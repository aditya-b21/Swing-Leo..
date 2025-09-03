
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradeJournal } from '@/components/TradeJournal/TradeJournal';
import { SetupTracker } from '@/components/SetupTracker/SetupTracker';
import { WeeklyDashboard } from '@/components/Dashboard/WeeklyDashboard';
import { TradingCalculator } from '@/components/Calculator/TradingCalculator';
import { CommunitySection } from '@/components/Community/CommunitySection';
import { ScannerSection } from '@/components/Scanner/ScannerSection';
// import { BookOpen, Target, BarChart3, Calculator, MessageSquare, Search } from 'lucide-react'; // Removed as icons are now in LeftNavbar

interface DashboardTabsProps {
  activeTab: string;
}

export function DashboardTabs({ activeTab }: DashboardTabsProps) {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Tabs value={activeTab} className="w-full">
        {/* TabsList removed as navigation is now handled by LeftNavbar */}

        {/* TradeJournal content is now at /journal-pro */}
        {/* <TabsContent value="journal" className="mt-6">
          <TradeJournal />
        </TabsContent> */}

        <TabsContent value="setups" className="mt-6">
          <SetupTracker />
        </TabsContent>

        <TabsContent value="scanner" className="mt-6">
          <ScannerSection />
        </TabsContent>

        <TabsContent value="community" className="mt-6">
          <CommunitySection />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <WeeklyDashboard />
        </TabsContent>

        <TabsContent value="calculator" className="mt-6">
          <TradingCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
