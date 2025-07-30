import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaymentModal } from '@/components/Payment/PaymentModal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Send, Pin, Upload, X, ImageIcon, Trash2, CreditCard, CheckCircle, Lock, Info } from 'lucide-react';
import { toast } from 'sonner';
import { CommunityPasswordPrompt } from './CommunityPasswordPrompt';
import { CommunityPasswordBox } from './CommunityPasswordBox';
import { ImageModal } from './ImageModal';
import { motion } from 'framer-motion';
import Aurora from '@/components/ui/Aurora';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  post_type: string;
  is_pinned: boolean;
  created_at: string;
  user_id: string;
  image_url?: string;
  user_email?: string;
  user_full_name?: string;
}

export function CommunitySection() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [canPost, setCanPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', post_type: 'discussion' });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [hasVerifiedPayment, setHasVerifiedPayment] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [selectedViewImage, setSelectedViewImage] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    if (user) {
      checkCommunityAccess();
      checkPostingPermission();
    } else {
      setLoading(false);
      setCheckingPayment(false);
    }
  }, [user]);

  useEffect(() => {
    if (!hasAccess || !user) return;

    const subscription = supabase
      .channel('community-posts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_posts'
      }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [hasAccess, user]);

  const checkCommunityAccess = async () => {
    if (!user) return;
    
    try {
      setCheckingPayment(true);
      console.log('Checking community access for user:', user.id);
      
      // Check if user has verified payment
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_submissions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'verified')
        .limit(1);
      
      if (paymentError) {
        console.error('Error checking payment:', paymentError);
      }

      const hasPayment = paymentData && paymentData.length > 0;
      setHasVerifiedPayment(hasPayment);
      console.log('Has verified payment:', hasPayment);
      
      if (!hasPayment) {
        setLoading(false);
        setCheckingPayment(false);
        return;
      }

      // Check session storage for community access
      const communityAccess = sessionStorage.getItem('community_access');
      const accessTimestamp = sessionStorage.getItem('community_access_time');
      const accessPassword = sessionStorage.getItem('community_password');
      
      if (communityAccess === 'granted' && accessTimestamp && accessPassword) {
        const accessTime = parseInt(accessTimestamp);
        const currentTime = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (currentTime - accessTime < twentyFourHours) {
          try {
            const { data } = await supabase.functions.invoke('verify-community-password', {
              body: { password: accessPassword }
            });
            
            if (data?.valid) {
              setHasAccess(true);
              fetchPosts();
              return;
            }
          } catch (error) {
            console.error('Error verifying stored password:', error);
          }
        }
      }
      
      // Clear invalid session
      clearCommunitySession();
    } catch (error) {
      console.error('Error checking community access:', error);
      clearCommunitySession();
    }
  };

  const clearCommunitySession = () => {
    sessionStorage.removeItem('community_access');
    sessionStorage.removeItem('community_access_time');
    sessionStorage.removeItem('community_password');
    setHasAccess(false);
    setLoading(false);
    setCheckingPayment(false);
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-community-password', {
        body: { password }
      });

      if (error) {
        console.error('Verification error:', error);
        return false;
      }

      if (data?.valid) {
        if (user) {
          await supabase.functions.invoke('log-community-access', {
            body: { 
              user_email: user.email,
              user_id: user.id 
            }
          });
        }

        setHasAccess(true);
        sessionStorage.setItem('community_access', 'granted');
        sessionStorage.setItem('community_access_time', Date.now().toString());
        sessionStorage.setItem('community_password', password);
        
        fetchPosts();
        toast.success('Welcome to the community!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verifying password:', error);
      toast.error('Failed to verify password. Please try again.');
      return false;
    }
  };

  const checkPostingPermission = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('community_posters')
        .select('can_post')
        .eq('email', user.email)
        .single();

      if (error) throw error;

      setCanPost(!!data?.can_post);
    } catch (error) {
      console.error('Error checking posting permission:', error);
      setCanPost(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      console.log('Fetching posts...');
      
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Posts fetch error:', postsError);
        throw postsError;
      }

      console.log('Posts fetched:', postsData?.length || 0);

      // Get user profiles for posts
      const userIds = [...new Set(postsData?.map(post => post.user_id).filter(Boolean))];
      let postsWithUserInfo = postsData || [];
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        postsWithUserInfo = postsData?.map(post => {
          const profile = profilesData?.find(p => p.id === post.user_id);
          return {
            ...post,
            user_email: profile?.email || 'Unknown User',
            user_full_name: profile?.full_name || profile?.email || 'Unknown User'
          };
        }) || [];
      }

      setPosts(postsWithUserInfo);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load community posts');
    } finally {
      setLoading(false);
      setCheckingPayment(false);
    }
  };

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

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      toast.success('Post deleted successfully!');
      await fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post. Please try again.');
    }
  };

  if (checkingPayment) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 bg-background min-h-screen p-6">
        <Card className="border-primary/20 bg-card">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-primary text-2xl">
              <Lock className="w-6 h-6" />
              Login Required
            </CardTitle>
            <CardDescription className="text-lg">
              Please login to access the trading community
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!hasVerifiedPayment) {
    return (
      <div className="space-y-6 bg-background min-h-screen p-6">
        <Card className="border-primary/20 bg-card">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-primary text-2xl">
              <Lock className="w-6 h-6" />
              Premium Community Access
            </CardTitle>
            <CardDescription className="text-lg">
              Subscribe to access our exclusive trading community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
                <CreditCard className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-primary mb-2">Premium Features</h3>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Share trading insights and charts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Connect with experienced traders
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Access to exclusive discussions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Real-time market insights
                  </li>
                </ul>
              </div>
              <PaymentModal>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Subscribe Now
                </Button>
              </PaymentModal>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="space-y-6 bg-background min-h-screen p-6">
        <Card className="border-primary/20 bg-card">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-primary text-2xl">
              <CheckCircle className="w-6 h-6 text-green-400" />
              Payment Verified!
            </CardTitle>
            <CardDescription className="text-lg text-green-400">
              Your payment has been verified. Enter the community password to access.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <CommunityPasswordBox />
        <CommunityPasswordPrompt onPasswordSubmit={verifyPassword} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8 relative min-h-screen">
      <Aurora
        colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />
      
      <Card className="bg-black/40 backdrop-blur-sm border-2 border-blue-600/50 shadow-lg shadow-blue-600/20">
        <CardHeader className="relative">
          <CardTitle className="text-3xl text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-400" />
            Premium Trading Community
          </CardTitle>
          {/* Disclaimer Icon at top right */}
          <button
            type="button"
            title="Disclaimer"
            className="absolute top-2 right-2 p-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20"
            style={{ lineHeight: 0 }}
            onClick={() => setShowDisclaimer(true)}
          >
            <Info className="w-5 h-5 text-yellow-400" />
          </button>
          <CardDescription className="text-gray-300 text-lg">
            Connect with fellow traders, share insights, and discuss market strategies
          </CardDescription>
        </CardHeader>
        {/* Disclaimer Modal */}
        {showDisclaimer && (
          <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 50, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(20,20,30,0.98)', border: '1px solid #333', borderRadius: '0.75rem', padding: '1.1rem 1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', minWidth: '320px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.7rem', alignItems: 'center', position: 'relative' }}>
              <button onClick={() => setShowDisclaimer(false)} style={{ position: 'sticky', top: 8, right: 8, alignSelf: 'flex-end', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 700, zIndex: 2 }}>&times;</button>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span role="img" aria-label="scroll">📜</span> Legal Disclaimer – SEBI Compliance Statement
              </div>
              <div style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '1rem', textAlign: 'left' }}>
                <b>Swing-Leofy is not a SEBI-registered investment advisor or research analyst.</b><br/><br/>
                All content provided on this platform — including scanners, trading journals, calculators, AI tools, and setup trackers — is intended strictly for educational and informational purposes only.<br/><br/>
                We do not provide any stock recommendations, price targets, buy/sell/hold signals, or investment advice of any kind.<br/>
                All tools are designed to help users improve their market understanding and make independent trading decisions.<br/><br/>
                Trading and investing in the stock market involve significant financial risk.<br/>
                Past performance is not indicative of future results.<br/>
                Please consult a SEBI-registered financial advisor before making any investment decisions.<br/><br/>
                Swing-Leofy and its creators are not responsible for any financial loss, profit, or decision made by users based on content or tools provided on this site.
              </div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span role="img" aria-label="check">✅</span> Terms of Use
              </div>
              <div style={{ color: '#fff', fontSize: '0.95rem', textAlign: 'left' }}>
                <b>🔹 1. No Advisory Role</b><br/>
                Swing-Leofy does not act as, or claim to be, a SEBI-registered investment advisor or research analyst.<br/>
                We do not provide personalized financial advice.<br/><br/>
                <b>🔹 2. Educational Purpose Only</b><br/>
                All tools, including AI stock analysis, scanners, setup trackers, and calculators, are designed solely for educational and analytical purposes.<br/><br/>
                <b>🔹 3. User Responsibility</b><br/>
                Users are fully responsible for their trading actions and must perform their own due diligence before making any trade or investment.<br/><br/>
                <b>🔹 4. No Guarantees</b><br/>
                We do not offer any guarantees of returns or financial outcomes. Market conditions are dynamic and involve inherent risks.<br/><br/>
                <b>🔹 5. Community Conduct</b><br/>
                Users in our premium community are expected to:<br/>
                <ul style={{ marginLeft: '1.2em', marginTop: '0.5em', color: '#fff' }}>
                  <li>Avoid sharing unverified stock tips.</li>
                  <li>Respect others' privacy and opinions.</li>
                  <li>Not promote external financial services or advisors.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Community Password Box for verified users */}
      <CommunityPasswordBox />

      {/* Create New Post */}
      {hasAccess && (
        <Card className="bg-black/40 backdrop-blur-sm border-2 border-blue-600/50 shadow-lg shadow-blue-600/20">
          <CardHeader>
            <CardTitle className="text-xl">Create Post</CardTitle>
            {!canPost && (
              <CardDescription className="text-yellow-400">
                Your posting access is currently disabled. Please contact an administrator.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={createPost} className="space-y-4">
              <div>
                <Input
                  placeholder="Post Title"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="bg-black border-gray-700"
                  disabled={!canPost}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Write your post..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="min-h-[100px] bg-black border-gray-700"
                  disabled={!canPost}
                />
              </div>
              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
                    className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      canPost
                        ? 'border-blue-500 text-blue-500 hover:bg-blue-500/10'
                        : 'border-gray-600 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Image
                  </label>
                </div>
              </div>
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-[400px] h-auto rounded-lg border border-gray-700"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Community Posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card className="bg-black/40 backdrop-blur-sm border-2 border-blue-600/50 shadow-lg shadow-blue-600/20">
            <CardContent className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">No posts yet. Be the first to start a discussion!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-black/40 backdrop-blur-sm border border-gray-700/50 hover:border-blue-400/50 transition-all duration-300 shadow-md hover:shadow-blue-400/20">
                <CardHeader className="py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {post.is_pinned && <Pin className="w-3 h-3 text-blue-400" />}
                        <h3 className="font-semibold text-white text-base">{post.title}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span className="text-blue-400">{post.user_full_name}</span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleString()}</span>
                        <Badge variant="outline" className="text-[10px] border-blue-400/50 text-blue-400 bg-blue-400/10">
                          {post.post_type}
                        </Badge>
                      </div>
                    </div>
                    
                    {user && post.user_id === user.id && (
                      <Button
                        onClick={() => deletePost(post.id)}
                        variant="destructive"
                        size="sm"
                        className="h-7 w-7 p-0 bg-red-600/80 hover:bg-red-700/80"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="py-3">
                  <p className="text-gray-300 text-sm whitespace-pre-wrap mb-3 leading-relaxed">{post.content}</p>
                  {post.image_url && (
                    <div className="mt-2 max-w-[65%]">
                      <img 
                        src={post.image_url} 
                        alt="Chart" 
                        className="rounded-lg w-full h-auto max-h-[350px] object-contain border border-blue-400/30 cursor-pointer hover:opacity-90 transition-all duration-300"
                        onClick={() => setSelectedViewImage(post.image_url)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Image Modal */}
      <ImageModal
        imageUrl={selectedViewImage || ''}
        isOpen={!!selectedViewImage}
        onClose={() => setSelectedViewImage(null)}
      />
    </div>
  );
}
