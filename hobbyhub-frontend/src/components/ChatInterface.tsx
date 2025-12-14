import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Search,
  Phone,
  Video,
  Users,
  Settings,
  X,
  Download,
  Image,
  File,
  User,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
}

interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface ChatInterfaceProps {
  chatType: 'group' | 'direct';
  chatId: string;
  chatName: string;
  participants: ChatParticipant[];
  onSendMessage?: (content: string, type?: string, file?: File) => void;
  onLeaveChat?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatType,
  chatId,
  chatName,
  participants,
  onSendMessage,
  onLeaveChat
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for development
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        sender: { id: '1', name: 'Sarah Chen', avatar: '' },
        content: 'Welcome to our Digital Photography group chat! 📸',
        timestamp: '2025-12-14T10:00:00Z',
        type: 'text',
        isRead: true
      },
      {
        id: '2',
        sender: { id: '2', name: 'Mike Rodriguez', avatar: '' },
        content: 'Thanks Sarah! Excited to be here. Anyone have tips for shooting in low light?',
        timestamp: '2025-12-14T10:05:00Z',
        type: 'text',
        isRead: true
      },
      {
        id: '3',
        sender: { id: '3', name: 'Alex Kim', avatar: '' },
        content: 'For low light, I recommend using a tripod and slower shutter speeds. ISO 800-1600 usually works well.',
        timestamp: '2025-12-14T10:10:00Z',
        type: 'text',
        isRead: true
      },
      {
        id: '4',
        sender: { id: '4', name: 'Emma Wilson', avatar: '' },
        content: 'Here\'s a photo I took last night with those settings',
        timestamp: '2025-12-14T10:15:00Z',
        type: 'image',
        fileUrl: '/api/placeholder/400/300',
        fileName: 'low-light-photo.jpg',
        isRead: false
      }
    ];

    setMessages(mockMessages);
    setOnlineUsers(['1', '2', '3']); // Mock online users
  }, [chatId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() && !attachedFile) return;

    const messageType = attachedFile ? (attachedFile.type.startsWith('image/') ? 'image' : 'file') : 'text';

    onSendMessage?.(newMessage, messageType, attachedFile || undefined);

    // Add message to local state (would be handled by WebSocket in real implementation)
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: { id: user?._id || 'user', name: 'You', avatar: '' },
      content: newMessage || `[${attachedFile?.name}]`,
      timestamp: new Date().toISOString(),
      type: messageType as any,
      fileUrl: attachedFile ? URL.createObjectURL(attachedFile) : undefined,
      fileName: attachedFile?.name,
      isRead: false
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    setAttachedFile(null);
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.sender.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const grouped: { [key: string]: ChatMessage[] } = {};
    messages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    return grouped;
  };

  const groupedMessages = groupMessagesByDate(filteredMessages);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar size="sm">
            <AvatarFallback>
              {chatName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-gray-900">{chatName}</h3>
            <p className="text-sm text-gray-500">
              {chatType === 'group'
                ? `${participants.length} members • ${onlineUsers.length} online`
                : participants.find(p => p.isOnline)?.isOnline ? 'Online' : 'Offline'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="w-4 h-4" />
          </Button>
          {chatType === 'group' && (
            <Button variant="ghost" size="sm">
              <Users className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="bg-white border-b px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center mb-4">
                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {date}
                </div>
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message) => (
                <div key={message.id} className="flex space-x-3 mb-4">
                  <Avatar size="sm">
                    <AvatarFallback className="text-xs">
                      {message.sender.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {message.sender.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                      {!message.isRead && (
                        <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="bg-white rounded-lg px-3 py-2 shadow-sm max-w-md">
                      {message.type === 'text' && (
                        <p className="text-sm text-gray-900">{message.content}</p>
                      )}

                      {message.type === 'image' && message.fileUrl && (
                        <div>
                          <img
                            src={message.fileUrl}
                            alt={message.fileName}
                            className="rounded max-w-full h-auto mb-2"
                          />
                          <p className="text-sm text-gray-900">{message.content}</p>
                        </div>
                      )}

                      {message.type === 'file' && message.fileName && (
                        <div className="flex items-center space-x-2">
                          <File className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                            {message.fileName}
                          </span>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <div className="px-4 py-2 text-sm text-gray-500">
          Someone is typing...
        </div>
      )}

      {/* Attachment Preview */}
      {attachedFile && (
        <div className="px-4 py-2 border-t bg-gray-50">
          <div className="flex items-center justify-between bg-white rounded p-2">
            <div className="flex items-center space-x-2">
              {attachedFile.type.startsWith('image/') ? (
                <Image className="w-4 h-4 text-green-500" />
              ) : (
                <File className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-sm text-gray-700">{attachedFile.name}</span>
              <span className="text-xs text-gray-500">
                ({(attachedFile.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={removeAttachment}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-end space-x-2">
          <Button variant="ghost" size="sm" onClick={handleFileAttach}>
            <Paperclip className="w-4 h-4" />
          </Button>

          <div className="flex-1">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${chatType === 'group' ? chatName : chatName}...`}
              className="min-h-[40px] max-h-32 resize-none border-0 focus:ring-0"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && !attachedFile}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Online Users Sidebar (for group chats) */}
      {chatType === 'group' && (
        <div className="absolute right-0 top-0 h-full w-64 bg-white border-l shadow-lg transform translate-x-full group-hover:translate-x-0 transition-transform duration-300">
          <div className="p-4 border-b">
            <h4 className="font-semibold text-gray-900">Online ({onlineUsers.length})</h4>
          </div>
          <div className="overflow-y-auto">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50">
                <div className="relative">
                  <Avatar size="sm">
                    <AvatarFallback className="text-xs">
                      {participant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {participant.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                  <p className="text-xs text-gray-500">
                    {participant.isOnline ? 'Online' : `Last seen ${participant.lastSeen}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
