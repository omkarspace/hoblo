const express = require('express');
const Recommendation = require('../models/Recommendation');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/recommendations
// @desc    Get personalized recommendations feed for current user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit, includeViewed } = req.query;
    const options = {};

    if (limit) options.limit = parseInt(limit);
    if (includeViewed === 'true') options.includeViewed = true;

    const recommendations = await Recommendation.getRecommendationFeed(req.user._id, options);

    // Format recommendations for frontend
    const formattedRecommendations = recommendations.map(rec => ({
      id: rec._id,
      type: rec.recommendedItem.type,
      item: rec.recommendedItem.itemId,
      recommendationType: rec.recommendationType,
      confidence: rec.confidence,
      reason: rec.reason,
      reasonDetails: rec.reasonDetails,
      priority: rec.priority,
      isViewed: rec.isViewed,
      isInteracted: rec.isInteracted,
      interactionType: rec.interactionType,
      createdAt: rec.createdAt
    }));

    res.json({
      success: true,
      data: {
        recommendations: formattedRecommendations,
        total: formattedRecommendations.length
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
});

// @route   GET /api/recommendations/homepage
// @desc    Get homepage recommendation feed (top recommendations)
// @access  Private
router.get('/homepage', authenticateToken, async (req, res) => {
  try {
    // Get top 6 recommendations for homepage
    const recommendations = await Recommendation.getRecommendationFeed(req.user._id, {
      limit: 6,
      includeViewed: false
    });

    // Group by recommendation type for display sections
    const grouped = {
      profileBased: [],
      activityBased: [],
      trending: [],
      collaborative: []
    };

    recommendations.forEach(rec => {
      const formatted = {
        id: rec._id,
        item: rec.recommendedItem.itemId,
        reason: rec.reason,
        confidence: rec.confidence,
        type: rec.recommendedItem.type
      };

      switch (rec.recommendationType) {
        case 'profile_based':
          grouped.profileBased.push(formatted);
          break;
        case 'activity_based':
          grouped.activityBased.push(formatted);
          break;
        case 'trending':
          grouped.trending.push(formatted);
          break;
        case 'collaborative':
          grouped.collaborative.push(formatted);
          break;
      }
    });

    res.json({
      success: true,
      data: {
        sections: grouped,
        totalRecommendations: recommendations.length
      }
    });
  } catch (error) {
    console.error('Get homepage recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get homepage recommendations'
    });
  }
});

// @route   POST /api/recommendations/generate
// @desc    Generate fresh recommendations for current user
// @access  Private
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const newRecommendations = await Recommendation.generateRecommendations(req.user._id);

    res.json({
      success: true,
      message: `Generated ${newRecommendations.length} new recommendations`,
      data: {
        newRecommendationsCount: newRecommendations.length,
        recommendations: newRecommendations.map(rec => ({
          id: rec._id,
          type: rec.recommendedItem.type,
          item: rec.recommendedItem.itemId,
          recommendationType: rec.recommendationType,
          reason: rec.reason,
          confidence: rec.confidence
        }))
      }
    });
  } catch (error) {
    console.error('Generate recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations'
    });
  }
});

// @route   POST /api/recommendations/:recommendationId/interact
// @desc    Mark recommendation as interacted with
// @access  Private
router.post('/:recommendationId/interact', authenticateToken, async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { interactionType } = req.body;

    const validInteractions = ['viewed', 'followed', 'joined', 'dismissed', 'liked'];
    if (!validInteractions.includes(interactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interaction type'
      });
    }

    const updatedRecommendation = await Recommendation.markAsInteracted(
      req.user._id,
      recommendationId,
      interactionType
    );

    if (!updatedRecommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    // If user followed or joined, update their profile accordingly
    if (interactionType === 'followed' && updatedRecommendation.recommendedItem.type === 'category') {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { followedCategories: updatedRecommendation.recommendedItem.itemId }
      });
    }

    res.json({
      success: true,
      message: 'Recommendation interaction recorded',
      data: {
        recommendation: {
          id: updatedRecommendation._id,
          interactionType: updatedRecommendation.interactionType,
          isInteracted: updatedRecommendation.isInteracted
        }
      }
    });
  } catch (error) {
    console.error('Recommendation interaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record recommendation interaction'
    });
  }
});

// @route   GET /api/recommendations/stats
// @desc    Get recommendation statistics for current user
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [
      totalRecommendations,
      viewedRecommendations,
      interactedRecommendations,
      recommendationsByType
    ] = await Promise.all([
      Recommendation.countDocuments({ userId: req.user._id }),
      Recommendation.countDocuments({ userId: req.user._id, isViewed: true }),
      Recommendation.countDocuments({ userId: req.user._id, isInteracted: true }),
      Recommendation.aggregate([
        { $match: { userId: req.user._id } },
        { $group: { _id: '$recommendationType', count: { $sum: 1 } } }
      ])
    ]);

    const typeStats = {};
    recommendationsByType.forEach(stat => {
      typeStats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        total: totalRecommendations,
        viewed: viewedRecommendations,
        interacted: interactedRecommendations,
        viewRate: totalRecommendations > 0 ? (viewedRecommendations / totalRecommendations) * 100 : 0,
        interactionRate: totalRecommendations > 0 ? (interactedRecommendations / totalRecommendations) * 100 : 0,
        byType: typeStats
      }
    });
  } catch (error) {
    console.error('Get recommendation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendation statistics'
    });
  }
});

