import React, { useState, useEffect } from 'react';
import { Edit3, Camera, MapPin, Calendar, Trophy, Users, MessageSquare } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  location?: string;
  hobbies?: string[];
  profilePicture?: string;
  isEmailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    bio: '',
    location: '',
    hobbies: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Initialize profile data from auth context
    if (user) {
      setProfile(user as UserProfile);
      setEditForm({
        bio: user.bio || '',
        location: user.location || '',
        hobbies: user.hobbies || []
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement profile update API call
      console.log('Updating profile:', editForm);

      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        setIsEditing(false);
        // Update local profile state
        if (profile) {
          setProfile({
            ...profile,
            bio: editForm.bio,
            location: editForm.location,
            hobbies: editForm.hobbies
          });
        }
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to current profile values
    if (profile) {
      setEditForm({
        bio: profile.bio || '',
        location: profile.location || '',
        hobbies: profile.hobbies || []
      });
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Picture */}
              <div className="relative">
                <Avatar size="lg" className="border-4 border-white shadow-lg">
                  {profile.profilePicture ? (
                    <AvatarImage src={profile.profilePicture} alt={`${profile.firstName} ${profile.lastName}`} />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile.firstName} {profile.lastName}
                </h1>

                <div className="flex items-center justify-center md:justify-start space-x-4 mb-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profile.location || 'Location not set'}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                  {profile.isEmailVerified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Verified
                    </Badge>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={editForm.bio}
                        onChange={handleInputChange}
                        placeholder="Tell others about yourself and your hobbies..."
                        rows={3}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        value={editForm.location}
                        onChange={handleInputChange}
                        placeholder="City, Country"
                        className="w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 mb-4">
                    {profile.bio || 'No bio added yet. Click edit to add one!'}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex justify-center md:justify-start space-x-3">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSaveProfile} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hobbies Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                Hobbies & Interests
              </CardTitle>
              <CardDescription>
                Your favorite activities and passions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.hobbies && profile.hobbies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map((hobby, index) => (
                    <Badge key={index} variant="secondary">
                      {hobby}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  No hobbies selected yet. Edit your profile to add some!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Stats Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-500" />
                Activity Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Posts Created</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Groups Joined</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Achievements</span>
                  <span className="font-semibold">1</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Login</span>
                  <span className="font-semibold text-sm">
                    {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'Today'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-green-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Welcome to HobbyHub!</div>
                  <div className="text-gray-500">Completed profile setup</div>
                  <div className="text-xs text-gray-400">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-center text-gray-500 italic py-4">
                  More activities will appear here as you engage with the community
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Settings */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account preferences and security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Email Address</div>
                  <div className="text-sm text-gray-600">{profile.email}</div>
                </div>
                <div className="flex items-center space-x-2">
                  {profile.isEmailVerified ? (
                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Unverified
                    </Badge>
                  )}
                  <Button variant="outline" size="sm">
                    Change Email
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Password</div>
                  <div className="text-sm text-gray-600">Last updated 30 days ago</div>
                </div>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Privacy Settings</div>
                  <div className="text-sm text-gray-600">Control who can see your profile</div>
                </div>
                <Button variant="outline" size="sm">
                  Manage Privacy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
