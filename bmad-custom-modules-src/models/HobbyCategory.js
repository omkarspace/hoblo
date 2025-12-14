const mongoose = require('mongoose');

const hobbyCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  icon: {
    type: String,
    required: true // Emoji or icon identifier
  },
  color: {
    type: String,
    default: '#6366f1' // Default indigo color
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HobbyCategory',
    default: null
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HobbyCategory'
  }],
  level: {
    type: Number,
    default: 1, // 1 = main category, 2 = subcategory, etc.
    min: 1,
    max: 3
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  popularity: {
    type: Number,
    default: 0
  },
  followerCount: {
    type: Number,
    default: 0
  },
  postCount: {
    type: Number,
    default: 0
  },
  groupCount: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  metaTags: {
    type: [String],
    default: []
  },
  skillLevels: [{
    name: String, // Beginner, Intermediate, Advanced, Expert
    description: String,
    color: String
  }],
  relatedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HobbyCategory'
  }],
  navigationType: {
    type: String,
    enum: ['craft_circle', 'skill_tree', 'standard'],
    default: 'standard'
  },
  navigationData: {
    // For craft_circle: circular positioning
    angle: Number,
    radius: Number,
    // For skill_tree: hierarchical positioning
    x: Number,
    y: Number,
    connections: [{
      toCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HobbyCategory'
      },
      type: {
        type: String,
        enum: ['prerequisite', 'related', 'progression']
      }
    }]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
hobbyCategorySchema.index({ slug: 1 });
hobbyCategorySchema.index({ parentCategory: 1 });
hobbyCategorySchema.index({ level: 1 });
hobbyCategorySchema.index({ isActive: 1 });
hobbyCategorySchema.index({ popularity: -1 });
hobbyCategorySchema.index({ displayOrder: 1 });

// Virtual for checking if category has subcategories
hobbyCategorySchema.virtual('hasSubcategories').get(function() {
  return this.subcategories && this.subcategories.length > 0;
});

// Virtual for full category path
hobbyCategorySchema.virtual('path').get(async function() {
  if (!this.parentCategory) return [this.name];

  const parent = await mongoose.model('HobbyCategory').findById(this.parentCategory);
  if (!parent) return [this.name];

  return [...(await parent.path), this.name];
});

// Static method to get main categories (level 1)
hobbyCategorySchema.statics.getMainCategories = function(options = {}) {
  const query = { level: 1, isActive: true };

  if (options.featured) query.featured = true;

  return this.find(query)
    .sort({ displayOrder: 1, popularity: -1 })
    .limit(options.limit || 50);
};

// Static method to get subcategories
hobbyCategorySchema.statics.getSubcategories = function(parentId) {
  return this.find({
    parentCategory: parentId,
    isActive: true
  }).sort({ displayOrder: 1, popularity: -1 });
};

// Static method to get category tree
hobbyCategorySchema.statics.getCategoryTree = async function() {
  const mainCategories = await this.getMainCategories();

  const tree = await Promise.all(
    mainCategories.map(async (category) => {
      const subcategories = await this.getSubcategories(category._id);
      return {
        ...category.toObject(),
        subcategories: subcategories.map(sub => ({
          ...sub.toObject(),
          parentName: category.name
        }))
      };
    })
  );

  return tree;
};

// Static method to get craft circles data
hobbyCategorySchema.statics.getCraftCircles = async function() {
  const categories = await this.find({
    navigationType: 'craft_circle',
    isActive: true,
    level: 1
  }).sort({ displayOrder: 1 });

  return categories.map(category => ({
    id: category._id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    color: category.color,
    description: category.description,
    angle: category.navigationData?.angle || 0,
    radius: category.navigationData?.radius || 100,
    followerCount: category.followerCount,
    postCount: category.postCount
  }));
};

// Static method to get skill trees data
hobbyCategorySchema.statics.getSkillTrees = async function() {
  const categories = await this.find({
    navigationType: 'skill_tree',
    isActive: true
  }).populate('navigationData.connections.toCategory', 'name slug icon');

  return categories.map(category => ({
    id: category._id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    color: category.color,
    level: category.level,
    x: category.navigationData?.x || 0,
    y: category.navigationData?.y || 0,
    connections: category.navigationData?.connections || [],
    skillLevels: category.skillLevels
  }));
};

// Static method to search categories
hobbyCategorySchema.statics.searchCategories = function(searchTerm, options = {}) {
  const regex = new RegExp(searchTerm, 'i');
  const query = {
    isActive: true,
    $or: [
      { name: regex },
      { description: regex },
      { metaTags: regex }
    ]
  };

  return this.find(query)
    .sort({ popularity: -1, followerCount: -1 })
    .limit(options.limit || 20);
};

// Static method to get popular categories
hobbyCategorySchema.statics.getPopularCategories = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ followerCount: -1, postCount: -1 })
    .limit(limit);
};

// Static method to get featured categories
hobbyCategorySchema.statics.getFeaturedCategories = function(limit = 6) {
  return this.find({ isActive: true, featured: true })
    .sort({ displayOrder: 1, popularity: -1 })
    .limit(limit);
};

// Pre-save middleware to generate slug
hobbyCategorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('HobbyCategory', hobbyCategorySchema);
