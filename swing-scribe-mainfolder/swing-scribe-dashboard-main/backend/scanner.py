#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import yfinance as yf
import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
import logging
import json
from typing import Dict, List, Optional
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('scanner.log', encoding='utf-8')
    ]
)

logger = logging.getLogger(__name__)

class StockScanner:
    def __init__(self):
        self.ALPHA_VANTAGE_KEY = "1R88EC0OVK05M6EZ"  # Updated API key
        self.yahoo_session = requests.Session()
        self.alpha_vantage_session = requests.Session()
        self.rate_limit_delay = 1  # Delay in seconds between API calls
        self.max_retries = 3  # Maximum retries for API calls

    def scan_stock(self, symbol: str) -> Dict:
        """
        Main method to scan a single stock with real-time data
        """
        logger.info(f"\n{'='*80}")
        logger.info(f"Starting detailed scan for {symbol}")
        logger.info(f"{'='*80}")

        if not self._validate_symbol(symbol):
            return self._create_error_result(symbol, "Invalid stock symbol")

        try:
            # Step 1: Get Real-Time Data
            logger.info(f"Step 1: Fetching real-time data for {symbol}")
            real_time_data = self._get_realtime_data(symbol)
            if not real_time_data:
                return self._create_error_result(symbol, "Failed to fetch real-time data")

            # Step 2: Get Historical Data
            logger.info(f"Step 2: Fetching historical data for {symbol}")
            historical_data = self._get_historical_data(symbol)
            if historical_data is None:
                return self._create_error_result(symbol, "Failed to fetch historical data")

            # Step 3: Calculate Technical Indicators
            logger.info(f"Step 3: Calculating technical indicators for {symbol}")
            indicators = self._calculate_indicators(real_time_data, historical_data)
            if not indicators:
                return self._create_error_result(symbol, "Failed to calculate indicators")

            # Step 4: Check All Conditions
            logger.info(f"Step 4: Checking Rocket Base conditions for {symbol}")
            conditions = self._check_conditions(real_time_data, indicators)

            # Step 5: Prepare Result
            result = {
                'symbol': symbol,
                'timestamp': datetime.now().isoformat(),
                'price': real_time_data['price'],
                'volume': real_time_data['volume'],
                'percentChange': real_time_data['percentChange'],
                'indicators': indicators,
                'conditions': conditions,
                'allConditionsPassed': all(conditions.values()),
                'dataSource': real_time_data['source']
            }

            if not result['allConditionsPassed']:
                failed_conditions = [cond for cond, passed in conditions.items() if not passed]
                logger.info(f"❌ {symbol} failed conditions: {', '.join(failed_conditions)}")
            else:
                logger.info(f"✅ {symbol} PASSED ALL CONDITIONS!")

            # Introduce a delay to slow down scanning
            time.sleep(self.rate_limit_delay)

            return result

        except Exception as e:
            logger.error(f"Error scanning {symbol}: {str(e)}")
            return self._create_error_result(symbol, str(e))

    def _validate_symbol(self, symbol: str) -> bool:
        """
        Validate if the stock symbol is valid and listed on the exchange.
        """
        try:
            logger.info(f"Validating stock symbol: {symbol}")
            instruments = self.yahoo_session.get(f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={symbol}").json()
            if 'quoteResponse' in instruments and 'result' in instruments['quoteResponse']:
                results = instruments['quoteResponse']['result']
                if len(results) > 0:
                    logger.info(f"Symbol {symbol} is valid.")
                    return True
                else:
                    logger.warning(f"Symbol {symbol} is invalid or not listed.")
            else:
                logger.error(f"Unexpected response structure for symbol {symbol}: {instruments}")
        except Exception as e:
            logger.error(f"Error validating symbol {symbol}: {str(e)}")
        return False

    def _get_realtime_data(self, symbol: str) -> Optional[Dict]:
        """
        Get real-time stock data from multiple sources
        """
        # Define proxy pool with 12-15 rotating proxies
        proxy_pool = [
            'http://proxy1:port',
            'http://proxy2:port',
            'http://proxy3:port',
            'http://proxy4:port',
            'http://proxy5:port',
            'http://proxy6:port',
            'http://proxy7:port',
            'http://proxy8:port',
            'http://proxy9:port',
            'http://proxy10:port',
            'http://proxy11:port',
            'http://proxy12:port',
            'http://proxy13:port',
            'http://proxy14:port',
            'http://proxy15:port'
        ]

        # Try Yahoo Finance with rotating proxies
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Fetching real-time data from Yahoo Finance for {symbol} (Attempt {attempt + 1})")
                yahoo_symbol = f"{symbol}.NS" if '.' not in symbol else symbol
                ticker = yf.Ticker(yahoo_symbol)

                # Rotate proxies
                proxy = proxy_pool[attempt % len(proxy_pool)]
                proxies = {
                    'http': proxy,
                    'https': proxy
                }

                # Use proxy for requests
                with requests.Session() as session:
                    session.proxies.update(proxies)
                    info = ticker.info

                # Validate response
                if info and 'regularMarketPrice' in info:
                    logger.info(f"Successfully fetched data for {symbol} from Yahoo Finance.")
                    return {
                        'price': info['regularMarketPrice'],
                        'volume': info.get('regularMarketVolume', 0),
                        'previousClose': info.get('previousClose', 0),
                        'percentChange': ((info['regularMarketPrice'] - info['previousClose']) / info['previousClose']) * 100 if info.get('previousClose') else 0,
                        'high': info.get('dayHigh', 0),
                        'low': info.get('dayLow', 0),
                        'open': info.get('regularMarketOpen', 0),
                        'source': 'Yahoo Finance'
                    }
                else:
                    logger.error(f"Yahoo Finance response missing required fields for {symbol}: {info}")
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 429:  # Too Many Requests
                    logger.warning(f"Rate limit hit for Yahoo Finance. Retrying in {2 ** attempt} seconds...")
                    time.sleep(2 ** attempt)
                else:
                    logger.error(f"Yahoo Finance HTTP error for {symbol}: {str(e)}")
                    break
            except Exception as e:
                logger.error(f"Yahoo Finance error for {symbol}: {str(e)}")

        logger.warning(f"All attempts to fetch data from Yahoo Finance for {symbol} failed.")
        return None

    def _get_historical_data(self, symbol: str) -> Optional[pd.DataFrame]:
        """
        Get historical data for technical analysis using Yahoo Finance
        """
        try:
            logger.info(f"Fetching historical data from Yahoo Finance for {symbol}")
            yahoo_symbol = f"{symbol}.NS" if '.' not in symbol else symbol
            ticker = yf.Ticker(yahoo_symbol)

            # Fetch historical data for the last 180 days
            historical_data = ticker.history(period="180d")

            if historical_data.empty:
                logger.error(f"No historical data found for {symbol} on Yahoo Finance.")
                return None

            # Format the DataFrame
            historical_data.reset_index(inplace=True)
            historical_data.rename(columns={
                'Open': 'open',
                'High': 'high',
                'Low': 'low',
                'Close': 'close',
                'Volume': 'volume'
            }, inplace=True)

            return historical_data[['open', 'high', 'low', 'close', 'volume']]
        except Exception as e:
            logger.error(f"Yahoo Finance error fetching historical data for {symbol}: {str(e)}")
        return None

    def _calculate_indicators(self, real_time_data: Dict, historical_data: pd.DataFrame) -> Dict:
        """
        Calculate all technical indicators needed for Rocket Base conditions
        """
        try:
            # Prepare data
            closes = historical_data['Close'].values
            highs = historical_data['High'].values
            lows = historical_data['Low'].values
            volumes = historical_data['Volume'].values
            
            # Add current price to historical data
            current_price = real_time_data['price']
            current_volume = real_time_data['volume']
            
            closes = np.insert(closes, 0, current_price)
            volumes = np.insert(volumes, 0, current_volume)
            
            # Calculate indicators
            indicators = {}
            
            # WMA calculations
            indicators['dailyWMA1'] = self._calculate_wma(closes, 1)
            indicators['monthlyWMA2'] = self._calculate_wma(closes, 2)
            indicators['monthlyWMA4'] = self._calculate_wma(closes, 4)
            indicators['weeklyWMA6'] = self._calculate_wma(closes, 6)
            indicators['weeklyWMA12'] = self._calculate_wma(closes, 12)
            indicators['wma12From4DaysAgo'] = self._calculate_wma(closes[4:], 12)
            indicators['wma20From2DaysAgo'] = self._calculate_wma(closes[2:], 20)
            
            # Volume averages
            indicators['avgVolume5'] = np.mean(volumes[:5])
            indicators['avgVolume10'] = np.mean(volumes[5:15])
            
            # RSI
            indicators['rsi'] = self._calculate_rsi(closes)
            
            # ATR
            indicators['atr'] = self._calculate_atr(highs, lows, closes)
            indicators['atrPercentage'] = (indicators['atr'] / current_price) * 100
            
            # ADX
            indicators['adx'] = self._calculate_adx(highs, lows, closes)
            
            # Base duration
            indicators['baseDuration'] = self._calculate_base_duration(highs, lows)
            
            # 5-day metrics
            indicators['fiveDayChange'] = ((current_price - closes[5]) / closes[5]) * 100 if len(closes) > 5 else 0
            five_day_high = max(highs[:5]) if len(highs) >= 5 else highs[0]
            five_day_low = min(lows[:5]) if len(lows) >= 5 else lows[0]
            indicators['fiveDayRange'] = ((five_day_high - five_day_low) / five_day_low) * 100
            
            return indicators
            
        except Exception as e:
            logger.error(f"Error calculating indicators: {str(e)}")
            return None
            
    def _check_conditions(self, real_time_data: Dict, indicators: Dict) -> Dict:
        """
        Check all Rocket Base conditions
        """
        conditions = {}

        # Price & Volume conditions
        conditions['price'] = real_time_data['price'] > 70
        conditions['volume'] = real_time_data['volume'] > 85000
        conditions['percentChange'] = real_time_data['percentChange'] > 0
        conditions['fiveDayChange'] = indicators['fiveDayChange'] < 10

        # WMA Filters
        conditions['wmaFilter1'] = indicators['dailyWMA1'] > (indicators['monthlyWMA2'] + 1)
        conditions['wmaFilter2'] = indicators['monthlyWMA2'] > (indicators['monthlyWMA4'] + 2)
        conditions['wmaFilter3'] = indicators['dailyWMA1'] > (indicators['weeklyWMA6'] + 2)
        conditions['wmaFilter4'] = indicators['weeklyWMA6'] > (indicators['weeklyWMA12'] + 2)
        conditions['wmaFilter5'] = indicators['dailyWMA1'] > (indicators['wma12From4DaysAgo'] + 2)
        conditions['wmaFilter6'] = indicators['dailyWMA1'] > (indicators['wma20From2DaysAgo'] + 2)

        # Log each condition and its result
        for condition, result in conditions.items():
            logger.info(f"Condition '{condition}': {'PASSED' if result else 'FAILED'}")

        return conditions
        
    def _calculate_wma(self, data: np.ndarray, period: int) -> float:
        """Calculate Weighted Moving Average"""
        if len(data) < period:
            return 0
        weights = np.arange(period, 0, -1)
        return np.sum(data[:period] * weights) / weights.sum()
        
    def _calculate_rsi(self, prices: np.ndarray, period: int = 14) -> float:
        """Calculate RSI"""
        if len(prices) <= period:
            return 0
            
        deltas = np.diff(prices)
        seed = deltas[:period+1]
        up = seed[seed >= 0].sum()/period
        down = -seed[seed < 0].sum()/period
        
        if down == 0:
            return 100
            
        rs = up/down
        return 100 - (100/(1+rs))
        
    def _calculate_atr(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> float:
        """Calculate ATR"""
        if len(highs) < period + 1:
            return 0
            
        true_ranges = []
        for i in range(1, period + 1):
            true_ranges.append(max(
                highs[i-1] - lows[i-1],
                abs(highs[i-1] - closes[i]),
                abs(lows[i-1] - closes[i])
            ))
            
        return np.mean(true_ranges)
        
    def _calculate_adx(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> float:
        """Calculate ADX"""
        if len(highs) < period * 2:
            return 0
            
        # Calculate +DM, -DM, and TR
        plus_dm = np.zeros_like(highs)
        minus_dm = np.zeros_like(highs)
        tr = np.zeros_like(highs)
        
        for i in range(1, len(highs)):
            h_diff = highs[i] - highs[i-1]
            l_diff = lows[i-1] - lows[i]
            
            plus_dm[i] = max(h_diff, 0) if h_diff > l_diff else 0
            minus_dm[i] = max(l_diff, 0) if l_diff > h_diff else 0
            
            tr[i] = max(
                highs[i] - lows[i],
                abs(highs[i] - closes[i-1]),
                abs(lows[i] - closes[i-1])
            )
            
        # Calculate smoothed averages
        tr_avg = np.mean(tr[1:period+1])
        plus_dm_avg = np.mean(plus_dm[1:period+1])
        minus_dm_avg = np.mean(minus_dm[1:period+1])
        
        # Calculate +DI and -DI
        plus_di = 100 * plus_dm_avg / tr_avg if tr_avg != 0 else 0
        minus_di = 100 * minus_dm_avg / tr_avg if tr_avg != 0 else 0
        
        # Calculate DX
        dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di) if (plus_di + minus_di) != 0 else 0
        
        return dx
        
    def _calculate_base_duration(self, highs: np.ndarray, lows: np.ndarray, period: int = 10) -> int:
        """Calculate base duration"""
        if len(highs) < period:
            return 0
            
        for days in range(period, min(20, len(highs))):
            highest = max(highs[:days])
            lowest = min(lows[:days])
            range_percent = ((highest - lowest) / lowest) * 100
            
            if range_percent >= 10:
                return days - 1
                
        return min(20, len(highs))
        
    def _create_error_result(self, symbol: str, error: str) -> Dict:
        """Create error result dictionary"""
        return {
            'symbol': symbol,
            'error': error,
            'timestamp': datetime.now().isoformat(),
            'allConditionsPassed': False
        }
        
    def scan_stocks_from_file(self, file_path: str):
        """
        Scan stocks listed in an uploaded file and display results in a table.
        """
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return

        try:
            file_path = os.path.abspath(file_path)  # Ensure absolute path

            # Read stock symbols from the uploaded file
            import pandas as pd
            df = pd.read_csv(file_path, delimiter='\t')  # Assuming tab-delimited file

            if 'Symbol' not in df.columns:
                logger.error("The uploaded file does not contain a 'Symbol' column.")
                return

            symbols = df['Symbol'].dropna().unique()  # Extract unique symbols

            results = []

            for symbol in symbols:
                result = self.scan_stock(symbol)
                results.append(result)

            # Display results in a table
            self._display_results_table(results)

        except Exception as e:
            logger.error(f"Error processing file {file_path}: {str(e)}")

    def _display_results_table(self, results: List[Dict]):
        """
        Display the scan results in a formatted table.
        """
        try:
            import pandas as pd

            df = pd.DataFrame(results)
            print(df.to_string(index=False))

        except ImportError:
            logger.error("Pandas is required to display results in a table.")
            print("Results:")
            for result in results:
                print(result)

# Example usage
if __name__ == "__main__":
    scanner = StockScanner()
    file_path = "c:\\Users\\Admin\\Downloads\\swing-scribe-mainfolder\\swing-scribe-dashboard-main\\backend\\uploaded_stocks.txt"
    scanner.scan_stocks_from_file(file_path)