import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Home, BookOpen, Target, Search, Globe, LineChart, Rocket, Calculator, Bot, Brain, PieChart, BarChart3, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Index = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI Based Fundamental Analysis",
      description: "Advanced AI algorithms analyze company fundamentals for better trade decisions",
      color: "bg-blue-600",
    },
    {
      icon: PieChart,
      title: "Advanced Profitable Strategies",
      description: "Proven strategies with high success rates for consistent returns",
      color: "bg-blue-600",
    },
    {
      icon: Home,
      title: "Home Dashboard",
      description: "Clean, simple, and powerful start to your trading journey.",
      color: "bg-blue-600",
    },
    {
      icon: BookOpen,
      title: "Pro Journal",
      description: "Track your trades, refine your strategy, and learn from every move.",
      color: "bg-purple-600",
    },
    {
      icon: Target,
      title: "Setup Tracker",
      description: "Never miss a winning setup with organized, easy-to-follow tracking.",
      color: "bg-green-600",
    },
    {
      icon: Search,
      title: "Smart Scanner",
      description: "Find high-probability stocks instantly with AI-powered filters.",
      color: "bg-red-600",
    },
    {
      icon: Users,
      title: "Community",
      description: "Connect, share, and grow with like-minded traders.",
      color: "bg-orange-600",
    },
    {
      icon: BarChart3,
      title: "Sector Rotation Tool",
      description: "Spot money flow between sectors for better market timing.",
      color: "bg-teal-600",
    },
    {
      icon: Rocket,
      title: "LIVE Sector Rotation & Stock Data",
      description: "Real-time insights, real trading advantage.",
      color: "bg-pink-600",
    },
    {
      icon: Calculator,
      title: "Trading Calculator",
      description: "Manage risk & reward with precision.",
      color: "bg-yellow-600",
    },
    {
      icon: Bot,
      title: "LEO AI",
      description: "Your personal AI-powered swing trading assistant.",
      color: "bg-indigo-600",
    },
  ];

  const mainFeatures = features.filter(f => ["LEO AI", "Pro Journal", "Community"].includes(f.title));
  const otherFeatures = features.filter(f => !["LEO AI", "Pro Journal", "Community"].includes(f.title));

  return (
    <div className="flex-1 p-8 pt-6 space-y-4 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-4xl w-full text-center">
        {user && (
          <div className="mb-4 p-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-200">Welcome back,</p>
              <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{profile?.full_name || user.email}</p>
            </div>
            {profile?.is_community_member && (
              <span className="text-xs bg-[#34d399]/20 text-[#34d399] px-2 py-1 rounded-full inline-block">
                Community Member
              </span>
            )}
          </div>
        )}
        {/* <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-500 text-sm font-semibold">Premium Active</span>
        </div> */}
        <h1 className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-[#2c004f] via-[#5a009f] to-[#0f0c29] text-transparent bg-clip-text leading-tight mb-4 drop-shadow-lg">
          WELCOME, LEO <br />BECOME THE LEO OF SWING TRADING
        </h1>
        <p className="text-xl text-gray-700 font-medium mb-8">
          Join Now. Dominate the Charts. 📊
        </p>
        {/* <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto hidden">
          Access your premium tools, live workshops, and exclusive trading insights
        </p> */}
        {/* <div className="flex justify-center space-x-4 mt-6">
          <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-3 rounded-lg text-lg shadow-lg flex items-center hover:from-gray-900 hover:to-black">
            <Home className="mr-2 h-5 w-5" /> Home
          </Button>
          <Button onClick={() => navigate('/journal-pro')} variant="outline" className="border-gray-700 text-gray-700 hover:bg-gray-100/10 px-6 py-3 rounded-lg text-lg shadow-lg flex items-center">
            <BookOpen className="mr-2 h-5 w-5" /> Journal
          </Button>
        </div> */}

        {/* Existing statistics section removed */}
        {/* <div className="mt-12 text-left space-y-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Features to help you dominate:</h2>
          <ul className="space-y-3">
            <li className="flex items-center text-lg text-gray-800">
              <span className="mr-3 text-2xl">🏠</span> Home Dashboard – Clean, simple, and powerful start to your trading journey.
            </li>
            <li className="flex items-center text-lg text-gray-800">
              <span className="mr-3 text-2xl">📓</span> Pro Journal – Track your trades, refine your strategy, and learn from every move.
            </li>
            <li className="flex items-center text-lg text-gray-800">
              <span className="mr-3 text-2xl">🎯</span> Setup Tracker – Never miss a winning setup with organized, easy-to-follow tracking.
            </li>
            <li className="flex items-center text-lg text-gray-800">
              <span className="mr-3 text-2xl">🔍</span> Smart Scanner – Find high-probability stocks instantly with AI-powered filters.
            </li>
            <li className="flex items-center text-lg text-gray-800">
              <span className="mr-3 text-2xl">🌐</span> Community – Connect, share, and grow with like-minded traders.
            </li>
            <li className="flex items-center text-lg text-gray-800">
              <span className="mr-3 text-2xl">📈</span> Sector Rotation Tool – Spot money flow between sectors for better market timing.
            </li>
            <li className="flex items-center text-lg text-gray-800">
              <span className="mr-3 text-2xl">🚀</span> LIVE Sector Rotation & Stock Data – Real-time insights, real trading advantage.
            </li>
            <li className="flex items-center text-lg text-gray-800">
              <span className="mr-3 text-2xl">🧮</span> Trading Calculator – Manage risk & reward with precision.
            </li>
            <li className="flex items-center text-lg text-gray-800">
              <span className="mr-3 text-2xl">🤖</span> LEO AI – Your personal AI-powered swing trading assistant.
            </li>
          </ul>
        </div> */}

        {/* Main Features Section */}
        <div className="mt-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Key Features:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mainFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center space-y-4 border border-gray-200"
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className={`${feature.color} rounded-full p-3`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center">{feature.title}</h3>
                  <p className="text-center text-gray-600 text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Other Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {otherFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center space-y-4 border border-gray-200"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className={`${feature.color} rounded-full p-3`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center">{feature.title}</h3>
                <p className="text-center text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
