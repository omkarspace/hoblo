const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  stripeCustomerId: {
    type: String,
    required: true
  },
  stripeSubscriptionId: {
    type: String,
    sparse: true
  },
  tier: {
    type: String,
    enum: ['free', 'basic', 'standard', 'premium'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'],
    default: 'active'
  },
  currentPeriodStart: {
    type: Date,
    default: Date.now
  },
  currentPeriodEnd: {
    type: Date,
    default: Date.now
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  stripePriceId: {
    type: String
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  paymentMethod: {
    type: mongoose.Schema.Types.Mixed // Store Stripe payment method details
  },
  billingHistory: [{
    invoiceId: String,
    amount: Number,
    currency: String,
    status: String,
    date: Date,
    description: String
  }]
}, {
  timestamps: true
});

// Index for better query performance
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' || this.status === 'trialing';
});

// Virtual for checking if subscription is paid tier
subscriptionSchema.virtual('isPaid').get(function() {
  return this.tier !== 'free' && this.isActive;
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
