const mongoose = require('mongoose');
const HobbyCategory = require('../models/HobbyCategory');
require('dotenv').config();

// Hobby categories data with navigation features
const categoriesData = [
  // Craft Circle Categories (circular navigation)
  {
    name: 'Digital Art',
    slug: 'digital-art',
    description: 'Create stunning digital artwork using modern tools and techniques',
    icon: '🎨',
    color: '#8b5cf6',
    level: 1,
    featured: true,
    displayOrder: 1,
    navigationType: 'craft_circle',
    navigationData: {
      angle: 0,
      radius: 120
    },
    metaTags: ['digital', 'art', 'creative', 'design'],
    skillLevels: [
      { name: 'Beginner', description: 'Learning basic digital tools', color: '#22c55e' },
      { name: 'Intermediate', description: 'Mastering digital techniques', color: '#f59e0b' },
      { name: 'Advanced', description: 'Professional digital artistry', color: '#ef4444' },
      { name: 'Expert', description: 'Digital art mastery', color: '#8b5cf6' }
    ]
  },
  {
    name: 'Photography',
    slug: 'photography',
    description: 'Capture and edit beautiful photographs with professional techniques',
    icon: '📸',
    color: '#06b6d4',
    level: 1,
    featured: true,
    displayOrder: 2,
    navigationType: 'craft_circle',
    navigationData: {
      angle: 72,
      radius: 120
    },
    metaTags: ['camera', 'photo', 'editing', 'composition']
  },
  {
    name: 'Writing',
    slug: 'writing',
    description: 'Express yourself through creative writing and storytelling',
    icon: '✍️',
    color: '#10b981',
    level: 1,
    featured: true,
    displayOrder: 3,
    navigationType: 'craft_circle',
    navigationData: {
      angle: 144,
      radius: 120
    },
    metaTags: ['writing', 'storytelling', 'creative', 'literature']
  },
  {
    name: 'Music Production',
    slug: 'music-production',
    description: 'Create and produce music using digital audio workstations',
    icon: '🎵',
    color: '#f59e0b',
    level: 1,
    featured: true,
    displayOrder: 4,
    navigationType: 'craft_circle',
    navigationData: {
      angle: 216,
      radius: 120
    },
    metaTags: ['music', 'audio', 'production', 'recording']
  },
  {
    name: 'Cooking',
    slug: 'cooking',
    description: 'Master culinary arts and create delicious meals',
    icon: '👨‍🍳',
    color: '#ef4444',
    level: 1,
    featured: true,
    displayOrder: 5,
    navigationType: 'craft_circle',
    navigationData: {
      angle: 288,
      radius: 120
    },
    metaTags: ['cooking', 'culinary', 'food', 'recipes']
  },

  // Skill Tree Categories (hierarchical navigation)
  {
    name: 'Programming',
    slug: 'programming',
    description: 'Learn to code and build software applications',
    icon: '💻',
    color: '#6366f1',
    level: 1,
    displayOrder: 6,
    navigationType: 'skill_tree',
    navigationData: {
      x: 400,
      y: 100
    },
    skillLevels: [
      { name: 'Beginner', description: 'Learning programming basics', color: '#22c55e' },
      { name: 'Intermediate', description: 'Building applications', color: '#f59e0b' },
      { name: 'Advanced', description: 'System architecture', color: '#ef4444' },
      { name: 'Expert', description: 'Software engineering mastery', color: '#8b5cf6' }
    ]
  },
  {
    name: 'Web Development',
    slug: 'web-development',
    description: 'Build websites and web applications',
    icon: '🌐',
    color: '#3b82f6',
    level: 2,
    displayOrder: 7,
    navigationType: 'skill_tree',
    navigationData: {
      x: 300,
      y: 200,
      connections: [{
        toCategory: 'programming',
        type: 'prerequisite'
      }]
    }
  },
  {
    name: 'Mobile Development',
    slug: 'mobile-development',
    description: 'Create mobile applications for iOS and Android',
    icon: '📱',
    color: '#06b6d4',
    level: 2,
    displayOrder: 8,
    navigationType: 'skill_tree',
    navigationData: {
      x: 500,
      y: 200,
      connections: [{
        toCategory: 'programming',
        type: 'prerequisite'
      }]
    }
  },
  {
    name: 'React Development',
    slug: 'react-development',
    description: 'Master React.js for modern web development',
    icon: '⚛️',
    color: '#61dafb',
    level: 3,
    displayOrder: 9,
    navigationType: 'skill_tree',
    navigationData: {
      x: 250,
      y: 300,
      connections: [{
        toCategory: 'web-development',
        type: 'progression'
      }]
    }
  },
  {
    name: 'Node.js Backend',
    slug: 'nodejs-backend',
    description: 'Build server-side applications with Node.js',
    icon: '🟢',
    color: '#68d391',
    level: 3,
    displayOrder: 10,
    navigationType: 'skill_tree',
    navigationData: {
      x: 350,
      y: 300,
      connections: [{
        toCategory: 'web-development',
        type: 'progression'
      }]
    }
  },

  // Standard Categories
  {
    name: 'Gardening',
    slug: 'gardening',
    description: 'Grow and cultivate beautiful gardens and plants',
    icon: '🌱',
    color: '#22c55e',
    level: 1,
    displayOrder: 11,
    metaTags: ['plants', 'outdoor', 'nature', 'cultivation']
  },
  {
    name: 'Woodworking',
    slug: 'woodworking',
    description: 'Craft beautiful wooden items and furniture',
    icon: '🪵',
    color: '#92400e',
    level: 1,
    displayOrder: 12,
    metaTags: ['wood', 'crafting', 'furniture', 'tools']
  },
  {
    name: 'Knitting',
    slug: 'knitting',
    description: 'Create cozy knitted garments and accessories',
    icon: '🧶',
    color: '#ec4899',
    level: 1,
    displayOrder: 13,
    metaTags: ['yarn', 'crafting', 'textiles', 'handmade']
  },
  {
    name: 'Painting',
    slug: 'painting',
    description: 'Express yourself through various painting techniques',
    icon: '🎨',
    color: '#7c3aed',
    level: 1,
    displayOrder: 14,
    metaTags: ['art', 'painting', 'canvas', 'colors']
  },
  {
    name: 'Guitar',
    slug: 'guitar',
    description: 'Learn to play guitar and create music',
    icon: '🎸',
    color: '#dc2626',
    level: 1,
    displayOrder: 15,
    metaTags: ['music', 'instrument', 'strings', 'melody']
  }
];

