import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Upload, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

interface CreateCommunityPostProps {
  user: User | null;
  canPost: boolean;
  fetchPosts: () => Promise<void>;
}

export function CreateCommunityPost({ user, canPost, fetchPosts }: CreateCommunityPostProps) {
  const [newPost, setNewPost] = useState({ title: '', content: '', post_type: 'discussion' });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingPost, setUploadingPost] = useState(false);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    
    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImagePreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      console.log('Starting image upload...');
      
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `community-images/${fileName}`;

      console.log('Uploading to path:', filePath);

      const { data, error: uploadError } = await supabase.storage
        .from('community-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', data);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('community-uploads')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
      return null;
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canPost) {
      toast.error('You do not have permission to post in the community');
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    setUploadingPost(true);
    try {
      let imageUrl = null;
      
      // Upload image if selected
      if (selectedImage) {
        console.log('Uploading image...');
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          setUploadingPost(false);
          return;
        }
        console.log('Image uploaded successfully:', imageUrl);
      }

      console.log('Creating post with data:', {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        post_type: newPost.post_type,
        user_id: user.id,
        image_url: imageUrl
      });

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          title: newPost.title.trim(),
          content: newPost.content.trim(),
          post_type: newPost.post_type,
          user_id: user.id,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Post creation error:', error);
        throw error;
      }

      console.log('Post created successfully:', data);

      // Reset form
      setNewPost({ title: '', content: '', post_type: 'discussion' });
      setSelectedImage(null);
      setImagePreview(null);
      
      // Clear the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      toast.success('Post created successfully!');
      await fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setUploadingPost(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById('chart-upload-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <Card className="bg-gray-900 border border-gray-700 shadow-lg p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl text-white flex items-center gap-2">
          <Send className="w-5 h-5 text-gray-400" />
          Create Post
        </CardTitle>
        {!canPost && (
          <p className="text-yellow-500 text-sm mt-1">
            Your posting access is currently disabled. Please contact an administrator.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={createPost} className="space-y-4">
          <div>
            <Input
              placeholder="Post Title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              disabled={!canPost}
            />
          </div>
          <div>
            <Textarea
              placeholder="Write your post..."
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              className="min-h-[100px] bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              disabled={!canPost}
            />
          </div>
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200"
              disabled={uploadingPost || !canPost}
            >
              {uploadingPost ? (
                <>Posting...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Post
                </>
              )}
            </Button>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
                disabled={!canPost}
              />
              <label
                htmlFor="image-upload"
                className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    canPost
                      ? 'border-blue-500 text-blue-500 hover:bg-blue-500/10'
                      : 'border-gray-600 text-gray-400 cursor-not-allowed'
                  } bg-gray-800 hover:bg-gray-700`}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Add Image
              </label>
            </div>
          </div>
          {imagePreview && (
            <div className="relative inline-block mt-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-full h-auto rounded-lg border border-gray-600 shadow-sm cursor-pointer hover:opacity-90 transition-all duration-300"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
