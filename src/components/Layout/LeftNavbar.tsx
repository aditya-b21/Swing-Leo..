import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { BookOpen, Search, MessageSquare, BarChart3, Calculator, Shield, LogOut, Bot, Home } from 'lucide-react';
import RocketIcon from '@/components/RocketIcon'; // Assuming RocketIcon is also needed
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion"; // Import motion
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react'; // Import icons
import { useState } from 'react';

interface LeftNavbarProps {
  onOpenProJournal: () => void; // New prop for opening ProJournal modal
  onOpenLiveSectorRotation: () => void; // New prop for opening Live Sector Rotation modal
  onOpenLiveStockData: () => void; // New prop for opening Live Stock Data modal
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function LeftNavbar({ onOpenProJournal, onOpenLiveSectorRotation, onOpenLiveStockData, isOpen, setIsOpen }: LeftNavbarProps) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation(); // Use useLocation to get the current path
  // const [isOpen, setIsOpen] = useState(true); // State for sidebar open/close
  const [showSectorRotationSubButtons, setShowSectorRotationSubButtons] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleAdminAccess = () => {
    navigate('/admin');
  };

  const isAdmin = user?.email === 'adityabarod807@gmail.com' || user?.email === 'admin@swingscribe.com';

  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: isOpen ? "200px" : "60px" }}
      transition={{ duration: 0.3 }}
      className="fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-[#0f0c29] via-[#2c004f] to-[#000000] shadow-2xl p-4 flex flex-col rounded-r-2xl"
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        {isOpen && (
          <div className="flex items-center gap-2">
            <RocketIcon className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-xl font-bold text-white tracking-widest">Swing-Leofy</h1>
              <p className="text-xs text-gray-400">Trading Journal & Community</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-white bg-[#2c004f] hover:bg-[#a855f7]/50 w-8 h-8"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {/* {isOpen && user && (
        <div className="mb-4 p-2 bg-[#0f0c29] rounded-lg border border-[#2c004f] shadow-inner">
          <p className="text-sm text-gray-200">Welcome back,</p>
          <p className="text-base font-semibold text-white truncate">{profile?.full_name || user.email}</p>
          {profile?.is_community_member && (
            <span className="text-xs bg-[#34d399]/20 text-[#34d399] px-2 py-1 rounded-full mt-2 inline-block">
              Community Member
            </span>
          )}
        </div>
      )} */}

      <nav className="flex-1 space-y-2 overflow-y-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden w-full ${isActive ? "bg-gradient-to-r from-[#E0E0E0] to-[#C0C0C0] text-[#0f0c29] shadow-lg" : "text-gray-200 hover:text-white hover:bg-[#a855f7]/50"}`
          }
        >
          <Home className="w-4 h-4" />
          {isOpen && "Home"}
          {({ isActive }) =>
            isActive && isOpen && (
              <motion.div
                layoutId="activeGlow"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#A8A8A8]/40 to-[#E0E0E0]/40 backdrop-blur-md"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )
          }
        </NavLink>
        <Button
          onClick={onOpenProJournal}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden w-full bg-gradient-to-r from-[#E0E0E0] to-[#C0C0C0] text-[#0f0c29] shadow-lg hover:from-[#C0C0C0] hover:to-[#E0E0E0]"
        >
          <BookOpen className="w-4 h-4" />
          {isOpen && "Pro Journal"}
        </Button>
        <NavLink
          to="/scanner"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden w-full ${isActive ? "bg-gradient-to-r from-[#E0E0E0] to-[#C0C0C0] text-[#0f0c29] shadow-lg" : "text-gray-200 hover:text-white hover:bg-[#a855f7]/50"}`
          }
        >
          <Search className="w-4 h-4" />
          {isOpen && "Scanner"}
          {({ isActive }) =>
            isActive && isOpen && (
              <motion.div
                layoutId="activeGlow"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#A8A8A8]/40 to-[#E0E0E0]/40 backdrop-blur-md"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )
          }
        </NavLink>
        <NavLink
          to="/community"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden w-full ${isActive ? "bg-gradient-to-r from-[#E0E0E0] to-[#C0C0C0] text-[#0f0c29] shadow-lg" : "text-gray-200 hover:text-white hover:bg-[#a855f7]/50"}`
          }
        >
          <MessageSquare className="w-4 h-4" />
          {isOpen && "Community"}
          {({ isActive }) =>
            isActive && isOpen && (
              <motion.div
                layoutId="activeGlow"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#A8A8A8]/40 to-[#E0E0E0]/40 backdrop-blur-md"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )
          }
        </NavLink>
        <Button
          onClick={() => setShowSectorRotationSubButtons(!showSectorRotationSubButtons)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden w-full ${showSectorRotationSubButtons ? "bg-gradient-to-r from-[#E0E0E0] to-[#C0C0C0] text-[#0f0c29] shadow-lg" : "text-gray-200 hover:text-white hover:bg-[#a855f7]/50"}`}
        >
          <BarChart3 className="w-4 h-4" />
          {isOpen && "Sector Rotation"}
        </Button>
        {showSectorRotationSubButtons && (
          <div className="ml-4 space-y-1">
            <Button
              onClick={onOpenLiveSectorRotation}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden w-full text-gray-200 hover:text-white hover:bg-[#a855f7]/50 flex-col items-start h-auto justify-center`}
            >
              {isOpen && (
                <div className="flex flex-col items-start">
                  <span>LIVE SECTOR</span>
                  <span>ROTATION</span>
                </div>
              )}
            </Button>
            <Button
              onClick={onOpenLiveStockData}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden w-full text-gray-200 hover:text-white hover:bg-[#a855f7]/50`}
            >
              {isOpen && "LIVE STOCK DATA"}
            </Button>
          </div>
        )}
        <NavLink
          to="/calculator"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden w-full ${isActive ? "bg-gradient-to-r from-[#E0E0E0] to-[#C0C0C0] text-[#0f0c29] shadow-lg" : "text-gray-200 hover:text-white hover:bg-[#a855f7]/50"}`
          }
        >
          <Calculator className="w-4 h-4" />
          {isOpen && "Calculator"}
          {({ isActive }) =>
            isActive && isOpen && (
              <motion.div
                layoutId="activeGlow"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#A8A8A8]/40 to-[#E0E0E0]/40 backdrop-blur-md"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )
          }
        </NavLink>
        <NavLink
          to="/leo-ai"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden w-full ${isActive ? "bg-gradient-to-r from-[#a855f7] to-[#d946ef] text-white shadow-lg" : "text-gray-200 hover:text-white hover:bg-[#a855f7]/50"}`
          }
        >
          <Bot className="w-4 h-4" />
          {isOpen && "LEO Ai"}
          {({ isActive }) =>
            isActive && isOpen && (
              <motion.div
                layoutId="activeGlow"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#d946ef]/40 to-[#a855f7]/40 backdrop-blur-md"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )
          }
        </NavLink>
      </nav>

      {isOpen && (
        <div className="space-y-1">
          {isAdmin && (
            <Button
              onClick={handleAdminAccess}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-gradient-to-r from-[#E0E0E0] to-[#C0C0C0] text-[#0f0c29] shadow-lg font-medium transition-all text-sm hover:from-[#C0C0C0] hover:to-[#E0E0E0]"
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </Button>
          )}
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-red-700/20 text-red-300 font-medium transition-colors duration-200 hover:bg-red-600/30 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      )}

      {isOpen && (
        <div className="mt-auto text-center text-xs text-gray-400 pt-2">
          © 2025 Swing-Leofy
        </div>
      )}
    </motion.div>
  );
}
