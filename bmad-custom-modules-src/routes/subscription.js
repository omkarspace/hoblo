const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const User = require('../models/User');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/subscription/plans
// @desc    Get all active subscription plans
// @access  Public
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.getActivePlans();
    res.json({
      success: true,
      data: {
        plans: plans
      }
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription plans'
    });
  }
});

// @route   GET /api/subscription/current
// @desc    Get current user's subscription
// @access  Private
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id })
      .populate('userId', 'firstName lastName email');

    if (!subscription) {
      // Return free tier if no subscription exists
      return res.json({
        success: true,
        data: {
          subscription: {
            tier: 'free',
            status: 'active',
            isActive: true,
            isPaid: false
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        subscription: subscription
      }
    });
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription'
    });
  }
});

// @route   POST /api/subscription/create-customer
// @desc    Create Stripe customer for user
// @access  Private
router.post('/create-customer', authenticateToken, async (req, res) => {
  try {
    // Check if user already has a subscription
    let subscription = await Subscription.findOne({ userId: req.user._id });

    if (subscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has a subscription'
      });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: req.user.email,
      name: `${req.user.firstName} ${req.user.lastName}`,
      metadata: {
        userId: req.user._id.toString()
      }
    });

    // Create subscription record
    subscription = new Subscription({
      userId: req.user._id,
      stripeCustomerId: customer.id,
      tier: 'free',
      status: 'active'
    });

    await subscription.save();

    res.json({
      success: true,
      message: 'Customer created successfully',
      data: {
        subscription: subscription,
        stripeCustomer: {
          id: customer.id,
          email: customer.email
        }
      }
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer'
    });
  }
});

// @route   POST /api/subscription/create-subscription
// @desc    Create subscription with payment method
// @access  Private
router.post('/create-subscription', authenticateToken, async (req, res) => {
  try {
    const { paymentMethodId, priceId, billingCycle = 'monthly' } = req.body;

    if (!paymentMethodId || !priceId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID and price ID are required'
      });
    }

    // Get or create subscription record
    let subscription = await Subscription.findOne({ userId: req.user._id });

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: 'Customer not found. Please create customer first.'
      });
    }

    // Get the plan details
    const plan = await SubscriptionPlan.findOne({
      $or: [
        { 'price.monthly.stripePriceId': priceId },
        { 'price.yearly.stripePriceId': priceId }
      ]
    });

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price ID'
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: subscription.stripeCustomerId
    });

    // Set as default payment method
    await stripe.customers.update(subscription.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    // Create subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: subscription.stripeCustomerId,
      items: [{
        price: priceId
      }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent']
    });

    // Update subscription record
    subscription.stripeSubscriptionId = stripeSubscription.id;
    subscription.tier = plan.tier;
    subscription.status = stripeSubscription.status;
    subscription.stripePriceId = priceId;
    subscription.billingCycle = billingCycle;
    subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);

    await subscription.save();

    // Update user tier
    await User.findByIdAndUpdate(req.user._id, { subscriptionTier: plan.tier });

    res.json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription: subscription,
        stripeSubscription: stripeSubscription
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/subscription/change-tier
// @desc    Change subscription tier
// @access  Private
router.post('/change-tier', authenticateToken, async (req, res) => {
  try {
    const { newPriceId, billingCycle = 'monthly' } = req.body;

    if (!newPriceId) {
      return res.status(400).json({
        success: false,
        message: 'New price ID is required'
      });
    }

    const subscription = await Subscription.findOne({ userId: req.user._id });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Get new plan details
    const newPlan = await SubscriptionPlan.findOne({
      $or: [
        { 'price.monthly.stripePriceId': newPriceId },
        { 'price.yearly.stripePriceId': newPriceId }
      ]
    });

    if (!newPlan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price ID'
      });
    }

    // Update subscription item
    const subscriptionItem = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    const itemId = subscriptionItem.items.data[0].id;

    const updatedSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: itemId,
        price: newPriceId
      }],
      proration_behavior: 'create_prorations'
    });

    // Update local subscription record
    subscription.tier = newPlan.tier;
    subscription.stripePriceId = newPriceId;
    subscription.billingCycle = billingCycle;
    subscription.currentPeriodStart = new Date(updatedSubscription.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(updatedSubscription.current_period_end * 1000);

    await subscription.save();

    // Update user tier
    await User.findByIdAndUpdate(req.user._id, { subscriptionTier: newPlan.tier });

    res.json({
      success: true,
      message: 'Subscription tier updated successfully',
      data: {
        subscription: subscription
      }
    });
  } catch (error) {
    console.error('Change tier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change subscription tier',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/subscription/cancel
// @desc    Cancel subscription
// @access  Private
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const { cancelAtPeriodEnd = true } = req.body;

    const subscription = await Subscription.findOne({ userId: req.user._id });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    if (cancelAtPeriodEnd) {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      subscription.cancelAtPeriodEnd = true;
      await subscription.save();

      res.json({
        success: true,
        message: 'Subscription will be canceled at the end of the current billing period',
        data: {
          subscription: subscription
        }
      });
    } else {
      // Cancel immediately
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

      subscription.status = 'canceled';
      subscription.cancelAtPeriodEnd = false;
      await subscription.save();

      // Downgrade user to free tier
      await User.findByIdAndUpdate(req.user._id, { subscriptionTier: 'free' });

      res.json({
        success: true,
        message: 'Subscription canceled immediately',
        data: {
          subscription: subscription
        }
      });
    }
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

// @route   POST /api/subscription/reactivate
// @desc    Reactivate canceled subscription
// @access  Private
router.post('/reactivate', authenticateToken, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No subscription found'
      });
    }

    // Reactivate subscription
    const updatedStripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    subscription.cancelAtPeriodEnd = false;
    subscription.status = updatedStripeSubscription.status;
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      data: {
        subscription: subscription
      }
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate subscription'
    });
  }
});

