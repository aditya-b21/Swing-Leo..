# Stock Scanner Backend

This is a Python Flask backend for the Stock Scanner application. It provides an API for scanning stocks based on the Rocket Base conditions.

## Setup

1. Install Python 3.8 or higher
2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```
3. Run the server:
   ```
   python app.py
   ```

## API Endpoints

### Health Check
- **URL**: `/api/health`
- **Method**: `GET`
- **Response**: `{"status": "ok", "message": "Server is running"}`

### Scan Stocks
- **URL**: `/api/scan`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: The file containing stock data (CSV, Excel)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Scan complete. X stocks passed all conditions.",
    "results": [
      {
        "sr": 1,
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "price": 150.25,
        "volume": 12345678,
        "percentChange": 1.5
      },
      ...
    ]
  }
  ```

## Rocket Base Conditions

The scanner applies the following Rocket Base conditions:

### 📊 Price & Volume:
- Close > ₹70 (Custom Penny Stock Filter)
- Volume > 85,000
- % Change > 0
- 5-Day Change < 10%
- 5-Day Range < 10%

### 📈 WMA Filters:
- Daily WMA(close,1) > Monthly WMA(close,2) + 1
- Monthly WMA(close,2) > Monthly WMA(close,4) + 2
- Daily WMA(close,1) > Weekly WMA(close,6) + 2
- Weekly WMA(close,6) > Weekly WMA(close,12) + 2
- Daily WMA(close,1) > WMA(close,12) from 4 days ago + 2
- Daily WMA(close,1) > WMA(close,20) from 2 days ago + 2

### 📉 Volume Contraction:
- AvgVolume_5 < AvgVolume_10

### 📊 Technical Indicators:
- RSI > 60
- ATR Volatility: Passed (ATR < 5% of price)
- ADX > 20 and rising

### 📅 Base Duration Filter:
- Sideways Base Duration ≥ 10 days (10-day high-low range < 10% to confirm tight consolidation)

### ❌ Exclusions:
- Exclude ETFs
- Exclude stocks with % Change ≤ 0
- Exclude Penny Stocks (Price < ₹70) 