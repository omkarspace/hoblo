const express = require('express');
const HobbyCategory = require('../models/HobbyCategory');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all main categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { featured, limit } = req.query;
    const options = {};

    if (featured === 'true') options.featured = true;
    if (limit) options.limit = parseInt(limit);

    const categories = await HobbyCategory.getMainCategories(options);
    res.json({
      success: true,
      data: {
        categories: categories
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
});

// @route   GET /api/categories/tree
// @desc    Get complete category tree
// @access  Public
router.get('/tree', async (req, res) => {
  try {
    const categoryTree = await HobbyCategory.getCategoryTree();
    res.json({
      success: true,
      data: {
        tree: categoryTree
      }
    });
  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category tree'
    });
  }
});

// @route   GET /api/categories/craft-circles
// @desc    Get craft circles navigation data
// @access  Public
router.get('/craft-circles', async (req, res) => {
  try {
    const craftCircles = await HobbyCategory.getCraftCircles();
    res.json({
      success: true,
      data: {
        craftCircles: craftCircles,
        centerText: 'Choose Your Craft',
        description: 'Explore our circular navigation of creative hobbies'
      }
    });
  } catch (error) {
    console.error('Get craft circles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get craft circles'
    });
  }
});

// @route   GET /api/categories/skill-trees
// @desc    Get skill trees navigation data
// @access  Public
router.get('/skill-trees', async (req, res) => {
  try {
    const skillTrees = await HobbyCategory.getSkillTrees();
    res.json({
      success: true,
      data: {
        skillTrees: skillTrees,
        legend: {
          beginner: { color: '#22c55e', label: 'Beginner' },
          intermediate: { color: '#f59e0b', label: 'Intermediate' },
          advanced: { color: '#ef4444', label: 'Advanced' },
          expert: { color: '#8b5cf6', label: 'Expert' }
        }
      }
    });
  } catch (error) {
    console.error('Get skill trees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get skill trees'
    });
  }
});

// @route   GET /api/categories/popular
// @desc    Get popular categories
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const categories = await HobbyCategory.getPopularCategories(limit);
    res.json({
      success: true,
      data: {
        categories: categories
      }
    });
  } catch (error) {
    console.error('Get popular categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular categories'
    });
  }
});

// @route   GET /api/categories/featured
// @desc    Get featured categories
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const categories = await HobbyCategory.getFeaturedCategories(limit);
    res.json({
      success: true,
      data: {
        categories: categories
      }
    });
  } catch (error) {
    console.error('Get featured categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get featured categories'
    });
  }
});

// @route   GET /api/categories/search
// @desc    Search categories
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const options = {};
    if (limit) options.limit = parseInt(limit);

    const categories = await HobbyCategory.searchCategories(q.trim(), options);
    res.json({
      success: true,
      data: {
        categories: categories,
        query: q,
        total: categories.length
      }
    });
  } catch (error) {
    console.error('Search categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search categories'
    });
  }
});

// @route   GET /api/categories/:slug
// @desc    Get category by slug with subcategories and related data
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await HobbyCategory.findOne({ slug: slug, isActive: true })
      .populate('parentCategory', 'name slug icon')
      .populate('relatedCategories', 'name slug icon description');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get subcategories if this is a main category
    let subcategories = [];
    if (category.level === 1) {
      subcategories = await HobbyCategory.getSubcategories(category._id);
    }

    // Get breadcrumb path
    let breadcrumb = [];
    if (category.parentCategory) {
      const parent = category.parentCategory;
      breadcrumb = [{
        name: parent.name,
        slug: parent.slug,
        icon: parent.icon
      }];
    }

    res.json({
      success: true,
      data: {
        category: category,
        subcategories: subcategories,
        breadcrumb: breadcrumb,
        relatedCategories: category.relatedCategories,
        navigationData: category.navigationType === 'craft_circle' ?
          { angle: category.navigationData?.angle, radius: category.navigationData?.radius } :
          category.navigationType === 'skill_tree' ?
          { x: category.navigationData?.x, y: category.navigationData?.y, connections: category.navigationData?.connections } :
          null
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category'
    });
  }
});

// @route   GET /api/categories/:slug/subcategories
// @desc    Get subcategories for a specific category
// @access  Public
router.get('/:slug/subcategories', async (req, res) => {
  try {
    const { slug } = req.params;

    const parentCategory = await HobbyCategory.findOne({ slug: slug, isActive: true });
    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: 'Parent category not found'
      });
    }

    const subcategories = await HobbyCategory.getSubcategories(parentCategory._id);
    res.json({
      success: true,
      data: {
        parentCategory: {
          name: parentCategory.name,
          slug: parentCategory.slug,
          icon: parentCategory.icon
        },
        subcategories: subcategories
      }
    });
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subcategories'
    });
  }
});

// @route   POST /api/categories/:categoryId/follow
// @desc    Follow/unfollow a category
// @access  Private
router.post('/:categoryId/follow', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { action } = req.body; // 'follow' or 'unfollow'

    const category = await HobbyCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const user = await require('../models/User').findById(req.user._id);

    if (action === 'follow') {
      // Add category to user's followed categories if not already following
      if (!user.followedCategories) user.followedCategories = [];
      if (!user.followedCategories.includes(categoryId)) {
        user.followedCategories.push(categoryId);
        category.followerCount += 1;
        await category.save();
      }
    } else if (action === 'unfollow') {
      // Remove category from user's followed categories
      if (user.followedCategories) {
        const index = user.followedCategories.indexOf(categoryId);
        if (index > -1) {
          user.followedCategories.splice(index, 1);
          category.followerCount = Math.max(0, category.followerCount - 1);
          await category.save();
        }
      }
    }

    await user.save();

    res.json({
      success: true,
      message: action === 'follow' ? 'Category followed' : 'Category unfollowed',
      data: {
        category: {
          id: category._id,
          name: category.name,
          followerCount: category.followerCount
        },
        isFollowing: action === 'follow'
      }
    });
  } catch (error) {
    console.error('Follow category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow category'
    });
  }
});

// @route   GET /api/categories/user/followed
// @desc    Get categories followed by current user
// @access  Private
router.get('/user/followed', authenticateToken, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user._id)
      .populate('followedCategories', 'name slug icon color description followerCount');

    res.json({
      success: true,
      data: {
        followedCategories: user.followedCategories || []
      }
    });
  } catch (error) {
    console.error('Get followed categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get followed categories'
    });
  }
});

module.exports = router;
