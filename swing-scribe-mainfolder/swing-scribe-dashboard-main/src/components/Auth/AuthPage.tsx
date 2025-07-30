
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, User, Crown, Shield, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DarkVeil from './DarkVeil';
import RotatingText from './RotatingText';

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'SwingScribe2024!',
  masterKey: 'SWING_ADMIN_2024'
};

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
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
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        toast.error(error.message || 'Failed to sign in');
      } else {
        toast.success('Welcome back!');
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
        setShowForgotPassword(false);
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
        adminCredentials.username === ADMIN_CREDENTIALS.username &&
        adminCredentials.password === ADMIN_CREDENTIALS.password &&
        adminCredentials.masterKey === ADMIN_CREDENTIALS.masterKey
      ) {
        localStorage.setItem('admin_authenticated', 'true');
        navigate('/admin');
        toast.success('Admin login successful');
      } else {
        toast.error('Invalid admin credentials');
      }
    } catch (error) {
      toast.error('Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-effect shine-animation">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="w-12 h-12 text-gray-300" />
            </div>
            <CardTitle className="text-2xl text-white">Reset Password</CardTitle>
            <CardDescription className="text-gray-400">
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-gray-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="bg-card-bg border-gray-600 pl-10 focus:border-gray-400 text-white placeholder:text-gray-500"
                    required
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold btn-animated"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
                onClick={() => setShowForgotPassword(false)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', overflow: 'hidden', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      {/* Custom Navigation Buttons */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', width: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: '0.5rem', border: '1px solid #fff', borderRadius: '1rem', padding: '0.15rem 0.6rem', background: 'rgba(0,0,0,0.15)' }}>
          <button onClick={() => setShowContactModal(true)} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 500, padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.85rem', letterSpacing: '0.03em', outline: 'none', cursor: 'pointer' }}>CONTACT</button>
          <button onClick={() => setShowAboutModal(true)} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 500, padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.85rem', letterSpacing: '0.03em', outline: 'none', cursor: 'pointer' }}>ABOUT US</button>
          <button onClick={() => setShowTermsModal(true)} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 500, padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.85rem', letterSpacing: '0.03em', outline: 'none', cursor: 'pointer' }}>TERMS & CONDITION</button>
          <button onClick={() => setShowServiceModal(true)} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 500, padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.85rem', letterSpacing: '0.03em', outline: 'none', cursor: 'pointer' }}>OUR SERVICE</button>
        </div>
      </div>
      {/* Contact Modal */}
      {showContactModal && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '120px', margin: '0 auto', zIndex: 30, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(20,20,30,0.98)', border: '1px solid #333', borderRadius: '0.75rem', padding: '1.1rem 1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '0.7rem', alignItems: 'flex-start', position: 'relative' }}>
            <button onClick={() => setShowContactModal(false)} style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 700 }}>&times;</button>
            <a href="https://t.me/SwingLeofyin" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', color: '#229ED9', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="120" cy="120" r="120" fill="#229ED9"/><path d="M53 120.5l54.5 22.5 22.5 54.5 54.5-154.5-131.5 77.5z" fill="#fff"/><path d="M53 120.5l54.5 22.5 22.5 54.5 54.5-154.5-131.5 77.5z" fill="#fff" fillOpacity=".2"/></svg>
              Telegram
            </a>
            <div style={{ display: 'flex', alignItems: 'center', color: '#fff', fontWeight: 500, fontSize: '0.95rem', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="#fff"/><path d="M4 8l8 5 8-5" stroke="#229ED9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="8" width="16" height="8" rx="2" stroke="#229ED9" strokeWidth="2"/></svg>
              swingleofy@gmail.com
            </div>
          </div>
        </div>
      )}
      {/* Terms & Condition Modal */}
      {showTermsModal && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '120px', margin: '0 auto', zIndex: 30, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(20,20,30,0.98)', border: '1px solid #333', borderRadius: '0.75rem', padding: '1.1rem 1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', minWidth: '320px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.7rem', alignItems: 'flex-start', position: 'relative' }}>
            <button onClick={() => setShowTermsModal(false)} style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 700 }}>&times;</button>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span role="img" aria-label="doc">📄</span> 1. Terms & Conditions
            </div>
            <div style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '1rem' }}>
              <b>Terms & Conditions</b><br/>
              By accessing and using this website ("Platform"), you agree to be bound by the following Terms and Conditions. If you do not agree with any part of these terms, please do not use the platform.<br/><br/>
              <b>1. Educational Purpose Only</b><br/>
              All tools, scanners, content, and community discussions on this platform are provided strictly for educational and informational purposes. We are not SEBI-registered advisors or research analysts. No content should be interpreted as investment advice.<br/><br/>
              <b>2. No Liability</b><br/>
              The use of any tool, strategy, or setup presented here is entirely at your own risk. The platform and its owners are not liable for any direct, indirect, or incidental losses resulting from the use of any information, tool, or discussion available here.<br/><br/>
              <b>3. Payments & Access</b><br/>
              All subscription or product fees are charged in exchange for access to educational tools and content. You are paying for access to scanners, trading journals, calculators, and community — not for tips, buy/sell advice, or profit guarantees.<br/><br/>
              <b>4. No Refund Policy</b><br/>
              All purchases are final. No refunds will be provided once access to any paid feature is granted. Please ensure you understand the service before purchasing.<br/><br/>
              <b>5. Community Use</b><br/>
              Users must maintain respectful and legal communication in community sections. Any user found giving financial advice, abusive content, or misleading messages may be removed without warning.<br/><br/>
              <b>6. Intellectual Property</b><br/>
              All content, tools, and materials are protected by copyright. Do not copy, resell, or distribute any proprietary features or content without permission.<br/><br/>
              <b>7. Changes to Terms</b><br/>
              We may update these Terms & Conditions at any time. Continued use of the platform after changes means you agree to the new terms.
            </div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span role="img" aria-label="doc">📄</span> 2. Privacy Policy
            </div>
            <div style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '1rem' }}>
              <b>Privacy Policy</b><br/>
              This Privacy Policy outlines how we collect, use, and protect your information when you use our website and services.<br/><br/>
              <b>1. Information Collection</b><br/>
              We collect basic personal information such as name, email address, and payment details when you sign up or make purchases. We also use cookies and analytics to improve your experience.<br/><br/>
              <b>2. How We Use Your Data</b><br/>
              To provide access to paid tools and services<br/>
              To notify you of updates or new features<br/>
              To improve our website functionality<br/>
              To prevent misuse or fraud<br/><br/>
              <b>3. Data Protection</b><br/>
              Your data is stored securely and is never shared or sold to third parties. We take appropriate technical measures to protect it from unauthorized access.<br/><br/>
              <b>4. Payment Security</b><br/>
              We do not store credit/debit card details. All payments are processed through secure third-party payment gateways.<br/><br/>
              <b>5. Your Rights</b><br/>
              You may request to access, update, or delete your personal data at any time by contacting us.<br/><br/>
              <b>6. Policy Updates</b><br/>
              We may update this Privacy Policy from time to time. Continued use of the site implies acceptance of any revised policy.
            </div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span role="img" aria-label="doc">📄</span> 3. Disclaimer (Already shared, but for completeness)
            </div>
            <div style={{ color: '#fff', fontSize: '0.95rem' }}>
              <b>Disclaimer: Educational Use Only</b><br/>
              All information, scanners, tools, and content provided on this platform are intended for educational and informational purposes only. We are not SEBI-registered advisors. We do not provide investment advice, tips, or signals. Trading in the stock market involves risk, and any decisions based on our content are solely at your own discretion.<br/><br/>
              We do not guarantee any returns or financial outcomes. Use this platform at your own risk. By using the platform, you agree to this disclaimer.
            </div>
          </div>
        </div>
      )}
      {/* About Us Modal */}
      {showAboutModal && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '120px', margin: '0 auto', zIndex: 30, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(20,20,30,0.98)', border: '1px solid #333', borderRadius: '0.75rem', padding: '1.1rem 1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', minWidth: '320px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.7rem', alignItems: 'flex-start', position: 'relative' }}>
            <button onClick={() => setShowAboutModal(false)} style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 700 }}>&times;</button>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span role="img" aria-label="book">📘</span> About Us – The Story Behind Swing-Leofy
            </div>
            <div style={{ color: '#fff', fontSize: '0.95rem' }}>
              Swing-Leofy was born from a trader’s need to simplify, streamline, and succeed in swing trading. What started as a personal project has evolved into a full-fledged platform empowering retail traders with the right mix of tools, technology, and community.<br/><br/>
              We believe that profitable trading isn’t about chasing tips—it’s about following a system, tracking your performance, and staying connected to a like-minded group. That’s exactly what Swing-Leofy delivers.<br/><br/>
              <b>Our mission?</b><br/>
              To equip swing traders with easy-to-use tools, AI insights, and a strong community to grow their capital consistently—with clarity and confidence.<br/><br/>
              Let’s swing smart.<br/>
              Let’s swing together.
            </div>
          </div>
        </div>
      )}
      {/* Our Service Modal */}
      {showServiceModal && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '120px', margin: '0 auto', zIndex: 30, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(20,20,30,0.98)', border: '1px solid #333', borderRadius: '0.75rem', padding: '1.1rem 1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', minWidth: '320px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.7rem', alignItems: 'flex-start', position: 'relative' }}>
            <button onClick={() => setShowServiceModal(false)} style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 700 }}>&times;</button>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span role="img" aria-label="star">🌟</span> Our Services — Trade Smarter with Swing-Leofy
            </div>
            <div style={{ color: '#fff', fontSize: '0.95rem' }}>
              Welcome to Swing-Leofy, where powerful tools meet precision trading. We’ve built everything a swing trader needs — in one clean, intelligent hub.<br/><br/>
              <b>🧭 Free Tools for Every Trader</b><br/>
              <b>📓 Trading Journal</b> – Track your wins, losses, emotions, and strategies. Know what’s working — and what’s not.<br/><br/>
              <b>📊 Setup Tracker</b> – Spot and monitor setups like Rocket Base, VCP, and IPO Base — all from one place.<br/><br/>
              <b>🧮 Smart Calculators</b> – Calculate risk, reward, and position size like a pro — instantly.<br/><br/>
              <b>🚀 Premium Tools for Serious Gains</b><br/>
              <b>🔍 Pro-Level Scanner</b> – Instantly discover high-probability stocks forming powerful swing setups. Let our scanner do the heavy lifting.<br/><br/>
              <b>🧠 Swing-Leo-Analysis (AI Stock Brain)</b> – Get lightning-fast stock analysis powered by AI. Understand trend strength, volatility, and entry zones in seconds.<br/><br/>
              <b>👥 Community Group Access</b> – Trade isn’t a solo game. Join our premium members-only group for real-time ideas, alerts, support, and strategy talks.<br/><br/>
              No noise. No clutter. Just data-backed decisions, clear tools, and one goal — helping you swing trade like a beast.
            </div>
          </div>
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <DarkVeil />
      </div>
      {/* Main Content: Animated Text (left) and Login Form (right) */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', gap: '2vw' }}>
        {/* Animated Text Left Middle */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', height: '100%' }}>
          <RotatingText
            texts={["Your Premium Trading Journal", "Community & Analytics", "Elevate Your Trading", "With SWING-LEOFY"]}
            mainClassName="text-2xl md:text-3xl font-bold text-white"
            staggerFrom={"last"}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2000}
          />
          <div style={{ marginTop: '0.5rem', color: '#fff', fontWeight: 400, fontSize: '1rem', letterSpacing: '0.01em', textAlign: 'right', maxWidth: '350px' }}>
            Welcome to SWING-LEOFY! Connect with us for support or inquiries.
          </div>
        </div>
        {/* Login Form Right */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', height: '100%' }}>
          <div style={{ width: '100%' }}>
            <Card className="w-full max-w-md glass-effect shine-animation">
              <CardHeader className="text-center">
                <Crown className="mx-auto mb-2 w-10 h-10 text-white" />
                <CardTitle className="text-3xl font-bold text-white">SWING-LEOFY</CardTitle>
                <CardDescription className="text-gray-300">Your Premium Trading Journal & Community</CardDescription>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="signin" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3 bg-card-bg border border-gray-600">
                    <TabsTrigger value="signin" className="btn-animated text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="btn-animated text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700">Sign Up</TabsTrigger>
                    <TabsTrigger value="admin" className="btn-animated text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700">Admin</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="bg-card-bg border-gray-600 pl-10 focus:border-gray-400 text-white placeholder:text-gray-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-300">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="bg-card-bg border-gray-600 pl-10 focus:border-gray-400 text-white placeholder:text-gray-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="link"
                          className="text-gray-400 hover:text-white p-0 h-auto"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Forgot Password?
                        </Button>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold btn-animated"
                        disabled={loading}
                      >
                        {loading ? 'Signing In...' : 'Sign In'}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            id="fullName"
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                            className="bg-card-bg border-gray-600 pl-10 focus:border-gray-400 text-white placeholder:text-gray-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-gray-300">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="bg-card-bg border-gray-600 pl-10 focus:border-gray-400 text-white placeholder:text-gray-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-gray-300">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="bg-card-bg border-gray-600 pl-10 focus:border-gray-400 text-white placeholder:text-gray-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold btn-animated"
                        disabled={loading}
                      >
                        {loading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="admin">
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div className="flex justify-center mb-4">
                        <Shield className="w-8 h-8 text-gray-300" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="admin-username" className="text-gray-300">Username</Label>
                        <Input
                          id="admin-username"
                          type="text"
                          placeholder="Enter admin username"
                          value={adminCredentials.username}
                          onChange={(e) => setAdminCredentials(prev => ({ ...prev, username: e.target.value }))}
                          className="bg-card-bg border-gray-600 focus:border-gray-400 text-white placeholder:text-gray-500"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="admin-password" className="text-gray-300">Password</Label>
                        <Input
                          id="admin-password"
                          type="password"
                          placeholder="Enter admin password"
                          value={adminCredentials.password}
                          onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                          className="bg-card-bg border-gray-600 focus:border-gray-400 text-white placeholder:text-gray-500"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="admin-masterkey" className="text-gray-300">Master Key</Label>
                        <Input
                          id="admin-masterkey"
                          type="password"
                          placeholder="Enter master key"
                          value={adminCredentials.masterKey}
                          onChange={(e) => setAdminCredentials(prev => ({ ...prev, masterKey: e.target.value }))}
                          className="bg-card-bg border-gray-600 focus:border-gray-400 text-white placeholder:text-gray-500"
                          required
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold btn-animated"
                        disabled={loading}
                      >
                        {loading ? 'Authenticating...' : 'Access Admin Panel'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
