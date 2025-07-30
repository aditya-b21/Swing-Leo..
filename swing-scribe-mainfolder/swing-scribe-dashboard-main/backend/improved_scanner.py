#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import requests
import time
import yfinance as yf
import logging
from datetime import datetime, timedelta

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

class ImprovedScanner:
    def __init__(self):
        self.alpha_vantage_key = "D0S6FR2CY3CJNF4H"
        self.yahoo_session = requests.Session()
        self.alpha_vantage_session = requests.Session()
        
    def _get_yahoo_finance_data(self, symbol: str) -> Optional[pd.DataFrame]:
        """Get data from Yahoo Finance with retries"""
        try:
            logger.info(f"Fetching Yahoo Finance data for {symbol}")
            
            # Try NSE first
            ticker = yf.Ticker(f"{symbol}.NS")
            df = ticker.history(period="60d", interval="1d")
            
            if df.empty:
                logger.info(f"No NSE data for {symbol}, trying BSE")
                # Try BSE if NSE fails
                ticker = yf.Ticker(f"{symbol}.BO")
                df = ticker.history(period="60d", interval="1d")
            
            if df.empty:
                logger.error(f"No data found for {symbol} on Yahoo Finance")
                return None
                
            # Standardize column names
            df.columns = [col.lower() for col in df.columns]
            df = df.sort_index()
            
            # Get real-time data
            info = ticker.info
            if info and 'regularMarketPrice' in info:
                current_price = info['regularMarketPrice']
                current_volume = info.get('regularMarketVolume', df['volume'].iloc[-1])
                
                # Add current price to historical data
                latest_row = pd.DataFrame({
                    'open': [current_price],
                    'high': [current_price],
                    'low': [current_price],
                    'close': [current_price],
                    'volume': [current_volume]
                }, index=[pd.Timestamp.now()])
                
                df = pd.concat([latest_row, df])
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching Yahoo Finance data for {symbol}: {str(e)}")
            return None
    
    def _get_alpha_vantage_data(self, symbol: str) -> Optional[pd.DataFrame]:
        """Get data from Alpha Vantage with retries"""
        try:
            logger.info(f"Fetching Alpha Vantage data for {symbol}")
            
            # Get real-time quote first
            quote_url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={self.alpha_vantage_key}"
            quote_response = self.alpha_vantage_session.get(quote_url, timeout=10)
            quote_data = quote_response.json()
            
            time.sleep(1)  # Rate limiting
            
            # Get historical data
            hist_url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&outputsize=full&apikey={self.alpha_vantage_key}"
            hist_response = self.alpha_vantage_session.get(hist_url, timeout=10)
            hist_data = hist_response.json()
            
            if "Time Series (Daily)" not in hist_data:
                logger.error(f"No historical data found for {symbol} on Alpha Vantage")
                return None
                
            df = pd.DataFrame(hist_data["Time Series (Daily)"]).T
            df.columns = ['open', 'high', 'low', 'close', 'volume']
            df = df.astype(float)
            df = df.sort_index()
            
            # Add real-time data if available
            if 'Global Quote' in quote_data:
                quote = quote_data['Global Quote']
                current_price = float(quote['05. price'])
                current_volume = int(quote['06. volume'])
                
                latest_row = pd.DataFrame({
                    'open': [current_price],
                    'high': [current_price],
                    'low': [current_price],
                    'close': [current_price],
                    'volume': [current_volume]
                }, index=[pd.Timestamp.now()])
                
                df = pd.concat([latest_row, df])
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching Alpha Vantage data for {symbol}: {str(e)}")
            return None
    
    def calculate_wma(self, data: pd.Series, period: int) -> float:
        """Calculate Weighted Moving Average"""
        try:
            weights = np.arange(1, period + 1)
            values = data[-period:].values if isinstance(data, pd.Series) else data[-period:]
            return np.average(values, weights=weights)
        except Exception as e:
            logger.error(f"Error calculating WMA: {str(e)}")
            return 0
    
    def check_conditions(self, df: pd.DataFrame, current_price: float, 
                        current_volume: float, percent_change: float) -> Dict:
        """Check all Rocket Base conditions"""
        try:
            conditions = {}
            
            # 1. Price and Volume Conditions
            conditions['price'] = current_price > 70
            conditions['volume'] = current_volume > 85000
            conditions['percentChange'] = percent_change > 0
            
            # 2. 5-day calculations
            last_5_days = df[-5:]
            five_day_change = ((current_price - last_5_days['close'].iloc[0]) / 
                             last_5_days['close'].iloc[0] * 100)
            conditions['fiveDayChange'] = five_day_change < 10
            
            five_day_range = ((last_5_days['high'].max() - last_5_days['low'].min()) / 
                            last_5_days['low'].min() * 100)
            conditions['fiveDayRange'] = five_day_range < 10
            
            # 3. WMA Calculations
            close_series = df['close']
            
            wma = {
                'dailyWMA1': self.calculate_wma(close_series, 1),
                'monthlyWMA2': self.calculate_wma(close_series, 2),
                'monthlyWMA4': self.calculate_wma(close_series, 4),
                'weeklyWMA6': self.calculate_wma(close_series, 6),
                'weeklyWMA12': self.calculate_wma(close_series, 12),
                'wma12From4DaysAgo': self.calculate_wma(close_series[:-4], 12),
                'wma20From2DaysAgo': self.calculate_wma(close_series[:-2], 20)
            }
            
            # WMA Conditions
            conditions['wmaFilter1'] = wma['dailyWMA1'] > (wma['monthlyWMA2'] + 1)
            conditions['wmaFilter2'] = wma['monthlyWMA2'] > (wma['monthlyWMA4'] + 2)
            conditions['wmaFilter3'] = wma['dailyWMA1'] > (wma['weeklyWMA6'] + 2)
            conditions['wmaFilter4'] = wma['weeklyWMA6'] > (wma['weeklyWMA12'] + 2)
            conditions['wmaFilter5'] = wma['dailyWMA1'] > (wma['wma12From4DaysAgo'] + 2)
            conditions['wmaFilter6'] = wma['dailyWMA1'] > (wma['wma20From2DaysAgo'] + 2)
            
            # 4. Volume Contraction
            last_5_volume = df['volume'][-5:].mean()
            prev_10_volume = df['volume'][-15:-5].mean()
            conditions['volumeContraction'] = last_5_volume < prev_10_volume
            
            # 5. RSI Calculation
            delta = df['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            current_rsi = rsi.iloc[-1]
            conditions['rsi'] = current_rsi > 60
            
            # 6. ATR Calculation
            high_low = df['high'] - df['low']
            high_close = abs(df['high'] - df['close'].shift())
            low_close = abs(df['low'] - df['close'].shift())
            ranges = pd.concat([high_low, high_close, low_close], axis=1)
            true_range = ranges.max(axis=1)
            atr = true_range.rolling(window=14).mean().iloc[-1]
            atr_percentage = (atr / current_price) * 100
            conditions['atrVolatility'] = atr_percentage < 5
            
            # 7. ADX Calculation (simplified)
            tr = true_range
            plus_dm = df['high'].diff()
            minus_dm = -df['low'].diff()
            plus_dm = plus_dm.where(plus_dm > minus_dm, 0)
            minus_dm = minus_dm.where(minus_dm > plus_dm, 0)
            
            tr14 = tr.rolling(window=14).sum()
            plus_di14 = 100 * plus_dm.rolling(window=14).sum() / tr14
            minus_di14 = 100 * minus_dm.rolling(window=14).sum() / tr14
            dx = 100 * abs(plus_di14 - minus_di14) / (plus_di14 + minus_di14)
            adx = dx.rolling(window=14).mean()
            conditions['adx'] = adx.iloc[-1] > 20
            
            # 8. Base Duration
            for days in range(10, min(20, len(df))):
                period_data = df[-days:]
                range_percent = ((period_data['high'].max() - period_data['low'].min()) / 
                               period_data['low'].min() * 100)
                if range_percent >= 10:
                    base_duration = days - 1
                    break
            else:
                base_duration = min(20, len(df))
            
            conditions['baseDuration'] = base_duration >= 10
            
            # Check if all conditions are met
            all_passed = all(conditions.values())
            
            # Prepare result
            result = {
                'passed': all_passed,
                'conditions': conditions,
                'details': {
                    'price': current_price,
                    'volume': current_volume,
                    'percentChange': percent_change,
                    'fiveDayChange': five_day_change,
                    'fiveDayRange': five_day_range,
                    'rsi': current_rsi,
                    'atr': atr_percentage,
                    'adx': adx.iloc[-1],
                    'baseDuration': base_duration,
                    'wma': wma
                }
            }
            
            if not all_passed:
                result['failedConditions'] = [
                    cond for cond, passed in conditions.items() 
                    if not passed
                ]
            
            return result
            
        except Exception as e:
            logger.error(f"Error checking conditions: {str(e)}")
            return {
                'passed': False,
                'error': str(e)
            }
    
    def scan_stock(self, stock_info: Dict) -> Dict:
        """Scan a single stock"""
        try:
            symbol = stock_info['symbol']
            logger.info(f"\n{'='*80}\nScanning {symbol}...")
            
            # Try Yahoo Finance first
            df = self._get_yahoo_finance_data(symbol)
            data_source = "Yahoo Finance"
            
            # If Yahoo fails, try Alpha Vantage
            if df is None:
                logger.info(f"Yahoo Finance failed for {symbol}, trying Alpha Vantage")
                time.sleep(1)  # Rate limiting
                df = self._get_alpha_vantage_data(symbol)
                data_source = "Alpha Vantage"
            
            if df is None:
                logger.error(f"Failed to fetch data for {symbol} from all sources")
                return {
                    "symbol": symbol,
                    "passed": False,
                    "error": "Failed to fetch data from all sources"
                }
            
            # Get current values
            current_price = float(df['close'].iloc[-1])
            current_volume = float(df['volume'].iloc[-1])
            prev_close = float(df['close'].iloc[-2])
            percent_change = ((current_price - prev_close) / prev_close) * 100
            
            # Check conditions
            result = self.check_conditions(df, current_price, current_volume, percent_change)
            
            # Prepare response
            response = {
                "symbol": symbol,
                "name": stock_info.get('name', symbol),
                "price": current_price,
                "volume": current_volume,
                "percentChange": percent_change,
                "passed": result["passed"],
                "dataSource": data_source,
                "timestamp": datetime.now().isoformat()
            }
            
            if 'error' in result:
                response['error'] = result['error']
            else:
                response.update({
                    "conditions": result["conditions"],
                    "details": result["details"]
                })
                
                if not result["passed"]:
                    response["failedConditions"] = result["failedConditions"]
            
            return response
            
        except Exception as e:
            logger.error(f"Error scanning {symbol}: {str(e)}")
            return {
                "symbol": symbol,
                "passed": False,
                "error": str(e)
            }
    
    def scan_stocks(self, stock_list: List[Dict]) -> Dict:
        """Scan multiple stocks"""
        results = []
        passed_stocks = []
        failed_stocks = []
        errors = []
        
        start_time = time.time()
        total_stocks = len(stock_list)
        
        logger.info(f"\n{'*'*80}")
        logger.info(f"Starting scan of {total_stocks} stocks")
        logger.info(f"{'*'*80}")
        
        for i, stock in enumerate(stock_list, 1):
            try:
                logger.info(f"\nProcessing stock {i}/{total_stocks}: {stock['symbol']}")
                
                # Add delay between stocks
                if i > 1:
                    time.sleep(2)
                
                result = self.scan_stock(stock)
                
                if 'error' in result:
                    errors.append(result)
                    logger.error(f"Error processing {stock['symbol']}: {result['error']}")
                elif result['passed']:
                    passed_stocks.append({
                        "sr": len(passed_stocks) + 1,
                        "symbol": result["symbol"],
                        "name": result["name"],
                        "price": result["price"],
                        "volume": result["volume"],
                        "percentChange": result["percentChange"],
                        "dataSource": result["dataSource"],
                        "details": result["details"]
                    })
                    logger.info(f"✅ {stock['symbol']} passed all conditions")
                else:
                    failed_stocks.append({
                        "symbol": result["symbol"],
                        "failedConditions": result.get("failedConditions", []),
                        "details": result.get("details", {})
                    })
                    logger.info(f"❌ {stock['symbol']} failed conditions: {', '.join(result.get('failedConditions', []))}")
                
            except Exception as e:
                logger.error(f"Error processing {stock['symbol']}: {str(e)}")
                errors.append({
                    "symbol": stock['symbol'],
                    "error": str(e)
                })
        
        end_time = time.time()
        total_time = end_time - start_time
        
        logger.info(f"\n{'*'*80}")
        logger.info(f"Scan completed in {total_time:.2f} seconds")
        logger.info(f"Passed: {len(passed_stocks)}, Failed: {len(failed_stocks)}, Errors: {len(errors)}")
        logger.info(f"{'*'*80}")
        
        return {
            "passed_stocks": passed_stocks,
            "failed_stocks": failed_stocks,
            "errors": errors,
            "stats": {
                "total_scanned": total_stocks,
                "total_passed": len(passed_stocks),
                "total_failed": len(failed_stocks),
                "total_errors": len(errors),
                "processing_time": total_time,
                "average_time_per_stock": total_time / total_stocks if total_stocks else 0
            }
        } 