async function seedCategories() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hobbyhub');

    console.log('Clearing existing categories...');
    await HobbyCategory.deleteMany({});

    console.log('Seeding hobby categories...');

    // First, create all main categories
    for (const categoryData of categoriesData.filter(c => c.level === 1)) {
      const category = new HobbyCategory(categoryData);
      await category.save();
      console.log(`✓ Created main category: ${category.name}`);
    }

    // Then create subcategories and set up relationships
    for (const categoryData of categoriesData.filter(c => c.level > 1)) {
      const category = new HobbyCategory(categoryData);
      await category.save();
      console.log(`✓ Created subcategory: ${category.name}`);

      // Set up parent-child relationships
      if (categoryData.navigationData?.connections) {
        for (const connection of categoryData.navigationData.connections) {
          if (connection.type === 'prerequisite') {
            const parentCategory = await HobbyCategory.findOne({ slug: connection.toCategory });
            if (parentCategory) {
              parentCategory.subcategories = parentCategory.subcategories || [];
              if (!parentCategory.subcategories.includes(category._id)) {
                parentCategory.subcategories.push(category._id);
                await parentCategory.save();
              }
            }
          }
        }
      }
    }

    // Update follower counts with mock data for demo
    const categories = await HobbyCategory.find({});
    for (const category of categories) {
      category.followerCount = Math.floor(Math.random() * 500) + 10;
      category.postCount = Math.floor(Math.random() * 1000) + 5;
      category.groupCount = Math.floor(Math.random() * 50) + 1;
      await category.save();
    }

    console.log('Seeding completed successfully!');
    console.log(`\nCreated ${categoriesData.length} hobby categories:`);
    console.log('- Main categories:', categoriesData.filter(c => c.level === 1).length);
    console.log('- Subcategories:', categoriesData.filter(c => c.level > 1).length);
    console.log('- Craft circle categories:', categoriesData.filter(c => c.navigationType === 'craft_circle').length);
    console.log('- Skill tree categories:', categoriesData.filter(c => c.navigationType === 'skill_tree').length);
    console.log('- Standard categories:', categoriesData.filter(c => c.navigationType === 'standard').length);

    console.log('\nNavigation Features:');
    console.log('- Craft Circles: Circular navigation for creative hobbies');
    console.log('- Skill Trees: Hierarchical skill progression paths');
    console.log('- Standard: Traditional category browsing');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the seed function
seedCategories();
