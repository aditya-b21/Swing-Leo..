
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, Shield, ArrowLeft, BookOpen, Bot, LineChart, Search, History, Bell, List, Users, Crown, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AuthModal from './AuthModal'; // Import the new AuthModal component
import Lightning from '../Lightning/Lightning'; // Import the Lightning component
import '../Lightning/Lightning.css'; // Import the Lightning CSS

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false); // New state for auth modal
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false); // New state for Learn More modal

    return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
        <Lightning
          hue={220}
          xOffset={0}
          speed={0.5}
          intensity={1}
          size={0.7}
        />
      </div>
      <div className="relative z-10">
      <div className="container">
          <header className="flex-col sm:flex-row">
          <div className="logo">
            <div className="logo-icon"><Crown /></div>
            <div className="logo-text">SWING-LEOFY</div>
          </div>
            <div className="nav-buttons flex-col sm:flex-row">
              <button className="btn btn-outline py-2 px-4 text-base sm:py-1 sm:px-2 sm:text-sm" onClick={() => setShowAuthModal(true)}>Login</button>
              <button className="btn btn-primary py-2 px-4 text-base sm:py-1 sm:px-2 sm:text-sm" onClick={() => setShowAuthModal(true)}>JOIN NOW</button>
              <button className="btn btn-outline py-2 px-4 text-base sm:py-1 sm:px-2 sm:text-sm" onClick={() => setShowLearnMoreModal(true)}>LEARN MORE</button> {/* Moved Learn More button */}
          </div>
        </header>
        
        <section className="hero">
            <h1 className="text-4xl sm:text-5xl">Welcome to SWING-LEOFY</h1>
            <h2 className="text-xl sm:text-2xl">The Leo of Swing Trade <Crown style={{ color: '#f59e0b' }} className="inline-block align-middle w-6 h-6"/></h2>
            <p className="text-base sm:text-lg">Access your trading journal, premium tools, and community insights.</p>
            <button className="btn btn-primary py-2 px-4 text-base sm:py-1 sm:px-2 sm:text-sm" onClick={() => setShowAuthModal(true)}>GET STARTED</button>
          
          <div className="divider"></div>
          
          <h1 className="section-title">Unlock Your Trading Potential</h1>
        </section>
        
          <section className="features grid-cols-1 sm:grid-cols-3">
          <div className="feature-card">
            <div className="feature-icon"><BookOpen /></div>
            <h3 className="feature-title">Professional Trading Journal</h3>
            <p className="feature-desc">Track trades, P&L, notes, screenshots, and performance analytics with our advanced journaling system.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon"><Bot /></div>
            <h3 className="feature-title">LEO AI – Dual Chatbots</h3>
            <p className="feature-desc">Two smart assistants for strategy development, risk management, and market Q&A with real-time insights.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon"><LineChart /></div>
            <h3 className="feature-title">Live Market + Sector Rotation</h3>
            <p className="feature-desc">Real-time data streams with heatmaps and smart sector flow analysis to identify market trends.</p>
          </div>
        </section>
        
        <section className="ai-section">
          <h2 className="ai-title">AI Algo Scanner</h2>
          <p className="ai-desc">Detect high-probability setups with ATR, EMA, RSI & volatility logic. Our advanced algorithms scan the market 24/7 to find the best opportunities.</p>
          
            <div className="features grid-cols-1">
            <div className="feature-card">
              <div className="feature-icon"><Search /></div>
              <h3 className="feature-title">Stock Screener</h3>
              <p className="feature-desc">Advanced stock screening with 100+ technical and fundamental filters to identify profitable trading opportunities.</p>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="section-title">And many more powerful features...</h2>
          
            <div className="more-features grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="more-feature">
              <div className="more-feature-icon"><History /></div>
              <h3 className="more-feature-title">Backtests</h3>
              <p className="more-feature-desc">Test your strategies against historical data to optimize performance.</p>
            </div>
            
            <div className="more-feature">
              <div className="more-feature-icon"><Bell /></div>
              <h3 className="more-feature-title">Alerts</h3>
              <p className="more-feature-desc">Get notified when your criteria are met with customizable alerts.</p>
            </div>
            
            <div className="more-feature">
              <div className="more-feature-icon"><List /></div>
              <h3 className="more-feature-title">Watchlists</h3>
              <p className="more-feature-desc">Organize and track your favorite stocks with custom watchlists.</p>
      </div>

            <div className="more-feature">
              <div className="more-feature-icon"><Users /></div>
              <h3 className="more-feature-title">Community Rooms</h3>
              <p className="more-feature-desc">Connect with other traders, share ideas, and learn from experts.</p>
            </div>
        </div>
        </section>
        
          <section className="cta-section py-8 px-4 sm:py-16 sm:px-6">
            <h2 className="cta-title text-2xl sm:text-4xl">Ready to Transform Your Trading?</h2>
            <p className="cta-desc text-base sm:text-lg">Join thousands of successful traders who are already using SWING-LEOFY to maximize their profits and minimize risks.</p>
          <button className="btn btn-primary" onClick={() => setShowAuthModal(true)}>START YOUR FREE TRIAL</button>
        </section>
        
          <footer className="text-center py-8 px-4 sm:px-6">
            <p>© 2025 SWING-LEOFY. All rights reserved.</p>
            <p>The Leo of Swing Trade this <Rocket className="inline-block align-middle w-4 h-4"/></p>
            <div className="footer-links mt-4 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-6">
              <button className="text-gray-400 hover:text-white transition-colors duration-200" onClick={() => setShowContactModal(true)}>CONTACT</button>
              <button className="text-gray-400 hover:text-white transition-colors duration-200" onClick={() => setShowAboutModal(true)}>ABOUT US</button>
              <button className="text-gray-400 hover:text-white transition-colors duration-200" onClick={() => setShowTermsModal(true)}>TERMS & CONDITION</button>
              <button className="text-gray-400 hover:text-white transition-colors duration-200" onClick={() => setShowServiceModal(true)}>OUR SERVICE</button>
            </div>
        </footer>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-blue-bg bg-opacity-90 backdrop-blur-lg animate-fade-in">
          <div className="bg-dark-blue-card bg-opacity-95 border border-primary-purple rounded-2xl p-8 shadow-2xl relative w-full max-w-xl text-center">
            <button onClick={() => setShowContactModal(false)} className="absolute top-4 right-4 text-text-light hover:text-text-medium text-3xl font-bold transition-colors duration-200">&times;</button>
            <h2 className="text-3xl font-bold mb-5 text-text-light">Get in Touch</h2>
            <p className="text-lg text-text-medium mb-6">We'd love to hear from you!</p>
            <a href="https://t.me/SwingLeofyin" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-primary-blue hover:text-primary-purple transition-colors duration-200 font-semibold text-lg gap-3 mb-4">
              <svg width="24" height="24" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="120" cy="120" r="120" fill="#229ED9"/><path d="M53 120.5l54.5 22.5 22.5 54.5 54.5-154.5-131.5 77.5z" fill="#fff"/><path d="M53 120.5l54.5 22.5 22.5 54.5 54.5-154.5-131.5 77.5z" fill="#fff" fillOpacity=".2"/></svg>
              Join us on Telegram
            </a>
            <div className="flex items-center justify-center text-text-light font-semibold text-lg gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="#fff"/><path d="M4 8l8 5 8-5" stroke="#229ED9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="8" width="16" height="8" rx="2" stroke="#229ED9" strokeWidth="2"/></svg>
              swingleofy@gmail.com
            </div>
          </div>
        </div>
      )}
      {/* Terms & Condition Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-blue-bg bg-opacity-90 backdrop-blur-lg animate-fade-in">
          <div className="bg-dark-blue-card bg-opacity-95 border border-primary-purple rounded-2xl p-8 shadow-2xl relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowTermsModal(false)} className="absolute top-4 right-4 bg-transparent border-none text-text-light hover:text-text-medium text-3xl cursor-pointer font-bold transition-colors duration-200">&times;</button>
            <h2 className="text-3xl font-bold mb-5 text-text-light">Terms & Conditions</h2>
            <div className="text-text-medium text-base leading-relaxed space-y-5">
              <p>
                <b>Terms & Conditions</b><br/>
                By accessing and using this website ("Platform"), you agree to be bound by the following Terms and Conditions. If you do not agree with any part of these terms, please do not use the platform.
              </p>
              <p>
                <b>1. Educational Purpose Only</b><br/>
                All tools, scanners, content, and community discussions on this platform are provided strictly for educational and informational purposes. We are not SEBI-registered advisors or research analysts. No content should be interpreted as investment advice.
              </p>
              <p>
                <b>2. No Liability</b><br/>
                The use of any tool, strategy, or setup presented here is entirely at your own risk. The platform and its owners are not liable for any direct, indirect, or incidental losses resulting from the use of any information, tool, or discussion available here.
              </p>
              <p>
                <b>3. Payments & Access</b><br/>
                All subscription or product fees are charged in exchange for access to educational tools and content. You are paying for access to scanners, trading journals, calculators, and community — not for tips, buy/sell advice, or profit guarantees.
              </p>
              <p>
                <b>4. No Refund Policy</b><br/>
                All purchases are final. No refunds will be provided once access to any paid feature is granted. Please ensure you understand the service before purchasing.
              </p>
              <p>
                <b>5. Community Use</b><br/>
                Users must maintain respectful and legal communication in community sections. Any user found giving financial advice, abusive content, or misleading messages may be removed without warning.
              </p>
              <p>
                <b>6. Intellectual Property</b><br/>
                All content, tools, and materials are protected by copyright. Do not copy, resell, or distribute any proprietary features or content without permission.
              </p>
              <p>
                <b>7. Changes to Terms</b><br/>
                We may update these Terms & Conditions at any time. Continued use of the platform after changes means you agree to the new terms.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* About Us Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-blue-bg bg-opacity-90 backdrop-blur-lg animate-fade-in">
          <div className="bg-dark-blue-card bg-opacity-95 border border-primary-purple rounded-2xl p-8 shadow-2xl relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAboutModal(false)} className="absolute top-4 right-4 bg-transparent border-none text-text-light hover:text-text-medium text-3xl cursor-pointer font-bold transition-colors duration-200">&times;</button>
            <h2 className="text-3xl font-bold mb-5 text-text-light">About Us – The Story Behind Swing-Leofy</h2>
            <div className="text-text-medium text-base leading-relaxed space-y-5">
              <p>
                Swing-Leofy was born from a trader’s need to simplify, streamline, and succeed in swing trading. What started as a personal project has evolved into a full-fledged platform empowering retail traders with the right mix of tools, technology, and community.
              </p>
              <p>
                We believe that profitable trading isn’t about chasing tips—it’s about following a system, tracking your performance, and staying connected to a like-minded group. That’s exactly what Swing-Leofy delivers.
              </p>
              <p>
                <b>Our mission?</b><br/>
                To equip swing traders with easy-to-use tools, AI insights, and a strong community to grow their capital consistently—with clarity and confidence.
              </p>
              <p>
                Let’s swing smart.<br/>
                Let’s swing together.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Our Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-blue-bg bg-opacity-90 backdrop-blur-lg animate-fade-in">
          <div className="bg-dark-blue-card bg-opacity-95 border border-primary-purple rounded-2xl p-8 shadow-2xl relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowServiceModal(false)} className="absolute top-4 right-4 bg-transparent border-none text-text-light hover:text-text-medium text-3xl cursor-pointer font-bold transition-colors duration-200">&times;</button>
            <h2 className="text-3xl font-bold mb-5 text-text-light">Our Services — Trade Smarter with Swing-Leofy</h2>
            <div className="text-text-medium text-base leading-relaxed space-y-5">
              <p>
                Welcome to Swing-Leofy, where powerful tools meet precision trading. We’ve built everything a swing trader needs — in one clean, intelligent hub.
              </p>
              <p>
                <b>🧭 Free Tools for Every Trader</b><br/>
                <b>📓 Trading Journal</b> – Track your wins, losses, emotions, and strategies. Know what’s working — and what’s not.
              </p>
              <p>
                <b>📊 Setup Tracker</b> – Spot and monitor setups like Rocket Base, VCP, and IPO Base — all from one place.
              </p>
              <p>
                <b>🧮 Smart Calculators</b> – Calculate risk, reward, and position size like a pro — instantly.
              </p>
              <p>
                <b>🚀 Premium Tools for Serious Gains</b><br/>
                <b>🔍 Pro-Level Scanner</b> – Instantly discover high-probability stocks forming powerful swing setups. Let our scanner do the heavy lifting.
              </p>
              <p>
                <b>🧠 Swing-Leo-Analysis (AI Stock Brain)</b> – Get lightning-fast stock analysis powered by AI. Understand trend strength, volatility, and entry zones in seconds.
              </p>
              <p>
                <b>👥 Community Group Access</b> – Trade isn’t a solo game. Join our premium members-only group for real-time ideas, alerts, support, and strategy talks.
              </p>
              <p>
                No noise. No clutter. Just data-backed decisions, clear tools, and one goal — helping you swing trade like a beast.
              </p>
            </div>
          </div>
        </div>
      )}
        {/* Auth Modal will go here */}
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />} {/* Conditionally render AuthModal */}

      {/* Learn More Modal */}
      {showLearnMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-blue-bg bg-opacity-90 backdrop-blur-lg animate-fade-in">
          <div className="bg-dark-blue-card bg-opacity-95 border border-primary-purple rounded-2xl p-8 shadow-2xl relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowLearnMoreModal(false)} className="absolute top-4 right-4 bg-transparent border-none text-text-light hover:text-text-medium text-3xl cursor-pointer font-bold transition-colors duration-200">&times;</button>
            <h2 className="text-3xl font-bold mb-5 text-text-light">Swing-Leofy – Ultimate Legal Disclaimer & Terms of Use</h2>
            <div className="text-text-medium text-base leading-relaxed space-y-5">
              <p>
                Swing-Leofy is an educational and informational platform created by a team of partners to share insights, charts, and stock market knowledge strictly for learning, research, and awareness purposes. We are not registered with SEBI or any financial authority, and we do not provide any buy, sell, or investment recommendations.
              </p>
              <p>
                By accessing or using Swing-Leofy, you acknowledge and agree to the following:
              </p>
              <p>
                <b>Educational Use Only:</b> All content, charts, and analysis are for educational purposes only. Swing-Leofy is not a financial advisor, broker, or consultancy.
              </p>
              <p>
                <b>No Investment Advice:</b> We do not provide buy/sell tips, trading signals, or investment recommendations. Any action taken based on our content is entirely at your own risk.
              </p>
              <p>
                <b>No Guarantees:</b> Swing-Leofy does not guarantee profits, returns, or financial outcomes. Past performance of any stock or strategy is not indicative of future results.
              </p>
              <p>
                <b>Non-Refundable:</b> All paid services, subscriptions, courses, or digital products are strictly non-refundable.
              </p>
              <p>
                <b>Original & Protected Content:</b> All content on Swing-Leofy is original, created by our team, and protected under copyright law. All rights are exclusively reserved by Swing-Leofy. We do not sell, share, or distribute your data or our content to any third party.
              </p>
              <p>
                <b>Partnership Structure:</b> The website is operated by multiple partners who act within legal and ethical boundaries.
              </p>
              <p>
                <b>No Liability:</b> Swing-Leofy, its owners, partners, or affiliates are not responsible for any losses, damages, or legal claims arising from the use of this website.
              </p>
              <p>
                <b>User Responsibility:</b> Users are responsible for their own actions. Always conduct independent research before making any financial or trading decisions.
              </p>
              <p>
                <b>Legal Compliance:</b> Swing-Leofy operates strictly within applicable laws. Content is educational, original, and non-copying.
              </p>
              <p>
                <b>Intellectual Property Rights:</b> All text, images, graphics, and digital content are fully owned by Swing-Leofy. Unauthorized copying, redistribution, or commercial use is strictly prohibited.
              </p>
              <p>
                By using Swing-Leofy, you accept all terms above, acknowledge that the platform is for educational purposes only, and agree that your use is at your own risk. All rights are reserved exclusively by Swing-Leofy.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
