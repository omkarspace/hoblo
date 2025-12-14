const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true // URL or icon identifier
  },
  category: {
    type: String,
    enum: ['engagement', 'creation', 'community', 'milestone', 'special'],
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  triggerType: {
    type: String,
    enum: ['automatic', 'manual', 'event'],
    default: 'automatic'
  },
  triggerConditions: {
    type: mongoose.Schema.Types.Mixed, // Flexible conditions object
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  }],
  maxProgress: {
    type: Number,
    default: 1 // For progress-based achievements
  },
  isProgressBased: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
achievementSchema.index({ category: 1, isActive: 1 });
achievementSchema.index({ rarity: 1 });

// Static method to get active achievements
achievementSchema.statics.getActiveAchievements = function() {
  return this.find({ isActive: true }).sort({ displayOrder: 1 });
};

// Static method to get achievements by category
achievementSchema.statics.getByCategory = function(category) {
  return this.find({ category: category, isActive: true }).sort({ displayOrder: 1 });
};

// Static method to check if user meets achievement conditions
achievementSchema.statics.checkAchievementConditions = function(achievement, userStats) {
  const conditions = achievement.triggerConditions;

  switch (achievement.category) {
    case 'engagement':
      if (conditions.postsCreated && userStats.postsCreated >= conditions.postsCreated) return true;
      if (conditions.commentsMade && userStats.commentsMade >= conditions.commentsMade) return true;
      if (conditions.groupsJoined && userStats.groupsJoined >= conditions.groupsJoined) return true;
      if (conditions.daysActive && userStats.daysActive >= conditions.daysActive) return true;
      break;

    case 'creation':
      if (conditions.contentUploaded && userStats.contentUploaded >= conditions.contentUploaded) return true;
      if (conditions.resourcesShared && userStats.resourcesShared >= conditions.resourcesShared) return true;
      if (conditions.eventsHosted && userStats.eventsHosted >= conditions.eventsHosted) return true;
      break;

    case 'community':
      if (conditions.followersGained && userStats.followersGained >= conditions.followersGained) return true;
      if (conditions.groupsCreated && userStats.groupsCreated >= conditions.groupsCreated) return true;
      if (conditions.helpfulVotes && userStats.helpfulVotes >= conditions.helpfulVotes) return true;
      break;

    case 'milestone':
      if (conditions.accountAgeDays && userStats.accountAgeDays >= conditions.accountAgeDays) return true;
      if (conditions.totalPoints && userStats.totalPoints >= conditions.totalPoints) return true;
      break;

    case 'special':
      // Special achievements might have custom logic
      return false;
  }

  return false;
};

module.exports = mongoose.model('Achievement', achievementSchema);
