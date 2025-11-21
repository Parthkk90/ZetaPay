// Price Ticker for ZetaPay
// Displays real-time cryptocurrency prices

class PriceTicker {
  constructor() {
    this.prices = {};
    this.updateInterval = null;
    this.container = null;
  }

  // Token ID mapping for CoinPaprika API
  static TOKEN_IDS = {
    'BTC': 'btc-bitcoin',
    'ETH': 'eth-ethereum',
    'ZETA': 'zeta-zetachain',
    'BNB': 'bnb-binance-coin',
    'MATIC': 'matic-polygon'
  };

  // Initialize ticker
  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Price ticker container not found');
      return;
    }

    this.render();
    this.fetchPrices();

    // Update prices every 30 seconds
    this.updateInterval = setInterval(() => {
      this.fetchPrices();
    }, 30000);
  }

  // Render ticker UI
  render() {
    this.container.innerHTML = `
      <div class="price-ticker">
        <div class="ticker-header">
          <h3>Live Prices</h3>
          <button class="refresh-btn" id="refreshPrices">🔄</button>
        </div>
        <div class="ticker-list" id="tickerList">
          <div class="loading">Loading prices...</div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .price-ticker {
        background: white;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .ticker-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .ticker-header h3 {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }

      .refresh-btn {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        opacity: 0.7;
        transition: opacity 0.2s, transform 0.3s;
      }

      .refresh-btn:hover {
        opacity: 1;
      }

      .refresh-btn.spinning {
        animation: spin 0.6s linear;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .ticker-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .ticker-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: #f9fafb;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .ticker-item:hover {
        background: #f3f4f6;
      }

      .ticker-symbol {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .ticker-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: 700;
      }

      .ticker-name {
        font-size: 13px;
        font-weight: 600;
        color: #1f2937;
      }

      .ticker-price-container {
        text-align: right;
      }

      .ticker-price {
        font-size: 14px;
        font-weight: 700;
        color: #1f2937;
      }

      .ticker-change {
        font-size: 11px;
        font-weight: 600;
        margin-top: 2px;
      }

      .ticker-change.positive {
        color: #10b981;
      }

      .ticker-change.negative {
        color: #ef4444;
      }

      .loading {
        text-align: center;
        padding: 20px;
        color: #6b7280;
        font-size: 13px;
      }

      .error {
        text-align: center;
        padding: 20px;
        color: #ef4444;
        font-size: 13px;
      }
    `;
    document.head.appendChild(style);

    // Add refresh button listener
    document.getElementById('refreshPrices').addEventListener('click', () => {
      this.fetchPrices(true);
    });
  }

  // Fetch prices from API
  async fetchPrices(showAnimation = false) {
    const tokens = ['BTC', 'ETH', 'ZETA', 'BNB', 'MATIC'];
    const listContainer = document.getElementById('tickerList');

    if (showAnimation) {
      const btn = document.getElementById('refreshPrices');
      btn.classList.add('spinning');
      setTimeout(() => btn.classList.remove('spinning'), 600);
    }

    try {
      const promises = tokens.map(token => this.fetchTokenPrice(token));
      await Promise.all(promises);
      
      this.renderPrices();
    } catch (error) {
      console.error('Error fetching prices:', error);
      listContainer.innerHTML = '<div class="error">Failed to load prices</div>';
    }
  }

  // Fetch single token price
  async fetchTokenPrice(tokenSymbol) {
    try {
      const tokenId = PriceTicker.TOKEN_IDS[tokenSymbol];
      if (!tokenId) return;

      const response = await fetch(`https://api.coinpaprika.com/v1/tickers/${tokenId}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      this.prices[tokenSymbol] = {
        symbol: data.symbol,
        name: data.name,
        price: data.quotes?.USD?.price || 0,
        change24h: data.quotes?.USD?.percent_change_24h || 0,
        marketCap: data.quotes?.USD?.market_cap || 0,
        volume24h: data.quotes?.USD?.volume_24h || 0
      };

      return this.prices[tokenSymbol];
    } catch (error) {
      console.error(`Error fetching ${tokenSymbol} price:`, error);
      return null;
    }
  }

  // Render prices
  renderPrices() {
    const listContainer = document.getElementById('tickerList');
    
    if (Object.keys(this.prices).length === 0) {
      listContainer.innerHTML = '<div class="loading">Loading prices...</div>';
      return;
    }

    listContainer.innerHTML = Object.entries(this.prices)
      .map(([symbol, data]) => {
        const changeClass = data.change24h >= 0 ? 'positive' : 'negative';
        const changeIcon = data.change24h >= 0 ? '▲' : '▼';
        
        return `
          <div class="ticker-item">
            <div class="ticker-symbol">
              <div class="ticker-icon">${symbol[0]}</div>
              <div class="ticker-name">${symbol}</div>
            </div>
            <div class="ticker-price-container">
              <div class="ticker-price">$${this.formatPrice(data.price)}</div>
              <div class="ticker-change ${changeClass}">
                ${changeIcon} ${Math.abs(data.change24h).toFixed(2)}%
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // Format price
  formatPrice(price) {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      });
    } else {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 4,
        maximumFractionDigits: 6 
      });
    }
  }

  // Get specific token price
  getPrice(tokenSymbol) {
    return this.prices[tokenSymbol]?.price || null;
  }

  // Stop ticker
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PriceTicker;
}
