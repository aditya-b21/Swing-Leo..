#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import yfinance as yf
import pandas as pd
import numpy as np
import requests
import time
import asyncio
import aiohttp
import websockets
from datetime import datetime, timedelta
import logging
from typing import Dict, Optional, List
from nsepy import get_history
import pandas_ta as ta

logger = logging.getLogger(__name__)

class DataFetcher:
    def __init__(self):
        self.alpha_vantage_key = "D0S6FR2CY3CJNF4H"
        self.session = requests.Session()
        self.last_request_time = {}
        self.cache = {}
        self.cache_expiry = {}
        self.CACHE_DURATION = 60  # Cache data for 60 seconds
        
    async def get_realtime_data(self, symbol: str) -> Optional[Dict]:
        """
        Get real-time data from multiple sources with fallback
        """
        try:
            # Clear expired cache
            self._clear_expired_cache(symbol)
            
            # Check cache first
            if self._is_cached(symbol):
                logger.info(f"Using cached data for {symbol}")
                return self.cache[symbol]
            
            # Rate limiting
            await self._respect_rate_limit(symbol)
            
            # Try multiple sources in parallel
            tasks = [
                self._get_yahoo_realtime(symbol),
                self._get_alphavantage_realtime(symbol),
                self._get_nse_realtime(symbol)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Use the first successful result
            for result in results:
                if isinstance(result, dict) and result.get('success'):
                    self._cache_data(symbol, result['data'])
                    return result['data']
            
            logger.error(f"Failed to get real-time data for {symbol} from all sources")
            return None
            
        except Exception as e:
            logger.error(f"Error getting real-time data for {symbol}: {str(e)}")
            return None
    
    async def get_historical_data(self, symbol: str, days: int = 60) -> Optional[pd.DataFrame]:
        """
        Get historical data with technical indicators
        """
        try:
            # Try Yahoo Finance first
            df = await self._get_yahoo_historical(symbol, days)
            source = "Yahoo Finance"
            
            if df is None:
                # Try NSE data
                df = await self._get_nse_historical(symbol, days)
                source = "NSE"
            
            if df is None:
                # Try Alpha Vantage as last resort
                df = await self._get_alphavantage_historical(symbol, days)
                source = "Alpha Vantage"
            
            if df is None:
                logger.error(f"Failed to get historical data for {symbol} from all sources")
                return None
            
            # Add technical indicators
            df = self._add_technical_indicators(df)
            
            logger.info(f"Got historical data for {symbol} from {source}")
            return df
            
        except Exception as e:
            logger.error(f"Error getting historical data for {symbol}: {str(e)}")
            return None
    
    async def _get_yahoo_realtime(self, symbol: str) -> Dict:
        """Get real-time data from Yahoo Finance"""
        try:
            # Add .NS suffix for NSE stocks
            yahoo_symbol = f"{symbol}.NS"
            
            ticker = yf.Ticker(yahoo_symbol)
            info = ticker.info
            
            if not info or 'regularMarketPrice' not in info:
                return {'success': False}
            
            data = {
                'price': info['regularMarketPrice'],
                'volume': info['regularMarketVolume'],
                'change': info['regularMarketChangePercent'],
                'high': info['dayHigh'],
                'low': info['dayLow'],
                'open': info['regularMarketOpen'],
                'prev_close': info['previousClose'],
                'timestamp': datetime.now().isoformat(),
                'source': 'Yahoo Finance'
            }
            
            return {'success': True, 'data': data}
            
        except Exception as e:
            logger.error(f"Yahoo Finance error for {symbol}: {str(e)}")
            return {'success': False}
    
    async def _get_alphavantage_realtime(self, symbol: str) -> Dict:
        """Get real-time data from Alpha Vantage"""
        try:
            url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={self.alpha_vantage_key}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    data = await response.json()
            
            if 'Global Quote' not in data:
                return {'success': False}
            
            quote = data['Global Quote']
            result = {
                'price': float(quote['05. price']),
                'volume': int(quote['06. volume']),
                'change': float(quote['10. change percent'].rstrip('%')),
                'high': float(quote['03. high']),
                'low': float(quote['04. low']),
                'open': float(quote['02. open']),
                'prev_close': float(quote['08. previous close']),
                'timestamp': datetime.now().isoformat(),
                'source': 'Alpha Vantage'
            }
            
            return {'success': True, 'data': result}
            
        except Exception as e:
            logger.error(f"Alpha Vantage error for {symbol}: {str(e)}")
            return {'success': False}
    
    async def _get_nse_realtime(self, symbol: str) -> Dict:
        """Get real-time data from NSE"""
        try:
            # Get current date
            today = datetime.now().date()
            
            # Get NSE data
            data = get_history(symbol=symbol,
                             start=today,
                             end=today)
            
            if data.empty:
                return {'success': False}
            
            latest = data.iloc[-1]
            result = {
                'price': latest['Close'],
                'volume': latest['Volume'],
                'change': ((latest['Close'] - latest['Prev Close']) / latest['Prev Close']) * 100,
                'high': latest['High'],
                'low': latest['Low'],
                'open': latest['Open'],
                'prev_close': latest['Prev Close'],
                'timestamp': datetime.now().isoformat(),
                'source': 'NSE'
            }
            
            return {'success': True, 'data': result}
            
        except Exception as e:
            logger.error(f"NSE error for {symbol}: {str(e)}")
            return {'success': False}
    
    async def _get_yahoo_historical(self, symbol: str, days: int) -> Optional[pd.DataFrame]:
        """Get historical data from Yahoo Finance"""
        try:
            ticker = yf.Ticker(f"{symbol}.NS")
            df = ticker.history(period=f"{days}d")
            
            if df.empty:
                return None
            
            df.columns = [col.lower() for col in df.columns]
            return df
            
        except Exception as e:
            logger.error(f"Yahoo historical error for {symbol}: {str(e)}")
            return None
    
    async def _get_alphavantage_historical(self, symbol: str, days: int) -> Optional[pd.DataFrame]:
        """Get historical data from Alpha Vantage"""
        try:
            url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&outputsize=full&apikey={self.alpha_vantage_key}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    data = await response.json()
            
            if "Time Series (Daily)" not in data:
                return None
            
            df = pd.DataFrame(data["Time Series (Daily)"]).T
            df.columns = ['open', 'high', 'low', 'close', 'volume']
            df = df.astype(float)
            
            # Get last N days
            df = df.head(days)
            return df
            
        except Exception as e:
            logger.error(f"Alpha Vantage historical error for {symbol}: {str(e)}")
            return None
    
    async def _get_nse_historical(self, symbol: str, days: int) -> Optional[pd.DataFrame]:
        """Get historical data from NSE"""
        try:
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=days)
            
            df = get_history(symbol=symbol,
                           start=start_date,
                           end=end_date)
            
            if df.empty:
                return None
            
            df.columns = [col.lower() for col in df.columns]
            return df
            
        except Exception as e:
            logger.error(f"NSE historical error for {symbol}: {str(e)}")
            return None
    
    def _add_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add technical indicators to dataframe"""
        try:
            # Add basic indicators
            df['sma_20'] = ta.sma(df['close'], length=20)
            df['sma_50'] = ta.sma(df['close'], length=50)
            df['rsi'] = ta.rsi(df['close'], length=14)
            
            # Add MACD
            macd = ta.macd(df['close'])
            df = pd.concat([df, macd], axis=1)
            
            # Add Bollinger Bands
            bbands = ta.bbands(df['close'])
            df = pd.concat([df, bbands], axis=1)
            
            # Add ADX
            adx = ta.adx(df['high'], df['low'], df['close'])
            df = pd.concat([df, adx], axis=1)
            
            # Add ATR
            atr = ta.atr(df['high'], df['low'], df['close'])
            df['atr'] = atr
            
            # Calculate custom indicators
            df['atr_percentage'] = (df['atr'] / df['close']) * 100
            df['volume_sma_5'] = df['volume'].rolling(window=5).mean()
            df['volume_sma_10'] = df['volume'].rolling(window=10).mean()
            
            return df
            
        except Exception as e:
            logger.error(f"Error adding technical indicators: {str(e)}")
            return df
    
    async def _respect_rate_limit(self, symbol: str):
        """Ensure we don't exceed API rate limits"""
        now = time.time()
        if symbol in self.last_request_time:
            time_since_last = now - self.last_request_time[symbol]
            if time_since_last < 1:  # Minimum 1 second between requests
                await asyncio.sleep(1 - time_since_last)
        self.last_request_time[symbol] = now
    
    def _is_cached(self, symbol: str) -> bool:
        """Check if we have fresh cached data"""
        if symbol not in self.cache or symbol not in self.cache_expiry:
            return False
        return datetime.now().timestamp() < self.cache_expiry[symbol]
    
    def _cache_data(self, symbol: str, data: Dict):
        """Cache data with expiry"""
        self.cache[symbol] = data
        self.cache_expiry[symbol] = datetime.now().timestamp() + self.CACHE_DURATION
    
    def _clear_expired_cache(self, symbol: str):
        """Clear expired cache entries"""
        now = datetime.now().timestamp()
        if symbol in self.cache_expiry and now > self.cache_expiry[symbol]:
            del self.cache[symbol]
            del self.cache_expiry[symbol]
    
    async def get_live_eod_data(self, symbols: List[str]) -> List[Dict]:
        """
        Fetch live EOD data for all stocks listed on NSE and BSE.
        """
        results = []
        for symbol in symbols:
            try:
                # Fetch data from Yahoo Finance
                yahoo_symbol = f"{symbol}.NS" if '.' not in symbol else symbol
                ticker = yf.Ticker(yahoo_symbol)
                info = ticker.info

                if info and 'regularMarketPrice' in info:
                    results.append({
                        'symbol': symbol,
                        'price': info['regularMarketPrice'],
                        'volume': info['regularMarketVolume'],
                        'percentChange': ((info['regularMarketPrice'] - info['previousClose']) / info['previousClose']) * 100,
                        'source': 'Yahoo Finance'
                    })
            except Exception as e:
                logger.error(f"Error fetching live EOD data for {symbol}: {str(e)}")

        return results