import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Pin,
  MessageSquare,
  Calendar,
  User,
  Filter,
  Plus,
  Flag,
  MoreVertical,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface GroupPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  category: 'general' | 'events' | 'resources' | 'announcements';
  isPinned: boolean;
  isHidden: boolean;
  createdAt: string;
  likes: number;
  comments: number;
  tags: string[];
}

interface GroupAnnouncement {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

const POST_CATEGORIES = [
  { value: 'all', label: 'All Posts' },
  { value: 'general', label: 'General Discussion' },
  { value: 'events', label: 'Events' },
  { value: 'resources', label: 'Resources & Guides' },
  { value: 'announcements', label: 'Announcements' }
];

const GroupContentPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();

  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<GroupPost[]>([]);
  const [announcements, setAnnouncements] = useState<GroupAnnouncement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [showHiddenPosts, setShowHiddenPosts] = useState(false);

  // Mock data for development
  useEffect(() => {
    const mockPosts: GroupPost[] = [
      {
        id: '1',
        title: 'Welcome to our Digital Photography Community!',
        content: 'I\'m excited to start this group for photography enthusiasts. Let\'s share tips, techniques, and showcase our work. What camera are you currently using?',
        author: { id: '1', name: 'Sarah Chen', avatar: '' },
        category: 'announcements',
        isPinned: true,
        isHidden: false,
        createdAt: '2025-12-14T10:00:00Z',
        likes: 12,
        comments: 8,
        tags: ['welcome', 'introduction']
      },
      {
        id: '2',
        title: 'Photography Workshop: Portrait Lighting Techniques',
        content: 'I\'m organizing a workshop on portrait lighting this Saturday at Central Park. We\'ll cover natural light, studio setups, and flash techniques. Limited spots available!',
        author: { id: '2', name: 'Mike Rodriguez', avatar: '' },
        category: 'events',
        isPinned: false,
        isHidden: false,
        createdAt: '2025-12-13T15:30:00Z',
        likes: 24,
        comments: 15,
        tags: ['workshop', 'lighting', 'portrait']
      },
      {
        id: '3',
        title: 'Best Camera Settings for Street Photography',
        content: 'For street photography, I recommend these settings: ISO 400-800, aperture f/5.6-f/8, shutter speed 1/125s or faster. Focus on people and candid moments.',
        author: { id: '3', name: 'Alex Kim', avatar: '' },
        category: 'resources',
        isPinned: false,
        isHidden: false,
        createdAt: '2025-12-12T09:15:00Z',
        likes: 18,
        comments: 7,
        tags: ['settings', 'street-photography', 'tips']
      },
      {
        id: '4',
        title: 'New Member Introduction',
        content: 'Hi everyone! I\'m new to photography and excited to learn from this community. I just got my first DSLR camera. Any beginner tips?',
        author: { id: '4', name: 'Emma Wilson', avatar: '' },
        category: 'general',
        isPinned: false,
        isHidden: false,
        createdAt: '2025-12-11T14:20:00Z',
        likes: 6,
        comments: 12,
        tags: ['introduction', 'beginner']
      }
    ];

    const mockAnnouncements: GroupAnnouncement[] = [
      {
        id: '1',
        title: 'Group Guidelines',
        content: 'Please remember to be respectful, share constructively, and follow our community guidelines. No spam or self-promotion without permission.',
        author: { id: '1', name: 'Sarah Chen', avatar: '' },
        isActive: true,
        createdAt: '2025-12-14T10:00:00Z'
      }
    ];

    setPosts(mockPosts);
    setFilteredPosts(mockPosts);
    setAnnouncements(mockAnnouncements);
    setIsOwner(user?._id === '1'); // Mock owner check
  }, [groupId, user]);

  useEffect(() => {
    let filtered = posts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter hidden posts (only show to owners if they choose)
    if (!showHiddenPosts) {
      filtered = filtered.filter(post => !post.isHidden);
    }

    // Sort: pinned posts first, then by creation date
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setFilteredPosts(filtered);
  }, [posts, selectedCategory, searchQuery, showHiddenPosts]);

  const handlePinPost = async (postId: string, isPinned: boolean) => {
    // TODO: Implement pin/unpin post API
    setPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, isPinned } : post
    ));
  };

  const handleHidePost = async (postId: string, isHidden: boolean) => {
    // TODO: Implement hide/show post API
    setPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, isHidden } : post
    ));
  };

  const handleDeletePost = async (postId: string) => {
    // TODO: Implement delete post API
    if (confirm('Are you sure you want to delete this post?')) {
      setPosts(prev => prev.filter(post => post.id !== postId));
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'announcements': return 'bg-red-100 text-red-800';
      case 'events': return 'bg-blue-100 text-blue-800';
      case 'resources': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Active Announcements */}
      {announcements.filter(a => a.isActive).length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {announcements.filter(a => a.isActive).map((announcement) => (
              <Card key={announcement.id} className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900">{announcement.title}</h3>
                      <p className="text-blue-800 text-sm">{announcement.content}</p>
                      <p className="text-blue-600 text-xs mt-2">
                        Posted by {announcement.author.name} • {formatDate(announcement.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Content Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Group Content</h1>
              <p className="text-gray-600">Discussions, events, and resources for the community</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
              {isOwner && (
                <Button variant="outline">
                  <Pin className="w-4 h-4 mr-2" />
                  New Announcement
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search posts, content, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
              >
                {POST_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            {isOwner && (
              <div className="flex items-center space-x-2">
                <input
                  id="showHidden"
                  type="checkbox"
                  checked={showHiddenPosts}
                  onChange={(e) => setShowHiddenPosts(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="showHidden" className="text-sm text-gray-600">
                  Show hidden posts
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <Card key={post.id} className={`${post.isHidden ? 'opacity-60 border-gray-300' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {post.isPinned && <Pin className="w-4 h-4 text-yellow-500" />}
                      {post.isHidden && <EyeOff className="w-4 h-4 text-gray-400" />}
                      <Badge variant="secondary" className={getCategoryColor(post.category)}>
                        {POST_CATEGORIES.find(cat => cat.value === post.category)?.label}
                      </Badge>
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                      <Avatar size="sm">
                        <AvatarFallback className="text-xs">
                          {post.author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{post.author.name}</span>
                      <span>•</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  {isOwner && (
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePinPost(post.id, !post.isPinned)}
                        className={post.isPinned ? 'text-yellow-600' : ''}
                      >
                        <Pin className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleHidePost(post.id, !post.isHidden)}
                        className={post.isHidden ? 'text-gray-600' : ''}
                      >
                        {post.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 mb-4">{post.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {post.comments} comments
                    </span>
                    <span>{post.likes} likes</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Like
                    </Button>
                    <Button variant="outline" size="sm">
                      Comment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Be the first to start a discussion in this group!'}
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Post
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupContentPage;
