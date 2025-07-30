
import { useState } from 'react';
import { AdminLogin } from './AdminLogin';
import { UserManagement } from './UserManagement';
import { CommunityManagement } from './CommunityManagement';
import { CommunityRequestsManagement } from './CommunityRequestsManagement';
import { AllUsersManagement } from './AllUsersManagement';
import { CommunityPasswordManagement } from './CommunityPasswordManagement';
import { CommunityPostingManagement } from './CommunityPostingManagement';
import { PaymentManagement } from './PaymentManagement';
import { StockScanningSection } from './StockScanningSection';
import { ProScannerSection } from '@/components/Admin/ProScannerSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Shield, Users, MessageSquare, UserPlus, LogOut, UsersIcon, Lock, CreditCard, Search, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('pro-scanner'); // Set default tab to pro-scanner
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-[1500px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold text-white flex items-center">
                <Shield className="w-6 h-6 mr-2 text-blue-400" />
                Admin Panel
              </CardTitle>
              <Button
                onClick={handleLogout} 
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Exit Admin
              </Button>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="pro-scanner" className="space-y-6" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-9 bg-card-bg border border-gray-600">
            <TabsTrigger value="pro-scanner" className="flex items-center gap-2 btn-animated btn-scale text-gray-300 data-[state=active]:text-white">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Pro Scanner</span>
            </TabsTrigger>
            <TabsTrigger value="all-users" className="flex items-center gap-2 btn-animated btn-scale text-gray-300 data-[state=active]:text-white">
              <UsersIcon className="w-4 h-4" />
              <span className="hidden sm:inline">All Users</span>
            </TabsTrigger>
            <TabsTrigger value="user-management" className="flex items-center gap-2 btn-animated btn-scale text-gray-300 data-[state=active]:text-white">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">User Management</span>
            </TabsTrigger>
            <TabsTrigger value="community-management" className="flex items-center gap-2 btn-animated btn-scale text-gray-300 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="community-posting" className="flex items-center gap-2 btn-animated btn-scale text-gray-300 data-[state=active]:text-white">
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Posting Access</span>
            </TabsTrigger>
            <TabsTrigger value="community-requests" className="flex items-center gap-2 btn-animated btn-scale text-gray-300 data-[state=active]:text-white">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Requests</span>
            </TabsTrigger>
            <TabsTrigger value="community-password" className="flex items-center gap-2 btn-animated btn-scale text-gray-300 data-[state=active]:text-white">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Password</span>
            </TabsTrigger>
            <TabsTrigger value="payment-management" className="flex items-center gap-2 btn-animated btn-scale text-gray-300 data-[state=active]:text-white">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="stock-scanning" className="flex items-center gap-2 btn-animated btn-scale text-gray-300 data-[state=active]:text-white">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Stock Scanning</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pro-scanner" className="animate-fadeIn">
            <ProScannerSection />
          </TabsContent>

          <TabsContent value="all-users" className="animate-fadeIn">
            <AllUsersManagement />
          </TabsContent>

          <TabsContent value="user-management" className="animate-fadeIn">
            <UserManagement />
          </TabsContent>

          <TabsContent value="community-management" className="animate-fadeIn">
            <CommunityManagement />
          </TabsContent>

          <TabsContent value="community-posting" className="animate-fadeIn">
            <CommunityPostingManagement />
          </TabsContent>

          <TabsContent value="community-requests" className="animate-fadeIn">
            <CommunityRequestsManagement />
          </TabsContent>

          <TabsContent value="community-password" className="animate-fadeIn">
            <CommunityPasswordManagement />
          </TabsContent>

          <TabsContent value="payment-management" className="animate-fadeIn">
            <PaymentManagement />
          </TabsContent>

          <TabsContent value="stock-scanning" className="animate-fadeIn">
            <StockScanningSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
