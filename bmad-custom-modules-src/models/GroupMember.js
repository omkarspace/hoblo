const mongoose = require('mongoose');

const groupMemberSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'moderator', 'member'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended', 'removed'],
    default: 'pending'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  inviteMessage: {
    type: String,
    maxlength: 500,
    default: ''
  },
  permissions: {
    canPost: {
      type: Boolean,
      default: true
    },
    canComment: {
      type: Boolean,
      default: true
    },
    canInvite: {
      type: Boolean,
      default: false
    },
    canModerate: {
      type: Boolean,
      default: false
    },
    canManageSettings: {
      type: Boolean,
      default: false
    }
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  contributionScore: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
groupMemberSchema.index({ groupId: 1, status: 1 });
groupMemberSchema.index({ groupId: 1, role: 1 });
groupMemberSchema.index({ userId: 1, status: 1 });
groupMemberSchema.index({ groupId: 1, lastActivity: -1 });

// Virtual for checking if member is active
groupMemberSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Virtual for checking if member has admin privileges
groupMemberSchema.virtual('isAdmin').get(function() {
  return ['owner', 'admin'].includes(this.role);
});

// Virtual for checking if member has moderator privileges
groupMemberSchema.virtual('isModerator').get(function() {
  return ['owner', 'admin', 'moderator'].includes(this.role);
});

// Static method to get group members
groupMemberSchema.statics.getGroupMembers = function(groupId, options = {}) {
  const query = { groupId: groupId };

  if (options.status) query.status = options.status;
  if (options.role) query.role = options.role;

  return this.find(query)
    .populate('userId', 'firstName lastName profilePicture')
    .sort({ role: 1, joinedAt: 1 });
};

// Static method to get user's groups
groupMemberSchema.statics.getUserGroups = function(userId, options = {}) {
  const query = {
    userId: userId,
    status: 'active'
  };

  return this.find(query)
    .populate({
      path: 'groupId',
      match: { 'settings.isActive': true },
      populate: {
        path: 'category',
        select: 'name icon color'
      }
    })
    .sort({ joinedAt: -1 });
};

// Static method to check if user is member of group
groupMemberSchema.statics.isMember = function(groupId, userId) {
  return this.findOne({
    groupId: groupId,
    userId: userId,
    status: 'active'
  });
};

// Static method to check if user has pending request
groupMemberSchema.statics.hasPendingRequest = function(groupId, userId) {
  return this.findOne({
    groupId: groupId,
    userId: userId,
    status: 'pending'
  });
};

// Static method to get pending join requests for a group
groupMemberSchema.statics.getPendingRequests = function(groupId) {
  return this.find({
    groupId: groupId,
    status: 'pending'
  })
  .populate('userId', 'firstName lastName profilePicture bio')
  .populate('invitedBy', 'firstName lastName')
  .sort({ createdAt: 1 });
};

// Static method to get user's pending requests
groupMemberSchema.statics.getUserPendingRequests = function(userId) {
  return this.find({
    userId: userId,
    status: 'pending'
  })
  .populate({
    path: 'groupId',
    populate: {
      path: 'category',
      select: 'name icon color'
    }
  })
  .sort({ createdAt: -1 });
};

// Static method to approve join request
groupMemberSchema.statics.approveRequest = async function(groupId, userId, approvedBy) {
  const membership = await this.findOneAndUpdate(
    { groupId: groupId, userId: userId, status: 'pending' },
    {
      status: 'active',
      joinedAt: new Date()
    },
    { new: true }
  ).populate('userId', 'firstName lastName');

  if (membership) {
    // Update group member count
    await mongoose.model('Group').findByIdAndUpdate(groupId, {
      $inc: { memberCount: 1 },
      lastActivity: new Date()
    });

    // Update user's group membership stats
    await mongoose.model('User').findByIdAndUpdate(userId, {
      $inc: { 'stats.groupsJoined': 1 }
    });
  }

  return membership;
};

// Static method to reject join request
groupMemberSchema.statics.rejectRequest = async function(groupId, userId, rejectedBy) {
  return this.findOneAndDelete({
    groupId: groupId,
    userId: userId,
    status: 'pending'
  });
};

// Static method to remove member from group
groupMemberSchema.statics.removeMember = async function(groupId, userId, removedBy) {
  const membership = await this.findOneAndUpdate(
    { groupId: groupId, userId: userId, status: 'active' },
    { status: 'removed' },
    { new: true }
  );

  if (membership) {
    // Update group member count
    await mongoose.model('Group').findByIdAndUpdate(groupId, {
      $inc: { memberCount: -1 }
    });
  }

  return membership;
};

// Static method to update member role
groupMemberSchema.statics.updateRole = async function(groupId, userId, newRole, updatedBy) {
  const validRoles = ['owner', 'admin', 'moderator', 'member'];
  if (!validRoles.includes(newRole)) {
    throw new Error('Invalid role');
  }

  // Update permissions based on role
  const permissions = getPermissionsForRole(newRole);

  return this.findOneAndUpdate(
    { groupId: groupId, userId: userId, status: 'active' },
    {
      role: newRole,
      permissions: permissions
    },
    { new: true }
  ).populate('userId', 'firstName lastName profilePicture');
};

// Static method to invite user to group
groupMemberSchema.statics.inviteUser = async function(groupId, userId, invitedBy, message = '') {
  // Check if user is already a member or has pending request
  const existing = await this.findOne({
    groupId: groupId,
    userId: userId,
    status: { $in: ['active', 'pending'] }
  });

  if (existing) {
    if (existing.status === 'active') {
      throw new Error('User is already a member of this group');
    } else {
      throw new Error('User already has a pending request for this group');
    }
  }

  // Create invitation
  const invitation = new this({
    groupId: groupId,
    userId: userId,
    invitedBy: invitedBy,
    inviteMessage: message,
    status: 'pending'
  });

  return invitation.save();
};

// Helper function to get permissions for role
function getPermissionsForRole(role) {
  const basePermissions = {
    canPost: true,
    canComment: true,
    canInvite: false,
    canModerate: false,
    canManageSettings: false
  };

  switch (role) {
    case 'owner':
      return {
        ...basePermissions,
        canInvite: true,
        canModerate: true,
        canManageSettings: true
      };
    case 'admin':
      return {
        ...basePermissions,
        canInvite: true,
        canModerate: true,
        canManageSettings: true
      };
    case 'moderator':
      return {
        ...basePermissions,
        canModerate: true
      };
    case 'member':
    default:
      return basePermissions;
  }
}

module.exports = mongoose.model('GroupMember', groupMemberSchema);
