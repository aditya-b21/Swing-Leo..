#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import yfinance as yf
import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
import logging
from typing import Dict, Optional

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

class StockProcessor:
    def __init__(self):
        self.alpha_vantage_key = "D0S6FR2CY3CJNF4H"
        
    def process_stock(self, symbol: str) -> Dict:
        """Process a single stock thoroughly with all Rocket Base conditions"""
        try:
            logger.info(f"\n{'='*80}")
            logger.info(f"Starting detailed processing of {symbol}")
            logger.info(f"{'='*80}")
            
            # Step 1: Get Real-Time Data
            logger.info(f"Step 1: Fetching real-time data for {symbol}")
            real_time_data = self._get_realtime_data(symbol)
            if not real_time_data:
                return self._create_error_result(symbol, "Failed to get real-time data")
            
            # Log real-time data
            logger.info(f"Real-time data for {symbol}:")
            logger.info(f"  Price: {real_time_data['price']:.2f}")
            logger.info(f"  Volume: {real_time_data['volume']:,}")
            logger.info(f"  Change: {real_time_data['change']:.2f}%")
            
            # Step 2: Get Historical Data (90 days)
            logger.info(f"Step 2: Fetching historical data for {symbol}")
            historical_data = self._get_historical_data(symbol, days=90)
            if historical_data is None:
                return self._create_error_result(symbol, "Failed to get historical data")
            
            # Step 3: Calculate Technical Indicators
            logger.info(f"Step 3: Calculating technical indicators for {symbol}")
            indicators = self._calculate_indicators(historical_data, real_time_data)
            
            # Step 4: Check Each Condition
            logger.info(f"Step 4: Checking conditions for {symbol}")
            conditions = self._check_all_conditions(real_time_data, historical_data, indicators)
            
            # Create result
            result = {
                'symbol': symbol,
                'price': real_time_data['price'],
                'volume': real_time_data['volume'],
                'change': real_time_data['change'],
                'passed': conditions['allPassed'],
                'conditions': conditions['results'],
                'indicators': indicators,
                'timestamp': datetime.now().isoformat(),
                'dataSource': real_time_data['source']
            }
            
            if not conditions['allPassed']:
                result['failedConditions'] = conditions['failed']
                logger.info(f"❌ {symbol} failed conditions: {', '.join(conditions['failed'])}")
            else:
                logger.info(f"✅ {symbol} PASSED all conditions!")
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing {symbol}: {str(e)}")
            return self._create_error_result(symbol, str(e))
    
    def _get_realtime_data(self, symbol: str) -> Optional[Dict]:
        """Get real-time stock data with fallback options"""
        try:
            # Try Yahoo Finance first
            logger.info(f"Fetching from Yahoo Finance: {symbol}")
            
            # Add .NS suffix for NSE stocks
            yahoo_symbol = f"{symbol}.NS"
            ticker = yf.Ticker(yahoo_symbol)
            
            # Get real-time data
            info = ticker.info
            if not info or 'regularMarketPrice' not in info:
                logger.error(f"No real-time data from Yahoo Finance for {symbol}")
                return None
            
            data = {
                'price': info['regularMarketPrice'],
                'volume': info['regularMarketVolume'],
                'change': info['regularMarketChangePercent'],
                'high': info['dayHigh'],
                'low': info['dayLow'],
                'open': info['regularMarketOpen'],
                'prevClose': info['previousClose'],
                'source': 'Yahoo Finance'
            }
            
            logger.info(f"Successfully got real-time data from Yahoo Finance")
            return data
            
        except Exception as e:
            logger.error(f"Yahoo Finance error: {str(e)}")
            
            # Try Alpha Vantage as backup
            try:
                logger.info(f"Trying Alpha Vantage for {symbol}")
                time.sleep(1)  # Rate limiting
                
                url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={self.alpha_vantage_key}"
                response = requests.get(url, timeout=10)
                result = response.json()
                
                if 'Global Quote' not in result:
                    logger.error(f"No data from Alpha Vantage for {symbol}")
                    return None
                
                quote = result['Global Quote']
                data = {
                    'price': float(quote['05. price']),
                    'volume': int(quote['06. volume']),
                    'change': float(quote['10. change percent'].rstrip('%')),
                    'high': float(quote['03. high']),
                    'low': float(quote['04. low']),
                    'open': float(quote['02. open']),
                    'prevClose': float(quote['08. previous close']),
                    'source': 'Alpha Vantage'
                }
                
                logger.info(f"Successfully got real-time data from Alpha Vantage")
                return data
                
            except Exception as av_error:
                logger.error(f"Alpha Vantage error: {str(av_error)}")
                return None
    
    def _get_historical_data(self, symbol: str, days: int = 90) -> Optional[pd.DataFrame]:
        """Get historical data for analysis"""
        try:
            logger.info(f"Getting {days} days of historical data")
            
            ticker = yf.Ticker(f"{symbol}.NS")
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            df = ticker.history(start=start_date, end=end_date)
            if df.empty:
                logger.error(f"No historical data available")
                return None
            
            logger.info(f"Got {len(df)} days of historical data")
            return df
            
        except Exception as e:
            logger.error(f"Error getting historical data: {str(e)}")
            return None
    
    def _calculate_indicators(self, df: pd.DataFrame, real_time: Dict) -> Dict:
        """Calculate all technical indicators"""
        try:
            indicators = {}
            
            # Get data arrays
            closes = df['Close'].values
            highs = df['High'].values
            lows = df['Low'].values
            volumes = df['Volume'].values
            
            # Add current price to historical data
            closes = np.insert(closes, 0, real_time['price'])
            volumes = np.insert(volumes, 0, real_time['volume'])
            
            # 1. Calculate WMAs
            indicators['dailyWMA1'] = self._calculate_wma(closes, 1)
            indicators['monthlyWMA2'] = self._calculate_wma(closes, 2)
            indicators['monthlyWMA4'] = self._calculate_wma(closes, 4)
            indicators['weeklyWMA6'] = self._calculate_wma(closes, 6)
            indicators['weeklyWMA12'] = self._calculate_wma(closes, 12)
            indicators['wma12From4DaysAgo'] = self._calculate_wma(closes[4:], 12)
            indicators['wma20From2DaysAgo'] = self._calculate_wma(closes[2:], 20)
            
            # 2. Volume Averages
            indicators['avgVolume5'] = np.mean(volumes[:5])
            indicators['avgVolume10'] = np.mean(volumes[5:15])
            
            # 3. RSI
            indicators['rsi'] = self._calculate_rsi(closes)
            
            # 4. ATR
            indicators['atr'] = self._calculate_atr(highs, lows, closes)
            indicators['atrPercentage'] = (indicators['atr'] / real_time['price']) * 100
            
            # 5. Five Day Metrics
            indicators['fiveDayChange'] = ((real_time['price'] - closes[5]) / closes[5]) * 100 if len(closes) > 5 else 0
            indicators['fiveDayRange'] = ((max(highs[:5]) - min(lows[:5])) / min(lows[:5])) * 100 if len(highs) > 5 else 0
            
            # Log indicators
            logger.info("Technical Indicators:")
            logger.info(f"  RSI: {indicators['rsi']:.2f}")
            logger.info(f"  ATR%: {indicators['atrPercentage']:.2f}%")
            logger.info(f"  5-Day Change: {indicators['fiveDayChange']:.2f}%")
            logger.info(f"  5-Day Range: {indicators['fiveDayRange']:.2f}%")
            
            return indicators
            
        except Exception as e:
            logger.error(f"Error calculating indicators: {str(e)}")
            return {}
    
    def _check_all_conditions(self, real_time: Dict, df: pd.DataFrame, 
                            indicators: Dict) -> Dict:
        """Check all Rocket Base conditions"""
        conditions = {}
        failed = []
        
        # 1. Price Conditions
        logger.info("Checking price conditions...")
        conditions['price'] = real_time['price'] > 70
        if not conditions['price']:
            failed.append('price')
            logger.info(f"❌ Failed price > ₹70 condition: {real_time['price']:.2f}")
        
        # 2. Volume Conditions
        logger.info("Checking volume conditions...")
        conditions['volume'] = real_time['volume'] > 85000
        if not conditions['volume']:
            failed.append('volume')
            logger.info(f"❌ Failed volume > 85,000 condition: {real_time['volume']:,}")
        
        # 3. Percent Change
        logger.info("Checking percent change...")
        conditions['percentChange'] = real_time['change'] > 0
        if not conditions['percentChange']:
            failed.append('percentChange')
            logger.info(f"❌ Failed positive % change condition: {real_time['change']:.2f}%")
        
        # 4. Five Day Conditions
        logger.info("Checking 5-day conditions...")
        conditions['fiveDayChange'] = indicators['fiveDayChange'] < 8  # Updated to 8%
        if not conditions['fiveDayChange']:
            failed.append('fiveDayChange')
            logger.info(f"❌ Failed 5-day change < 8% condition: {indicators['fiveDayChange']:.2f}%")
        
        conditions['fiveDayRange'] = indicators['fiveDayRange'] < 10
        if not conditions['fiveDayRange']:
            failed.append('fiveDayRange')
            logger.info(f"❌ Failed 5-day range < 10% condition: {indicators['fiveDayRange']:.2f}%")
        
        # 5. WMA Conditions
        logger.info("Checking WMA conditions...")
        wma_conditions = {
            'wmaFilter1': indicators['dailyWMA1'] > (indicators['monthlyWMA2'] + 1),
            'wmaFilter2': indicators['monthlyWMA2'] > (indicators['monthlyWMA4'] + 2),
            'wmaFilter3': indicators['dailyWMA1'] > (indicators['weeklyWMA6'] + 2),
            'wmaFilter4': indicators['weeklyWMA6'] > (indicators['weeklyWMA12'] + 2),
            'wmaFilter5': indicators['dailyWMA1'] > (indicators['wma12From4DaysAgo'] + 2),
            'wmaFilter6': indicators['dailyWMA1'] > (indicators['wma20From2DaysAgo'] + 2)
        }
        
        conditions.update(wma_conditions)
        for name, passed in wma_conditions.items():
            if not passed:
                failed.append(name)
                logger.info(f"❌ Failed {name}")
        
        # 6. Volume Contraction
        logger.info("Checking volume contraction...")
        conditions['volumeContraction'] = indicators['avgVolume5'] < indicators['avgVolume10']
        if not conditions['volumeContraction']:
            failed.append('volumeContraction')
            logger.info("❌ Failed volume contraction condition")
        
        # 7. RSI Condition
        logger.info("Checking RSI...")
        conditions['rsi'] = indicators['rsi'] > 60
        if not conditions['rsi']:
            failed.append('rsi')
            logger.info(f"❌ Failed RSI > 60 condition: {indicators['rsi']:.2f}")
        
        # 8. ATR Volatility (Optional)
        logger.info("Checking ATR volatility...")
        conditions['atrVolatility'] = indicators['atrPercentage'] < 5
        if not conditions['atrVolatility']:
            failed.append('atrVolatility')
            logger.info(f"❌ Failed ATR < 5% condition: {indicators['atrPercentage']:.2f}%")
        
        # Final result
        all_passed = len(failed) == 0
        if all_passed:
            logger.info("✅ All Rocket Base conditions passed!")
        else:
            logger.info(f"❌ Failed {len(failed)} conditions")
        
        return {
            'results': conditions,
            'failed': failed,
            'allPassed': all_passed
        }
    
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
    
    def _calculate_atr(self, highs: np.ndarray, lows: np.ndarray, 
                      closes: np.ndarray, period: int = 14) -> float:
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
    
    def _create_error_result(self, symbol: str, error: str) -> Dict:
        """Create error result dictionary"""
        return {
            'symbol': symbol,
            'error': error,
            'passed': False,
            'timestamp': datetime.now().isoformat()
        } 