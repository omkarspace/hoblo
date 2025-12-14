const mongoose = require('mongoose');
const Achievement = require('../models/Achievement');
require('dotenv').config();

// Achievement data
const achievementsData = [
  // Engagement Achievements
  {
    name: 'First Steps',
    description: 'Create your first post',
    icon: '🎯',
    category: 'engagement',
    rarity: 'common',
    points: 10,
    triggerConditions: { postsCreated: 1 },
    displayOrder: 1
  },
  {
    name: 'Conversation Starter',
    description: 'Create 10 posts',
    icon: '💬',
    category: 'engagement',
    rarity: 'common',
    points: 25,
    triggerConditions: { postsCreated: 10 },
    displayOrder: 2
  },
  {
    name: 'Active Contributor',
    description: 'Create 50 posts',
    icon: '📝',
    category: 'engagement',
    rarity: 'uncommon',
    points: 50,
    triggerConditions: { postsCreated: 50 },
    displayOrder: 3
  },
  {
    name: 'Commentator',
    description: 'Leave 25 comments',
    icon: '💭',
    category: 'engagement',
    rarity: 'common',
    points: 20,
    triggerConditions: { commentsMade: 25 },
    displayOrder: 4
  },
  {
    name: 'Social Butterfly',
    description: 'Join 5 groups',
    icon: '🦋',
    category: 'engagement',
    rarity: 'common',
    points: 15,
    triggerConditions: { groupsJoined: 5 },
    displayOrder: 5
  },
  {
    name: 'Community Builder',
    description: 'Join 25 groups',
    icon: '🌟',
    category: 'engagement',
    rarity: 'uncommon',
    points: 40,
    triggerConditions: { groupsJoined: 25 },
    displayOrder: 6
  },

  // Creation Achievements
  {
    name: 'Content Creator',
    description: 'Upload your first piece of content',
    icon: '📸',
    category: 'creation',
    rarity: 'common',
    points: 15,
    triggerConditions: { contentUploaded: 1 },
    displayOrder: 7
  },
  {
    name: 'Resource Sharer',
    description: 'Share 10 resources',
    icon: '📚',
    category: 'creation',
    rarity: 'uncommon',
    points: 30,
    triggerConditions: { resourcesShared: 10 },
    displayOrder: 8
  },
  {
    name: 'Event Organizer',
    description: 'Host your first live event',
    icon: '🎪',
    category: 'creation',
    rarity: 'uncommon',
    points: 35,
    triggerConditions: { eventsHosted: 1 },
    displayOrder: 9
  },

  // Community Achievements
  {
    name: 'Well Liked',
    description: 'Receive 10 helpful votes',
    icon: '👍',
    category: 'community',
    rarity: 'common',
    points: 20,
    triggerConditions: { helpfulVotes: 10 },
    displayOrder: 10
  },
  {
    name: 'Group Founder',
    description: 'Create your first group',
    icon: '👑',
    category: 'community',
    rarity: 'uncommon',
    points: 45,
    triggerConditions: { groupsCreated: 1 },
    displayOrder: 11
  },
  {
    name: 'Influencer',
    description: 'Gain 50 followers',
    icon: '🌟',
    category: 'community',
    rarity: 'rare',
    points: 75,
    triggerConditions: { followersGained: 50 },
    displayOrder: 12
  },

  // Milestone Achievements
  {
    name: 'One Week Wonder',
    description: 'Active on HobbyHub for 7 days',
    icon: '📅',
    category: 'milestone',
    rarity: 'common',
    points: 10,
    triggerConditions: { daysActive: 7 },
    displayOrder: 13
  },
  {
    name: 'Month Milestone',
    description: 'Active member for 30 days',
    icon: '🎂',
    category: 'milestone',
    rarity: 'uncommon',
    points: 25,
    triggerConditions: { daysActive: 30 },
    displayOrder: 14
  },
  {
    name: 'Year Veteran',
    description: 'Loyal member for 365 days',
    icon: '🏆',
    category: 'milestone',
    rarity: 'epic',
    points: 100,
    triggerConditions: { daysActive: 365 },
    displayOrder: 15
  },
  {
    name: 'Point Collector',
    description: 'Earn 100 achievement points',
    icon: '💎',
    category: 'milestone',
    rarity: 'rare',
    points: 50,
    triggerConditions: { totalPoints: 100 },
    displayOrder: 16
  },

  // Progress-based Achievements
  {
    name: 'Posting Pro',
    description: 'Create 100 posts',
    icon: '🚀',
    category: 'engagement',
    rarity: 'rare',
    points: 80,
    triggerConditions: { postsCreated: 100 },
    isProgressBased: true,
    maxProgress: 100,
    displayOrder: 17
  },
  {
    name: 'Master Creator',
    description: 'Upload 50 pieces of content',
    icon: '🎨',
    category: 'creation',
    rarity: 'epic',
    points: 120,
    triggerConditions: { contentUploaded: 50 },
    isProgressBased: true,
    maxProgress: 50,
    displayOrder: 18
  },

  // Special Achievements
  {
    name: 'Beta Tester',
    description: 'Participated in beta testing',
    icon: '🧪',
    category: 'special',
    rarity: 'legendary',
    points: 200,
    triggerType: 'manual',
    triggerConditions: { specialEvent: 'beta_tester' },
    displayOrder: 19
  },
  {
    name: 'Community Champion',
    description: 'Recognized for outstanding community contributions',
    icon: '👏',
    category: 'special',
    rarity: 'legendary',
    points: 300,
    triggerType: 'manual',
    triggerConditions: { specialEvent: 'community_champion' },
    displayOrder: 20
  }
];

async function seedAchievements() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hobbyhub');

    console.log('Clearing existing achievements...');
    await Achievement.deleteMany({});

    console.log('Seeding achievements...');
    for (const achievementData of achievementsData) {
      const achievement = new Achievement(achievementData);
      await achievement.save();
      console.log(`✓ Created ${achievement.name} achievement`);
    }

    console.log('Seeding completed successfully!');
    console.log(`\nCreated ${achievementsData.length} achievements:`);
    console.log('- Engagement:', achievementsData.filter(a => a.category === 'engagement').length);
    console.log('- Creation:', achievementsData.filter(a => a.category === 'creation').length);
    console.log('- Community:', achievementsData.filter(a => a.category === 'community').length);
    console.log('- Milestone:', achievementsData.filter(a => a.category === 'milestone').length);
    console.log('- Special:', achievementsData.filter(a => a.category === 'special').length);

    console.log('\nProgress-based achievements:', achievementsData.filter(a => a.isProgressBased).length);

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the seed function
seedAchievements();
