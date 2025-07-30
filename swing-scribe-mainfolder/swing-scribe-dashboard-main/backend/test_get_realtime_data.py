import logging
from scanner import StockScanner

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

def test_get_realtime_data():
    scanner = StockScanner()
    symbol = "AAPL"  # Example stock symbol

    logging.info(f"Testing _get_realtime_data for symbol: {symbol}")
    result = scanner._get_realtime_data(symbol)

    if result:
        logging.info(f"Real-time data fetched successfully: {result}")
    else:
        logging.error("Failed to fetch real-time data.")

if __name__ == "__main__":
    test_get_realtime_data()
