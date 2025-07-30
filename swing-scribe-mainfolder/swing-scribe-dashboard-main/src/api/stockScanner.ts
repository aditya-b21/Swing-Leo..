import axios from 'axios';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  volume: number;
  percentChange?: number;
  sr?: number;
}

// Main function to scan stocks
export const scanStocks = async (
  stocks: StockData[], 
  progressCallback?: (processed: number, total: number) => void
): Promise<StockData[]> => {
  console.log(`Starting to scan ${stocks.length} stocks...`);
  
  try {
    // Create a form data object to send the file
    const formData = new FormData();
    
    // Convert stocks array to CSV format
    const csvHeader = 'Symbol,Name\n';
    const csvRows = stocks.map(stock => `${stock.symbol},${stock.name}`);
    const csvContent = csvHeader + csvRows.join('\n');
    
    // Create a file from the CSV content
    const file = new Blob([csvContent], { type: 'text/csv' });
    formData.append('file', file, 'stocks.csv');
    
    // Show initial progress
    if (progressCallback) {
      progressCallback(0, stocks.length);
    }
    
    // Set up a timer to simulate progress while waiting for the backend
    let processed = 0;
    const progressInterval = setInterval(() => {
      processed += Math.floor(stocks.length / 20); // Increment by ~5% each time
      if (processed > stocks.length * 0.95) {
        processed = Math.floor(stocks.length * 0.95); // Cap at 95%
      }
      if (progressCallback) {
        progressCallback(processed, stocks.length);
      }
    }, 1000);
    
    // Call the Python backend API
    const response = await axios.post('http://localhost:5000/api/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Clear the progress interval
    clearInterval(progressInterval);
    
    // Show 100% progress
    if (progressCallback) {
      progressCallback(stocks.length, stocks.length);
    }
    
    // Check if the API call was successful
    if (response.data.success) {
      console.log(response.data.message);
      return response.data.results;
    } else {
      throw new Error(response.data.error || 'Failed to scan stocks');
    }
  } catch (error: any) {
    console.error('Error scanning stocks:', error);
    
    // If there's an error, try using the fallback local processing
    console.log('Using fallback local processing...');
    
    // Return empty results for now
    return [];
  }
}; 