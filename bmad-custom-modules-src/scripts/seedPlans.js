const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');
require('dotenv').config();

// Subscription plans data
const plansData = [
  {
    name: 'Free',
    tier: 'free',
    description: 'Perfect for getting started with HobbyHub',
    price: {
      monthly: {
        amount: 0,
        stripePriceId: 'price_free_monthly'
      },
      yearly: {
        amount: 0,
        stripePriceId: 'price_free_yearly'
      }
    },
    features: [
      { name: 'Create up to 10 posts', included: true, limit: 10, unit: 'posts' },
      { name: 'Join up to 5 groups', included: true, limit: 5, unit: 'groups' },
      { name: 'Basic community features', included: true },
      { name: 'Access to free content', included: true }
    ],
    limits: {
      maxPosts: 10,
      maxGroups: 5,
      maxStorageGB: 1,
      premiumContent: false,
      liveEvents: false,
      creatorTools: false,
      analytics: false
    },
    displayOrder: 1,
    popular: false
  },
  {
    name: 'Basic',
    tier: 'basic',
    description: 'Great for active hobby enthusiasts',
    price: {
      monthly: {
        amount: 9.99,
        stripePriceId: 'price_basic_monthly'
      },
      yearly: {
        amount: 99.99,
        stripePriceId: 'price_basic_yearly'
      }
    },
    features: [
      { name: 'Create unlimited posts', included: true },
      { name: 'Join unlimited groups', included: true },
      { name: '5GB cloud storage', included: true, limit: 5, unit: 'GB' },
      { name: 'Premium content access', included: true },
      { name: 'Priority support', included: true },
      { name: 'Advanced search filters', included: true }
    ],
    limits: {
      maxPosts: -1, // unlimited
      maxGroups: -1, // unlimited
      maxStorageGB: 5,
      premiumContent: true,
      liveEvents: false,
      creatorTools: false,
      analytics: false
    },
    displayOrder: 2,
    popular: true
  },
  {
    name: 'Standard',
    tier: 'standard',
    description: 'Ideal for creators and community leaders',
    price: {
      monthly: {
        amount: 19.99,
        stripePriceId: 'price_standard_monthly'
      },
      yearly: {
        amount: 199.99,
        stripePriceId: 'price_standard_yearly'
      }
    },
    features: [
      { name: 'All Basic features', included: true },
      { name: '15GB cloud storage', included: true, limit: 15, unit: 'GB' },
      { name: 'Live event participation', included: true },
      { name: 'Creator tools', included: true },
      { name: 'Custom group branding', included: true },
      { name: 'Monetization features', included: true },
      { name: 'Advanced analytics', included: true }
    ],
    limits: {
      maxPosts: -1,
      maxGroups: -1,
      maxStorageGB: 15,
      premiumContent: true,
      liveEvents: true,
      creatorTools: true,
      analytics: true
    },
    displayOrder: 3,
    popular: false
  },
  {
    name: 'Premium',
    tier: 'premium',
    description: 'The ultimate hobby experience',
    price: {
      monthly: {
        amount: 39.99,
        stripePriceId: 'price_premium_monthly'
      },
      yearly: {
        amount: 399.99,
        stripePriceId: 'price_premium_yearly'
      }
    },
    features: [
      { name: 'All Standard features', included: true },
      { name: 'Unlimited cloud storage', included: true },
      { name: 'Host unlimited live events', included: true },
      { name: 'Advanced creator dashboard', included: true },
      { name: 'Priority creator support', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'White-label options', included: true },
      { name: 'Dedicated account manager', included: true }
    ],
    limits: {
      maxPosts: -1,
      maxGroups: -1,
      maxStorageGB: -1, // unlimited
      premiumContent: true,
      liveEvents: true,
      creatorTools: true,
      analytics: true
    },
    displayOrder: 4,
    popular: false
  }
];

async function seedPlans() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hobbyhub');

    console.log('Clearing existing plans...');
    await SubscriptionPlan.deleteMany({});

    console.log('Seeding subscription plans...');
    for (const planData of plansData) {
      const plan = new SubscriptionPlan(planData);
      await plan.save();
      console.log(`✓ Created ${plan.name} plan`);
    }

    console.log('Seeding completed successfully!');
    console.log('\nNote: Update the Stripe price IDs in production with actual Stripe price IDs.');
    console.log('Free tier price IDs can remain as placeholders since no payment is required.');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the seed function
seedPlans();
