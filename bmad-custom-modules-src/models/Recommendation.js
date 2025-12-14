const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recommendedItem: {
    type: {
      type: String,
      enum: ['category', 'group', 'achievement', 'content'],
      required: true
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'recommendedItem.type'
    }
  },
  recommendationType: {
    type: String,
    enum: ['profile_based', 'activity_based', 'collaborative', 'trending', 'similar_users'],
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  reasonDetails: {
    type: mongoose.Schema.Types.Mixed // Additional context for the recommendation
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  isViewed: {
    type: Boolean,
    default: false
  },
  isInteracted: {
    type: Boolean,
    default: false
  },
  interactionType: {
    type: String,
    enum: ['viewed', 'followed', 'joined', 'dismissed', 'liked'],
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
recommendationSchema.index({ userId: 1, createdAt: -1 });
recommendationSchema.index({ userId: 1, isViewed: 1 });
recommendationSchema.index({ expiresAt: 1 });
recommendationSchema.index({ 'recommendedItem.type': 1, 'recommendedItem.itemId': 1 });

// Virtual for checking if recommendation is expired
recommendationSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Static method to get active recommendations for a user
recommendationSchema.statics.getActiveRecommendations = function(userId, limit = 20) {
  return this.find({
    userId: userId,
    isViewed: false,
    expiresAt: { $gt: new Date() }
  })
  .populate('recommendedItem.itemId')
  .sort({ priority: -1, confidence: -1, createdAt: -1 })
  .limit(limit);
};

// Static method to get personalized recommendations feed
recommendationSchema.statics.getRecommendationFeed = function(userId, options = {}) {
  const limit = options.limit || 10;
  const includeViewed = options.includeViewed || false;

  const query = {
    userId: userId,
    expiresAt: { $gt: new Date() }
  };

  if (!includeViewed) {
    query.isViewed = false;
  }

  return this.find(query)
  .populate('recommendedItem.itemId')
  .sort({ priority: -1, confidence: -1, createdAt: -1 })
  .limit(limit);
};

// Static method to mark recommendation as interacted
recommendationSchema.statics.markAsInteracted = async function(userId, recommendationId, interactionType) {
  return this.findOneAndUpdate(
    { _id: recommendationId, userId: userId },
    {
      isInteracted: true,
      interactionType: interactionType,
      isViewed: true
    },
    { new: true }
  );
};

// Static method to generate recommendations for a user
recommendationSchema.statics.generateRecommendations = async function(userId) {
  const User = mongoose.model('User');
  const HobbyCategory = mongoose.model('HobbyCategory');
  const UserAchievement = mongoose.model('UserAchievement');

  const user = await User.findById(userId).populate('followedCategories hobbyInterests');
  if (!user) return [];

  const recommendations = [];

  // 1. Profile-based recommendations (based on stated interests)
  if (user.hobbyInterests && user.hobbyInterests.length > 0) {
    const profileBased = await generateProfileBasedRecommendations(user);
    recommendations.push(...profileBased);
  }

  // 2. Activity-based recommendations (based on followed categories and achievements)
  const activityBased = await generateActivityBasedRecommendations(user);
  recommendations.push(...activityBased);

  // 3. Collaborative filtering (users with similar interests)
  const collaborative = await generateCollaborativeRecommendations(user);
  recommendations.push(...collaborative);

  // 4. Trending/popular categories
  const trending = await generateTrendingRecommendations(user);
  recommendations.push(...trending);

  // Remove duplicates and limit recommendations
  const uniqueRecommendations = removeDuplicates(recommendations);
  const finalRecommendations = uniqueRecommendations.slice(0, 20);

  // Save recommendations to database
  const savedRecommendations = [];
  for (const rec of finalRecommendations) {
    const existing = await this.findOne({
      userId: userId,
      'recommendedItem.type': rec.recommendedItem.type,
      'recommendedItem.itemId': rec.recommendedItem.itemId,
      expiresAt: { $gt: new Date() }
    });

    if (!existing) {
      const saved = await this.create(rec);
      savedRecommendations.push(saved);
    }
  }

  return savedRecommendations;
};

// Helper function: Generate profile-based recommendations
async function generateProfileBasedRecommendations(user) {
  const HobbyCategory = mongoose.model('HobbyCategory');
  const recommendations = [];

  // Find categories related to user's stated interests
  for (const interest of user.hobbyInterests || []) {
    const relatedCategories = await HobbyCategory.find({
      $or: [
        { name: new RegExp(interest, 'i') },
        { metaTags: interest }
      ],
      isActive: true
    }).limit(3);

    for (const category of relatedCategories) {
      // Skip if user already follows this category
      if (user.followedCategories.some(cat => cat.toString() === category._id.toString())) {
        continue;
      }

      recommendations.push({
        userId: user._id,
        recommendedItem: {
          type: 'category',
          itemId: category._id
        },
        recommendationType: 'profile_based',
        confidence: 0.8,
        reason: `Based on your interest in ${interest}`,
        reasonDetails: { matchedInterest: interest },
        priority: 8
      });
    }
  }

  return recommendations;
}

// Helper function: Generate activity-based recommendations
async function generateActivityBasedRecommendations(user) {
  const HobbyCategory = mongoose.model('HobbyCategory');
  const recommendations = [];

  // Get user's followed categories
  const followedCategories = await HobbyCategory.find({
    _id: { $in: user.followedCategories || [] }
  });

  // Find related categories based on what user already follows
  for (const followedCat of followedCategories) {
    const relatedCategories = await HobbyCategory.find({
      _id: { $nin: user.followedCategories || [] },
      $or: [
        { relatedCategories: followedCat._id },
        { metaTags: { $in: followedCat.metaTags } }
      ],
      isActive: true
    }).limit(2);

    for (const category of relatedCategories) {
      recommendations.push({
        userId: user._id,
        recommendedItem: {
          type: 'category',
          itemId: category._id
        },
        recommendationType: 'activity_based',
        confidence: 0.7,
        reason: `Because you follow ${followedCat.name}`,
        reasonDetails: { followedCategory: followedCat.name },
        priority: 7
      });
    }
  }

  return recommendations;
}

// Helper function: Generate collaborative recommendations
async function generateCollaborativeRecommendations(user) {
  const User = mongoose.model('User');
  const HobbyCategory = mongoose.model('HobbyCategory');
  const recommendations = [];

  // Find users with similar followed categories
  const similarUsers = await User.find({
    _id: { $ne: user._id },
    followedCategories: { $in: user.followedCategories || [] }
  }).limit(10);

  // Get categories that similar users follow but user doesn't
  const similarUserCategoryIds = [];
  similarUsers.forEach(similarUser => {
    similarUserCategoryIds.push(...(similarUser.followedCategories || []));
  });

  const uniqueCategoryIds = [...new Set(similarUserCategoryIds)]
    .filter(id => !user.followedCategories.some(catId => catId.toString() === id.toString()));

  if (uniqueCategoryIds.length > 0) {
    const recommendedCategories = await HobbyCategory.find({
      _id: { $in: uniqueCategoryIds },
      isActive: true
    }).limit(3);

    for (const category of recommendedCategories) {
      recommendations.push({
        userId: user._id,
        recommendedItem: {
          type: 'category',
          itemId: category._id
        },
        recommendationType: 'collaborative',
        confidence: 0.6,
        reason: 'Popular among users with similar interests',
        reasonDetails: { similarUsersCount: similarUsers.length },
        priority: 6
      });
    }
  }

  return recommendations;
}

// Helper function: Generate trending recommendations
async function generateTrendingRecommendations(user) {
  const HobbyCategory = mongoose.model('HobbyCategory');
  const recommendations = [];

  // Get trending categories (high follower growth)
  const trendingCategories = await HobbyCategory.find({
    _id: { $nin: user.followedCategories || [] },
    isActive: true,
    followerCount: { $gt: 50 }
  })
  .sort({ followerCount: -1 })
  .limit(3);

  for (const category of trendingCategories) {
    recommendations.push({
      userId: user._id,
      recommendedItem: {
        type: 'category',
        itemId: category._id
      },
      recommendationType: 'trending',
      confidence: 0.5,
      reason: 'Trending among HobbyHub community',
      reasonDetails: { followerCount: category.followerCount },
      priority: 5
    });
  }

  return recommendations;
}

// Helper function: Remove duplicate recommendations
function removeDuplicates(recommendations) {
  const seen = new Set();
  return recommendations.filter(rec => {
    const key = `${rec.recommendedItem.type}-${rec.recommendedItem.itemId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = mongoose.model('Recommendation', recommendationSchema);
