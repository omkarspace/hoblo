const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');

const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const HobbyCategory = require('../models/HobbyCategory');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for group cover images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/group-covers/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'group-' + req.params.groupId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Validation rules
const createGroupValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Group name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('privacy')
    .optional()
    .isIn(['public', 'private', 'invite_only'])
    .withMessage('Invalid privacy setting'),
  body('membershipPolicy')
    .optional()
    .isIn(['open', 'approval_required', 'invite_only'])
    .withMessage('Invalid membership policy')
];

const updateGroupValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Group name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Tags must be less than 30 characters each')
];

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', authenticateToken, createGroupValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, categoryId, privacy, membershipPolicy, tags, rules } = req.body;

    // Verify category exists
    const category = await HobbyCategory.findById(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // Create group
    const group = new Group({
      name,
      description,
      category: categoryId,
      creator: req.user._id,
      privacy: privacy || 'public',
      membershipPolicy: membershipPolicy || 'open',
      tags: tags || [],
      rules: rules || []
    });

    await group.save();

    // Add creator as owner member
    const membership = new GroupMember({
      groupId: group._id,
      userId: req.user._id,
      role: 'owner',
      status: 'active',
      permissions: {
        canPost: true,
        canComment: true,
        canInvite: true,
        canModerate: true,
        canManageSettings: true
      }
    });

    await membership.save();

    // Populate group data for response
    await group.populate('creator', 'firstName lastName profilePicture');
    await group.populate('category', 'name icon color');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: {
        group: group,
        membership: membership
      }
    });
  } catch (error) {
    console.error('Create group error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Group name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create group'
    });
  }
});

// @route   GET /api/groups
// @desc    Get groups with filtering
// @access  Public/Private
router.get('/', async (req, res) => {
  try {
    const { category, search, privacy, featured, limit, popular } = req.query;

    let groups;

    if (search) {
      // Search groups
      groups = await Group.searchGroups(search, { category, privacy, limit: parseInt(limit) || 20 });
    } else if (popular === 'true') {
      // Get popular groups
      groups = await Group.getPopularGroups(parseInt(limit) || 10);
    } else if (featured === 'true') {
      // Get featured groups
      groups = await Group.getFeaturedGroups(parseInt(limit) || 6);
    } else if (category) {
      // Get groups by category
      groups = await Group.getByCategory(category, { privacy, limit: parseInt(limit) || 20 });
    } else {
      // Get general groups
      const query = { 'settings.isActive': true };
      if (privacy) query.privacy = privacy;

      groups = await Group.find(query)
        .populate('creator', 'firstName lastName profilePicture')
        .populate('category', 'name icon color')
        .sort({ memberCount: -1, lastActivity: -1 })
        .limit(parseInt(limit) || 20);
    }

    res.json({
      success: true,
      data: {
        groups: groups,
        total: groups.length
      }
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get groups'
    });
  }
});

// @route   GET /api/groups/my-groups
// @desc    Get current user's groups
// @access  Private
router.get('/my-groups', authenticateToken, async (req, res) => {
  try {
    const userGroups = await GroupMember.getUserGroups(req.user._id);

    // Filter out null groups (inactive groups)
    const activeGroups = userGroups.filter(membership => membership.groupId);

    res.json({
      success: true,
      data: {
        groups: activeGroups,
        total: activeGroups.length
      }
    });
  } catch (error) {
    console.error('Get my groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get your groups'
    });
  }
});

// @route   GET /api/groups/:groupId
// @desc    Get group details
// @access  Public/Private
router.get('/:groupId', async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.groupId,
      'settings.isActive': true
    })
    .populate('creator', 'firstName lastName profilePicture')
    .populate('category', 'name icon color slug');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user can view this group
    let membership = null;
    let canView = group.privacy === 'public';

    if (req.user) {
      membership = await GroupMember.isMember(group._id, req.user._id);
      canView = canView || membership || group.creator.toString() === req.user._id;
    }

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this group'
      });
    }

    res.json({
      success: true,
      data: {
        group: group,
        membership: membership,
        canJoin: membership ? false : group.canJoinDirectly,
        isOwner: req.user && group.creator._id.toString() === req.user._id.toString()
      }
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group'
    });
  }
});

