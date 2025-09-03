
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/components/Auth/AuthPage";
import { PasswordResetPage } from "@/components/Auth/PasswordResetPage";
import { LeftNavbar } from "@/components/Layout/LeftNavbar"; // Import LeftNavbar
import { DashboardTabs } from "@/components/Dashboard/DashboardTabs";
import { AdminPanel } from "@/components/Admin/AdminPanel";
import { ProJournalModal } from "@/components/Journal/ProJournalModal"; // Import ProJournalModal
import Orb from '@/components/Orb/Orb'; // Import Orb component
import '@/components/Orb/Orb.css'; // Import Orb CSS
import Aurora from '@/components/ui/Aurora'; // Re-import Aurora
import { useState, useEffect } from 'react'; // Import useState and useEffect
import { useLocation } from 'react-router-dom'; // Import useLocation
import { LeoAiModal } from '@/components/LeoAi/LeoAiModal'; // Import LeoAiModal
import Index from '@/pages/Index'; // Import the Index component
import { LiveSectorRotationModal } from '@/components/Modals/LiveSectorRotationModal'; // Import LiveSectorRotationModal
import { LiveStockDataModal } from '@/components/Modals/LiveStockDataModal'; // Import LiveStockDataModal

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900/20 to-blue-900/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation(); // Keep useLocation here
  const [showProJournalModal, setShowProJournalModal] = useState(false); // New state for ProJournalModal
  const [isNavbarOpen, setIsNavbarOpen] = useState(true); // State for LeftNavbar open/close
  const [showLiveSectorRotationModal, setShowLiveSectorRotationModal] = useState(false); // New state for LiveSectorRotationModal
  const [showLiveStockDataModal, setShowLiveStockDataModal] = useState(false); // New state for LiveStockDataModal
  // const [showLeoAiModal, setShowLeoAiModal] = useState(false); // Removed state for LeoAiModal

  const handleOpenProJournal = () => {
    setShowProJournalModal(true);
  };

  const handleCloseProJournal = () => {
    setShowProJournalModal(false);
  };

  const handleOpenLiveSectorRotation = () => {
    setShowLiveSectorRotationModal(true);
  };

  const handleCloseLiveSectorRotation = () => {
    setShowLiveSectorRotationModal(false);
  };

  const handleOpenLiveStockData = () => {
    setShowLiveStockDataModal(true);
  };

  const handleCloseLiveStockData = () => {
    setShowLiveStockDataModal(false);
  };

  // Removed handleOpenLeoAi function
  // Removed handleCloseLeoAi function

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-x-hidden">
        <Aurora colorStops={["#3A29FF", "#FF94B4", "#FF3232"]} blend={0.5} amplitude={1.0} speed={0.5} /> {/* Re-add Aurora to loading state */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 z-10"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden flex">
      <div className="fixed inset-0 z-0">
        <Orb
          hoverIntensity={0.5}
          rotateOnHover={true}
          hue={0}
          forceHoverState={false}
        />
      </div>
      <div className="relative z-10 flex flex-1">
        {user && location.pathname !== '/auth' && location.pathname !== '/reset-password' && (
          <LeftNavbar
            onOpenProJournal={handleOpenProJournal}
            onOpenLiveSectorRotation={handleOpenLiveSectorRotation}
            onOpenLiveStockData={handleOpenLiveStockData}
            isOpen={isNavbarOpen}
            setIsOpen={setIsNavbarOpen}
          />
        )}
        <div className="flex-1 flex flex-col"
             style={{ marginLeft: user && location.pathname !== '/auth' && location.pathname !== '/reset-password' ? (isNavbarOpen ? "200px" : "60px") : "0px" }}>
          <Routes>
            <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
            <Route path="/reset-password" element={<PasswordResetPage />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            {/* Removed /journal-pro route */}
            <Route path="/leo-ai" element={<ProtectedRoute><LeoAiModal /></ProtectedRoute>} /> {/* New route for LEO Ai Modal */}
            {/* Removed the LiveSectorRotationDisplay route */}
            {/* Removed the LiveStockData route */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            {/* Removed /setups route */}
            <Route path="/scanner" element={<ProtectedRoute><DashboardTabs activeTab="scanner" /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><DashboardTabs activeTab="community" /></ProtectedRoute>} />
            <Route path="/performance" element={<ProtectedRoute><DashboardTabs activeTab="dashboard" /></ProtectedRoute>} />
            <Route path="/calculator" element={<ProtectedRoute><DashboardTabs activeTab="calculator" /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {showProJournalModal && <ProJournalModal onClose={handleCloseProJournal} />} {/* Conditionally render ProJournalModal */}
        {showLiveSectorRotationModal && <LiveSectorRotationModal onClose={handleCloseLiveSectorRotation} />} {/* Conditionally render LiveSectorRotationModal */}
        {showLiveStockDataModal && <LiveStockDataModal onClose={handleCloseLiveStockData} />} {/* Conditionally render LiveStockDataModal */}
        {/* {showLeoAiModal && <LeoAiModal onClose={handleCloseLeoAi} />} Removed LeoAiModal rendering */}
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner richColors />
        <Toaster />
        <BrowserRouter> {/* BrowserRouter added here */}
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
