import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Reintroduce Tabs components

import { Mail, Lock, User, Crown, Shield, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('signin'); // Default to 'signin' view
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    password: '',
    masterKey: ''
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        toast.error(error.message || 'Failed to sign in');
      } else {
        toast.success('Welcome back!');
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await signUp(formData.email, formData.password, formData.fullName);
      if (error) {
        toast.error(error.message || 'Failed to sign up');
      } else {
        toast.success('Account created successfully! Please check your email for verification.');
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message || 'Failed to send reset email');
      } else {
        toast.success('Password reset email sent! Check your inbox.');
        setCurrentView('signin'); // Go back to sign in after sending reset link
        setForgotPasswordEmail('');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (
        adminCredentials.username === "admin" &&
        adminCredentials.password === "SwingScribe2024!" &&
        adminCredentials.masterKey === "SWING_ADMIN_2024"
      ) {
        localStorage.setItem('admin_authenticated', 'true');
        navigate('/admin');
        toast.success('Admin login successful');
        onClose();
      } else {
        toast.error('Invalid admin credentials');
      }
    } catch (error) {
      toast.error('Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black bg-opacity-80 backdrop-blur-md animate-fade-in">
      {/* Modal Container */}
      <div className="relative w-full sm:max-w-md bg-dark-surface border border-gray-700 rounded-2xl shadow-neon-blue animate-slide-down overflow-hidden">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-white text-xl sm:text-3xl font-bold bg-transparent border-none z-50 transition-colors duration-200"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Main Card with Tabs */}
        <Card className="w-full sm:max-w-md glass-effect shine-animation bg-transparent border-none shadow-none p-6">
          <CardHeader className="text-center pb-4">
            <Crown className="mx-auto mb-3 w-12 h-12 text-purple-400 drop-shadow-lg" />
            <CardTitle className="text-4xl font-extrabold text-white leading-tight">SWING-LEOFY</CardTitle>
            <CardDescription className="text-gray-300 text-lg">Your Premium Trading Journal & Community</CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <Tabs defaultValue="signin" className="space-y-6" onValueChange={setCurrentView}>
              <TabsList className="grid w-full grid-cols-3 bg-dark-bg border border-gray-700 rounded-xl p-1 shadow-inner">
                <TabsTrigger value="signin" className="btn-animated text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-500 data-[state=active]:shadow-md data-[state=active]:rounded-lg py-3 px-4 text-base font-medium">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="btn-animated text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-400 data-[state=active]:shadow-md data-[state=active]:rounded-lg py-3 px-4 text-base font-medium">Sign Up</TabsTrigger>
                <TabsTrigger value="admin" className="btn-animated text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-400 data-[state=active]:shadow-md data-[state=active]:rounded-lg py-3 px-4 text-base font-medium">Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300 text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-gray-800 border border-gray-700 pl-11 pr-4 py-2 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-300 placeholder:text-gray-500 text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300 text-sm">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="bg-gray-800 border border-gray-700 pl-11 pr-4 py-2 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-300 placeholder:text-gray-500 text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-blue-400 hover:text-blue-300 p-0 h-auto text-sm"
                      onClick={() => setCurrentView('forgotPassword')}
                    >
                      Forgot Password?
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-extrabold py-3 rounded-lg text-lg shadow-lg btn-animated pulse-blue tracking-wide"
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-300 text-sm">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="bg-gray-800 border border-gray-700 pl-11 pr-4 py-2 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-300 placeholder:text-gray-500 text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-gray-300 text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-gray-800 border border-gray-700 pl-11 pr-4 py-2 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-300 placeholder:text-gray-500 text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-gray-300 text-sm">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="bg-gray-800 border border-gray-700 pl-11 pr-4 py-2 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-300 placeholder:text-gray-500 text-base"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-extrabold py-3 rounded-lg text-lg shadow-lg btn-animated pulse-blue tracking-wide"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="admin-username" className="text-gray-300 text-sm">Username</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="admin-username"
                        type="text"
                        placeholder="Enter admin username"
                        value={adminCredentials.username}
                        onChange={(e) => setAdminCredentials(prev => ({ ...prev, username: e.target.value }))}
                        className="bg-gray-800 border border-gray-700 pl-11 pr-4 py-2 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-300 placeholder:text-gray-500 text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="text-gray-300 text-sm">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="Enter admin password"
                        value={adminCredentials.password}
                        onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                        className="bg-gray-800 border border-gray-700 pl-11 pr-4 py-2 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-300 placeholder:text-gray-500 text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-masterkey" className="text-gray-300 text-sm">Master Key</Label>
                    <div className="relative">
                      <Crown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="admin-masterkey"
                        type="password"
                        placeholder="Enter master key"
                        value={adminCredentials.masterKey}
                        onChange={(e) => setAdminCredentials(prev => ({ ...prev, masterKey: e.target.value }))}
                        className="bg-gray-800 border border-gray-700 pl-11 pr-4 py-2 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-300 placeholder:text-gray-500 text-base"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-extrabold py-3 rounded-lg text-lg shadow-lg btn-animated pulse-blue tracking-wide"
                    disabled={loading}
                  >
                    {loading ? 'Authenticating...' : 'Access Admin Panel'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {currentView === 'forgotPassword' && (
          <Card className="w-full sm:max-w-md glass-effect shine-animation bg-transparent border-none shadow-none p-6">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <Mail className="w-14 h-14 text-blue-300 drop-shadow-lg" />
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">Reset Password</CardTitle>
              <CardDescription className="text-gray-400 text-base leading-relaxed">Enter your email address and we'll send you a link to reset your password.</CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-gray-300 text-sm">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="Enter your email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="bg-gray-800 border border-gray-700 pl-11 pr-4 py-2 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-300 placeholder:text-gray-500 text-base"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-extrabold py-3 rounded-lg text-lg shadow-lg btn-animated pulse-blue tracking-wide"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="w-full text-blue-400 hover:text-blue-300 flex items-center justify-center p-0 h-auto"
                  onClick={() => setCurrentView('signin')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AuthModal;


