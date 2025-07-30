#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import pandas as pd
import logging
from typing import Dict, List, Optional
from datetime import datetime
import time
from data_fetcher import DataFetcher
from technical_analysis import TechnicalAnalysis

logger = logging.getLogger(__name__)

class RealTimeScanner:
    def __init__(self):
        self.data_fetcher = DataFetcher()
        self.technical_analyzer = TechnicalAnalysis()
        
    async def scan_stock(self, stock_info: Dict) -> Dict:
        """
        Scan a single stock with real-time data
        """
        try:
            symbol = stock_info['symbol']
            logger.info(f"\n{'='*80}\nScanning {symbol}...")
            
            # Step 1: Get Real-Time Data
            logger.info(f"Step 1: Getting real-time data for {symbol}")
            real_time_data = await self.data_fetcher.get_realtime_data(symbol)
            
            if not real_time_data:
                logger.error(f"Failed to get real-time data for {symbol}")
                return {
                    'symbol': symbol,
                    'passed': False,
                    'error': 'Failed to get real-time data'
                }
            
            # Step 2: Get Historical Data
            logger.info(f"Step 2: Getting historical data for {symbol}")
            historical_data = await self.data_fetcher.get_historical_data(symbol)
            
            if historical_data is None:
                logger.error(f"Failed to get historical data for {symbol}")
                return {
                    'symbol': symbol,
                    'passed': False,
                    'error': 'Failed to get historical data'
                }
            
            # Step 3: Technical Analysis
            logger.info(f"Step 3: Performing technical analysis for {symbol}")
            analysis_result = self.technical_analyzer.analyze_stock(historical_data, real_time_data)
            
            if not analysis_result['success']:
                logger.error(f"Technical analysis failed for {symbol}")
                return {
                    'symbol': symbol,
                    'passed': False,
                    'error': 'Technical analysis failed'
                }
            
            # Step 4: Check Conditions
            logger.info(f"Step 4: Checking conditions for {symbol}")
            conditions_result = self.technical_analyzer.check_rocket_base_conditions(
                historical_data, real_time_data, analysis_result['indicators']
            )
            
            # Step 5: Prepare Result
            result = {
                'symbol': symbol,
                'name': stock_info.get('name', symbol),
                'price': real_time_data['price'],
                'volume': real_time_data['volume'],
                'percentChange': real_time_data['change'],
                'passed': conditions_result['passed'],
                'dataSource': real_time_data['source'],
                'timestamp': datetime.now().isoformat(),
                'indicators': analysis_result['indicators']
            }
            
            if not conditions_result['passed']:
                result['failedConditions'] = conditions_result.get('failedConditions', [])
            
            result['details'] = conditions_result.get('details', {})
            
            # Log result
            if result['passed']:
                logger.info(f"✅ {symbol} PASSED all conditions")
            else:
                logger.info(f"❌ {symbol} failed conditions: {', '.join(result.get('failedConditions', []))}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error scanning {symbol}: {str(e)}")
            return {
                'symbol': symbol,
                'passed': False,
                'error': str(e)
            }
    
    async def scan_stocks(self, stock_list: List[Dict]) -> Dict:
        """
        Scan multiple stocks with real-time data
        """
        results = []
        passed_stocks = []
        failed_stocks = []
        errors = []
        
        start_time = time.time()
        total_stocks = len(stock_list)
        
        logger.info(f"\n{'*'*80}")
        logger.info(f"Starting scan of {total_stocks} stocks")
        logger.info(f"{'*'*80}")
        
        # Process stocks in batches to avoid overwhelming APIs
        batch_size = 5
        for i in range(0, len(stock_list), batch_size):
            batch = stock_list[i:i + batch_size]
            
            # Process batch concurrently
            tasks = [self.scan_stock(stock) for stock in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            for result in batch_results:
                if isinstance(result, Exception):
                    logger.error(f"Batch processing error: {str(result)}")
                    continue
                    
                if 'error' in result:
                    errors.append(result)
                elif result['passed']:
                    result['sr'] = len(passed_stocks) + 1
                    passed_stocks.append(result)
                else:
                    failed_stocks.append(result)
            
            # Add delay between batches
            if i + batch_size < len(stock_list):
                await asyncio.sleep(2)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        logger.info(f"\n{'*'*80}")
        logger.info(f"Scan completed in {total_time:.2f} seconds")
        logger.info(f"Passed: {len(passed_stocks)}, Failed: {len(failed_stocks)}, Errors: {len(errors)}")
        logger.info(f"{'*'*80}")
        
        return {
            'passed_stocks': passed_stocks,
            'failed_stocks': failed_stocks,
            'errors': errors,
            'stats': {
                'total_scanned': total_stocks,
                'total_passed': len(passed_stocks),
                'total_failed': len(failed_stocks),
                'total_errors': len(errors),
                'processing_time': total_time,
                'average_time_per_stock': total_time / total_stocks if total_stocks else 0
            }
        }
    
    def check_rocket_base_conditions(self, historical_data, real_time_data, indicators):
        """
        Updated conditions for Rocket Base Scanner.
        """
        conditions = {}

        # Price & Volume Filters
        conditions['price'] = real_time_data['price'] > 70
        conditions['volume'] = real_time_data['volume'] > 85000
        conditions['percentChange'] = real_time_data['change'] > 0
        conditions['fiveDayChange'] = indicators['fiveDayChange'] < 8
        conditions['fiveDayRange'] = indicators['fiveDayRange'] < 10

        # WMA Trend Strength Filters
        conditions['wmaFilter1'] = indicators['dailyWMA1'] > (indicators['monthlyWMA2'] + 1)
        conditions['wmaFilter2'] = indicators['monthlyWMA2'] > (indicators['monthlyWMA4'] + 2)
        conditions['wmaFilter3'] = indicators['dailyWMA1'] > (indicators['weeklyWMA6'] + 2)
        conditions['wmaFilter4'] = indicators['weeklyWMA6'] > (indicators['weeklyWMA12'] + 2)
        conditions['wmaFilter5'] = indicators['dailyWMA1'] > (indicators['wma12From4DaysAgo'] + 2)
        conditions['wmaFilter6'] = indicators['dailyWMA1'] > (indicators['wma20From2DaysAgo'] + 2)

        # Volume Contraction
        conditions['volumeContraction'] = indicators['avgVolume5'] < indicators['avgVolume10']

        # Technical Indicators
        conditions['rsi'] = indicators['rsi'] > 60
        conditions['atrVolatility'] = indicators['atrPercentage'] < 5

        # Exclusion Filters
        conditions['excludeETFs'] = not real_time_data.get('isETF', False)
        conditions['excludePennyStocks'] = real_time_data['price'] >= 70

        passed = all(conditions.values())
        failed_conditions = [key for key, value in conditions.items() if not value]

        return {
            'passed': passed,
            'failedConditions': failed_conditions,
            'details': conditions
        }