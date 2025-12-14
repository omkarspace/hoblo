import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Settings,
  Users,
  UserPlus,
  UserMinus,
  Shield,
  BarChart3,
  Edit3,
  MoreVertical,
  Check,
  X,
  Crown,
  Calendar,
  MapPin,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

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
  rules?: string;
  tags: string[];
  createdAt: string;
  lastActivity: string;
}

interface GroupMember {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: string;
  isPending?: boolean;
}

const GroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<GroupMember[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings' | 'analytics'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);

  // Mock data for development
  useEffect(() => {
    const mockGroup: Group = {
      id: groupId || '1',
      name: 'Digital Photography Enthusiasts',
      description: 'Share tips, techniques, and showcase your best shots. From smartphone photography to DSLR mastery.',
      category: 'photography',
      location: 'Global',
      memberCount: 1247,
      maxMembers: 2000,
      isPrivate: false,
      owner: { id: '1', name: 'Sarah Chen', avatar: '' },
      rules: 'Be respectful, share constructively, no spam.',
      tags: ['Photography', 'Digital', 'Camera', 'Art'],
      createdAt: '2025-01-15T10:00:00Z',
      lastActivity: '2025-12-14T10:30:00Z'
    };

    const mockMembers: GroupMember[] = [
      { id: '1', userId: '1', name: 'Sarah Chen', role: 'owner', joinedAt: '2025-01-15T10:00:00Z' },
      { id: '2', userId: '2', name: 'Mike Rodriguez', role: 'admin', joinedAt: '2025-01-16T14:30:00Z' },
      { id: '3', userId: '3', name: 'Alex Kim', role: 'member', joinedAt: '2025-01-20T09:15:00Z' },
      { id: '4', userId: '4', name: 'David Thompson', role: 'member', joinedAt: '2025-02-01T16:45:00Z' },
      { id: '5', userId: '5', name: 'Emma Wilson', role: 'moderator', joinedAt: '2025-01-18T11:20:00Z' }
    ];

    const mockPendingRequests: GroupMember[] = [
      { id: '6', userId: '6', name: 'John Smith', role: 'member', joinedAt: '2025-12-13T08:00:00Z', isPending: true },
      { id: '7', userId: '7', name: 'Lisa Brown', role: 'member', joinedAt: '2025-12-12T15:30:00Z', isPending: true }
    ];

    setGroup(mockGroup);
    setMembers(mockMembers);
    setPendingRequests(mockPendingRequests);

    // Check user permissions
    setIsOwner(user?._id === mockGroup.owner.id);
    setIsMember(mockMembers.some(m => m.userId === user?._id));
  }, [groupId, user]);

  const handleJoinGroup = async () => {
    // TODO: Implement join group API
    setIsMember(true);
    setGroup(prev => prev ? { ...prev, memberCount: prev.memberCount + 1 } : null);
  };

  const handleLeaveGroup = async () => {
    // TODO: Implement leave group API
    setIsMember(false);
    setGroup(prev => prev ? { ...prev, memberCount: prev.memberCount - 1 } : null);
  };

  const handleApproveRequest = async (memberId: string) => {
    // TODO: Implement approve member API
    const approvedMember = pendingRequests.find(m => m.id === memberId);
    if (approvedMember) {
      setPendingRequests(prev => prev.filter(m => m.id !== memberId));
      setMembers(prev => [...prev, { ...approvedMember, isPending: false }]);
      setGroup(prev => prev ? { ...prev, memberCount: prev.memberCount + 1 } : null);
    }
  };

  const handleRejectRequest = async (memberId: string) => {
    // TODO: Implement reject member API
    setPendingRequests(prev => prev.filter(m => m.id !== memberId));
  };

  const handleRemoveMember = async (memberId: string) => {
    // TODO: Implement remove member API
    setMembers(prev => prev.filter(m => m.id !== memberId));
    setGroup(prev => prev ? { ...prev, memberCount: prev.memberCount - 1 } : null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-3 h-3" />;
      case 'admin': return <Shield className="w-3 h-3" />;
      case 'moderator': return <UserPlus className="w-3 h-3" />;
      default: return <Users className="w-3 h-3" />;
    }
  };

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Group Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
            {/* Group Avatar */}
            <div className="flex-shrink-0 mb-6 md:mb-0">
              <Avatar size="lg" className="border-4 border-white shadow-lg">
                <AvatarFallback className="text-2xl">
                  {group.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Group Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
                  <div className="flex items-center space-x-4 text-gray-600 mb-2">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {group.location}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {group.memberCount}/{group.maxMembers} members
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Created {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{group.category}</Badge>
                    {group.isPrivate && <Badge variant="outline">Private</Badge>}
                    {group.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  {isOwner && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      {isEditing ? 'Cancel Edit' : 'Edit Group'}
                    </Button>
                  )}
                  {isMember ? (
                    <Button variant="outline" onClick={handleLeaveGroup}>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Leave Group
                    </Button>
                  ) : (
                    <Button onClick={handleJoinGroup}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Join Group
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-gray-700 mb-4">{group.description}</p>

              {group.rules && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Group Rules</h3>
                  <p className="text-blue-800">{group.rules}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: MessageSquare },
              { id: 'members', label: 'Members', icon: Users, badge: pendingRequests.length > 0 ? pendingRequests.length : undefined },
              { id: 'settings', label: 'Settings', icon: Settings, ownerOnly: true },
              { id: 'analytics', label: 'Analytics', icon: BarChart3, ownerOnly: true }
            ].map((tab) => {
              const Icon = tab.icon;
              if (tab.ownerOnly && !isOwner) return null;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {tab.badge && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {tab.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest posts and discussions in this group</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No recent activity yet.</p>
                    <p className="text-sm">Be the first to start a discussion!</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Group Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Group Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Members</span>
                      <span className="font-semibold">{group.memberCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Today</span>
                      <span className="font-semibold">23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Posts This Week</span>
                      <span className="font-semibold">47</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Contributors */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Contributors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {members.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <Avatar size="sm">
                          <AvatarFallback className="text-xs">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-gray-500">12 posts this week</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-8">
            {/* Pending Requests */}
            {isOwner && pendingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-orange-500" />
                    Pending Join Requests ({pendingRequests.length})
                  </CardTitle>
                  <CardDescription>
                    Review and approve new member requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar size="sm">
                            <AvatarFallback className="text-xs">
                              {request.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.name}</p>
                            <p className="text-sm text-gray-500">
                              Requested {new Date(request.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(request.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Members List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-500" />
                  Group Members ({members.length})
                </CardTitle>
                <CardDescription>
                  Manage group membership and roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar size="sm">
                          <AvatarFallback className="text-xs">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className={`${getRoleColor(member.role)} text-xs`}>
                              {getRoleIcon(member.role)}
                              <span className="ml-1 capitalize">{member.role}</span>
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isOwner && member.role !== 'owner' && (
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            Change Role
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && isOwner && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Group Settings</CardTitle>
                <CardDescription>
                  Configure your group's privacy and behavior settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="private" className="text-base">Private Group</Label>
                    <p className="text-sm text-gray-600">
                      Only approved members can view content and join
                    </p>
                  </div>
                  <Switch id="private" checked={group.isPrivate} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Maximum Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    min="2"
                    max="10000"
                    value={group.maxMembers}
                    onChange={(e) => setGroup(prev => prev ? { ...prev, maxMembers: parseInt(e.target.value) } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rules">Group Rules</Label>
                  <Textarea
                    id="rules"
                    value={group.rules || ''}
                    onChange={(e) => setGroup(prev => prev ? { ...prev, rules: e.target.value } : null)}
                    placeholder="Define community guidelines and expectations"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that affect the entire group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-red-900">Transfer Ownership</h3>
                      <p className="text-sm text-red-700">
                        Transfer group ownership to another member
                      </p>
                    </div>
                    <Button variant="outline" className="text-red-600 border-red-600">
                      Transfer
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-red-900">Delete Group</h3>
                      <p className="text-sm text-red-700">
                        Permanently delete this group and all its content
                      </p>
                    </div>
                    <Button variant="destructive">
                      Delete Group
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && isOwner && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{group.memberCount}</div>
                <div className="text-sm text-gray-600">Total Members</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600">+12</div>
                <div className="text-sm text-gray-600">New This Month</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">47</div>
                <div className="text-sm text-gray-600">Posts This Week</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600">89%</div>
                <div className="text-sm text-gray-600">Member Engagement</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetailPage;
