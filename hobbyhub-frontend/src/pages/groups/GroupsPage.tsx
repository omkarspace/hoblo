import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, MapPin, Plus, Filter, Grid3X3, List } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select } from '../../components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { useAuth } from '../../contexts/AuthContext';

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  coverImage?: string;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  tags: string[];
  lastActivity: string;
  isMember: boolean;
}

const GROUP_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'sports', label: 'Sports & Fitness' },
  { value: 'arts-crafts', label: 'Arts & Crafts' },
  { value: 'technology', label: 'Technology' },
  { value: 'music', label: 'Music' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'cooking', label: 'Cooking & Food' },
  { value: 'photography', label: 'Photography' },
  { value: 'writing', label: 'Writing & Literature' },
  { value: 'science', label: 'Science & Nature' },
  { value: 'business', label: 'Business & Entrepreneurship' },
  { value: 'languages', label: 'Languages & Culture' },
  { value: 'other', label: 'Other' }
];

const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // TODO: Fetch groups from API
    // For now, using mock data
    const mockGroups: Group[] = [
      {
        id: '1',
        name: 'Digital Photography Enthusiasts',
        description: 'Share tips, techniques, and showcase your best shots. From smartphone photography to DSLR mastery.',
        category: 'photography',
        location: 'Global',
        memberCount: 1247,
        maxMembers: 2000,
        isPrivate: false,
        owner: { id: '1', name: 'Sarah Chen', avatar: '' },
        tags: ['Photography', 'Digital', 'Camera', 'Art'],
        lastActivity: '2025-12-14T10:30:00Z',
        isMember: false
      },
      {
        id: '2',
        name: 'Urban Gardening Collective',
        description: 'Transforming city spaces into green havens. Share gardening tips, seed swaps, and urban farming techniques.',
        category: 'science',
        location: 'New York, NY',
        memberCount: 892,
        maxMembers: 1500,
        isPrivate: false,
        owner: { id: '2', name: 'Mike Rodriguez', avatar: '' },
        tags: ['Gardening', 'Urban', 'Sustainability', 'Plants'],
        lastActivity: '2025-12-14T09:15:00Z',
        isMember: true
      },
      {
        id: '3',
        name: 'Indie Game Developers',
        description: 'Connect with fellow indie developers. Share resources, get feedback, and collaborate on projects.',
        category: 'gaming',
        location: 'Global',
        memberCount: 2156,
        maxMembers: 3000,
        isPrivate: false,
        owner: { id: '3', name: 'Alex Kim', avatar: '' },
        tags: ['Gaming', 'Development', 'Indie', 'Unity', 'Unreal'],
        lastActivity: '2025-12-14T11:45:00Z',
        isMember: false
      },
      {
        id: '4',
        name: 'Vintage Camera Collectors',
        description: 'Dedicated to preserving and appreciating vintage photography equipment. Buy, sell, and trade with fellow collectors.',
        category: 'photography',
        location: 'Global',
        memberCount: 567,
        maxMembers: 1000,
        isPrivate: false,
        owner: { id: '4', name: 'David Thompson', avatar: '' },
        tags: ['Vintage', 'Cameras', 'Film', 'Collection'],
        lastActivity: '2025-12-13T16:20:00Z',
        isMember: false
      },
      {
        id: '5',
        name: 'Culinary Arts Workshop',
        description: 'Learn and master various cooking techniques. From molecular gastronomy to traditional cuisine.',
        category: 'cooking',
        location: 'San Francisco, CA',
        memberCount: 743,
        maxMembers: 800,
        isPrivate: false,
        owner: { id: '5', name: 'Chef Maria Santos', avatar: '' },
        tags: ['Cooking', 'Culinary', 'Recipes', 'Food'],
        lastActivity: '2025-12-14T08:30:00Z',
        isMember: false
      },
      {
        id: '6',
        name: 'Rock Climbing Beginners',
        description: 'Perfect for those new to climbing. Learn safety, techniques, and find climbing partners in your area.',
        category: 'sports',
        location: 'Los Angeles, CA',
        memberCount: 423,
        maxMembers: 600,
        isPrivate: false,
        owner: { id: '6', name: 'Jake Peterson', avatar: '' },
        tags: ['Climbing', 'Sports', 'Outdoor', 'Beginners'],
        lastActivity: '2025-12-14T07:15:00Z',
        isMember: true
      }
    ];
    setGroups(mockGroups);
    setFilteredGroups(mockGroups);
  }, []);

  useEffect(() => {
    let filtered = groups;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(group => group.category === selectedCategory);
    }

    setFilteredGroups(filtered);
  }, [searchQuery, selectedCategory, groups]);

  const handleJoinGroup = async (groupId: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement join group API call
      console.log('Joining group:', groupId);
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        // Update group membership status
        setGroups(prev => prev.map(group =>
          group.id === groupId ? { ...group, isMember: true, memberCount: group.memberCount + 1 } : group
        ));
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      alert('Failed to join group. Please try again.');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement leave group API call
      console.log('Leaving group:', groupId);
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        // Update group membership status
        setGroups(prev => prev.map(group =>
          group.id === groupId ? { ...group, isMember: false, memberCount: group.memberCount - 1 } : group
        ));
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      alert('Failed to leave group. Please try again.');
    }
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Active now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Hobby Groups</h1>
            <p className="text-xl text-gray-600">
              Discover communities of passionate hobby enthusiasts
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link to="/groups/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search groups by name, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select
                placeholder="Select category"
                options={GROUP_CATEGORIES}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Groups Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1 line-clamp-1">{group.name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{group.location}</span>
                      </div>
                    </div>
                    {group.isPrivate && (
                      <Badge variant="secondary" className="text-xs">Private</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {group.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {group.memberCount}/{group.maxMembers} members
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatLastActivity(group.lastActivity)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {group.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {group.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{group.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    variant={group.isMember ? "outline" : "default"}
                    onClick={() => group.isMember ? handleLeaveGroup(group.id) : handleJoinGroup(group.id)}
                    disabled={isLoading}
                  >
                    {group.isMember ? 'Leave Group' : 'Join Group'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{group.name}</h3>
                        {group.isPrivate && (
                          <Badge variant="secondary">Private</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{group.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📍 {group.location}</span>
                        <span>👥 {group.memberCount} members</span>
                        <span>🕒 {formatLastActivity(group.lastActivity)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Button
                        variant={group.isMember ? "outline" : "default"}
                        onClick={() => group.isMember ? handleLeaveGroup(group.id) : handleJoinGroup(group.id)}
                        disabled={isLoading}
                      >
                        {group.isMember ? 'Leave Group' : 'Join Group'}
                      </Button>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {group.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or create a new group for your hobby.
            </p>
            <Button asChild>
              <Link to="/groups/create">
                <Plus className="w-4 h-4 mr-2" />
                Create New Group
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