// @route   DELETE /api/recommendations/:recommendationId
// @desc    Dismiss/hide a recommendation
// @access  Private
router.delete('/:recommendationId', authenticateToken, async (req, res) => {
  try {
    const { recommendationId } = req.params;

    const deletedRecommendation = await Recommendation.findOneAndDelete({
      _id: recommendationId,
      userId: req.user._id
    });

    if (!deletedRecommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    res.json({
      success: true,
      message: 'Recommendation dismissed'
    });
  } catch (error) {
    console.error('Delete recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss recommendation'
    });
  }
});

// @route   GET /api/recommendations/explain/:recommendationId
// @desc    Get detailed explanation for why an item was recommended
// @access  Private
router.get('/explain/:recommendationId', authenticateToken, async (req, res) => {
  try {
    const { recommendationId } = req.params;

    const recommendation = await Recommendation.findOne({
      _id: recommendationId,
      userId: req.user._id
    }).populate('recommendedItem.itemId');

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    // Generate detailed explanation based on recommendation type
    const explanation = generateDetailedExplanation(recommendation);

    res.json({
      success: true,
      data: {
        recommendation: {
          id: recommendation._id,
          type: recommendation.recommendedItem.type,
          item: recommendation.recommendedItem.itemId,
          recommendationType: recommendation.recommendationType,
          confidence: recommendation.confidence
        },
        explanation: explanation
      }
    });
  } catch (error) {
    console.error('Get recommendation explanation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendation explanation'
    });
  }
});

// @route   GET /api/recommendations/similar-users
// @desc    Get recommendations based on similar users
// @access  Private
router.get('/similar-users', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('followedCategories');

    if (!user.followedCategories || user.followedCategories.length === 0) {
      return res.json({
        success: true,
        data: {
          recommendations: [],
          message: 'Follow some categories first to get similar user recommendations'
        }
      });
    }

    // Find users with similar interests
    const similarUsers = await User.find({
      _id: { $ne: req.user._id },
      followedCategories: { $in: user.followedCategories.map(cat => cat._id) }
    })
    .populate('followedCategories', 'name icon')
    .limit(5);

    // Get categories that similar users follow
    const recommendedCategories = new Map();

    similarUsers.forEach(similarUser => {
      similarUser.followedCategories.forEach(category => {
        if (!user.followedCategories.some(userCat => userCat._id.toString() === category._id.toString())) {
          const key = category._id.toString();
          if (!recommendedCategories.has(key)) {
            recommendedCategories.set(key, {
              category: category,
              similarUsersCount: 1,
              similarUsers: [similarUser.firstName || 'Anonymous']
            });
          } else {
            const existing = recommendedCategories.get(key);
            existing.similarUsersCount++;
            existing.similarUsers.push(similarUser.firstName || 'Anonymous');
          }
        }
      });
    });

    const recommendations = Array.from(recommendedCategories.values())
      .sort((a, b) => b.similarUsersCount - a.similarUsersCount)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        recommendations: recommendations,
        similarUsersCount: similarUsers.length
      }
    });
  } catch (error) {
    console.error('Get similar users recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get similar users recommendations'
    });
  }
});

// Helper function to generate detailed explanations
function generateDetailedExplanation(recommendation) {
  const { recommendationType, reason, reasonDetails, confidence, recommendedItem } = recommendation;
  const item = recommendedItem.itemId;

  let explanation = {
    summary: reason,
    confidence: confidence,
    algorithm: recommendationType,
    details: []
  };

  switch (recommendationType) {
    case 'profile_based':
      explanation.details = [
        'This recommendation is based on your stated hobby interests in your profile.',
        `You expressed interest in: ${reasonDetails.matchedInterest}`,
        'We found this category closely matches your declared preferences.',
        `Confidence level: ${(confidence * 100).toFixed(0)}% based on interest matching.`
      ];
      break;

    case 'activity_based':
      explanation.details = [
        'This recommendation is based on your recent activity on HobbyHub.',
        `You recently engaged with: ${reasonDetails.followedCategory}`,
        'Users who enjoy similar categories often explore related areas.',
        `This category shares common themes and skills with your followed categories.`
      ];
      break;

    case 'collaborative':
      explanation.details = [
        'This recommendation comes from collaborative filtering.',
        `${reasonDetails.similarUsersCount} users with similar interests to yours enjoy this category.`,
        'We analyzed patterns from users who follow the same categories as you.',
        'This creates a "social proof" recommendation based on community behavior.'
      ];
      break;

    case 'trending':
      explanation.details = [
        'This is a trending category in the HobbyHub community.',
        `Currently followed by ${reasonDetails.followerCount} community members.`,
        'Categories with high engagement often indicate current popular interests.',
        'This recommendation helps you stay current with community trends.'
      ];
      break;

    default:
      explanation.details = [
        'This recommendation was generated using our personalized algorithm.',
        'It takes into account your profile, activity, and community trends.',
        `Algorithm confidence: ${(confidence * 100).toFixed(0)}%`
      ];
  }

  return explanation;
}

module.exports = router;