// @route   PUT /api/groups/:groupId
// @desc    Update group settings
// @access  Private (Owner/Admin only)
router.put('/:groupId', authenticateToken, updateGroupValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is owner or admin
    const membership = await GroupMember.isMember(group._id, req.user._id);
    if (!membership || !membership.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this group'
      });
    }

    const { name, description, privacy, membershipPolicy, tags, rules, settings } = req.body;

    // Update fields
    if (name !== undefined) group.name = name;
    if (description !== undefined) group.description = description;
    if (privacy !== undefined) group.privacy = privacy;
    if (membershipPolicy !== undefined) group.membershipPolicy = membershipPolicy;
    if (tags !== undefined) group.tags = tags;
    if (rules !== undefined) group.rules = rules;
    if (settings !== undefined) group.settings = { ...group.settings, ...settings };

    await group.save();

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: {
        group: group
      }
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group'
    });
  }
});

// @route   POST /api/groups/:groupId/join
// @desc    Request to join or join a group
// @access  Private
router.post('/:groupId/join', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group || !group.settings.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is already a member
    const existingMembership = await GroupMember.isMember(group._id, req.user._id);
    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group'
      });
    }

    // Check if user has pending request
    const pendingRequest = await GroupMember.hasPendingRequest(group._id, req.user._id);
    if (pendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this group'
      });
    }

    if (group.canJoinDirectly) {
      // Direct join
      const membership = new GroupMember({
        groupId: group._id,
        userId: req.user._id,
        status: 'active',
        joinedAt: new Date()
      });

      await membership.save();

      // Update group member count
      group.memberCount += 1;
      group.lastActivity = new Date();
      await group.save();

      // Update user's group membership stats
      await require('../models/User').findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.groupsJoined': 1 }
      });

      res.json({
        success: true,
        message: 'Successfully joined the group',
        data: {
          membership: membership,
          group: group
        }
      });
    } else {
      // Create join request
      const membership = new GroupMember({
        groupId: group._id,
        userId: req.user._id,
        status: 'pending'
      });

      await membership.save();

      res.json({
        success: true,
        message: 'Join request sent successfully',
        data: {
          membership: membership,
          requiresApproval: true
        }
      });
    }
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join group'
    });
  }
});

// @route   POST /api/groups/:groupId/leave
// @desc    Leave a group
// @access  Private
router.post('/:groupId/leave', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const membership = await GroupMember.isMember(group._id, req.user._id);
    if (!membership) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Cannot leave if owner (transfer ownership first)
    if (membership.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'As the owner, you cannot leave the group. Transfer ownership first or delete the group.'
      });
    }

    // Remove membership
    await GroupMember.removeMember(group._id, req.user._id, req.user._id);

    res.json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave group'
    });
  }
});

// @route   GET /api/groups/:groupId/members
// @desc    Get group members
// @access  Private (Group members only)
router.get('/:groupId/members', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member
    const membership = await GroupMember.isMember(group._id, req.user._id);
    if (!membership && group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view group members'
      });
    }

    const members = await GroupMember.getGroupMembers(group._id, { status: 'active' });

    res.json({
      success: true,
      data: {
        members: members,
        total: members.length
      }
    });
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group members'
    });
  }
});

// @route   GET /api/groups/:groupId/pending-requests
// @desc    Get pending join requests
// @access  Private (Moderators only)
router.get('/:groupId/pending-requests', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is moderator
    const membership = await GroupMember.isMember(group._id, req.user._id);
    if (!membership || !membership.isModerator) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view pending requests'
      });
    }

    const pendingRequests = await GroupMember.getPendingRequests(group._id);

    res.json({
      success: true,
      data: {
        requests: pendingRequests,
        total: pendingRequests.length
      }
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending requests'
    });
  }
});

