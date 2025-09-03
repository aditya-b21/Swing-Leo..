import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, Rocket, Upload, AlertCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { StockData, SetupType } from '@/integrations/supabase/types';
import { useQuery } from '@tanstack/react-query';

interface StockInput {
  sr: number;
  name: string;
  symbol: string;
  price: string | number;
  volume: string | number;
}

// Helper: Clean and standardize stock data
function cleanStockData(rawStock: StockInput): StockData | null {
  try {
    // Fast validation of required fields first
    if (!rawStock.name?.trim() || !rawStock.symbol?.trim()) return null;

    // Clean price with single parse
    const cleanPrice = typeof rawStock.price === 'string' 
      ? parseFloat(rawStock.price.replace(/[^0-9.-]/g, ''))
      : rawStock.price;

    // Clean volume with single parse
    const cleanVolume = typeof rawStock.volume === 'string'
      ? parseInt(rawStock.volume.replace(/[^0-9]/g, ''))
      : rawStock.volume;

    // Quick validation
    if (isNaN(cleanPrice) || cleanPrice <= 0 || isNaN(cleanVolume) || cleanVolume <= 0) {
      return null;
    }

    // Return cleaned data with current date
    return {
      sr: rawStock.sr,
      name: String(rawStock.name).trim(),
      symbol: String(rawStock.symbol).trim().toUpperCase(),
      price: Number(cleanPrice.toFixed(2)),
      volume: Math.round(cleanVolume),
      uploadDate: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error cleaning stock data:', err);
    return null;
  }
}

// Helper: Parse CSV text with specific format
function parseCSVStocks(text: string): StockData[] {
  const lines = text.split('\n').filter(line => line.trim());
  const stocks: StockData[] = [];
  
  // Find header row and column indices
  const headerRow = lines[0].toLowerCase();
  const headers = headerRow.split(',').map(h => h.trim().replace(/['"]/g, ''));
  
  console.log('CSV Headers:', headers);

  // Find required column indices with flexible matching
  let nameIdx = -1;
  let symbolIdx = -1;
  let priceIdx = -1;
  let volumeIdx = -1;

  headers.forEach((header, idx) => {
    // Stock Name column
    if (header.includes('stock') && header.includes('name') || 
        header === 'name' || header === 'company') {
      nameIdx = idx;
    }
    // Symbol column
    if (header === 'symbol' || header === 'ticker') {
      symbolIdx = idx;
    }
    // Price column
    if (header === 'price' || header === 'close' || header === 'last') {
      priceIdx = idx;
    }
    // Volume column
    if (header === 'volume' || header === 'vol') {
      volumeIdx = idx;
    }
  });

  // If columns not found, try fixed positions based on your format
  if (nameIdx === -1) nameIdx = 1;  // Stock Name is second column
  if (symbolIdx === -1) symbolIdx = 2; // Symbol is third column
  if (priceIdx === -1) priceIdx = 5;   // Price is sixth column
  if (volumeIdx === -1) volumeIdx = 6;  // Volume is seventh column

  console.log('Column indices:', { nameIdx, symbolIdx, priceIdx, volumeIdx });

  // Process each line
  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split(',').map(f => f.trim().replace(/['"]/g, ''));
    
    // Create raw stock data with only the columns we need
    const rawStock = {
      sr: i,
      name: fields[nameIdx],
      symbol: fields[symbolIdx],
      price: fields[priceIdx],
      volume: fields[volumeIdx]
    };

    // Clean and validate the stock data
    const cleanedStock = cleanStockData(rawStock);
    if (cleanedStock) {
      stocks.push(cleanedStock);
    }
  }

  if (stocks.length === 0) {
    throw new Error('No valid stock data found in CSV. Please check the file format.');
  }

  return stocks;
}

// Helper: Parse Excel data with specific format
function parseExcelStocks(jsonData: any[]): StockData[] {
  const stocks: StockData[] = [];
  
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    throw new Error('Invalid Excel data format');
  }

  // Find header row and column indices
  const headers = jsonData[0].map((h: any) => String(h || '').toLowerCase().trim());
  
  console.log('Excel Headers:', headers);

  // Find required column indices with flexible matching
  let nameIdx = -1;
  let symbolIdx = -1;
  let priceIdx = -1;
  let volumeIdx = -1;

  headers.forEach((header: string, idx: number) => {
    // Stock Name column
    if (header.includes('stock') && header.includes('name') || 
        header === 'name' || header === 'company') {
      nameIdx = idx;
    }
    // Symbol column
    if (header === 'symbol' || header === 'ticker') {
      symbolIdx = idx;
    }
    // Price column
    if (header === 'price' || header === 'close' || header === 'last') {
      priceIdx = idx;
    }
    // Volume column
    if (header === 'volume' || header === 'vol') {
      volumeIdx = idx;
    }
  });

  // If columns not found, try fixed positions based on your format
  if (nameIdx === -1) nameIdx = 1;  // Stock Name is second column
  if (symbolIdx === -1) symbolIdx = 2; // Symbol is third column
  if (priceIdx === -1) priceIdx = 5;   // Price is sixth column
  if (volumeIdx === -1) volumeIdx = 6;  // Volume is seventh column

  console.log('Column indices:', { nameIdx, symbolIdx, priceIdx, volumeIdx });

  // Process each row
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!Array.isArray(row)) continue;
    
    // Create raw stock data with only the columns we need
    const rawStock = {
      sr: i,
      name: row[nameIdx],
      symbol: row[symbolIdx],
      price: row[priceIdx],
      volume: row[volumeIdx]
    };

    // Clean and validate the stock data
    const cleanedStock = cleanStockData(rawStock);
    if (cleanedStock) {
      stocks.push(cleanedStock);
    }
  }

  if (stocks.length === 0) {
    throw new Error('No valid stock data found in Excel. Please check the file format.');
  }

  return stocks;
}

const ADMIN_EMAILS = ['admin@swingscribe.com', 'adityabarod807@gmail.com'];

export function ProScannerSection() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<{ email: string | null } | null>(null);

  // State for VCP modal
  const [openVCPModal, setOpenVCPModal] = useState(false);
  const [vcpStocks, setVcpStocks] = useState<StockInput[]>([
    { sr: 1, name: '', symbol: '', price: '', volume: '' }
  ]);
  const [vcpFile, setVcpFile] = useState<File | null>(null);
  const [vcpPreview, setVcpPreview] = useState<StockData[]>([]);
  const [showVcpPreview, setShowVcpPreview] = useState(false);

  // State for IPO modal
  const [openIPOModal, setOpenIPOModal] = useState(false);
  const [ipoStocks, setIpoStocks] = useState<StockInput[]>([
    { sr: 1, name: '', symbol: '', price: '', volume: '' }
  ]);
  const [ipoFile, setIpoFile] = useState<File | null>(null);
  const [ipoPreview, setIpoPreview] = useState<StockData[]>([]);
  const [showIpoPreview, setShowIpoPreview] = useState(false);

  // State for Rocket modal
  const [openRocketModal, setOpenRocketModal] = useState(false);
  const [rocketStocks, setRocketStocks] = useState<StockInput[]>([
    { sr: 1, name: '', symbol: '', price: '', volume: '' }
  ]);
  const [rocketFile, setRocketFile] = useState<File | null>(null);
  const [rocketPreview, setRocketPreview] = useState<StockData[]>([]);
  const [showRocketPreview, setShowRocketPreview] = useState(false);

  // Fetch current stock lists
  const { data: stockLists, isLoading } = useQuery({
    queryKey: ['setup_stocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('setup_stock_lists')
        .select('*');

      if (error) throw error;
      return data || [];
    }
  });

  // Get current user on mount and listen for auth changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ? { email: session.user.email } : null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ? { email: session.user.email } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Generic handler for file upload and extraction
  async function handleFileExtract(file: File, setPreview: (stocks: StockData[]) => void, setShowPreview: (show: boolean) => void, setupName: string) {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // First, get the headers to check column names
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const headers: string[] = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
          headers[C] = cell ? String(cell.v).toLowerCase().trim() : '';
        }

        console.log('Found headers:', headers);

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: headers });
        console.log('Raw JSON data:', jsonData);

        if (jsonData.length <= 1) {
          toast.error('File appears to be empty or contains only headers');
        return;
      }

        // Remove header row if it was included in the data
        const dataRows = jsonData.slice(1);
        console.log('Data rows:', dataRows);

        // Transform the data with better column name handling
        const stocksData: StockData[] = dataRows.map((row: any, index: number) => {
          // Convert row keys to lowercase for case-insensitive matching
          const lowercaseRow = Object.keys(row).reduce((acc: any, key) => {
            acc[key.toLowerCase()] = row[key];
            return acc;
          }, {});

          console.log('Processing row with lowercase keys:', lowercaseRow);

          // Handle various possible column names for stock name
          const stockName = lowercaseRow['stock name'] || lowercaseRow['stockname'] || 
                          lowercaseRow['name'] || lowercaseRow['company'] || '';

          // Handle various possible column names for symbol
          const symbol = lowercaseRow['symbol'] || lowercaseRow['ticker'] || '';

          // Handle various possible column names for price
          const priceValue = lowercaseRow['price'] || lowercaseRow['last'] || 
                           lowercaseRow['close'] || lowercaseRow['ltp'] || 0;

          // Handle various possible column names for volume
          const volumeValue = lowercaseRow['volume'] || lowercaseRow['vol'] || 0;

          const currentDate = new Date().toISOString();

          // Log the extracted values for debugging
          console.log('Extracted values:', {
            index,
            stockName,
            symbol,
            priceValue,
            volumeValue,
            originalRow: row
          });

          if (!stockName || !symbol) {
            console.warn('Missing required data:', { stockName, symbol });
            toast.error(`Row ${index + 1}: Missing stock name or symbol`);
            return null;
          }

          // Clean and validate the values
          const cleanedPrice = typeof priceValue === 'string' ? 
            parseFloat(priceValue.replace(/[^0-9.-]/g, '')) : 
            parseFloat(String(priceValue));

          const cleanedVolume = typeof volumeValue === 'string' ? 
            parseInt(volumeValue.replace(/[^0-9]/g, '')) : 
            parseInt(String(volumeValue));

          if (isNaN(cleanedPrice) || cleanedPrice <= 0) {
            console.warn(`Invalid price for ${symbol}:`, priceValue);
            toast.error(`Row ${index + 1}: Invalid price for ${symbol}`);
            return null;
          }

          if (isNaN(cleanedVolume) || cleanedVolume <= 0) {
            console.warn(`Invalid volume for ${symbol}:`, volumeValue);
            toast.error(`Row ${index + 1}: Invalid volume for ${symbol}`);
            return null;
          }

          return {
            sr: index + 1,
            name: stockName.trim(),
            symbol: symbol.trim().toUpperCase(),
            price: cleanedPrice,
            volume: cleanedVolume,
            percentChange: parseFloat(lowercaseRow['% chg'] || lowercaseRow['percentchange'] || 
                                   lowercaseRow['%change'] || lowercaseRow['change%'] || 0),
            uploadDate: currentDate
          };
        }).filter(Boolean);

        if (stocksData.length === 0) {
          toast.error('No valid stock data found. Please check if the file has the required columns: Stock Name, Symbol, Price, Volume');
        return;
      }

        console.log('Final processed stocks:', stocksData);
        setPreview(stocksData);
      setShowPreview(true);
        toast.success(`Successfully processed ${stocksData.length} stocks`);
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error extracting file:', error);
      toast.error('Error processing file. Please make sure it is a valid Excel file with the correct format.');
    }
  }

  // Save function with improved error handling and immediate updates
  async function handleSaveStockList(setupType: SetupType, stocks: StockInput[], setModalOpen: (open: boolean) => void) {
    // Check auth state
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      toast.error('You must be logged in to save stock lists');
      return;
    }

    const loadingToast = toast.loading('Processing stock data...');
    
    try {
      // Validate and clean all stocks
      const currentDate = new Date().toISOString();
      const validStocks = stocks
        .map((stock, idx) => {
          if (!stock.name?.trim() || !stock.symbol?.trim()) {
            console.warn('Invalid stock data:', stock);
            return null;
          }

          const cleaned = cleanStockData({ ...stock, sr: idx + 1 });
          if (cleaned) {
            return {
              ...cleaned,
              uploadDate: currentDate
            };
          }
          return null;
        })
        .filter((stock): stock is StockData => stock !== null);

      if (validStocks.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No valid stocks to upload. Please check the data.');
        return;
      }

      console.log('Saving stocks:', validStocks); // Debug log

      // Map setup type to correct case
      const setupMap: Record<SetupType, SetupType> = {
        'VCP': 'VCP',
        'Rocket': 'Rocket',
        'IPO': 'IPO'
      };

      // Simple upsert operation
      const { data, error } = await supabase
        .from('setup_stock_lists')
        .upsert({
          setup_type: setupMap[setupType],
          stocks: validStocks,
          updated_by: session.user.email,
          updated_at: currentDate
        }, {
          onConflict: 'setup_type'
        })
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Save error:', error);
        toast.dismiss(loadingToast);
        toast.error(`Failed to save stock list: ${error.message}`);
        return;
      }

      if (!data) {
        console.error('No data returned after save');
        toast.dismiss(loadingToast);
        toast.error('Failed to verify saved data. Please check if the update was successful.');
        return;
      }

      // Success! Clear form and update UI
      toast.dismiss(loadingToast);
      toast.success(`Successfully saved ${validStocks.length} stocks for ${setupType}!`);
      
      // Clear the form
      const emptyStock: StockInput = { sr: 1, name: '', symbol: '', price: '', volume: '' };
      switch (setupType) {
        case 'VCP':
          setVcpStocks([emptyStock]);
          setVcpFile(null);
          break;
        case 'IPO':
          setIpoStocks([emptyStock]);
          setIpoFile(null);
          break;
        case 'Rocket':
          setRocketStocks([emptyStock]);
          setRocketFile(null);
          break;
      }

      // Force immediate refresh of all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['setup_stocks'] }),
        queryClient.invalidateQueries({ queryKey: ['scanner_stocks'] })
      ]);

      // Explicitly refetch the current setup's data
      const { data: refreshedData } = await supabase
        .from('setup_stock_lists')
        .select('*')
        .eq('setup_type', setupMap[setupType])
        .single();

      if (refreshedData) {
        // Update local state immediately
        const updatedStockLists = stockLists?.map(list => 
          list.setup_type === setupType ? refreshedData : list
        ) || [];
        queryClient.setQueryData(['setup_stocks'], updatedStockLists);
      }
      
      // Close modal
      setModalOpen(false);

    } catch (err: any) {
      console.error('Save error:', err);
      toast.dismiss(loadingToast);
      const errorMessage = err?.message || err?.error?.message || err?.details || 'Database operation failed';
      toast.error(`Failed to save stock list: ${errorMessage}`);
    }
  }

  // Delete stock function
  async function handleDeleteStock(setupType: SetupType, stockToDelete: StockInput) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      toast.error('You must be logged in to delete stocks');
      return;
    }

    const loadingToast = toast.loading(`Deleting ${stockToDelete.symbol}...`);

    try {
      // Get current stocks
      const { data: currentData } = await supabase
        .from('setup_stock_lists')
        .select('stocks')
        .eq('setup_type', setupType)
        .single();

      if (!currentData) {
        toast.dismiss(loadingToast);
        toast.error('Failed to find current stock list');
        return;
      }

      // Filter out the stock to delete and reindex sr numbers
      const updatedStocks = currentData.stocks
        .filter((stock: StockData) => stock.symbol !== stockToDelete.symbol)
        .map((stock: StockData, idx: number) => ({ ...stock, sr: idx + 1 }));

      // Update the database
      const { error } = await supabase
        .from('setup_stock_lists')
        .update({
          stocks: updatedStocks,
          updated_by: session.user.email,
          updated_at: new Date().toISOString()
        })
        .eq('setup_type', setupType);

      if (error) {
        console.error('Delete error:', error);
        toast.dismiss(loadingToast);
        toast.error(`Failed to delete stock: ${error.message}`);
        return;
      }

      // Update local state
      switch (setupType) {
        case 'VCP':
          setVcpStocks(prev => 
            prev.filter(s => s.symbol !== stockToDelete.symbol)
              .map((s, idx) => ({ ...s, sr: idx + 1 }))
          );
          break;
        case 'IPO':
          setIpoStocks(prev => 
            prev.filter(s => s.symbol !== stockToDelete.symbol)
              .map((s, idx) => ({ ...s, sr: idx + 1 }))
          );
          break;
        case 'Rocket':
          setRocketStocks(prev => 
            prev.filter(s => s.symbol !== stockToDelete.symbol)
              .map((s, idx) => ({ ...s, sr: idx + 1 }))
          );
          break;
      }

      // Success feedback
      toast.dismiss(loadingToast);
      toast.success(`Successfully deleted ${stockToDelete.symbol}`);

      // Refresh queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['setup_stocks'] }),
        queryClient.invalidateQueries({ queryKey: ['scanner_stocks'] })
      ]);

    } catch (err: any) {
      console.error('Delete error:', err);
      toast.dismiss(loadingToast);
      toast.error(`Failed to delete stock: ${err.message || 'Unknown error'}`);
    }
  }

  // Delete stock from scanner
  async function handleDeleteFromScanner(setupType: SetupType, stockSymbol: string) {
    const loadingToast = toast.loading(`Deleting ${stockSymbol}...`);

    try {
      // Get current stocks
      const { data: currentData } = await supabase
        .from('setup_stock_lists')
        .select('stocks')
        .eq('setup_type', setupType)
        .single();

      if (!currentData) {
        toast.dismiss(loadingToast);
        toast.error('Failed to find current stock list');
        return;
      }

      // Filter out the stock to delete and reindex sr numbers
      const updatedStocks = currentData.stocks
        .filter((stock: StockData) => stock.symbol !== stockSymbol)
        .map((stock: StockData, idx: number) => ({ ...stock, sr: idx + 1 }));

      // Update the database
      const { error } = await supabase
        .from('setup_stock_lists')
        .update({
          stocks: updatedStocks,
          updated_by: currentUser?.email,
          updated_at: new Date().toISOString()
        })
        .eq('setup_type', setupType);

      if (error) {
        console.error('Delete error:', error);
        toast.dismiss(loadingToast);
        toast.error(`Failed to delete stock: ${error.message}`);
        return;
      }

      // Success feedback
      toast.dismiss(loadingToast);
      toast.success(`Successfully deleted ${stockSymbol} from ${setupType} scanner`);

      // Refresh queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['setup_stocks'] }),
        queryClient.invalidateQueries({ queryKey: ['scanner_stocks'] })
      ]);

    } catch (err: any) {
      console.error('Delete error:', err);
      toast.dismiss(loadingToast);
      toast.error(`Failed to delete stock: ${err.message || 'Unknown error'}`);
    }
  }

  // File change handlers
  const handleVcpFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVcpFile(file);
      await handleFileExtract(file, setVcpPreview, setShowVcpPreview, 'VCP');
    }
  };

  const handleIpoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIpoFile(file);
      await handleFileExtract(file, setIpoPreview, setShowIpoPreview, 'IPO');
    }
  };

  const handleRocketFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRocketFile(file);
      await handleFileExtract(file, setRocketPreview, setShowRocketPreview, 'Rocket');
    }
  };

  // Table change handlers
  const handleVcpTableChange = (idx: number, field: string, value: string) => {
    setVcpStocks(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleIpoTableChange = (idx: number, field: string, value: string) => {
    setIpoStocks(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleRocketTableChange = (idx: number, field: string, value: string) => {
    setRocketStocks(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // Row management handlers
  const addRow = (stocks: StockInput[], setStocks: (stocks: StockInput[]) => void) => {
    setStocks([...stocks, { sr: stocks.length + 1, name: '', symbol: '', price: '', volume: '' }]);
  };

  const removeRow = (idx: number, stocks: StockInput[], setStocks: (stocks: StockInput[]) => void) => {
    if (stocks.length > 1) {
      setStocks(stocks.filter((_, i) => i !== idx).map((row, i) => ({ ...row, sr: i + 1 })));
    }
  };

  // Preview confirmation handlers
  const confirmPreview = (preview: StockData[], setStocks: (stocks: StockInput[]) => void, setShowPreview: (show: boolean) => void) => {
    setStocks(preview.map(p => ({
      sr: p.sr,
      name: p.name,
      symbol: p.symbol,
      price: p.price,
      volume: p.volume
    })));
    setShowPreview(false);
    toast.success('Stock list loaded from file. You can now review and edit before uploading.');
  };

  // Hide upload buttons if not admin
  if (!currentUser || !currentUser.email || !ADMIN_EMAILS.includes(currentUser.email)) {
    return null;
  }

  // Update the table row components to include delete button
  const renderTableRow = (
    row: StockInput,
    idx: number,
    handleChange: (idx: number, field: string, value: string) => void,
    setupType: SetupType
  ) => (
    <TableRow key={idx}>
      <TableCell>{idx + 1}</TableCell>
      <TableCell>
        <Input
          value={row.name}
          onChange={e => handleChange(idx, 'name', e.target.value)}
          placeholder="Stock Name"
          className="bg-slate-800"
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.symbol}
          onChange={e => handleChange(idx, 'symbol', e.target.value)}
          placeholder="Symbol"
          className="bg-slate-800"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={row.price}
          onChange={e => {
            const value = e.target.value;
            const formatted = value ? Number(parseFloat(value).toFixed(2)) : '';
            handleChange(idx, 'price', formatted.toString());
          }}
          placeholder="Price"
          className="bg-slate-800"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          value={row.volume}
          onChange={e => handleChange(idx, 'volume', e.target.value)}
          placeholder="Volume"
          className="bg-slate-800"
        />
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10"
            onClick={() => handleDeleteStock(setupType, row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => removeRow(idx, 
              setupType === 'VCP' ? vcpStocks : 
              setupType === 'IPO' ? ipoStocks : 
              rocketStocks, 
              setupType === 'VCP' ? setVcpStocks :
              setupType === 'IPO' ? setIpoStocks :
              setRocketStocks
            )}
          >
            ×
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  // Render current scanner stocks
  const renderScannerStocks = (setupType: SetupType) => {
    const setup = stockLists?.find(s => s.setup_type === setupType);
    
    // Sort stocks by upload date (newest first)
    const stocks = setup?.stocks?.slice() || [];
    stocks.sort((a, b) => {
      const dateA = new Date(a.uploadDate || 0);
      const dateB = new Date(b.uploadDate || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return (
      <div className="rounded-md border border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-800/50 hover:bg-slate-800/70">
              <TableHead className="text-slate-300 w-16">Sr.</TableHead>
              <TableHead className="text-slate-300">Stock Name</TableHead>
              <TableHead className="text-slate-300">Symbol</TableHead>
              <TableHead className="text-slate-300 text-right">Price</TableHead>
              <TableHead className="text-slate-300 text-right">Volume</TableHead>
              <TableHead className="text-slate-300">Upload Date</TableHead>
              <TableHead className="text-slate-300 w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-slate-400">
                  No stocks available
                </TableCell>
              </TableRow>
            ) : (
              stocks.map((stock: StockData, idx: number) => (
                <TableRow key={stock.symbol} className="border-slate-700 hover:bg-slate-800/50">
                  <TableCell className="text-slate-300">{idx + 1}</TableCell>
                  <TableCell className="text-slate-300 font-medium">{stock.name}</TableCell>
                  <TableCell className="text-blue-400">{stock.symbol}</TableCell>
                  <TableCell className="text-green-400 text-right">
                    ₹{typeof stock.price === 'number' ? stock.price.toFixed(2) : stock.price}
                  </TableCell>
                  <TableCell className="text-slate-300 text-right">
                    {stock.volume.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>{stock.uploadDate ? new Date(stock.uploadDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => handleDeleteFromScanner(setupType, stock.symbol)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* VCP Scanner Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader className="flex flex-col items-center text-center">
            <div className="p-3 bg-green-500/20 rounded-full mb-4">
              <Search className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-xl font-bold">VCP</CardTitle>
            <p className="text-sm text-gray-400">Volatility Contraction Pattern scanner</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <Button className="bg-green-600 hover:bg-green-700 text-white mb-2 w-full">
              Open VCP Scanner
            </Button>
            <Dialog open={openVCPModal} onOpenChange={setOpenVCPModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-green-600 text-green-400 w-full">
                  Upload Stock Table
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Stock Table (VCP)
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* File Upload Section */}
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Upload File</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Upload a CSV or Excel file with columns: Sr. | Stock Name | Symbol | Links | % Chg | Price | Volume
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleVcpFileChange}
                        className="flex-1"
                      />
                      {vcpFile && (
                        <Button
                          variant="outline"
                          onClick={() => setVcpFile(null)}
                          className="whitespace-nowrap"
                        >
                          Clear File
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Preview Section */}
                  {showVcpPreview && vcpPreview.length > 0 && (
                    <div className="bg-slate-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Preview from File</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowVcpPreview(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => confirmPreview(vcpPreview, setVcpStocks, setShowVcpPreview)}
                          >
                            Use This Data
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Sr.</TableHead>
                              <TableHead>Stock Name</TableHead>
                              <TableHead>Symbol</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Volume</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {vcpPreview.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{row.sr}</TableCell>
                                <TableCell>{row.name}</TableCell>
                                <TableCell>{row.symbol}</TableCell>
                                <TableCell>
                                  {typeof row.price === 'number' 
                                    ? row.price.toFixed(2) 
                                    : typeof row.price === 'string' && row.price
                                      ? Number(parseFloat(row.price).toFixed(2))
                                      : ''}
                                </TableCell>
                                <TableCell>{row.volume}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Manual Entry Section */}
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Manual Entry</h3>
                      <Button
                        variant="outline"
                        onClick={() => addRow(vcpStocks, setVcpStocks)}
                        className="whitespace-nowrap"
                      >
                        Add Row
                      </Button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">Sr.</TableHead>
                            <TableHead>Stock Name</TableHead>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vcpStocks.map((row, idx) => renderTableRow(row, idx, handleVcpTableChange, 'VCP'))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Validation Info */}
                  <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-400">Validation Rules</h4>
                        <ul className="text-sm text-gray-300 list-disc list-inside mt-1">
                          <li>Stock Name and Symbol are required</li>
                          <li>Price must be greater than 0</li>
                          <li>Volume must be greater than 0</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white w-full mt-4"
                    onClick={() => handleSaveStockList('VCP' as SetupType, vcpStocks, setOpenVCPModal)}
                  >
                    Save & Upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </motion.div>

      {/* IPO Scanner Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader className="flex flex-col items-center text-center">
            <div className="p-3 bg-blue-500/20 rounded-full mb-4">
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
            <CardTitle className="text-xl font-bold">IPO</CardTitle>
            <p className="text-sm text-gray-400">Scan for Initial Public Offerings and new listings</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white mb-2 w-full">
              Open IPO Scanner
            </Button>
            <Dialog open={openIPOModal} onOpenChange={setOpenIPOModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-600 text-blue-400 w-full">
                  Upload Stock Table
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Stock Table (IPO)
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* File Upload Section */}
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Upload File</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Upload a CSV or Excel file with columns: Sr. | Stock Name | Symbol | Links | % Chg | Price | Volume
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleIpoFileChange}
                        className="flex-1"
                      />
                      {ipoFile && (
                        <Button
                          variant="outline"
                          onClick={() => setIpoFile(null)}
                          className="whitespace-nowrap"
                        >
                          Clear File
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Preview Section */}
                  {showIpoPreview && ipoPreview.length > 0 && (
                    <div className="bg-slate-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Preview from File</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowIpoPreview(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => confirmPreview(ipoPreview, setIpoStocks, setShowIpoPreview)}
                          >
                            Use This Data
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Sr.</TableHead>
                              <TableHead>Stock Name</TableHead>
                              <TableHead>Symbol</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Volume</TableHead>
                              <TableHead>% Change</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ipoPreview.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{row.sr}</TableCell>
                                <TableCell>{row.name}</TableCell>
                                <TableCell>{row.symbol}</TableCell>
                                <TableCell>{row.price}</TableCell>
                                <TableCell>{row.volume}</TableCell>
                                <TableCell>{row.percentChange}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Manual Entry Section */}
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Manual Entry</h3>
                      <Button
                        variant="outline"
                        onClick={() => addRow(ipoStocks, setIpoStocks)}
                        className="whitespace-nowrap"
                      >
                        Add Row
                      </Button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">Sr.</TableHead>
                            <TableHead>Stock Name</TableHead>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ipoStocks.map((row, idx) => renderTableRow(row, idx, handleIpoTableChange, 'IPO'))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Validation Info */}
                  <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-400">Validation Rules</h4>
                        <ul className="text-sm text-gray-300 list-disc list-inside mt-1">
                          <li>Stock Name and Symbol are required</li>
                          <li>Price must be greater than 0</li>
                          <li>Volume must be greater than 0</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full mt-4"
                    onClick={() => handleSaveStockList('IPO' as SetupType, ipoStocks, setOpenIPOModal)}
                  >
                    Save & Upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </motion.div>

      {/* Rocket Scanner Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader className="flex flex-col items-center text-center">
            <div className="p-3 bg-orange-500/20 rounded-full mb-4">
              <Rocket className="w-8 h-8 text-orange-400" />
            </div>
            <CardTitle className="text-xl font-bold">Rocket</CardTitle>
            <p className="text-sm text-gray-400">High momentum breakout scanner</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white mb-2 w-full">
              Open Rocket Scanner
            </Button>
            <Dialog open={openRocketModal} onOpenChange={setOpenRocketModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-orange-600 text-orange-400 w-full">
                  Upload Stock Table
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Stock Table (Rocket)
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* File Upload Section */}
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Upload File</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Upload a CSV or Excel file with columns: Sr. | Stock Name | Symbol | Links | % Chg | Price | Volume
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleRocketFileChange}
                        className="flex-1"
                      />
                      {rocketFile && (
                        <Button
                          variant="outline"
                          onClick={() => setRocketFile(null)}
                          className="whitespace-nowrap"
                        >
                          Clear File
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Preview Section */}
                  {showRocketPreview && rocketPreview.length > 0 && (
                    <div className="bg-slate-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Preview from File</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowRocketPreview(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => confirmPreview(rocketPreview, setRocketStocks, setShowRocketPreview)}
                          >
                            Use This Data
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Sr.</TableHead>
                              <TableHead>Stock Name</TableHead>
                              <TableHead>Symbol</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Volume</TableHead>
                              <TableHead>% Change</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rocketPreview.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{row.sr}</TableCell>
                                <TableCell>{row.name}</TableCell>
                                <TableCell>{row.symbol}</TableCell>
                                <TableCell>{row.price}</TableCell>
                                <TableCell>{row.volume}</TableCell>
                                <TableCell>{row.percentChange}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Manual Entry Section */}
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Manual Entry</h3>
                      <Button
                        variant="outline"
                        onClick={() => addRow(rocketStocks, setRocketStocks)}
                        className="whitespace-nowrap"
                      >
                        Add Row
                      </Button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">Sr.</TableHead>
                            <TableHead>Stock Name</TableHead>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rocketStocks.map((row, idx) => renderTableRow(row, idx, handleRocketTableChange, 'Rocket'))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Validation Info */}
                  <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-400">Validation Rules</h4>
                        <ul className="text-sm text-gray-300 list-disc list-inside mt-1">
                          <li>Stock Name and Symbol are required</li>
                          <li>Price must be greater than 0</li>
                          <li>Volume must be greater than 0</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700 text-white w-full mt-4"
                    onClick={() => handleSaveStockList('Rocket' as SetupType, rocketStocks, setOpenRocketModal)}
                  >
                    Save & Upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}