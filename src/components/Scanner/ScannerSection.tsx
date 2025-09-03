
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, Rocket, ArrowLeft, CreditCard, MessageCircle } from 'lucide-react';
import { AIChatbot } from './AIChatbot';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { StockData } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { PaymentModal } from '@/components/Payment/PaymentModal';

type SetupType = 'VCP' | 'Rocket' | 'IPO';

interface SetupStockList {
  id: string;
  setup_type: SetupType;
  stocks: StockData[];
  updated_at: string;
  updated_by: string;
}

export function ScannerSection() {
  const [activeScanner, setActiveScanner] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showSwingLeoAnalysis, setShowSwingLeoAnalysis] = useState(false);

  // Fetch stock lists
  const { data: stockLists, isLoading, error } = useQuery<SetupStockList[]>({
    queryKey: ['setup_stocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('setup_stock_lists')
        .select('*');

      if (error) {
        console.error('Error fetching stock lists:', error);
        throw error;
      }

      // Process each setup's stocks to remove expired ones and sort by date
      const processedData = data?.map(setup => {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        console.log('Filtering stocks older than:', tenDaysAgo.toISOString());

        // Filter out stocks older than 10 days and sort by uploadDate
        const filteredAndSortedStocks = setup.stocks
          .filter(stock => {
            const stockDate = stock.uploadDate ? new Date(stock.uploadDate) : null;
            const isValid = stockDate ? stockDate > tenDaysAgo : false;
            
            if (!isValid) {
              console.log('Removing expired stock:', {
                symbol: stock.symbol,
                uploadDate: stock.uploadDate,
                age: stockDate ? Math.floor((Date.now() - stockDate.getTime()) / (1000 * 60 * 60 * 24)) : 'unknown',
                days: 'days'
              });
            }
            
            return isValid;
          })
          .sort((a, b) => {
            const dateA = new Date(a.uploadDate || 0);
            const dateB = new Date(b.uploadDate || 0);
            return dateB.getTime() - dateA.getTime(); // Sort descending (newest first)
          });

        console.log(`${setup.setup_type}: Filtered ${setup.stocks.length} stocks to ${filteredAndSortedStocks.length} stocks`);

        return {
          ...setup,
          stocks: filteredAndSortedStocks
        };
      }) || [];

      return processedData;
    }
  });

  // Map scanner IDs to setup types
  const getSetupType = (scannerId: string): SetupType => {
    const setupMap: Record<string, SetupType> = {
      'vcp': 'VCP',
      'rocket': 'Rocket',
      'ipo': 'IPO'
    };
    return setupMap[scannerId] || 'VCP';
  };

  // Get stocks for active scanner
  const getActiveStocks = () => {
    if (!activeScanner || !stockLists) return [];
    
    const setupType = getSetupType(activeScanner);
    const setup = stockLists.find(s => s.setup_type === setupType);
    
    if (!setup) {
      console.log('No setup found for type:', setupType);
      console.log('Available setups:', stockLists.map(s => s.setup_type));
    }
    
    return setup?.stocks || [];
  };

  // Filter stocks based on search query
  const filteredStocks = getActiveStocks().filter(stock => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      stock.name.toLowerCase().includes(query) ||
      stock.symbol.toLowerCase().includes(query)
    );
  });

  const scanners = [
    {
      id: 'vcp',
      title: 'VCP',
      description: 'Volatility Contraction Pattern scanner',
      icon: Search,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700'
    },
    {
      id: 'ipo',
      title: 'IPO',
      description: 'Scan for Initial Public Offerings and new listings',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700'
    },
    {
      id: 'rocket',
      title: 'Rocket',
      description: 'High momentum breakout scanner',
      icon: Rocket,
      color: 'from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700'
    },
    // {
    //   id: 'ai-chatbot',
    //   title: 'AI Stock Chatbot',
    //   description: 'Get AI-powered insights and financial data',
    //   icon: MessageCircle,
    //   color: 'from-purple-500 to-purple-600',
    //   hoverColor: 'hover:from-purple-600 hover:to-purple-700'
    // },
    // {
    //   id: 'swing-leo-analysis',
    //   title: 'Swing-Leo-Analysis Ai',
    //   description: 'Open Swing-Leo-Analysis AI tool',
    //   icon: Rocket, // You can change this icon if you want
    //   color: 'from-pink-500 to-pink-600',
    //   hoverColor: 'hover:from-pink-600 hover:to-pink-700'
    // }
  ];

  const handleScannerClick = (id: string) => {
    // if (id === 'swing-leo-analysis') {
    //   setShowSwingLeoAnalysis(true);
    // } else if (id === 'pro-ai') {
    //   window.open('http://localhost:5000', '_blank');
    // } else if (id === 'ai-chatbot') {
    //   setShowChatbot(true);
    // } else {
      setActiveScanner(id);
    // }
  };

  const getScannerTitle = (id: string) => {
    switch (id) {
      case 'vcp':
        return 'VCP Scanner';
      case 'ipo':
        return 'IPO Base Scanner';
      case 'rocket':
        return 'Rocket Scanner';
      // case 'ai-chatbot':
      //   return 'AI Stock Chatbot';
      default:
        return 'Scanner';
    }
  };

  // if (showSwingLeoAnalysis) {
  //   return (
  //     <div className="space-y-6">
  //       <div className="flex justify-between items-center mb-4">
  //         <h2 className="text-2xl font-bold text-white">Swing-Leo-Analysis Ai</h2>
  //         <button
  //           className="text-slate-400 hover:text-red-400 text-lg font-bold"
  //           onClick={() => setShowSwingLeoAnalysis(false)}
  //           title="Close"
  //         >
  //           ×
  //         </button>
  //       </div>
  //       <iframe
  //         src="https://swing-leofy-analysis-pvp3.onrender.com/"
  //         title="Swing-Leo-Analysis Ai"
  //         className="w-full h-[80vh] rounded-lg border border-slate-700 shadow-xl bg-white"
  //       />
  //     </div>
  //   );
  // }

  // if (showChatbot) {
  //   return (
  //     <div className="space-y-6">
  //       <div className="flex items-center gap-4 mb-6">
  //         <Button
  //           onClick={() => setShowChatbot(false)}
  //           variant="outline"
  //           className="border-slate-600 text-slate-300 hover:bg-slate-700"
  //         >
  //           <ArrowLeft className="w-4 h-4 mr-2" /> Back to Scanners
  //         </Button>
  //         <h2 className="text-xl font-bold text-white flex items-center gap-2">
  //           <MessageCircle className="w-5 h-5" /> AI Stock Chatbot
  //         </h2>
  //       </div>
  //       <AIChatbot />
  //     </div>
  //   );
  // }

  if (activeScanner) {
    const scanner = scanners.find(s => s.id === activeScanner);
    const IconComponent = scanner?.icon;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => setActiveScanner(null)}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Scanners
          </Button>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {IconComponent && <IconComponent className="w-5 h-5" />} {getScannerTitle(activeScanner)}
          </h2>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-700 space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-white flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center gap-2 mb-4 md:mb-0">
                  {IconComponent && <IconComponent className="w-5 h-5" />} 
                  {getScannerTitle(activeScanner)} Stocks
                </div>
                <div className="w-full md:w-64">
                  <Input
                    placeholder="Search stocks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 hover:bg-slate-800/70">
                      <TableHead className="text-slate-300 w-16">Sr.</TableHead>
                      <TableHead className="text-slate-300">Stock Name</TableHead>
                      <TableHead className="text-slate-300">Symbol</TableHead>
                      <TableHead className="text-slate-300 text-right">Price</TableHead>
                      <TableHead className="text-slate-300 text-right hidden sm:table-cell">Volume</TableHead>
                      <TableHead className="text-slate-300 hidden md:table-cell">Upload Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-slate-400">
                          Loading stocks...
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-red-400">
                          Error loading stocks. Please try again.
                        </TableCell>
                      </TableRow>
                    ) : filteredStocks.length > 0 ? (
                      filteredStocks.map((stock, index) => (
                        <TableRow 
                          key={index} 
                          className="hover:bg-slate-800/50"
                        >
                          <TableCell className="text-slate-300">{stock.sr}</TableCell>
                          <TableCell className="text-slate-300 font-medium">{stock.name}</TableCell>
                          <TableCell className="text-blue-400">{stock.symbol}</TableCell>
                          <TableCell className="text-green-400 text-right">
                            ₹{typeof stock.price === 'number' ? stock.price.toFixed(2) : stock.price}
                          </TableCell>
                          <TableCell className="text-slate-300 text-right hidden sm:table-cell">
                            {stock.volume.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{stock.uploadDate ? new Date(stock.uploadDate).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-slate-400">
                          No stocks available for this scanner.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="space-y-6">
        <Card className="glass-effect mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white text-2xl">
              <Search className="w-6 h-6 text-blue-400" />
              Trading Scanner
            </CardTitle>
            <p className="text-slate-400">
              You must be verified by admin to access the Scanner. Please subscribe to unlock.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <PaymentModal onVerificationChange={setIsVerified}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                  <CreditCard className="w-5 h-5 mr-2" />
                  JOIN NOW
                </Button>
              </PaymentModal>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-700 space-y-6">
      <Card className="glass-effect mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white text-2xl">
            <Search className="w-6 h-6 text-blue-400" />
            Trading Scanner
          </CardTitle>
          <p className="text-slate-400">
            Choose a scanner type to find trading opportunities
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <PaymentModal>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                <CreditCard className="w-5 h-5 mr-2" />
                Subscribe to Community
              </Button>
            </PaymentModal>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scanners.map((scanner) => {
          const IconComponent = scanner.icon;
          return (
            <Card 
              key={scanner.id}
              className="relative group flex flex-col items-center justify-center p-6 rounded-3xl overflow-hidden shadow-lg transform transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
              onClick={() => handleScannerClick(scanner.id)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 text-center space-y-4">
                <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${scanner.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:${scanner.hoverColor}`}>
                  <IconComponent className="w-10 h-10 text-white" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">
                    {scanner.title}
                  </h3>
                  <p className="text-slate-300 text-base">
                    {scanner.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {/* <div className="flex justify-center mt-6">
        <button
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
          onClick={() => setShowChatbot(true)}
        >
          <MessageCircle className="w-5 h-5" />
          AI Stock Chatbot
        </button>
      </div> */}
      {/* Chatbot Interface */}
      {/* {showChatbot && (
        <div className="mt-8 p-6 rounded-lg bg-slate-900 border border-slate-700 shadow-xl max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              AI Stock Chatbot
            </h3>
            <button
              className="text-slate-400 hover:text-red-400 text-lg font-bold"
              onClick={() => setShowChatbot(false)}
              title="Close Chatbot"
            >
              ×
            </button>
          </div>
          <ChatbotUI />
        </div>
      )} */}
    </div>
  );
}

function ChatbotUI() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch suggestions as user types
  useEffect(() => {
    if (input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    fetch('/api/stock_search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: input })
    })
      .then(res => res.json())
      .then(data => {
        setSuggestions(data.results || []);
        setShowSuggestions(true);
      })
      .catch(() => setSuggestions([]));
  }, [input]);

  // When a suggestion is clicked, fetch the full output
  const handleSuggestionClick = (stock) => {
    setInput(stock.name + ' (' + stock.symbol + ')');
    setShowSuggestions(false);
    setLoading(true);
    setError('');
    setResponse(null);
    fetch('/api/ai_stock_chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: stock.symbol })
    })
      .then(res => res.json())
      .then(data => {
        setResponse(data);
        setActiveTab(0);
      })
      .catch(err => setError('Failed to fetch stock data.'))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <div className="relative mb-4">
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded bg-slate-800 border border-slate-600 text-white w-full"
          placeholder="Enter stock name or symbol (e.g., TCS, RELIANCE)"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setShowSuggestions(true);
            setResponse(null);
            setError('');
          }}
          required
          autoComplete="off"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 left-0 right-0 bg-slate-800 border border-slate-700 rounded shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map(stock => (
              <div
                key={stock.symbol}
                className="px-4 py-2 cursor-pointer hover:bg-slate-700 text-white"
                onClick={() => handleSuggestionClick(stock)}
              >
                {stock.name} <span className="text-slate-400">({stock.symbol})</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {loading && <div className="text-slate-400 mb-2 animate-pulse">Fetching data, please wait...</div>}
      {response && (
        <div>
          {/* Tabs */}
          {response.tabs && response.tabs.length > 0 && (
            <div>
              <div className="flex gap-2 mb-2">
                {response.tabs.map((tab, idx) => (
                  <button
                    key={tab.label}
                    className={`px-3 py-1 rounded-t bg-slate-800 border-b-2 font-bold ${activeTab === idx ? 'border-blue-500 text-blue-300' : 'border-transparent text-slate-400'}`}
                    onClick={() => setActiveTab(idx)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="bg-slate-800 p-4 rounded-b text-white overflow-x-auto">
                {/* Tab content: render as HTML or table */}
                <div dangerouslySetInnerHTML={{ __html: response.tabs[activeTab].content }} />
              </div>
            </div>
          )}
          {/* AI Insights */}
          {response.ai_insights && response.ai_insights.length > 0 && (
            <div className="mt-4">
              <h4 className="text-lg font-bold text-blue-400 mb-2">AI Insights</h4>
              <ul className="list-disc list-inside text-slate-200">
                {response.ai_insights.map((insight, idx) => (
                  <li key={idx}>{insight}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Investment Implications */}
          {response.investment_implications && (
            <div className="mt-4">
              <h4 className="text-lg font-bold text-green-400 mb-2">Investment Implications</h4>
              <div className="text-slate-200">{response.investment_implications}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
