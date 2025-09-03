import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaymentModal } from '@/components/Payment/PaymentModal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Send, Pin, Upload, X, ImageIcon, Trash2, CreditCard, CheckCircle, Lock, Info, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { CommunityPasswordPrompt } from './CommunityPasswordPrompt';
import { CommunityPasswordBox } from './CommunityPasswordBox';
import { ImageModal } from './ImageModal';
import { motion } from 'framer-motion';
import { CreateCommunityPost } from './CreateCommunityPost'; // Import the new component

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
  const [hasVerifiedPayment, setHasVerifiedPayment] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [selectedViewImage, setSelectedViewImage] = useState<string | null>(null);

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
      <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 bg-black text-white min-h-screen">
        <Card className="bg-gray-900 border border-gray-700 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-white text-2xl">
              <Lock className="w-6 h-6 text-gray-400" />
              Login Required
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Please login to access the trading community
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!hasVerifiedPayment) {
    return (
      <motion.div 
        className="w-full mx-auto py-4 px-4 sm:px-6 flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 shadow-2xl rounded-3xl overflow-hidden p-6 w-full max-w-4xl">
          <CardHeader className="text-center space-y-3 mb-4">
            <Lock className="w-10 h-10 text-green-400 mx-auto" />
            <CardTitle className="text-green-400 text-3xl font-extrabold">
              Premium Community Access
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg leading-relaxed">
              Subscribe to access our exclusive trading community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center space-y-6">
              <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm">
                <CreditCard className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-400 mb-4">Here’s what you get inside:</h3>
                <ul className="text-left space-y-2 text-gray-300 text-sm leading-snug">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🏠 Home Dashboard – Clean, simple, and powerful start to your trading journey.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />📓 Pro Journal – Track your trades, refine your strategy, and learn from every move.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🎯 Setup Tracker – Never miss a winning setup with organized, easy-to-follow tracking.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🔍 Smart Scanner – Find high-probability stocks instantly with AI-powered filters.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🌐 Community – Connect, share, and grow with like-minded traders.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />📈 Sector Rotation Tool – Spot money flow between sectors for better market timing.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🚀 LIVE Sector Rotation & Stock Data – Real-time insights, real trading advantage.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🧮 Trading Calculator – Manage risk & reward with precision.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🤖 LEO AI – Your personal AI-powered swing trading assistant.</li>
                </ul>
              </div>
              <PaymentModal>
                <motion.div
                  whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(34,197,94,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-block w-full sm:w-auto"
                >
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out transform border border-green-400">
                    <CreditCard className="w-5 h-5 mr-3" />
                    JOIN NOW
                  </Button>
                </motion.div>
              </PaymentModal>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 bg-black text-white min-h-screen">
        <Card className="bg-gray-900 border border-gray-700 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-green-400 text-2xl">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Payment Verified!
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg">
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
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 bg-black text-white min-h-screen">
      
      {/* Community Feed Header */}
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-10 h-10 text-blue-400" />
        <div>
          <h1 className="text-4xl font-bold text-white">Community Feed</h1>
          <p className="text-gray-300 text-lg">Explore shared insights and resources from the community.</p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-gray-400 text-sm">{posts.length} Posts Available</span>
          <Button
            onClick={fetchPosts}
            variant="outline"
            className="text-gray-300 border-gray-600 hover:bg-gray-800"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Community Password Box for verified users (adjust styling as needed) */}
      <CommunityPasswordBox />

      {/* Create New Post */}
      {hasAccess && (
        <div className="mb-6">
          <CreateCommunityPost user={user} canPost={canPost} fetchPosts={fetchPosts} />
        </div>
      )}

      {/* Community Posts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.length === 0 ? (
          <Card className="col-span-full bg-gray-900 border border-gray-700 shadow-lg">
            <CardContent className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
              <Card className="bg-gray-900 border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
                <CardHeader className="p-4 pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        {post.is_pinned && <Pin className="w-3 h-3 text-yellow-400 mr-1" />} 
                        <h3 className="font-bold text-white text-base">{post.title}</h3>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span className="font-medium text-blue-300">{post.user_full_name}</span>
                        <span> • {new Date(post.created_at).toLocaleDateString()}</span>
                        
                        <Badge variant="outline" className="ml-1 text-blue-300 border-none bg-transparent p-0">{post.post_type}</Badge>
                      </div>
                    </div>
                    
                    {user && post.user_id === user.id && (
                      <Button
                        onClick={() => deletePost(post.id)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed mb-3">
                    <span className="bg-yellow-900/30 text-yellow-300 text-xs font-medium px-2.5 py-0.5 rounded-md">{post.content.substring(0, 50)}...</span> 
                  </div>
                  {post.image_url && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><ImageIcon className="w-3 h-3 text-gray-400"/> Images</p>
                      <img 
                        src={post.image_url} 
                        alt="Chart" 
                        className="rounded-md w-full h-auto max-h-[150px] object-cover border border-gray-600 cursor-pointer hover:opacity-90 transition-all duration-300"
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
