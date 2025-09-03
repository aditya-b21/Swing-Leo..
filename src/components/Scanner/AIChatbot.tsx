import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

const formatIndianRupee = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};






interface FinancialData {
  summary: FinancialSummary[];
  quarterly: QuarterlyAnalysis[];
  ratios: KeyFinancialRatios[];
  shareholding: LatestShareholdingPattern[];
  insights: string[];
  implications: string;
}

interface FinancialSummary {
  year: string;
  totalIncome: number;
  eps: number;
  netEarnings: number;
  fii: number;
  dii: number;
  promoters: number;
  qib: number;
  ownershipBreakdown: string; // This might need a more detailed structure
}

interface QuarterlyAnalysis {
  quarter: string;
  totalRevenue: number;
  netProfit: number;
  eps: number;
  fiiChange: number;
  diiChange: number;
  promoterHoldingChange: number;
}

interface KeyFinancialRatios {
  peRatio: number;
  roe: number;
  roce: number;
  debtToEquity: number;
  dividendYield: number;
  currentRatio: number;
}

interface LatestShareholdingPattern {
  fii: number;
  dii: number;
  promoters: number;
  qib: number;
  retailInvestors: number;
}

interface ChatbotUIProps {
  stockSymbol: string;
  financialData: FinancialData | null;
  setFinancialData: React.Dispatch<React.SetStateAction<FinancialData | null>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

// Ensure environment variables are loaded for API keys
const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;
const MOBULA_API_KEY = import.meta.env.VITE_MOBULA_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!FMP_API_KEY || !MOBULA_API_KEY || !GEMINI_API_KEY) {
  console.error("API keys are not defined. Please set VITE_FMP_API_KEY, VITE_MOBULA_API_KEY, and VITE_GEMINI_API_KEY in your environment variables.");
  // You might want to throw an error or handle this more gracefully in a production app
  // For now, we'll let it proceed but expect functionality issues.
}

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

