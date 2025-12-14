import React, { useState, useEffect } from 'react';
import { Trophy, Star, Share2, Lock, CheckCircle, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { useAuth } from '../../contexts/AuthContext';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'engagement' | 'creation' | 'community' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedDate?: string;
}

const ACHIEVEMENT_CATEGORIES = {
  engagement: { name: 'Community Engagement', color: 'bg-blue-100 text-blue-800' },
  creation: { name: 'Content Creation', color: 'bg-green-100 text-green-800' },
  community: { name: 'Community Building', color: 'bg-purple-100 text-purple-800' },
  milestone: { name: 'Platform Milestones', color: 'bg-orange-100 text-orange-800' }
};

const RARITY_CONFIG = {
  common: { color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-300' },
  rare: { color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
  epic: { color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-300' },
  legendary: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-300' }
};

const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [totalPoints, setTotalPoints] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    // TODO: Fetch achievements from API
    // For now, using mock data
    const mockAchievements: Achievement[] = [
      {
        id: '1',
        name: 'Welcome to HobbyHub',
        description: 'Complete your profile setup',
        icon: '🎉',
        category: 'milestone',
        rarity: 'common',
        points: 10,
        unlocked: true,
        unlockedDate: '2025-12-14'
      },
      {
        id: '2',
        name: 'First Post',
        description: 'Create your first community post',
        icon: '📝',
        category: 'creation',
        rarity: 'common',
        points: 25,
        unlocked: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: '3',
        name: 'Community Builder',
        description: 'Join 5 different hobby groups',
        icon: '🤝',
        category: 'community',
        rarity: 'rare',
        points: 50,
        unlocked: false,
        progress: 1,
        maxProgress: 5
      },
      {
        id: '4',
        name: 'Conversation Starter',
        description: 'Receive 10 replies to your posts',
        icon: '💬',
        category: 'engagement',
        rarity: 'rare',
        points: 75,
        unlocked: false,
        progress: 3,
        maxProgress: 10
      },
      {
        id: '5',
        name: 'Content Creator',
        description: 'Create 10 posts in the community',
        icon: '🎨',
        category: 'creation',
        rarity: 'epic',
        points: 100,
        unlocked: false,
        progress: 2,
        maxProgress: 10
      },
      {
        id: '6',
        name: 'Community Leader',
        description: 'Start a new hobby group',
        icon: '👑',
        category: 'community',
        rarity: 'epic',
        points: 150,
        unlocked: false
      },
      {
        id: '7',
        name: 'Hobby Master',
        description: 'Earn 500 achievement points',
        icon: '🏆',
        category: 'milestone',
        rarity: 'legendary',
        points: 200,
        unlocked: false,
        progress: 85,
        maxProgress: 500
      },
      {
        id: '8',
        name: 'Social Butterfly',
        description: 'Connect with 25 community members',
        icon: '🦋',
        category: 'engagement',
        rarity: 'epic',
        points: 125,
        unlocked: false,
        progress: 8,
        maxProgress: 25
      }
    ];
    setAchievements(mockAchievements);
    setTotalPoints(mockAchievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0));
  }, []);

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const completionRate = Math.round((unlockedAchievements.length / achievements.length) * 100);

  const handleShareAchievement = (achievement: Achievement) => {
    // TODO: Implement social sharing
    const shareText = `I just unlocked the "${achievement.name}" achievement on HobbyHub! 🎉`;
    if (navigator.share) {
      navigator.share({
        title: 'HobbyHub Achievement',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      alert('Achievement link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Achievements</h1>
          </div>
          <p className="text-xl text-gray-600 mb-6">
            Track your progress and unlock rewards as you explore your hobbies
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">{totalPoints}</div>
                <div className="text-sm text-gray-600">Achievement Points</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600">{unlockedAchievements.length}</div>
                <div className="text-sm text-gray-600">Achievements Unlocked</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{completionRate}%</div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Achievements
          </button>
          {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => {
            const rarityConfig = RARITY_CONFIG[achievement.rarity];
            const categoryConfig = ACHIEVEMENT_CATEGORIES[achievement.category];

            return (
              <Card
                key={achievement.id}
                className={`relative transition-all hover:shadow-lg ${
                  achievement.unlocked
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-gray-200 opacity-75'
                }`}
              >
                {achievement.unlocked && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl mb-3 ${
                    achievement.unlocked
                      ? rarityConfig.bgColor
                      : 'bg-gray-100'
                  }`}>
                    {achievement.unlocked ? achievement.icon : <Lock className="w-6 h-6 text-gray-400" />}
                  </div>

                  <CardTitle className="text-lg mb-1">{achievement.name}</CardTitle>

                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Badge
                      variant="secondary"
                      className={`${categoryConfig.color} text-xs`}
                    >
                      {categoryConfig.name}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`${rarityConfig.color} border-current text-xs capitalize`}
                    >
                      {achievement.rarity}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    {achievement.points} points
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <CardDescription className="text-center mb-4">
                    {achievement.description}
                  </CardDescription>

                  {/* Progress Bar for Incomplete Achievements */}
                  {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <Progress
                        value={(achievement.progress / achievement.maxProgress) * 100}
                        className="h-2"
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {achievement.unlocked ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleShareAchievement(achievement)}
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Target className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        Locked
                      </Button>
                    )}
                  </div>

                  {/* Unlock Date */}
                  {achievement.unlocked && achievement.unlockedDate && (
                    <div className="text-xs text-gray-500 text-center mt-3">
                      Unlocked {new Date(achievement.unlockedDate).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Achievement Categories Legend */}
        <div className="mt-12 bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Achievement Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, category]) => (
              <div key={key} className="text-center">
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${category.color}`}>
                  {category.name}
                </div>
                <p className="text-sm text-gray-600">
                  {key === 'engagement' && 'Interact with community content'}
                  {key === 'creation' && 'Create and share your work'}
                  {key === 'community' && 'Build and grow communities'}
                  {key === 'milestone' && 'Reach important platform goals'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
