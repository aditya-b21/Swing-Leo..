import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, FileUp, Download, FileSpreadsheet, FilePlus, FileJson, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { scanStocks } from '@/api/stockScanner';
import * as XLSX from 'xlsx';

// Define interfaces
interface StockData {
  sr?: number;
  symbol: string;
  name: string;
  price: number;
  volume: number;
  percentChange?: number;
}

interface ScannerResult {
  id: string;
  name: string;
  icon: any;
  description: string;
  active: boolean;
}

export function StockScanningSection() {
  // State variables
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedStocks, setUploadedStocks] = useState<StockData[]>([]);
  const [scanResults, setScanResults] = useState<StockData[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [activeScanner, setActiveScanner] = useState<string | null>('rocket');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animation effect
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Scanner options
  const scanners: ScannerResult[] = [
    {
      id: 'vcp',
      name: 'VCP Scanner',
      icon: FileJson,
      description: 'Scan for VCP pattern stocks',
      active: false
    },
    {
      id: 'rocket',
      name: 'Rocket Base Scanner',
      icon: FileSpreadsheet,
      description: 'Scan for Rocket Base pattern stocks',
      active: true
    },
    {
      id: 'ipo',
      name: 'IPO Base Scanner',
      icon: FilePlus,
      description: 'Scan for IPO Base pattern stocks',
      active: false
    }
  ];

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'pdf') {
        setSelectedFile(file);
        toast.success(`File selected: ${file.name}`);
      } else {
        toast.error('Please select a CSV, Excel, or PDF file');
        event.target.value = '';
      }
    }
  };

  // Extract stocks from file
  const extractStocksFromFile = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsExtracting(true);
    setScanResults([]);
    setShowResults(false);
    
    try {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      let extractedStocks: StockData[] = [];

      // Process file based on type
      if (fileExtension === 'csv') {
        extractedStocks = await parseCSVData(selectedFile);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        extractedStocks = await parseExcelData(selectedFile);
      } else if (fileExtension === 'pdf') {
        toast.info('PDF parsing is not yet implemented. Please use CSV or Excel files.');
        setIsExtracting(false);
        return;
      }

      // Process and validate extracted stocks
      const validStocks = extractedStocks
        .filter(stock => stock.symbol && stock.name)
        .map((stock, index) => ({
          ...stock,
          sr: index + 1
        }));

      if (validStocks.length === 0) {
        toast.error('No valid stock data found in the file');
      } else {
        setUploadedStocks(validStocks);
        toast.success(`Successfully extracted ${validStocks.length} stocks from file`);
      }
    } catch (error: any) {
      console.error('Error extracting stocks:', error);
      toast.error(`Failed to extract stocks: ${error.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Parse CSV data using a worker for better performance
  const parseCSVData = (file: File): Promise<StockData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          if (!text) {
            reject(new Error('Failed to read file'));
            return;
          }
          
          // Process CSV data in chunks for better performance
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(header => header.trim());
          
          // Find relevant column indices
          const symbolIndex = headers.findIndex(h => 
            h.toLowerCase().includes('symbol') || h.toLowerCase().includes('ticker'));
          const nameIndex = headers.findIndex(h => 
            h.toLowerCase().includes('name') || h.toLowerCase().includes('company'));
          const priceIndex = headers.findIndex(h => 
            h.toLowerCase().includes('price') || h.toLowerCase().includes('close'));
          const volumeIndex = headers.findIndex(h => 
            h.toLowerCase().includes('volume'));
          const percentChangeIndex = headers.findIndex(h => 
            h.toLowerCase().includes('% chg') || h.toLowerCase().includes('change'));
          
          if (symbolIndex === -1) {
            reject(new Error('Symbol column not found in CSV'));
            return;
          }
          
          const stocks: StockData[] = [];
          const batchSize = 100;
          let processedCount = 0;
          
          // Process in batches
          function processNextBatch() {
            const endIdx = Math.min(processedCount + batchSize, lines.length);
            
            for (let i = processedCount + 1; i < endIdx; i++) {
              if (!lines[i].trim()) continue;
              
              const values = lines[i].split(',').map(val => val.trim());
              
              const stock: StockData = {
                symbol: values[symbolIndex] || '',
                name: nameIndex !== -1 ? values[nameIndex] || values[symbolIndex] || '' : values[symbolIndex] || '',
                price: priceIndex !== -1 ? parseFloat(values[priceIndex]) || 0 : 0,
                volume: volumeIndex !== -1 ? parseInt(values[volumeIndex]) || 0 : 0,
                percentChange: percentChangeIndex !== -1 ? parseFloat(values[percentChangeIndex]) || 0 : undefined
              };
              
              if (stock.symbol) {
                stocks.push(stock);
              }
            }
            
            processedCount = endIdx;
            
            if (processedCount < lines.length) {
              // Continue processing in the next tick to avoid blocking UI
              setTimeout(processNextBatch, 0);
            } else {
              resolve(stocks);
            }
          }
          
          processNextBatch();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  };

  // Parse Excel data
  const parseExcelData = (file: File): Promise<StockData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          if (!data) {
            reject(new Error('Failed to read file'));
            return;
          }
          
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            reject(new Error('Excel file has insufficient data'));
            return;
          }
          
          const headers = jsonData[0] as string[];
          
          // Find relevant column indices
          const symbolIndex = headers.findIndex(h => 
            h && typeof h === 'string' && 
            (h.toLowerCase().includes('symbol') || h.toLowerCase().includes('ticker')));
          const nameIndex = headers.findIndex(h => 
            h && typeof h === 'string' && 
            (h.toLowerCase().includes('name') || h.toLowerCase().includes('company')));
          const priceIndex = headers.findIndex(h => 
            h && typeof h === 'string' && 
            (h.toLowerCase().includes('price') || h.toLowerCase().includes('close')));
          const volumeIndex = headers.findIndex(h => 
            h && typeof h === 'string' && h.toLowerCase().includes('volume'));
          const percentChangeIndex = headers.findIndex(h => 
            h && typeof h === 'string' && 
            (h.toLowerCase().includes('% chg') || h.toLowerCase().includes('change')));
          
          if (symbolIndex === -1) {
            reject(new Error('Symbol column not found in Excel file'));
            return;
          }
          
          const stocks: StockData[] = [];
          
          // Process rows in batches for better performance
          const batchSize = 100;
          let processedCount = 1; // Start from 1 to skip header
          
          function processNextBatch() {
            const endIdx = Math.min(processedCount + batchSize, jsonData.length);
            
            for (let i = processedCount; i < endIdx; i++) {
              const row = jsonData[i] as any[];
              if (!row || row.length === 0) continue;
              
              const stock: StockData = {
                symbol: row[symbolIndex]?.toString() || '',
                name: nameIndex !== -1 ? row[nameIndex]?.toString() || row[symbolIndex]?.toString() || '' : row[symbolIndex]?.toString() || '',
                price: priceIndex !== -1 ? parseFloat(row[priceIndex]) || 0 : 0,
                volume: volumeIndex !== -1 ? parseInt(row[volumeIndex]) || 0 : 0,
                percentChange: percentChangeIndex !== -1 ? parseFloat(row[percentChangeIndex]) || 0 : undefined
              };
              
              if (stock.symbol) {
                stocks.push(stock);
              }
            }
            
            processedCount = endIdx;
            
            if (processedCount < jsonData.length) {
              // Continue processing in the next tick to avoid blocking UI
              setTimeout(processNextBatch, 0);
            } else {
              resolve(stocks);
            }
          }
          
          processNextBatch();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  // Run the Rocket Base Scanner
  const runRocketBaseScanner = async () => {
    if (uploadedStocks.length === 0) {
      toast.error('No stocks to scan. Please upload and extract stocks first.');
      return;
    }

    setIsScanning(true);
    setScanResults([]);
    setShowResults(false);
    setScanProgress(0);
    setScanStatus('Initializing scanner...');

    toast.info(`Starting Rocket Base Scanner for ${uploadedStocks.length} stocks...`);

    try {
      // Use the progress callback from the improved scanStocks function
      const results = await scanStocks(uploadedStocks, (processed, total) => {
        const progress = Math.round((processed / total) * 100);
        setScanProgress(progress);
        setScanStatus(`Processing ${processed} of ${total} stocks...`);
      });

      // Add sr numbers to results
      const formattedResults = results.map((stock, index) => ({
        ...stock,
        sr: index + 1
      }));

      setScanProgress(100);
      setScanStatus(`Scan complete! Found ${formattedResults.length} matching stocks.`);

      setScanResults(formattedResults);
      setShowResults(true);
      
      if (formattedResults.length > 0) {
        toast.success(`Rocket Base Scan complete! Found ${formattedResults.length} matching stocks.`);
      } else {
        toast.info('Scan complete, but no stocks matched all Rocket Base conditions.');
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error(`Scan failed: ${error.message}`);
      setScanStatus('Scan failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // Run the appropriate scanner based on selection
  const runScanner = () => {
    if (activeScanner === 'rocket') {
      runRocketBaseScanner();
    } else {
      toast.info(`${activeScanner?.toUpperCase()} Scanner is not yet implemented.`);
    }
  };

  // Export results to CSV
  const handleExportResults = () => {
    if (scanResults.length === 0) {
      toast.error('No results to export');
      return;
    }

    try {
      // Create CSV content
      const headers = ['Sr.', 'Stock Name', 'Symbol', 'Price', 'Volume'];
      const csvContent = [
        headers.join(','),
        ...scanResults.map(stock => [
          stock.sr || '',
          `"${stock.name}"`, // Quote name to handle commas
          stock.symbol,
          stock.price,
          stock.volume
        ].join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `rocket_base_results_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Results exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error.message}`);
    }
  };

  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null);
    setUploadedStocks([]);
    setScanResults([]);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter results based on search query
  const filteredResults = scanResults.filter(stock => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      stock.symbol.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query)
    );
  });

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Stock Scanning</h2>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={runScanner} 
            disabled={isScanning || uploadedStocks.length === 0}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold"
            size="lg"
          >
            <Search className="w-5 h-5 mr-2" />
            {isScanning ? 'Scanning...' : 'Start Scanning'}
          </Button>
        </motion.div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">File Upload</CardTitle>
          <CardDescription className="text-slate-400">
            Upload a CSV, Excel, or PDF file containing stock data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={handleFileSelect}
                className="bg-slate-700 border-slate-600 text-white"
                disabled={isExtracting || isScanning}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={clearFileSelection}
                disabled={!selectedFile || isExtracting || isScanning}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Clear
              </Button>
              <Button 
                onClick={extractStocksFromFile}
                disabled={!selectedFile || isExtracting || isScanning}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isExtracting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Extracting...
                  </>
                ) : (
                  <>
                    <FileUp className="w-4 h-4 mr-2" />
                    Extract Stocks
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {selectedFile && (
            <div className="p-3 bg-slate-700 rounded-md flex items-center justify-between">
              <div className="flex items-center">
                <FileSpreadsheet className="w-5 h-5 text-blue-400 mr-2" />
                <span className="text-white">{selectedFile.name}</span>
              </div>
              <span className="text-slate-300 text-sm">{(selectedFile.size / 1024).toFixed(1)} KB</span>
            </div>
          )}
          
          {uploadedStocks.length > 0 && (
            <div className="p-3 bg-green-900/30 border border-green-700/50 rounded-md">
              <p className="text-green-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Successfully extracted {uploadedStocks.length} stocks
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scanners.map((scanner) => (
          <Card 
            key={scanner.id}
            className={`bg-slate-800 border-slate-700 cursor-pointer transition-all ${
              activeScanner === scanner.id 
                ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' 
                : 'hover:bg-slate-750'
            }`}
            onClick={() => scanner.active && setActiveScanner(scanner.id)}
          >
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <scanner.icon className={`w-5 h-5 ${activeScanner === scanner.id ? 'text-blue-400' : 'text-slate-400'}`} />
                {scanner.name}
                {scanner.id === 'rocket' && (
                  <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                    Active
                  </span>
                )}
                {(scanner.id === 'vcp' || scanner.id === 'ipo') && (
                  <span className="bg-slate-600 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                    Coming Soon
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {scanner.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {isScanning && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Scanning Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold inline-block text-blue-400">
                    {scanProgress}% Complete
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-400">
                    {scanStatus}
                  </span>
                </div>
              </div>
              <Progress value={scanProgress} className="h-2 bg-slate-700" />
            </div>
            <div className="flex justify-center">
              <div className="animate-pulse flex space-x-4 items-center">
                <div className="rounded-full bg-blue-400 h-3 w-3"></div>
                <p className="text-slate-300">Processing stock data, please wait...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showResults && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Scan Results</CardTitle>
              <CardDescription className="text-slate-400">
                Stocks that passed all Rocket Base conditions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
              <Button 
                variant="outline" 
                onClick={handleExportResults}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-700/50 hover:bg-slate-700">
                    <TableHead className="text-slate-300 w-16">Sr.</TableHead>
                    <TableHead className="text-slate-300">Stock Name</TableHead>
                    <TableHead className="text-slate-300">Symbol</TableHead>
                    <TableHead className="text-slate-300 text-right">Price</TableHead>
                    <TableHead className="text-slate-300 text-right">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.length > 0 ? (
                    filteredResults.map((stock, index) => (
                      <TableRow 
                        key={stock.symbol} 
                        className="border-slate-700 hover:bg-slate-700/50"
                      >
                        <TableCell className="text-slate-300">{stock.sr || index + 1}</TableCell>
                        <TableCell className="text-slate-300 font-medium">{stock.name}</TableCell>
                        <TableCell className="text-blue-400">{stock.symbol}</TableCell>
                        <TableCell className="text-green-400 text-right">
                          ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-slate-300 text-right">
                          {stock.volume.toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-slate-400">
                        {searchQuery ? 'No matching stocks found' : 'No stocks passed all Rocket Base conditions'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between text-sm text-slate-400">
            <div>
              Showing {filteredResults.length} of {scanResults.length} results
            </div>
            <div>
              Last updated: {new Date().toLocaleString()}
            </div>
          </CardFooter>
        </Card>
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Rocket Base Scanner Conditions</CardTitle>
          <CardDescription className="text-slate-400">
            Strict conditions applied to find quality stocks
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-300 space-y-4">
          <div>
            <h3 className="font-bold mb-1">📊 Price & Volume:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Close &gt; ₹70 (Custom Penny Stock Filter)</li>
              <li>Volume &gt; 85,000</li>
              <li>% Change &gt; 0</li>
              <li>5-Day Change &lt; 8%</li>
              <li>5-Day Price Range &lt; 10%</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-1">📈 WMA Filters:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Daily WMA(close,1) &gt; Monthly WMA(close,2) + 1</li>
              <li>Monthly WMA(close,2) &gt; Monthly WMA(close,4) + 2</li>
              <li>Daily WMA(close,1) &gt; Weekly WMA(close,6) + 2</li>
              <li>Weekly WMA(close,6) &gt; Weekly WMA(close,12) + 2</li>
              <li>Daily WMA(close,1) &gt; WMA(close,12) from 4 days ago + 2</li>
              <li>Daily WMA(close,1) &gt; WMA(close,20) from 2 days ago + 2</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-1">📉 Volume Contraction:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>AvgVolume_5 &lt; AvgVolume_10</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-1">📊 Technical Indicators:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>RSI &gt; 60</li>
              <li>ATR Volatility: Passed (ATR &lt; 5% of price)</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-1">❌ Exclusions:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Exclude ETFs</li>
              <li>Exclude % Chg ≤ 0</li>
              <li>Exclude Penny stocks (Price &lt; ₹70)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 