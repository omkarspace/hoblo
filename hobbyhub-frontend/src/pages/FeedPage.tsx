import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  Search,
  TrendingUp,
  Clock,
  Heart,
  MessageSquare,
  Bookmark,
  Share,
  MoreVertical,
  ThumbsUp,
  Eye,
  Calendar,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

interface FeedPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  group: {
    id: string;
    name: string;
    category: string;
  };
  category: string;
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  createdAt: string;
  isLiked: boolean;
  isBookmarked: boolean;
  isTrending: boolean;
  engagement: number; // Calculated engagement score
}

const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending', icon: TrendingUp },
  { value: 'recent', label: 'Recent', icon: Clock },
  { value: 'popular', label: 'Popular', icon: Heart },
  { value: 'bookmarked', label: 'Bookmarked', icon: Bookmark }
];

const CONTENT_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'events', label: 'Events' },
  { value: 'resources', label: 'Resources' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'projects', label: 'Projects' },
  { value: 'questions', label: 'Questions' }
];

const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<FeedPost[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<FeedPost[]>([]);
  const [sortBy, setSortBy] = useState('trending');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  const POSTS_PER_PAGE = 10;

  // Mock data for development
  useEffect(() => {
    const mockPosts: FeedPost[] = [
      {
        id: '1',
        title: 'Photography Tips: Mastering Natural Light',
        content: 'Natural light is the most beautiful and versatile light source available to photographers. Here are my top tips for working with natural light in different conditions...',
        author: { id: '1', name: 'Sarah Chen', avatar: '' },
        group: { id: '1', name: 'Digital Photography Enthusiasts', category: 'photography' },
        category: 'resources',
        tags: ['photography', 'lighting', 'tips'],
        likes: 47,
        comments: 12,
        views: 234,
        createdAt: '2025-12-14T10:30:00Z',
        isLiked: false,
        isBookmarked: false,
        isTrending: true,
        engagement: 85
      },
      {
        id: '2',
        title: 'Join our Weekend Hiking Group!',
        content: 'We\'re organizing a group hike this Saturday in the nearby mountains. Perfect for all skill levels. Meet at the trailhead at 8 AM. Don\'t forget water and snacks!',
        author: { id: '2', name: 'Mike Rodriguez', avatar: '' },
        group: { id: '2', name: 'Outdoor Adventures Club', category: 'sports' },
        category: 'events',
        tags: ['hiking', 'outdoor', 'weekend'],
        likes: 23,
        comments: 8,
        views: 156,
        createdAt: '2025-12-13T16:45:00Z',
        isLiked: true,
        isBookmarked: false,
        isTrending: false,
        engagement: 62
      },
      {
        id: '3',
        title: 'New Camera Recommendations for Beginners',
        content: 'If you\'re just starting out in photography, here are some great camera options that balance quality, ease of use, and affordability...',
        author: { id: '3', name: 'Alex Kim', avatar: '' },
        group: { id: '1', name: 'Digital Photography Enthusiasts', category: 'photography' },
        category: 'resources',
        tags: ['cameras', 'beginners', 'recommendations'],
        likes: 89,
        comments: 34,
        views: 567,
        createdAt: '2025-12-13T09:15:00Z',
        isLiked: false,
        isBookmarked: true,
        isTrending: true,
        engagement: 94
      },
      {
        id: '4',
        title: 'Question: Best Settings for Street Photography?',
        content: 'I\'ve been trying street photography but struggling with the right settings. What aperture, shutter speed, and ISO do you recommend for capturing candid moments?',
        author: { id: '4', name: 'Emma Wilson', avatar: '' },
        group: { id: '1', name: 'Digital Photography Enthusiasts', category: 'photography' },
        category: 'questions',
        tags: ['street-photography', 'settings', 'help'],
        likes: 15,
        comments: 22,
        views: 98,
        createdAt: '2025-12-12T14:20:00Z',
        isLiked: false,
        isBookmarked: false,
        isTrending: false,
        engagement: 45
      },
      {
        id: '5',
        title: 'Group Project: Community Photography Exhibition',
        content: 'Let\'s organize a community photography exhibition! We\'re looking for volunteers to help with curation, setup, and promotion. If you\'re interested in participating, reply below!',
        author: { id: '1', name: 'Sarah Chen', avatar: '' },
        group: { id: '1', name: 'Digital Photography Enthusiasts', category: 'photography' },
        category: 'projects',
        tags: ['exhibition', 'community', 'project'],
        likes: 67,
        comments: 18,
        views: 345,
        createdAt: '2025-12-11T11:00:00Z',
        isLiked: true,
        isBookmarked: true,
        isTrending: false,
        engagement: 78
      }
    ];

    setPosts(mockPosts);
    setFilteredPosts(mockPosts);
    setDisplayedPosts(mockPosts.slice(0, POSTS_PER_PAGE));
  }, []);

  // Filter and sort posts
  useEffect(() => {
    let filtered = [...posts];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.author.name.toLowerCase().includes(query) ||
        post.group.name.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort posts
    switch (sortBy) {
      case 'trending':
        filtered.sort((a, b) => b.engagement - a.engagement);
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'bookmarked':
        filtered = filtered.filter(post => post.isBookmarked);
        break;
      default:
        break;
    }

    setFilteredPosts(filtered);
    setDisplayedPosts(filtered.slice(0, POSTS_PER_PAGE));
    setPage(1);
    setHasMore(filtered.length > POSTS_PER_PAGE);
  }, [posts, selectedCategory, searchQuery, sortBy]);

  const loadMorePosts = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = (nextPage - 1) * POSTS_PER_PAGE;
      const endIndex = startIndex + POSTS_PER_PAGE;
      const newPosts = filteredPosts.slice(startIndex, endIndex);

      if (newPosts.length > 0) {
        setDisplayedPosts(prev => [...prev, ...newPosts]);
        setPage(nextPage);
        setHasMore(endIndex < filteredPosts.length);
      } else {
        setHasMore(false);
      }

      setIsLoading(false);
    }, 500);
  }, [page, filteredPosts, isLoading, hasMore]);

  const handleLike = async (postId: string) => {
    // TODO: Implement like API
    setDisplayedPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  };

  const handleBookmark = async (postId: string) => {
    // TODO: Implement bookmark API
    setDisplayedPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, isBookmarked: !post.isBookmarked }
          : post
      )
    );
  };

  const handleShare = async (postId: string) => {
    // TODO: Implement share functionality
    const post = displayedPosts.find(p => p.id === postId);
    if (post && navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + '...',
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'announcements': return 'bg-red-100 text-red-800';
      case 'events': return 'bg-blue-100 text-blue-800';
      case 'resources': return 'bg-green-100 text-green-800';
      case 'projects': return 'bg-purple-100 text-purple-800';
      case 'questions': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Feed</h1>
              <p className="text-gray-600">Discover content from groups you're part of</p>
            </div>
            <Button onClick={() => navigate('/create-post')}>
              Create Post
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search posts, authors, groups, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {SORT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {CONTENT_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {displayedPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {post.isTrending && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                      <Badge variant="secondary" className={getCategoryColor(post.category)}>
                        {CONTENT_CATEGORIES.find(cat => cat.value === post.category)?.label}
                      </Badge>
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    <CardTitle className="text-xl mb-2 cursor-pointer hover:text-blue-600"
                      onClick={() => navigate(`/post/${post.id}`)}>
                      {post.title}
                    </CardTitle>

                    <div className="flex items-center space-x-3 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-2">
                        <Avatar size="sm">
                          <AvatarFallback className="text-xs">
                            {post.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{post.author.name}</span>
                      </div>
                      <span>•</span>
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(post.createdAt)}
                      </span>
                      <span>•</span>
                      <span className="cursor-pointer hover:text-blue-600"
                        onClick={() => navigate(`/groups/${post.group.id}`)}>
                        {post.group.name}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-gray-700 mb-4 line-clamp-3">
                  {post.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {post.views}
                    </span>
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center hover:text-red-600 transition-colors ${
                        post.isLiked ? 'text-red-600' : ''
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {post.likes}
                    </button>
                    <span className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {post.comments}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookmark(post.id)}
                      className={post.isBookmarked ? 'text-yellow-600' : ''}
                    >
                      <Bookmark className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(post.id)}
                    >
                      <Share className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center py-8">
              <Button
                onClick={loadMorePosts}
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? 'Loading...' : 'Load More Posts'}
              </Button>
            </div>
          )}

          {/* Empty State */}
          {displayedPosts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery || selectedCategory !== 'all' ? 'No posts found' : 'Your feed is empty'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search terms or filters to find more content.'
                  : 'Join some groups and start following interesting content to populate your feed!'}
              </p>
              <div className="flex justify-center space-x-4">
                <Button onClick={() => navigate('/groups')}>
                  Browse Groups
                </Button>
                <Button variant="outline" onClick={() => navigate('/create-post')}>
                  Create Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