export function AIChatbot({ stockSymbol, financialData, setFinancialData, loading, setLoading, error, setError }: ChatbotUIProps) {
  const [stockSymbol, setStockSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);

  const handleGetInsights = async () => {
    if (!stockSymbol) {
      toast.error('Please enter a stock symbol.');
      return;
    }

    setLoading(true);
    setFinancialData(null);

    try {
      // Fetch stock data from Financial Modeling Prep (FMP)
      const financialApiUrl = `${FMP_BASE_URL}/profile/${stockSymbol}?apikey=${FMP_API_KEY}`;
      const financialResponse = await fetch(financialApiUrl);
      if (!financialResponse.ok) {
        throw new Error(`Failed to fetch financial data: ${financialResponse.statusText}`);
      }
      const financialDataRaw = await financialResponse.json();

      if (!financialDataRaw || financialDataRaw.length === 0) {
        throw new Error('Could not retrieve financial data for the given symbol. Please check the symbol or try again later.');
      }

      const profileData = financialDataRaw[0]; // FMP profile endpoint returns an array

      // Process financialDataRaw into the FinancialData interface format
      const processedFinancialData: FinancialData = {
        summary: [
          {
            year: profileData.lastDiv ? new Date(profileData.lastDiv).getFullYear().toString() : 'N/A',
            totalIncome: profileData.revenuePerShareTTM || 0,
            eps: profileData.eps || 0,
            netEarnings: profileData.netIncomePerShareTTM || 0,
            fii: 0, // FMP profile does not directly provide FII/DII. This would require other endpoints or data sources.
            dii: 0,
            promoters: 0,
            qib: 0,
            ownershipBreakdown: 'N/A', // Placeholder
          },
        ],
        quarterly: [],
        ratios: [],
        shareholding: [
          {
            fii: 0, // Placeholder
            dii: 0,
            promoters: 0,
            qib: 0,
            retailInvestors: 0,
          },
        ],
        insights: [],
        implications: '',
      };

      // Fetch quarterly income statements
      const quarterlyIncomeUrl = `${FMP_BASE_URL}/income-statement/${stockSymbol}?period=quarter&limit=5&apikey=${FMP_API_KEY}`;
      const quarterlyIncomeResponse = await fetch(quarterlyIncomeUrl);
      try {
        const quarterlyIncomeResponse = await fetch(quarterlyIncomeUrl);
        if (!quarterlyIncomeResponse.ok) {
          const errorText = await quarterlyIncomeResponse.text();
          throw new Error(`Failed to fetch quarterly income statement: ${quarterlyIncomeResponse.statusText}. Details: ${errorText}`);
        }
        const quarterlyIncomeData = await quarterlyIncomeResponse.json();
        if (quarterlyIncomeData && quarterlyIncomeData.length > 0) {
          processedFinancialData.quarterly = quarterlyIncomeData.map((data: any) => ({
            date: data.date,
            revenue: data.revenue,
            netIncome: data.netIncome,
            eps: data.eps,
          }));
        }
      } catch (error) {
        console.error(error);
      }

      // Fetch financial ratios
      const ratiosUrl = `${FMP_BASE_URL}/ratios/${stockSymbol}?period=quarter&limit=5&apikey=${FMP_API_KEY}`;
      const ratiosResponse = await fetch(ratiosUrl);
      try {
        const ratiosResponse = await fetch(ratiosUrl);
        if (!ratiosResponse.ok) {
          const errorText = await ratiosResponse.text();
          throw new Error(`Failed to fetch financial ratios: ${ratiosResponse.statusText}. Details: ${errorText}`);
        }
        const ratiosData = await ratiosResponse.json();
        if (ratiosData && ratiosData.length > 0) {
          processedFinancialData.ratios = ratiosData.map((data: any) => ({
            peRatio: data.peRatio,
            roe: data.roe,
            roce: data.returnOnCapitalEmployed,
            debtToEquity: data.debtToEquity,
            dividendYield: data.dividendYield,
            currentRatio: data.currentRatio,
          }));
        }
      } catch (error) {
        console.error(error);
      }



      // For shareholding data, FMP does not provide a direct endpoint in the free tier.
      // This would typically require a different data source or a higher-tier FMP plan.
      // We will use Gemini to generate this data.
      const shareholdingPrompt = `Given the following financial data for ${stockSymbol}: ${JSON.stringify(profileData)}. Provide hypothetical shareholding data in JSON format with the following structure: { "fii": number, "dii": number, "promoters": number, "qib": number, "retailInvestors": number }. Ensure the sum of all percentages is 100.`;

      try {
        const shareholdingResponse = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: shareholdingPrompt
              }]
            }]
          }),
        });

        if (!shareholdingResponse.ok) {
          throw new Error(`Failed to fetch shareholding data from Gemini: ${shareholdingResponse.statusText}`);
        }

        const shareholdingDataRaw = await shareholdingResponse.json();
        const shareholdingText = shareholdingDataRaw.candidates[0].content.parts[0].text;
        const shareholdingJsonMatch = shareholdingText.match(/```json\n([\s\S]*?)\n```/);

        if (shareholdingJsonMatch && shareholdingJsonMatch[1]) {
          const parsedShareholding = JSON.parse(shareholdingJsonMatch[1]);
          processedFinancialData.shareholding = [parsedShareholding];
        } else {
          console.warn('Could not parse shareholding data from Gemini response:', shareholdingText);
        }
      } catch (error) {
        console.error('Error fetching shareholding data from Gemini:', error);
      }

      // Call Gemini API for insights and implications
      const insightsPrompt = `Given the following financial data for ${stockSymbol} for the last 5 quarters, provide insights in Indian Rupees (INR) and avoid terms like USD: ${JSON.stringify(profileData)}. Provide:
1. 3-5 key insights in bullet points
2. Investment implications in 2-3 sentences
Format the response as JSON: { "insights": ["insight1", "insight2"], "implications": "text" }`;

      try {
        const insightsResponse = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: insightsPrompt
              }]
            }]
          }),
        });

        if (!insightsResponse.ok) {
          throw new Error(`Failed to fetch insights from Gemini: ${insightsResponse.statusText}`);
        }

        const insightsDataRaw = await insightsResponse.json();
        const insightsText = insightsDataRaw.candidates[0].content.parts[0].text;
        const insightsJsonMatch = insightsText.match(/```json\n([\s\S]*?)\n```/);

        if (insightsJsonMatch && insightsJsonMatch[1]) {
          const parsedInsights = JSON.parse(insightsJsonMatch[1]);
          processedFinancialData.insights = parsedInsights.insights || [];
          processedFinancialData.implications = parsedInsights.implications || '';
        } else {
          console.warn('Could not parse insights from Gemini response:', insightsText);
        }
      } catch (error) {
        console.error('Error fetching insights from Gemini:', error);
      }

      setFinancialData(processedFinancialData);

    } catch (error) {
      console.error('Error in handleGetInsights:', error);
      setFinancialData(null);
      setError(`Failed to get insights: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    }
  };


    return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="text-white">AI Stock Chatbot</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-300">Enter a stock name to get financial insights.</p>
        <div className="flex w-full max-w-sm items-center space-x-2 mt-4">
          <Input
            type="text"
            placeholder="Enter stock symbol (e.g., TCS)"
            className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
            value={stockSymbol}
            onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleGetInsights();
              }
            }}
          />
          <Button onClick={handleGetInsights} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'Fetching...' : 'Get Insights'}
          </Button>
        </div>

        {financialData && (
          <div className="mt-8">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                <TabsTrigger value="ratios">Ratios</TabsTrigger>
                <TabsTrigger value="shareholding">Shareholding</TabsTrigger>
              </TabsList>
              <TabsContent value="summary">
                <Card className="glass-effect mt-4">
                  <CardHeader><CardTitle className="text-white">Financial Summary</CardTitle></CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-slate-700">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/70">
                            <TableHead className="text-white">Year</TableHead>
                            <TableHead className="text-white">Total Income</TableHead>
                            <TableHead className="text-white">EPS</TableHead>
                            <TableHead className="text-white">Net Earnings</TableHead>
                            <TableHead className="text-white">FII %</TableHead>
                            <TableHead className="text-white">DII %</TableHead>
                            <TableHead className="text-white">Promoters %</TableHead>
                            <TableHead className="text-white">QIB %</TableHead>
                            <TableHead className="text-white">Ownership Breakdown</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {financialData.summary.map((data, index) => (
                            <TableRow key={index} className="bg-slate-900/50 hover:bg-slate-800/70">
                              <TableCell className="font-medium text-slate-300">{data.year}</TableCell>
                              <TableCell className="text-slate-300">{formatIndianRupee(data.totalIncome)}</TableCell>
                              <TableCell className="text-slate-300">{formatIndianRupee(data.eps)}</TableCell>
                              <TableCell className="text-slate-300">{formatIndianRupee(data.netEarnings)}</TableCell>
                              <TableCell className="text-slate-300">{data.fii}</TableCell>
                              <TableCell className="text-slate-300">{data.dii}</TableCell>
                              <TableCell className="text-slate-300">{data.promoters}</TableCell>
                              <TableCell className="text-slate-300">{data.qib}</TableCell>
                              <TableCell className="text-slate-300">{data.ownershipBreakdown}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="quarterly">
                <Card className="glass-effect mt-4">
                  <CardHeader><CardTitle className="text-white">Quarterly Analysis</CardTitle></CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-slate-700">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/70">
                            <TableHead className="text-white">Quarter</TableHead>
                            <TableHead className="text-white">Total Revenue</TableHead>
                            <TableHead className="text-white">Net Profit</TableHead>
                            <TableHead className="text-white">EPS</TableHead>
                            <TableHead className="text-white">FII % Change</TableHead>
                            <TableHead className="text-white">DII % Change</TableHead>
                            <TableHead className="text-white">Promoter Holding % Change</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {financialData.quarterly.map((data, index) => (
                            <TableRow key={index} className="bg-slate-900/50 hover:bg-slate-800/70">
                              <TableCell className="font-medium text-slate-300">{data.quarter}</TableCell>
                              <TableCell className="text-slate-300">{formatIndianRupee(data.totalRevenue)}</TableCell>
                              <TableCell className="text-slate-300">{formatIndianRupee(data.netProfit)}</TableCell>
                              <TableCell className="text-slate-300">{formatIndianRupee(data.eps)}</TableCell>
                              <TableCell className="text-slate-300">{data.fiiChange}</TableCell>
                              <TableCell className="text-slate-300">{data.diiChange}</TableCell>
                              <TableCell className="text-slate-300">{data.promoterHoldingChange}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="ratios">
                <Card className="glass-effect mt-4">
                  <CardHeader><CardTitle className="text-white">Key Financial Ratios</CardTitle></CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-slate-700">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/70">
                            <TableHead className="text-white">PE Ratio</TableHead>
                            <TableHead className="text-white">ROE</TableHead>
                            <TableHead className="text-white">ROCE</TableHead>
                            <TableHead className="text-white">Debt-to-Equity</TableHead>
                            <TableHead className="text-white">Dividend Yield</TableHead>
                            <TableHead className="text-white">Current Ratio</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {financialData.ratios.map((data, index) => (
                            <TableRow key={index} className="bg-slate-900/50 hover:bg-slate-800/70">
                              <TableCell className="font-medium text-slate-300">{formatIndianRupee(data.peRatio)}</TableCell>
                              <TableCell className="text-slate-300">{formatIndianRupee(data.roe)}</TableCell>
                              <TableCell className="text-slate-300">{formatIndianRupee(data.roce)}</TableCell>
                              <TableCell className="text-slate-300">{formatIndianRupee(data.debtToEquity)}</TableCell>
                              <TableCell className="text-slate-300">{formatIndianRupee(data.dividendYield)}</TableCell>
                              <TableCell className="text-slate-300">{formatIndianRupee(data.currentRatio)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="shareholding">
                <Card className="glass-effect mt-4">
                  <CardHeader><CardTitle className="text-white">Latest Shareholding Pattern</CardTitle></CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-slate-700">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/70">
                            <TableHead className="text-white">FII %</TableHead>
                            <TableHead className="text-white">DII %</TableHead>
                            <TableHead className="text-white">Promoters %</TableHead>
                            <TableHead className="text-white">QIB %</TableHead>
                            <TableHead className="text-white">Retail Investors %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {financialData.shareholding.map((data, index) => (
                            <TableRow key={index} className="bg-slate-900/50 hover:bg-slate-800/70">
                              <TableCell className="font-medium text-slate-300">{data.fii}</TableCell>
                              <TableCell className="text-slate-300">{data.dii}</TableCell>
                              <TableCell className="text-slate-300">{data.promoters}</TableCell>
                              <TableCell className="text-slate-300">{data.qib}</TableCell>
                              <TableCell className="text-slate-300">{data.retailInvestors}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="glass-effect mt-4">
              <CardHeader><CardTitle className="text-white">AI Insights</CardTitle></CardHeader>
              <CardContent>
                {financialData.insights.length > 0 ? (
                  <ul className="list-disc list-inside text-slate-300">
                    {financialData.insights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-300">{financialData.implications}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}