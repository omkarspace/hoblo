const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
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
    maxlength: 1000
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HobbyCategory',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverImage: {
    type: String,
    default: null
  },
  privacy: {
    type: String,
    enum: ['public', 'private', 'invite_only'],
    default: 'public'
  },
  membershipPolicy: {
    type: String,
    enum: ['open', 'approval_required', 'invite_only'],
    default: 'open'
  },
  memberCount: {
    type: Number,
    default: 1,
    min: 1
  },
  maxMembers: {
    type: Number,
    default: null, // null = unlimited
    min: 1
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  rules: [{
    title: String,
    description: String,
    order: Number
  }],
  settings: {
    allowPosts: {
      type: Boolean,
      default: true
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    requireApprovalForPosts: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  featured: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  stats: {
    totalPosts: {
      type: Number,
      default: 0
    },
    totalComments: {
      type: Number,
      default: 0
    },
    totalMembers: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
groupSchema.index({ slug: 1 });
groupSchema.index({ category: 1 });
groupSchema.index({ creator: 1 });
groupSchema.index({ privacy: 1 });
groupSchema.index({ 'settings.isActive': 1 });
groupSchema.index({ memberCount: -1 });
groupSchema.index({ lastActivity: -1 });
groupSchema.index({ featured: -1 });

// Virtual for checking if group is full
groupSchema.virtual('isFull').get(function() {
  return this.maxMembers && this.memberCount >= this.maxMembers;
});

// Virtual for checking if user can join directly
groupSchema.virtual('canJoinDirectly').get(function() {
  return this.membershipPolicy === 'open' && this.privacy !== 'invite_only' && !this.isFull;
});

// Static method to get groups by category
groupSchema.statics.getByCategory = function(categoryId, options = {}) {
  const query = {
    category: categoryId,
    'settings.isActive': true
  };

  if (options.privacy) query.privacy = options.privacy;
  if (options.featured) query.featured = true;

  return this.find(query)
    .populate('creator', 'firstName lastName profilePicture')
    .populate('category', 'name icon color')
    .sort({ featured: -1, memberCount: -1, lastActivity: -1 })
    .limit(options.limit || 20);
};

// Static method to search groups
groupSchema.statics.searchGroups = function(searchTerm, options = {}) {
  const regex = new RegExp(searchTerm, 'i');
  const query = {
    'settings.isActive': true,
    $or: [
      { name: regex },
      { description: regex },
      { tags: regex }
    ]
  };

  if (options.category) query.category = options.category;
  if (options.privacy) query.privacy = options.privacy;

  return this.find(query)
    .populate('creator', 'firstName lastName profilePicture')
    .populate('category', 'name icon color')
    .sort({ memberCount: -1, lastActivity: -1 })
    .limit(options.limit || 20);
};

// Static method to get user's groups
groupSchema.statics.getUserGroups = function(userId, options = {}) {
  // This would need to be used with GroupMember model
  // For now, return groups created by user
  const query = {
    creator: userId,
    'settings.isActive': true
  };

  return this.find(query)
    .populate('category', 'name icon color')
    .sort({ lastActivity: -1 });
};

// Static method to get popular groups
groupSchema.statics.getPopularGroups = function(limit = 10) {
  return this.find({
    'settings.isActive': true,
    privacy: { $ne: 'invite_only' }
  })
  .populate('creator', 'firstName lastName profilePicture')
  .populate('category', 'name icon color')
  .sort({ memberCount: -1, lastActivity: -1 })
  .limit(limit);
};

// Static method to get featured groups
groupSchema.statics.getFeaturedGroups = function(limit = 6) {
  return this.find({
    'settings.isActive': true,
    featured: true,
    privacy: { $ne: 'invite_only' }
  })
  .populate('creator', 'firstName lastName profilePicture')
  .populate('category', 'name icon color')
  .sort({ memberCount: -1, lastActivity: -1 })
  .limit(limit);
};

// Pre-save middleware to generate slug
groupSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);
