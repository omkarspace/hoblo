const express = require('express');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/achievements
// @desc    Get all active achievements
// @access  Public
router.get('/', async (req, res) => {
  try {
    const achievements = await Achievement.getActiveAchievements();
    res.json({
      success: true,
      data: {
        achievements: achievements
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements'
    });
  }
});

// @route   GET /api/achievements/categories/:category
// @desc    Get achievements by category
// @access  Public
router.get('/categories/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['engagement', 'creation', 'community', 'milestone', 'special'];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const achievements = await Achievement.getByCategory(category);
    res.json({
      success: true,
      data: {
        achievements: achievements
      }
    });
  } catch (error) {
    console.error('Get achievements by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements'
    });
  }
});

// @route   GET /api/achievements/user
// @desc    Get current user's achievements
// @access  Private
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userAchievements = await UserAchievement.getUserAchievements(req.user._id);

    // Calculate user stats for progress tracking
    const userStats = await calculateUserStats(req.user._id);

    res.json({
      success: true,
      data: {
        achievements: userAchievements,
        stats: userStats
      }
    });
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user achievements'
    });
  }
});

// @route   GET /api/achievements/user/completed
// @desc    Get current user's completed achievements
// @access  Private
router.get('/user/completed', authenticateToken, async (req, res) => {
  try {
    const completedAchievements = await UserAchievement.getCompletedAchievements(req.user._id);

    res.json({
      success: true,
      data: {
        achievements: completedAchievements,
        totalPoints: completedAchievements.reduce((sum, ua) => sum + (ua.achievementId?.points || 0), 0)
      }
    });
  } catch (error) {
    console.error('Get completed achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed achievements'
    });
  }
});

// @route   GET /api/achievements/user/progress
// @desc    Get current user's achievement progress
// @access  Private
router.get('/user/progress', authenticateToken, async (req, res) => {
  try {
    const allAchievements = await Achievement.getActiveAchievements();
    const userAchievements = await UserAchievement.find({ userId: req.user._id })
      .populate('achievementId');

    const progressData = allAchievements.map(achievement => {
      const userAchievement = userAchievements.find(
        ua => ua.achievementId._id.toString() === achievement._id.toString()
      );

      return {
        achievement: achievement,
        userAchievement: userAchievement || null,
        progress: userAchievement ? userAchievement.progress : 0,
        isCompleted: userAchievement ? userAchievement.isCompleted : false,
        earnedAt: userAchievement ? userAchievement.earnedAt : null
      };
    });

    res.json({
      success: true,
      data: {
        progress: progressData
      }
    });
  } catch (error) {
    console.error('Get achievement progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievement progress'
    });
  }
});

// @route   GET /api/achievements/:achievementId/progress
// @desc    Get progress for specific achievement
// @access  Private
router.get('/:achievementId/progress', authenticateToken, async (req, res) => {
  try {
    const { achievementId } = req.params;

    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    const userAchievement = await UserAchievement.getAchievementProgress(req.user._id, achievementId);

    res.json({
      success: true,
      data: {
        achievement: achievement,
        progress: userAchievement ? userAchievement.progress : 0,
        maxProgress: achievement.maxProgress,
        isCompleted: userAchievement ? userAchievement.isCompleted : false,
        earnedAt: userAchievement ? userAchievement.earnedAt : null
      }
    });
  } catch (error) {
    console.error('Get achievement progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievement progress'
    });
  }
});

