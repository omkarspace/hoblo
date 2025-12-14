import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share,
  Send,
  MoreVertical,
  Flag,
  ThumbsUp,
  Reply,
  AtSign,
  Smile
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  replies: Comment[];
  isLiked: boolean;
  mentions: string[]; // User IDs mentioned
}

interface SocialInteractionsProps {
  postId: string;
  likes: number;
  comments: Comment[];
  shares: number;
  isLiked: boolean;
  isShared: boolean;
  onLike?: () => void;
  onComment?: (content: string, parentId?: string) => void;
  onShare?: () => void;
  onReport?: () => void;
}

const SocialInteractions: React.FC<SocialInteractionsProps> = ({
  postId,
  likes,
  comments,
  shares,
  isLiked,
  isShared,
  onLike,
  onComment,
  onShare,
  onReport
}) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState(0);

  // Mock users for mentions (would come from API)
  const mockUsers = [
    { id: '1', name: 'Sarah Chen', avatar: '' },
    { id: '2', name: 'Mike Rodriguez', avatar: '' },
    { id: '3', name: 'Alex Kim', avatar: '' },
    { id: '4', name: 'Emma Wilson', avatar: '' }
  ];

  const handleLike = () => {
    onLike?.();
  };

  const handleComment = () => {
    if (newComment.trim()) {
      onComment?.(newComment);
      setNewComment('');
    }
  };

  const handleReply = (parentId: string) => {
    if (replyContent.trim()) {
      onComment?.(replyContent, parentId);
      setReplyContent('');
      setReplyTo(null);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this post on HobbyHub',
          text: 'Found this interesting post on HobbyHub',
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
    onShare?.();
  };

  const handleMentionInput = (value: string, cursorPos: number) => {
    const beforeCursor = value.substring(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const afterAt = beforeCursor.substring(atIndex + 1);
      if (!afterAt.includes(' ')) {
        setMentionSearch(afterAt);
        setMentionPosition(atIndex);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (userName: string) => {
    const beforeMention = newComment.substring(0, mentionPosition);
    const afterMention = newComment.substring(mentionPosition + mentionSearch.length + 1);
    setNewComment(beforeMention + '@' + userName + ' ' + afterMention);
    setShowMentions(false);
    setMentionSearch('');
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

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-3' : 'mt-4'} flex space-x-3`}>
      <Avatar size="sm">
        <AvatarFallback className="text-xs">
          {comment.author.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="text-sm">{comment.content}</p>
        </div>
        <div className="flex items-center space-x-4 mt-1">
          <button
            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            className="text-xs text-gray-500 hover:text-blue-600 flex items-center"
          >
            <Reply className="w-3 h-3 mr-1" />
            Reply
          </button>
          <button className="text-xs text-gray-500 hover:text-red-600 flex items-center">
            <ThumbsUp className="w-3 h-3 mr-1" />
            {comment.likes > 0 && comment.likes}
          </button>
        </div>

        {/* Reply input */}
        {replyTo === comment.id && (
          <div className="mt-3 flex space-x-2">
            <Avatar size="sm">
              <AvatarFallback className="text-xs">
                U
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex space-x-2">
              <Input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to ${comment.author.name}...`}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={() => handleReply(comment.id)}
                disabled={!replyContent.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  return (
    <div className="border-t pt-4">
      {/* Action Buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 transition-colors ${
              isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likes}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{comments.length}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <Share className="w-5 h-5" />
            <span className="text-sm">{shares}</span>
          </button>
        </div>

        <Button variant="ghost" size="sm" onClick={onReport}>
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* Comment Section */}
      {showComments && (
        <div className="space-y-4">
          {/* Add Comment */}
          <div className="flex space-x-3">
            <Avatar size="sm">
              <AvatarFallback className="text-xs">
                U
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <div className="flex space-x-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => {
                    setNewComment(e.target.value);
                    handleMentionInput(e.target.value, e.target.selectionStart || 0);
                  }}
                  placeholder="Write a comment... Use @ to mention users"
                  className="min-h-[80px] resize-none"
                />
                <Button
                  onClick={handleComment}
                  disabled={!newComment.trim()}
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Mention Dropdown */}
              {showMentions && filteredUsers.length > 0 && (
                <Card className="absolute top-full left-0 right-0 z-10 mt-1 max-h-40 overflow-y-auto">
                  <CardContent className="p-2">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => insertMention(user.name)}
                        className="w-full flex items-center space-x-2 p-2 hover:bg-gray-50 rounded text-left"
                      >
                        <Avatar size="sm">
                          <AvatarFallback className="text-xs">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.name}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-2">
            {comments.map(comment => renderComment(comment))}
          </div>

          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialInteractions;
