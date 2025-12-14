const express = require('express');
const HobbyCategory = require('../models/HobbyCategory');
const User = require('../models/User');
const Group = require('../models/Group');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/navigation/craft-circles
// @desc    Get enhanced craft circles navigation data
// @access  Public
router.get('/craft-circles', async (req, res) => {
  try {
    const craftCircles = await HobbyCategory.getCraftCircles();

    // Get additional data for each circle
    const enhancedCircles = await Promise.all(
      craftCircles.map(async (circle) => {
        // Get groups in this category
        const groups = await Group.getByCategory(circle.id, { limit: 3 });

        // Get recent activity
        const recentGroups = await Group.find({
          category: circle.id,
          'settings.isActive': true,
          lastActivity: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
        .sort({ lastActivity: -1 })
        .limit(2)
        .select('name lastActivity memberCount');

        return {
          ...circle,
          groups: groups.map(g => ({
            id: g._id,
            name: g.name,
            memberCount: g.memberCount,
            privacy: g.privacy
          })),
          recentActivity: recentGroups.map(g => ({
            name: g.name,
            lastActivity: g.lastActivity,
            memberCount: g.memberCount
          })),
          // Enhanced positioning for mobile
          mobilePosition: {
            x: Math.cos((circle.angle * Math.PI) / 180) * (circle.radius * 0.8),
            y: Math.sin((circle.angle * Math.PI) / 180) * (circle.radius * 0.8)
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        craftCircles: enhancedCircles,
        config: {
          centerText: 'Discover Your Craft',
          description: 'Explore creative hobbies through our interactive circular navigation',
          mobile: {
            radius: 120,
            centerRadius: 40,
            animation: {
              duration: 800,
              easing: 'ease-out'
            }
          },
          desktop: {
            radius: 180,
            centerRadius: 60,
            hover: {
              scale: 1.1,
              glow: true
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Get enhanced craft circles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get craft circles navigation'
    });
  }
});

// @route   GET /api/navigation/skill-trees
// @desc    Get enhanced skill trees navigation data
// @access  Public
router.get('/skill-trees', async (req, res) => {
  try {
    const skillTrees = await HobbyCategory.getSkillTrees();

    // Group by skill levels and add progression data
    const skillTreeData = {
      nodes: skillTrees.map(tree => ({
        id: tree.id,
        name: tree.name,
        slug: tree.slug,
        icon: tree.icon,
        color: tree.color,
        level: tree.level,
        x: tree.x,
        y: tree.y,
        category: tree.level === 1 ? 'foundation' : tree.level === 2 ? 'intermediate' : 'advanced',
        prerequisites: tree.connections
          .filter(conn => conn.type === 'prerequisite')
          .map(conn => conn.toCategory.toString()),
        unlocks: tree.connections
          .filter(conn => conn.type === 'progression')
          .map(conn => conn.toCategory.toString()),
        related: tree.connections
          .filter(conn => conn.type === 'related')
          .map(conn => conn.toCategory.toString()),
        skillLevels: tree.skillLevels,
        // Add mobile positioning
        mobileX: tree.x * 0.6,
        mobileY: tree.y * 0.6
      })),
      connections: skillTrees.flatMap(tree =>
        tree.connections.map(conn => ({
          from: tree.id,
          to: conn.toCategory.toString(),
          type: conn.type,
          animated: conn.type === 'progression'
        }))
      ),
      levels: {
        foundation: skillTrees.filter(t => t.level === 1).length,
        intermediate: skillTrees.filter(t => t.level === 2).length,
        advanced: skillTrees.filter(t => t.level === 3).length
      }
    };

    res.json({
      success: true,
      data: {
        skillTree: skillTreeData,
        config: {
          title: 'Skill Tree Navigator',
          description: 'Chart your learning path through interconnected skills and technologies',
          legend: {
            foundation: { color: '#22c55e', label: 'Foundation Skills' },
            intermediate: { color: '#f59e0b', label: 'Intermediate Skills' },
            advanced: { color: '#ef4444', label: 'Advanced Skills' }
          },
          mobile: {
            zoom: 0.8,
            panLimits: { x: [-100, 100], y: [-100, 100] },
            nodeSize: 60,
            connectionWidth: 2
          },
          desktop: {
            zoom: 1,
            panLimits: { x: [-200, 200], y: [-200, 200] },
            nodeSize: 80,
            connectionWidth: 3
          },
          animations: {
            nodeHover: { scale: 1.2, duration: 300 },
            connectionFlow: { speed: 50, color: '#3b82f6' },
            unlockEffect: { particles: 8, duration: 1000 }
          }
        }
      }
    });
  } catch (error) {
    console.error('Get enhanced skill trees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get skill trees navigation'
    });
  }
});

// @route   GET /api/navigation/personalized/:userId
// @desc    Get personalized navigation suggestions based on user profile
// @access  Private
router.get('/personalized/:userId', authenticateToken, async (req, res) => {
  try {
    // Check if user can access this data
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(req.params.userId).populate('followedCategories');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's hobby interests and followed categories
    const userInterests = user.hobbyInterests || [];
    const followedCategoryIds = user.followedCategories.map(cat => cat._id.toString());

    // Find related categories using interests and followed categories
    let suggestedCategories = [];

    // Based on stated interests
    if (userInterests.length > 0) {
      const interestCategories = await HobbyCategory.find({
        $or: [
          { name: { $in: userInterests.map(i => new RegExp(i, 'i')) } },
          { metaTags: { $in: userInterests } }
        ],
        isActive: true,
        _id: { $nin: followedCategoryIds }
      }).limit(5);

      suggestedCategories.push(...interestCategories);
    }

    // Based on followed categories (related categories)
    if (followedCategoryIds.length > 0) {
      const relatedCategories = await HobbyCategory.find({
        $or: [
          { relatedCategories: { $in: followedCategoryIds } },
          {
            metaTags: {
              $in: (await HobbyCategory.find({ _id: { $in: followedCategoryIds } })).flatMap(cat => cat.metaTags)
            }
          }
        ],
        isActive: true,
        _id: { $nin: followedCategoryIds }
      }).limit(5);

      suggestedCategories.push(...relatedCategories);
    }

    // Remove duplicates
    const uniqueCategories = suggestedCategories.filter((cat, index, self) =>
      index === self.findIndex(c => c._id.toString() === cat._id.toString())
    ).slice(0, 8);

    // Format for navigation
    const personalizedNav = {
      craftCircles: uniqueCategories
        .filter(cat => cat.navigationType === 'craft_circle')
        .map(cat => ({
          id: cat._id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          color: cat.color,
          angle: cat.navigationData?.angle || 0,
          radius: cat.navigationData?.radius || 100,
          reason: 'Based on your interests'
        })),
      skillTree: uniqueCategories
        .filter(cat => cat.navigationType === 'skill_tree')
        .map(cat => ({
          id: cat._id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          color: cat.color,
          level: cat.level,
          x: cat.navigationData?.x || 0,
          y: cat.navigationData?.y || 0,
          reason: 'Recommended learning path'
        })),
      standard: uniqueCategories
        .filter(cat => cat.navigationType === 'standard')
        .map(cat => ({
          id: cat._id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          color: cat.color,
          reason: 'Popular in your interest areas'
        }))
    };

    res.json({
      success: true,
      data: {
        personalizedNavigation: personalizedNav,
        userProfile: {
          interests: userInterests,
          followedCategories: user.followedCategories.length,
          suggestionsCount: uniqueCategories.length
        },
        config: {
          title: 'Your Learning Journey',
          description: 'Personalized navigation based on your interests and activity',
          refreshInterval: 24 * 60 * 60 * 1000 // 24 hours
        }
      }
    });
  } catch (error) {
    console.error('Get personalized navigation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get personalized navigation'
    });
  }
});

// @route   GET /api/navigation/context/:categorySlug
// @desc    Get context-aware navigation for a specific category
// @access  Public
router.get('/context/:categorySlug', async (req, res) => {
  try {
    const category = await HobbyCategory.findOne({
      slug: req.params.categorySlug,
      isActive: true
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const contextNav = {
      current: {
        id: category._id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        color: category.color,
        navigationType: category.navigationType
      },
      related: [],
      prerequisites: [],
      nextSteps: []
    };

    // Get related categories
    if (category.relatedCategories && category.relatedCategories.length > 0) {
      const relatedCats = await HobbyCategory.find({
        _id: { $in: category.relatedCategories },
        isActive: true
      }).select('name slug icon color navigationType');

      contextNav.related = relatedCats.map(cat => ({
        id: cat._id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
        navigationType: cat.navigationType
      }));
    }

    // For skill tree navigation, get prerequisites and next steps
    if (category.navigationType === 'skill_tree' && category.navigationData?.connections) {
      const connections = category.navigationData.connections;

      // Prerequisites
      const prereqIds = connections
        .filter(conn => conn.type === 'prerequisite')
        .map(conn => conn.toCategory);

      if (prereqIds.length > 0) {
        const prereqs = await HobbyCategory.find({
          _id: { $in: prereqIds },
          isActive: true
        }).select('name slug icon color');

        contextNav.prerequisites = prereqs.map(cat => ({
          id: cat._id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          color: cat.color
        }));
      }

      // Next steps
      const nextStepIds = connections
        .filter(conn => conn.type === 'progression')
        .map(conn => conn.toCategory);

      if (nextStepIds.length > 0) {
        const nextSteps = await HobbyCategory.find({
          _id: { $in: nextStepIds },
          isActive: true
        }).select('name slug icon color level');

        contextNav.nextSteps = nextSteps.map(cat => ({
          id: cat._id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          color: cat.color,
          level: cat.level
        }));
      }
    }

    // Get groups in this category for context
    const groups = await Group.getByCategory(category._id, { limit: 4 });

    res.json({
      success: true,
      data: {
        contextNavigation: contextNav,
        categoryGroups: groups.map(g => ({
          id: g._id,
          name: g.name,
          memberCount: g.memberCount,
          privacy: g.privacy
        })),
        navigationConfig: {
          showRelated: contextNav.related.length > 0,
          showPrerequisites: contextNav.prerequisites.length > 0,
          showNextSteps: contextNav.nextSteps.length > 0,
          hasGroups: groups.length > 0
        }
      }
    });
  } catch (error) {
    console.error('Get context navigation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get context navigation'
    });
  }
});

// @route   GET /api/navigation/mobile-optimized
// @desc    Get mobile-optimized navigation data
// @access  Public
router.get('/mobile-optimized', async (req, res) => {
  try {
    // Get featured categories optimized for mobile
    const featuredCategories = await HobbyCategory.getFeaturedCategories(6);

    // Get popular categories
    const popularCategories = await HobbyCategory.getPopularCategories(6);

    // Craft circles optimized for mobile
    const craftCircles = await HobbyCategory.getCraftCircles();

    const mobileNav = {
      featured: featuredCategories.map(cat => ({
        id: cat._id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
        compactName: cat.name.length > 12 ? cat.name.substring(0, 10) + '...' : cat.name
      })),
      popular: popularCategories.map(cat => ({
        id: cat._id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
        followerCount: cat.followerCount
      })),
      craftCircles: craftCircles.map(circle => ({
        ...circle,
        // Mobile-specific positioning
        mobileX: Math.cos((circle.angle * Math.PI) / 180) * (circle.radius * 0.7),
        mobileY: Math.sin((circle.angle * Math.PI) / 180) * (circle.radius * 0.7),
        tapRadius: 35 // Touch target size
      })),
      quickActions: [
        { type: 'search', label: 'Search', icon: '🔍' },
        { type: 'featured', label: 'Featured', icon: '⭐' },
        { type: 'popular', label: 'Popular', icon: '🔥' },
        { type: 'my-interests', label: 'My Interests', icon: '❤️' }
      ],
      swipeGestures: {
        enabled: true,
        velocity: 0.3,
        feedback: 'haptic'
      }
    };

    res.json({
      success: true,
      data: {
        mobileNavigation: mobileNav,
        config: {
          swipeThreshold: 50,
          animationDuration: 300,
          hapticFeedback: true,
          pullToRefresh: true,
          infiniteScroll: false
        }
      }
    });
  } catch (error) {
    console.error('Get mobile navigation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mobile navigation'
    });
  }
});

// @route   POST /api/navigation/interaction
// @desc    Track navigation interactions for analytics
// @access  Private
router.post('/interaction', authenticateToken, async (req, res) => {
  try {
    const { interactionType, categoryId, navigationType, metadata } = req.body;

    // In a real implementation, you would store this interaction data
    // for analytics and personalization improvement
    const interaction = {
      userId: req.user._id,
      interactionType, // 'view', 'click', 'swipe', 'zoom', etc.
      categoryId,
      navigationType, // 'craft_circle', 'skill_tree', 'standard'
      timestamp: new Date(),
      metadata: metadata || {},
      userAgent: req.get('User-Agent'),
      platform: metadata?.platform || 'unknown'
    };

    // For now, just acknowledge the interaction
    // In production, you'd save this to a NavigationInteraction model

    res.json({
      success: true,
      message: 'Interaction recorded',
      data: {
        recorded: true,
        interactionId: Date.now() // Mock ID
      }
    });
  } catch (error) {
    console.error('Navigation interaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record navigation interaction'
    });
  }
});

module.exports = router;