// @route   POST /api/achievements/:achievementId/share
// @desc    Share achievement on social platforms
// @access  Private
router.post('/:achievementId/share', authenticateToken, async (req, res) => {
  try {
    const { achievementId } = req.params;
    const { platforms } = req.body; // Array of platforms: ['twitter', 'facebook', etc.]

    if (!platforms || !Array.isArray(platforms)) {
      return res.status(400).json({
        success: false,
        message: 'Platforms array is required'
      });
    }

    const userAchievement = await UserAchievement.findOne({
      userId: req.user._id,
      achievementId: achievementId,
      isCompleted: true
    }).populate('achievementId');

    if (!userAchievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found or not completed'
      });
    }

    // Update sharing status
    userAchievement.shared = true;
    userAchievement.sharedAt = new Date();
    userAchievement.sharedPlatforms = platforms;
    await userAchievement.save();

    // Generate share URLs/messages for each platform
    const shareData = generateShareData(userAchievement.achievementId, req.user);

    res.json({
      success: true,
      message: 'Achievement shared successfully',
      data: {
        achievement: userAchievement,
        shareData: shareData
      }
    });
  } catch (error) {
    console.error('Share achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share achievement'
    });
  }
});

// @route   GET /api/achievements/user/:userId/public
// @desc    Get public achievements for a user (for profiles)
// @access  Public
router.get('/user/:userId/public', async (req, res) => {
  try {
    const { userId } = req.params;

    const completedAchievements = await UserAchievement.getCompletedAchievements(userId);

    // Only return public achievement data
    const publicAchievements = completedAchievements.map(ua => ({
      achievement: {
        name: ua.achievementId.name,
        description: ua.achievementId.description,
        icon: ua.achievementId.icon,
        category: ua.achievementId.category,
        rarity: ua.achievementId.rarity,
        points: ua.achievementId.points
      },
      earnedAt: ua.earnedAt,
      shared: ua.shared
    }));

    res.json({
      success: true,
      data: {
        achievements: publicAchievements,
        totalAchievements: publicAchievements.length,
        totalPoints: publicAchievements.reduce((sum, item) => sum + item.achievement.points, 0)
      }
    });
  } catch (error) {
    console.error('Get public achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get public achievements'
    });
  }
});

// @route   POST /api/achievements/check
// @desc    Manually trigger achievement checking (for development/testing)
// @access  Private (should be admin only in production)
router.post('/check', authenticateToken, async (req, res) => {
  try {
    // Calculate user stats
    const userStats = await calculateUserStats(req.user._id);

    // Check and award achievements
    const awardedAchievements = await UserAchievement.checkAndAwardAchievements(req.user._id, userStats);

    res.json({
      success: true,
      message: `Checked achievements. Awarded ${awardedAchievements.length} new achievements.`,
      data: {
        awardedAchievements: awardedAchievements,
        userStats: userStats
      }
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check achievements'
    });
  }
});

// Helper function to calculate user statistics
async function calculateUserStats(userId) {
  // This would integrate with actual post, comment, group, etc. models
  // For now, return mock stats based on user data
  const user = await require('../models/User').findById(userId);

  const accountAgeDays = user ? Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)) : 0;

  // Mock stats - in real implementation, these would come from actual data
  return {
    postsCreated: Math.floor(Math.random() * 50), // Replace with actual query
    commentsMade: Math.floor(Math.random() * 100),
    groupsJoined: Math.floor(Math.random() * 10),
    daysActive: accountAgeDays,
    contentUploaded: Math.floor(Math.random() * 25),
    resourcesShared: Math.floor(Math.random() * 15),
    eventsHosted: Math.floor(Math.random() * 5),
    followersGained: Math.floor(Math.random() * 20),
    groupsCreated: Math.floor(Math.random() * 3),
    helpfulVotes: Math.floor(Math.random() * 30),
    accountAgeDays: accountAgeDays,
    totalPoints: user.achievements.reduce((sum, achievement) => {
      // This would need achievement lookup in real implementation
      return sum + (achievement.points || 10);
    }, 0)
  };
}

// Helper function to generate share data
function generateShareData(achievement, user) {
  const shareText = `I just earned the "${achievement.name}" achievement on HobbyHub! 🏆 ${achievement.description}`;
  const shareUrl = `${process.env.CLIENT_URL}/achievements/${achievement._id}`;
  const shareImage = achievement.icon;

  return {
    twitter: {
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      text: shareText
    },
    facebook: {
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      text: shareText
    },
    linkedin: {
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      text: shareText
    }
  };
}

module.exports = router;
