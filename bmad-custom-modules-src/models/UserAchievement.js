const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0,
    min: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  shared: {
    type: Boolean,
    default: false
  },
  sharedAt: Date,
  sharedPlatforms: [{
    type: String,
    enum: ['twitter', 'facebook', 'linkedin', 'instagram']
  }]
}, {
  timestamps: true
});

// Compound index to ensure one achievement per user
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

// Index for better query performance
userAchievementSchema.index({ userId: 1, isCompleted: 1 });
userAchievementSchema.index({ userId: 1, earnedAt: -1 });

// Static method to get user's achievements
userAchievementSchema.statics.getUserAchievements = function(userId) {
  return this.find({ userId: userId })
    .populate('achievementId')
    .sort({ earnedAt: -1 });
};

// Static method to get completed achievements
userAchievementSchema.statics.getCompletedAchievements = function(userId) {
  return this.find({ userId: userId, isCompleted: true })
    .populate('achievementId')
    .sort({ earnedAt: -1 });
};

// Static method to get achievement progress
userAchievementSchema.statics.getAchievementProgress = function(userId, achievementId) {
  return this.findOne({ userId: userId, achievementId: achievementId });
};

// Static method to update achievement progress
userAchievementSchema.statics.updateProgress = async function(userId, achievementId, newProgress, maxProgress) {
  const isCompleted = newProgress >= maxProgress;

  return this.findOneAndUpdate(
    { userId: userId, achievementId: achievementId },
    {
      progress: Math.min(newProgress, maxProgress),
      isCompleted: isCompleted,
      earnedAt: isCompleted ? new Date() : undefined
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).populate('achievementId');
};

// Static method to award achievement
userAchievementSchema.statics.awardAchievement = async function(userId, achievementId) {
  const achievement = await this.findOneAndUpdate(
    { userId: userId, achievementId: achievementId },
    {
      progress: 1,
      isCompleted: true,
      earnedAt: new Date()
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).populate('achievementId');

  // Update user's achievement list
  await mongoose.model('User').findByIdAndUpdate(userId, {
    $addToSet: {
      achievements: {
        badgeId: achievementId,
        earnedAt: new Date()
      }
    }
  });

  return achievement;
};

// Static method to check and award achievements based on user stats
userAchievementSchema.statics.checkAndAwardAchievements = async function(userId, userStats) {
  const Achievement = mongoose.model('Achievement');
  const achievements = await Achievement.getActiveAchievements();
  const awardedAchievements = [];

  for (const achievement of achievements) {
    // Skip if user already has this achievement
    const existing = await this.findOne({ userId: userId, achievementId: achievement._id });
    if (existing && existing.isCompleted) continue;

    // Check if conditions are met
    const conditionsMet = Achievement.checkAchievementConditions(achievement, userStats);

    if (conditionsMet) {
      if (achievement.isProgressBased) {
        // For progress-based achievements, calculate progress
        const progress = calculateProgress(achievement, userStats);
        const updated = await this.updateProgress(userId, achievement._id, progress, achievement.maxProgress);

        if (updated.isCompleted && !existing?.isCompleted) {
          awardedAchievements.push(updated);
        }
      } else {
        // For instant achievements
        const awarded = await this.awardAchievement(userId, achievement._id);
        awardedAchievements.push(awarded);
      }
    } else if (achievement.isProgressBased) {
      // Update progress even if not completed
      const progress = calculateProgress(achievement, userStats);
      await this.updateProgress(userId, achievement._id, progress, achievement.maxProgress);
    }
  }

  return awardedAchievements;
};

// Helper function to calculate progress for progress-based achievements
function calculateProgress(achievement, userStats) {
  const conditions = achievement.triggerConditions;

  switch (achievement.category) {
    case 'engagement':
      if (conditions.postsCreated) return Math.min(userStats.postsCreated || 0, conditions.postsCreated);
      if (conditions.commentsMade) return Math.min(userStats.commentsMade || 0, conditions.commentsMade);
      if (conditions.groupsJoined) return Math.min(userStats.groupsJoined || 0, conditions.groupsJoined);
      break;

    case 'creation':
      if (conditions.contentUploaded) return Math.min(userStats.contentUploaded || 0, conditions.contentUploaded);
      if (conditions.resourcesShared) return Math.min(userStats.resourcesShared || 0, conditions.resourcesShared);
      break;

    case 'community':
      if (conditions.followersGained) return Math.min(userStats.followersGained || 0, conditions.followersGained);
      break;
  }

  return 0;
}

module.exports = mongoose.model('UserAchievement', userAchievementSchema);
