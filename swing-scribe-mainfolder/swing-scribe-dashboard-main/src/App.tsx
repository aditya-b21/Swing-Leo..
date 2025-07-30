
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/components/Auth/AuthPage";
import { PasswordResetPage } from "@/components/Auth/PasswordResetPage";
import { Navbar } from "@/components/Layout/Navbar";
import { DashboardTabs } from "@/components/Dashboard/DashboardTabs";
import { AdminPanel } from "@/components/Admin/AdminPanel";
import { TradingBackground } from "@/components/TradingBackground";
import Aurora from '@/components/ui/Aurora';

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

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-x-hidden">
        <Aurora colorStops={["#3A29FF", "#FF94B4", "#FF3232"]} blend={0.5} amplitude={1.0} speed={0.5} />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 z-10"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden">
      <Aurora colorStops={["#3A29FF", "#FF94B4", "#FF3232"]} blend={0.5} amplitude={1.0} speed={0.5} />
      <div className="relative z-10">
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
            <Route path="/reset-password" element={<PasswordResetPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <DashboardTabs />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
