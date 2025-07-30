#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import numpy as np
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class TechnicalAnalysis:
    def __init__(self):
        pass
        
    def analyze_stock(self, df: pd.DataFrame, current_data: Dict) -> Dict:
        """
        Perform complete technical analysis on a stock
        """
        try:
            # Prepare data
            df = self._prepare_data(df, current_data)
            
            # Calculate all indicators
            indicators = {}
            
            # 1. Moving Averages
            indicators.update(self._calculate_moving_averages(df))
            
            # 2. Volume Analysis
            indicators.update(self._analyze_volume(df))
            
            # 3. Momentum Indicators
            indicators.update(self._calculate_momentum_indicators(df))
            
            # 4. Volatility Indicators
            indicators.update(self._calculate_volatility_indicators(df))
            
            # 5. Trend Indicators
            indicators.update(self._calculate_trend_indicators(df))
            
            # 6. Base Pattern Analysis
            indicators.update(self._analyze_base_pattern(df))
            
            return {
                'success': True,
                'indicators': indicators
            }
            
        except Exception as e:
            logger.error(f"Error in technical analysis: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def check_rocket_base_conditions(self, df: pd.DataFrame, current_data: Dict, 
                                   indicators: Dict) -> Dict:
        """
        Check all Rocket Base conditions
        """
        try:
            conditions = {}
            
            # 1. Price and Volume Conditions
            conditions['price'] = current_data['price'] > 70
            conditions['volume'] = current_data['volume'] > 85000
            conditions['percentChange'] = current_data['change'] > 0
            
            # 2. Five Day Analysis
            conditions.update(self._check_five_day_conditions(df, current_data))
            
            # 3. Moving Average Conditions
            conditions.update(self._check_ma_conditions(indicators))
            
            # 4. Volume Contraction
            conditions['volumeContraction'] = indicators['volume_5d_avg'] < indicators['volume_10d_avg']
            
            # 5. Technical Indicator Conditions
            conditions.update(self._check_technical_conditions(indicators))
            
            # 6. Base Duration
            conditions['baseDuration'] = indicators['base_duration'] >= 10
            
            # Check all conditions
            all_passed = all(conditions.values())
            
            # Prepare result
            result = {
                'passed': all_passed,
                'conditions': conditions,
                'details': indicators
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
    
    def _prepare_data(self, df: pd.DataFrame, current_data: Dict) -> pd.DataFrame:
        """Prepare data for analysis"""
        try:
            # Add current price to historical data
            latest_row = pd.DataFrame({
                'open': [current_data['open']],
                'high': [current_data['high']],
                'low': [current_data['low']],
                'close': [current_data['price']],
                'volume': [current_data['volume']]
            }, index=[pd.Timestamp.now()])
            
            df = pd.concat([latest_row, df])
            return df
            
        except Exception as e:
            logger.error(f"Error preparing data: {str(e)}")
            return df
    
    def _calculate_moving_averages(self, df: pd.DataFrame) -> Dict:
        """Calculate all required moving averages"""
        try:
            closes = df['close'].values
            volumes = df['volume'].values
            
            # Calculate WMAs
            indicators = {
                'dailyWMA1': self._calculate_wma(closes, 1),
                'monthlyWMA2': self._calculate_wma(closes, 2),
                'monthlyWMA4': self._calculate_wma(closes, 4),
                'weeklyWMA6': self._calculate_wma(closes, 6),
                'weeklyWMA12': self._calculate_wma(closes, 12),
                'wma12From4DaysAgo': self._calculate_wma(closes[4:], 12),
                'wma20From2DaysAgo': self._calculate_wma(closes[2:], 20)
            }
            
            # Calculate volume averages
            indicators['volume_5d_avg'] = np.mean(volumes[:5])
            indicators['volume_10d_avg'] = np.mean(volumes[5:15])
            
            return indicators
            
        except Exception as e:
            logger.error(f"Error calculating moving averages: {str(e)}")
            return {}
    
    def _analyze_volume(self, df: pd.DataFrame) -> Dict:
        """Analyze volume patterns"""
        try:
            volumes = df['volume'].values
            
            return {
                'volume_trend': self._calculate_volume_trend(volumes),
                'volume_spike': self._check_volume_spike(volumes),
                'volume_consistency': self._check_volume_consistency(volumes)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing volume: {str(e)}")
            return {}
    
    def _calculate_momentum_indicators(self, df: pd.DataFrame) -> Dict:
        """Calculate momentum indicators"""
        try:
            closes = df['close'].values
            
            # Calculate RSI
            rsi = self._calculate_rsi(closes)
            
            # Calculate ROC
            roc = self._calculate_rate_of_change(closes)
            
            return {
                'rsi': rsi,
                'roc': roc
            }
            
        except Exception as e:
            logger.error(f"Error calculating momentum indicators: {str(e)}")
            return {}
    
    def _calculate_volatility_indicators(self, df: pd.DataFrame) -> Dict:
        """Calculate volatility indicators"""
        try:
            closes = df['close'].values
            highs = df['high'].values
            lows = df['low'].values
            
            # Calculate ATR
            atr = self._calculate_atr(highs, lows, closes)
            current_price = closes[0]
            atr_percentage = (atr / current_price) * 100
            
            return {
                'atr': atr,
                'atrPercentage': atr_percentage
            }
            
        except Exception as e:
            logger.error(f"Error calculating volatility indicators: {str(e)}")
            return {}
    
    def _calculate_trend_indicators(self, df: pd.DataFrame) -> Dict:
        """Calculate trend indicators"""
        try:
            closes = df['close'].values
            highs = df['high'].values
            lows = df['low'].values
            
            # Calculate ADX
            adx = self._calculate_adx(highs, lows, closes)
            
            return {
                'adx': adx
            }
            
        except Exception as e:
            logger.error(f"Error calculating trend indicators: {str(e)}")
            return {}
    
    def _analyze_base_pattern(self, df: pd.DataFrame) -> Dict:
        """Analyze base pattern formation"""
        try:
            highs = df['high'].values
            lows = df['low'].values
            
            # Calculate base duration
            base_duration = self._calculate_base_duration(highs, lows)
            
            # Calculate base tightness
            base_tightness = self._calculate_base_tightness(highs, lows)
            
            return {
                'base_duration': base_duration,
                'base_tightness': base_tightness
            }
            
        except Exception as e:
            logger.error(f"Error analyzing base pattern: {str(e)}")
            return {}
    
    def _calculate_wma(self, data: np.ndarray, period: int) -> float:
        """Calculate Weighted Moving Average"""
        try:
            if len(data) < period:
                return 0
            weights = np.arange(period, 0, -1)
            return np.sum(data[:period] * weights) / weights.sum()
        except Exception as e:
            logger.error(f"Error calculating WMA: {str(e)}")
            return 0
    
    def _calculate_rsi(self, prices: np.ndarray, period: int = 14) -> float:
        """Calculate RSI"""
        try:
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
            
        except Exception as e:
            logger.error(f"Error calculating RSI: {str(e)}")
            return 0
    
    def _calculate_atr(self, highs: np.ndarray, lows: np.ndarray, 
                      closes: np.ndarray, period: int = 14) -> float:
        """Calculate ATR"""
        try:
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
            
        except Exception as e:
            logger.error(f"Error calculating ATR: {str(e)}")
            return 0
    
    def _calculate_adx(self, highs: np.ndarray, lows: np.ndarray, 
                      closes: np.ndarray, period: int = 14) -> float:
        """Calculate ADX"""
        try:
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
            
        except Exception as e:
            logger.error(f"Error calculating ADX: {str(e)}")
            return 0
    
    def _calculate_base_duration(self, highs: np.ndarray, lows: np.ndarray, 
                               period: int = 10) -> int:
        """Calculate base duration"""
        try:
            if len(highs) < period:
                return 0
                
            for days in range(period, min(20, len(highs))):
                highest = max(highs[:days])
                lowest = min(lows[:days])
                range_percent = ((highest - lowest) / lowest) * 100
                
                if range_percent >= 10:
                    return days - 1
                    
            return min(20, len(highs))
            
        except Exception as e:
            logger.error(f"Error calculating base duration: {str(e)}")
            return 0
    
    def _calculate_base_tightness(self, highs: np.ndarray, lows: np.ndarray, 
                                period: int = 10) -> float:
        """Calculate base tightness"""
        try:
            if len(highs) < period:
                return 0
                
            period_highs = highs[:period]
            period_lows = lows[:period]
            
            highest = max(period_highs)
            lowest = min(period_lows)
            
            return ((highest - lowest) / lowest) * 100
            
        except Exception as e:
            logger.error(f"Error calculating base tightness: {str(e)}")
            return 0
    
    def _calculate_volume_trend(self, volumes: np.ndarray, period: int = 10) -> str:
        """Calculate volume trend"""
        try:
            if len(volumes) < period:
                return "neutral"
                
            recent_avg = np.mean(volumes[:period//2])
            older_avg = np.mean(volumes[period//2:period])
            
            if recent_avg > older_avg * 1.2:
                return "increasing"
            elif recent_avg < older_avg * 0.8:
                return "decreasing"
            else:
                return "neutral"
                
        except Exception as e:
            logger.error(f"Error calculating volume trend: {str(e)}")
            return "neutral"
    
    def _check_volume_spike(self, volumes: np.ndarray, period: int = 20) -> bool:
        """Check for volume spikes"""
        try:
            if len(volumes) < period:
                return False
                
            avg_volume = np.mean(volumes[1:period])
            return volumes[0] > avg_volume * 2
            
        except Exception as e:
            logger.error(f"Error checking volume spike: {str(e)}")
            return False
    
    def _check_volume_consistency(self, volumes: np.ndarray, period: int = 10) -> bool:
        """Check volume consistency"""
        try:
            if len(volumes) < period:
                return False
                
            period_volumes = volumes[:period]
            avg_volume = np.mean(period_volumes)
            std_volume = np.std(period_volumes)
            
            return std_volume / avg_volume < 0.5  # Less than 50% variation
            
        except Exception as e:
            logger.error(f"Error checking volume consistency: {str(e)}")
            return False
    
    def _calculate_rate_of_change(self, prices: np.ndarray, period: int = 10) -> float:
        """Calculate Rate of Change"""
        try:
            if len(prices) <= period:
                return 0
                
            return ((prices[0] - prices[period]) / prices[period]) * 100
            
        except Exception as e:
            logger.error(f"Error calculating ROC: {str(e)}")
            return 0
    
    def _check_five_day_conditions(self, df: pd.DataFrame, current_data: Dict) -> Dict:
        """Check 5-day related conditions"""
        try:
            last_5_days = df.head(5)
            
            five_day_change = ((current_data['price'] - last_5_days['close'].iloc[-1]) / 
                             last_5_days['close'].iloc[-1] * 100)
            
            five_day_range = ((last_5_days['high'].max() - last_5_days['low'].min()) / 
                            last_5_days['low'].min() * 100)
            
            return {
                'fiveDayChange': five_day_change < 10,
                'fiveDayRange': five_day_range < 10
            }
            
        except Exception as e:
            logger.error(f"Error checking 5-day conditions: {str(e)}")
            return {
                'fiveDayChange': False,
                'fiveDayRange': False
            }
    
    def _check_ma_conditions(self, indicators: Dict) -> Dict:
        """Check moving average conditions"""
        try:
            return {
                'wmaFilter1': indicators['dailyWMA1'] > (indicators['monthlyWMA2'] + 1),
                'wmaFilter2': indicators['monthlyWMA2'] > (indicators['monthlyWMA4'] + 2),
                'wmaFilter3': indicators['dailyWMA1'] > (indicators['weeklyWMA6'] + 2),
                'wmaFilter4': indicators['weeklyWMA6'] > (indicators['weeklyWMA12'] + 2),
                'wmaFilter5': indicators['dailyWMA1'] > (indicators['wma12From4DaysAgo'] + 2),
                'wmaFilter6': indicators['dailyWMA1'] > (indicators['wma20From2DaysAgo'] + 2)
            }
            
        except Exception as e:
            logger.error(f"Error checking MA conditions: {str(e)}")
            return {
                'wmaFilter1': False,
                'wmaFilter2': False,
                'wmaFilter3': False,
                'wmaFilter4': False,
                'wmaFilter5': False,
                'wmaFilter6': False
            }
    
    def _check_technical_conditions(self, indicators: Dict) -> Dict:
        """Check technical indicator conditions"""
        try:
            return {
                'rsi': indicators['rsi'] > 60,
                'atrVolatility': indicators['atrPercentage'] < 5,
                'adx': indicators['adx'] > 20
            }
            
        except Exception as e:
            logger.error(f"Error checking technical conditions: {str(e)}")
            return {
                'rsi': False,
                'atrVolatility': False,
                'adx': False
            } 