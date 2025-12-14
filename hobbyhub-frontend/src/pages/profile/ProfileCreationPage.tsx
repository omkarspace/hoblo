import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

const HOBBY_CATEGORIES = [
  'Photography', 'Cooking', 'Gardening', 'Painting', 'Music',
  'Writing', 'Woodworking', 'Knitting', 'Gaming', 'Fitness',
  'Dancing', 'Reading', 'Cycling', 'Fishing', 'Astronomy'
];

const ProfileCreationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    hobbies: [] as string[],
    profilePicture: null as File | null
  });
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));
    }
  };

  const toggleHobby = (hobby: string) => {
    setSelectedHobbies(prev =>
      prev.includes(hobby)
        ? prev.filter(h => h !== hobby)
        : [...prev, hobby]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement profile update API call
      console.log('Profile creation:', {
        ...formData,
        hobbies: selectedHobbies
      });

      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        navigate('/home');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Tell us about yourself to connect with like-minded hobby enthusiasts
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.firstName}!</CardTitle>
            <CardDescription>
              Let's personalize your HobbyHub experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              {/* Profile Picture */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Profile Picture</Label>
                <div className="flex items-center space-x-4">
                  <Avatar size="lg" className="border-2 border-gray-200">
                    {formData.profilePicture ? (
                      <AvatarImage
                        src={URL.createObjectURL(formData.profilePicture)}
                        alt="Profile preview"
                      />
                    ) : (
                      <AvatarFallback className="text-lg">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="profile-picture"
                    />
                    <Label
                      htmlFor="profile-picture"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Choose Photo
                    </Label>
                    <p className="mt-1 text-xs text-gray-500">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us about yourself and your hobbies..."
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Share your passion and what you're looking for in the community
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="City, Country"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Help us connect you with local hobby groups
                </p>
              </div>

              {/* Hobbies */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Your Hobbies & Interests</Label>
                <p className="text-sm text-gray-600">
                  Select the hobbies you're passionate about to get personalized recommendations
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {HOBBY_CATEGORIES.map((hobby) => (
                    <button
                      key={hobby}
                      type="button"
                      onClick={() => toggleHobby(hobby)}
                      className={`p-3 text-sm border rounded-lg transition-colors ${
                        selectedHobbies.includes(hobby)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {hobby}
                    </button>
                  ))}
                </div>
                {selectedHobbies.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Selected: {selectedHobbies.join(', ')}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving Profile...' : 'Complete Profile'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileCreationPage;
