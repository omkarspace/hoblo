import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Users, MapPin, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const GROUP_CATEGORIES = [
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

const GroupCreationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    location: '',
    maxMembers: 100,
    isPrivate: false,
    rules: '',
    tags: ''
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, coverImage: 'File size must be less than 5MB' }));
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, coverImage: 'Please select an image file' }));
        return;
      }

      setCoverImage(file);
      setErrors(prev => ({ ...prev, coverImage: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Group name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Group name must be less than 50 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.maxMembers < 2 || formData.maxMembers > 10000) {
      newErrors.maxMembers = 'Member limit must be between 2 and 10,000';
    }

    if (formData.rules && formData.rules.length > 1000) {
      newErrors.rules = 'Rules must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare group data
      const groupData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        coverImage: coverImage
      };

      // TODO: Implement group creation API call
      console.log('Creating group:', groupData);

      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        // Redirect to the new group or groups list
        navigate('/groups');
      }, 1500);

    } catch (error: any) {
      setIsLoading(false);
      setErrors({ submit: error.message || 'Failed to create group. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/groups')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Groups
          </Button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Group</h1>
            <p className="text-xl text-gray-600">
              Start a community for your favorite hobby
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-500" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Tell us about your group and what makes it special
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Group Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Digital Photography Enthusiasts"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what your group is about, what members can expect, and any special focus areas..."
                    rows={4}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  <p className="text-sm text-gray-500">
                    {formData.description.length}/500 characters
                  </p>
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                  >
                    <option value="" disabled>Select a category</option>
                    {GROUP_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Location *
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., New York, NY or Global"
                    className={errors.location ? 'border-red-500' : ''}
                  />
                  {errors.location && (
                    <p className="text-sm text-red-600">{errors.location}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Group Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-500" />
                  Group Settings
                </CardTitle>
                <CardDescription>
                  Configure privacy and membership settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Privacy */}
                <div className="flex items-center space-x-3">
                  <input
                    id="isPrivate"
                    name="isPrivate"
                    type="checkbox"
                    checked={formData.isPrivate}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <Label htmlFor="isPrivate" className="text-sm">
                    Make this a private group
                  </Label>
                </div>
                <p className="text-sm text-gray-600 ml-7">
                  {formData.isPrivate
                    ? 'Members must be approved to join. Content is only visible to members.'
                    : 'Anyone can join and view content. Best for open communities.'
                  }
                </p>

                {/* Member Limit */}
                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Maximum Members *</Label>
                  <Input
                    id="maxMembers"
                    name="maxMembers"
                    type="number"
                    min="2"
                    max="10000"
                    value={formData.maxMembers}
                    onChange={handleInputChange}
                    className={errors.maxMembers ? 'border-red-500' : ''}
                  />
                  <p className="text-sm text-gray-500">
                    Set a reasonable limit based on your group's focus and management capacity
                  </p>
                  {errors.maxMembers && (
                    <p className="text-sm text-red-600">{errors.maxMembers}</p>
                  )}
                </div>

                {/* Group Rules */}
                <div className="space-y-2">
                  <Label htmlFor="rules">Group Rules (Optional)</Label>
                  <Textarea
                    id="rules"
                    name="rules"
                    value={formData.rules}
                    onChange={handleInputChange}
                    placeholder="Define expectations for members, posting guidelines, and community standards..."
                    rows={3}
                    className={errors.rules ? 'border-red-500' : ''}
                  />
                  <p className="text-sm text-gray-500">
                    {formData.rules.length}/1000 characters
                  </p>
                  {errors.rules && (
                    <p className="text-sm text-red-600">{errors.rules}</p>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (Optional)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    type="text"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="photography, digital, camera, art"
                  />
                  <p className="text-sm text-gray-500">
                    Separate tags with commas. Helps others discover your group.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle>Cover Image (Optional)</CardTitle>
                <CardDescription>
                  Add a cover image to make your group more attractive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {coverImage ? (
                      <div className="space-y-4">
                        <img
                          src={URL.createObjectURL(coverImage)}
                          alt="Cover preview"
                          className="max-w-full h-32 object-cover rounded mx-auto"
                        />
                        <p className="text-sm text-gray-600">{coverImage.name}</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setCoverImage(null);
                            const input = document.getElementById('coverImage') as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                        >
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <div className="space-y-2">
                          <Label
                            htmlFor="coverImage"
                            className="cursor-pointer text-primary hover:text-primary/80 font-medium"
                          >
                            Click to upload
                          </Label>
                          <p className="text-sm text-gray-500">or drag and drop</p>
                          <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
                        </div>
                      </div>
                    )}
                    <input
                      id="coverImage"
                      name="coverImage"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  {errors.coverImage && (
                    <p className="text-sm text-red-600">{errors.coverImage}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/groups')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupCreationPage;