// @route   POST /api/groups/:groupId/requests/:requestId/approve
// @desc    Approve join request
// @access  Private (Moderators only)
router.post('/:groupId/requests/:requestId/approve', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is moderator
    const userMembership = await GroupMember.isMember(group._id, req.user._id);
    if (!userMembership || !userMembership.isModerator) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to approve requests'
      });
    }

    const membership = await GroupMember.approveRequest(group._id, req.params.requestId, req.user._id);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }

    res.json({
      success: true,
      message: 'Join request approved',
      data: {
        membership: membership
      }
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve request'
    });
  }
});

// @route   POST /api/groups/:groupId/requests/:requestId/reject
// @desc    Reject join request
// @access  Private (Moderators only)
router.post('/:groupId/requests/:requestId/reject', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is moderator
    const userMembership = await GroupMember.isMember(group._id, req.user._id);
    if (!userMembership || !userMembership.isModerator) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to reject requests'
      });
    }

    const deletedRequest = await GroupMember.rejectRequest(group._id, req.params.requestId, req.user._id);

    if (!deletedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }

    res.json({
      success: true,
      message: 'Join request rejected'
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject request'
    });
  }
});

// @route   POST /api/groups/:groupId/members/:memberId/role
// @desc    Update member role
// @access  Private (Admins only)
router.post('/:groupId/members/:memberId/role', authenticateToken, async (req, res) => {
  try {
    const { newRole } = req.body;

    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin
    const userMembership = await GroupMember.isMember(group._id, req.user._id);
    if (!userMembership || !userMembership.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update member roles'
      });
    }

    const updatedMembership = await GroupMember.updateRole(
      group._id,
      req.params.memberId,
      newRole,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Member role updated successfully',
      data: {
        membership: updatedMembership
      }
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member role'
    });
  }
});

// @route   POST /api/groups/:groupId/members/:memberId/remove
// @desc    Remove member from group
// @access  Private (Moderators only)
router.post('/:groupId/members/:memberId/remove', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is moderator
    const userMembership = await GroupMember.isMember(group._id, req.user._id);
    if (!userMembership || !userMembership.isModerator) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove members'
      });
    }

    // Cannot remove owner
    if (req.params.memberId === group.creator.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the group owner'
      });
    }

    const removedMembership = await GroupMember.removeMember(
      group._id,
      req.params.memberId,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member'
    });
  }
});

// @route   POST /api/groups/:groupId/invite
// @desc    Invite user to group
// @access  Private (Members with invite permission)
router.post('/:groupId/invite', authenticateToken, async (req, res) => {
  try {
    const { userId, message } = req.body;

    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user can invite
    const membership = await GroupMember.isMember(group._id, req.user._id);
    if (!membership || !membership.permissions.canInvite) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to invite users'
      });
    }

    const invitation = await GroupMember.inviteUser(
      group._id,
      userId,
      req.user._id,
      message
    );

    res.json({
      success: true,
      message: 'User invited successfully',
      data: {
        invitation: invitation
      }
    });
  } catch (error) {
    console.error('Invite user error:', error);
    if (error.message.includes('already')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to invite user'
    });
  }
});

// @route   POST /api/groups/:groupId/cover
// @desc    Upload group cover image
// @access  Private (Admins only)
router.post('/:groupId/cover', authenticateToken, upload.single('coverImage'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin
    const membership = await GroupMember.isMember(group._id, req.user._id);
    if (!membership || !membership.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update group cover'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    group.coverImage = req.file.filename;
    await group.save();

    res.json({
      success: true,
      message: 'Group cover updated successfully',
      data: {
        group: group,
        coverImageUrl: `/uploads/group-covers/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Upload group cover error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload group cover'
    });
  }
});

// @route   DELETE /api/groups/:groupId
// @desc    Delete group
// @access  Private (Owner only)
router.delete('/:groupId', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Only owner can delete
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group owner can delete the group'
      });
    }

    // Mark as inactive instead of deleting
    group.settings.isActive = false;
    await group.save();

    // Update all memberships to removed status
    await GroupMember.updateMany(
      { groupId: group._id, status: 'active' },
      { status: 'removed' }
    );

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete group'
    });
  }
});

module.exports = router;
