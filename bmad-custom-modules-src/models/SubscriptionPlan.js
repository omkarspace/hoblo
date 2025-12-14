const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  tier: {
    type: String,
    enum: ['free', 'basic', 'standard', 'premium'],
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    monthly: {
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      stripePriceId: {
        type: String,
        required: true
      }
    },
    yearly: {
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      stripePriceId: {
        type: String,
        required: true
      }
    }
  },
  features: [{
    name: String,
    description: String,
    included: {
      type: Boolean,
      default: true
    },
    limit: Number, // For features with quantity limits
    unit: String // e.g., 'posts', 'GB', 'users'
  }],
  limits: {
    maxPosts: {
      type: Number,
      default: 10
    },
    maxGroups: {
      type: Number,
      default: 5
    },
    maxStorageGB: {
      type: Number,
      default: 1
    },
    premiumContent: {
      type: Boolean,
      default: false
    },
    liveEvents: {
      type: Boolean,
      default: false
    },
    creatorTools: {
      type: Boolean,
      default: false
    },
    analytics: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  popular: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
subscriptionPlanSchema.index({ tier: 1 });
subscriptionPlanSchema.index({ isActive: 1 });
subscriptionPlanSchema.index({ displayOrder: 1 });

// Static method to get active plans
subscriptionPlanSchema.statics.getActivePlans = function() {
  return this.find({ isActive: true }).sort({ displayOrder: 1 });
};

// Static method to get plan by tier
subscriptionPlanSchema.statics.getByTier = function(tier) {
  return this.findOne({ tier: tier, isActive: true });
};

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