// @route   GET /api/subscription/billing-history
// @desc    Get billing history
// @access  Private
router.get('/billing-history', authenticateToken, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id });

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          billingHistory: []
        }
      });
    }

    // Get invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 20
    });

    const billingHistory = invoices.data.map(invoice => ({
      invoiceId: invoice.id,
      amount: invoice.amount_due / 100, // Convert from cents
      currency: invoice.currency,
      status: invoice.status,
      date: new Date(invoice.created * 1000),
      description: invoice.description || `Invoice ${invoice.number}`,
      downloadUrl: invoice.invoice_pdf
    }));

    // Update local billing history
    subscription.billingHistory = billingHistory;
    await subscription.save();

    res.json({
      success: true,
      data: {
        billingHistory: billingHistory
      }
    });
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get billing history'
    });
  }
});

// Webhook endpoint for Stripe events (would be configured separately)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        await handlePaymentSuccess(invoice);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper function to handle subscription updates
async function handleSubscriptionUpdate(stripeSubscription) {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSubscription.id
  });

  if (subscription) {
    subscription.status = stripeSubscription.status;
    subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;

    // Update user tier if subscription is canceled
    if (stripeSubscription.status === 'canceled') {
      await User.findByIdAndUpdate(subscription.userId, { subscriptionTier: 'free' });
    }

    await subscription.save();
  }
}

// Helper function to handle payment success
async function handlePaymentSuccess(invoice) {
  const subscription = await Subscription.findOne({
    stripeCustomerId: invoice.customer
  });

  if (subscription) {
    // Add to billing history
    subscription.billingHistory.push({
      invoiceId: invoice.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: invoice.status,
      date: new Date(invoice.created * 1000),
      description: invoice.description || `Invoice ${invoice.number}`
    });

    await subscription.save();
  }
}

module.exports = router;
