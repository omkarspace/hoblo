import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Save,
  Eye,
  EyeOff,
  Upload,
  X,
  Tag,
  Plus,
  Bold,
  Italic,
  Link,
  Image
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ContentEditorProps {
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string[];
  onSave?: (data: {
    title: string;
    content: string;
    tags: string[];
    category: string;
    isDraft: boolean;
  }) => void;
  onPublish?: (data: {
    title: string;
    content: string;
    tags: string[];
    category: string;
  }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const CONTENT_CATEGORIES = [
  { value: 'general', label: 'General Discussion' },
  { value: 'events', label: 'Events & Meetups' },
  { value: 'resources', label: 'Resources & Guides' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'projects', label: 'Projects & Collaborations' },
  { value: 'questions', label: 'Questions & Help' }
];

const ContentEditor: React.FC<ContentEditorProps> = ({
  initialTitle = '',
  initialContent = '',
  initialTags = [],
  onSave,
  onPublish,
  onCancel,
  isLoading = false
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    if (title || content) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 30000); // Auto-save every 30 seconds

      setAutoSaveTimer(timer);
    }

    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [title, content, tags, category]);

  const handleAutoSave = () => {
    if (onSave && (title || content)) {
      onSave({
        title,
        content,
        tags,
        category,
        isDraft: true
      });
      console.log('Auto-saved draft');
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      setUploadedImages(prev => [...prev, ...imageFiles]);
      // For now, just add placeholder text for images
      const imageText = imageFiles.map((file, index) => `![Image ${index + 1}](${URL.createObjectURL(file)})`).join('\n\n');
      setContent(prev => prev + '\n\n' + imageText);
    }
  };

  const handleLinkInsert = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const linkText = prompt('Enter link text:', 'Link Text') || 'Link Text';
      const markdownLink = `[${linkText}](${url})`;
      setContent(prev => prev + markdownLink);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        title,
        content,
        tags,
        category,
        isDraft: true
      });
      setIsDraft(true);
    }
  };

  const handlePublish = () => {
    if (!title.trim() || !content.trim()) {
      alert('Please add a title and content before publishing.');
      return;
    }

    if (onPublish) {
      onPublish({
        title,
        content,
        tags,
        category
      });
    }
  };

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: handleImageUpload,
        link: handleLinkInsert
      }
    }
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'link', 'image'
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create Content</CardTitle>
              <CardDescription>
                Share your thoughts, experiences, and knowledge with the community
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your post a compelling title..."
              className="text-lg font-medium"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {CONTENT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <Label>Content *</Label>
            {!showPreview ? (
              <div className="border rounded-md p-4">
                <div className="flex space-x-2 mb-4 border-b pb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setContent(prev => prev + '**bold text**')}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setContent(prev => prev + '*italic text*')}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLinkInsert}
                  >
                    <Link className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImageUpload}
                  >
                    <Image className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts, experiences, or ask questions... (Markdown supported)"
                  className="min-h-[250px] border-0 resize-none focus:ring-0"
                />
                <div className="text-xs text-gray-500 mt-2">
                  Supports Markdown: **bold**, *italic*, [link](url), ![image](url)
                </div>
              </div>
            ) : (
              <div className="border rounded-md p-4 min-h-[300px] bg-gray-50">
                <div className="prose max-w-none">
                  {content ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded" />')
                          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
                          .replace(/\n\n/g, '</p><p>')
                          .replace(/\n/g, '<br/>')
                      }}
                    />
                  ) : (
                    <p className="text-gray-500 italic">No content to preview</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Tags help others discover your content
            </p>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Auto-save Indicator */}
          {isDraft && (
            <div className="text-sm text-green-600 flex items-center">
              <Save className="w-4 h-4 mr-1" />
              Draft saved automatically
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSave}
                disabled={isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              )}
            </div>
            <Button
              onClick={handlePublish}
              disabled={isLoading || !title.trim() || !content.trim()}
              className="min-w-[120px]"
            >
              {isLoading ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress (if needed for multiple files) */}
      {uploadedImages.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Uploaded Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                  <button
                    onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContentEditor;
