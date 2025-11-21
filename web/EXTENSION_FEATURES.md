# 🔗 ZetaPay Browser Extension

Pay with cryptocurrency on any e-commerce website using ZetaChain's omnichain infrastructure.

## 🌟 Features

### ✅ Phase 1 (Current)
- **Auto-Detect Payments**: Automatically identifies checkout pages on major platforms (Amazon, Shopify, Stripe, eBay, WooCommerce)
- **Smart Payment Button**: Injects a "Pay with Crypto" button on detected checkout pages
- **QR Code Scanner**: Passively detects payment QR codes on web pages
- **Transaction History**: View all your past transactions with filtering options
- **Browser Notifications**: Get real-time updates on payment status
- **Price Alerts**: Set alerts for your favorite cryptocurrencies
- **Context Menu Integration**: Right-click any amount to pay with crypto
- **Badge Counter**: Shows today's transaction count on extension icon

### 🎨 User Interface
- Transaction history dashboard with filters (All, Success, Failed, Today)
- Settings page with toggles and preferences
- Network selection (ZetaChain, Ethereum, BSC, Polygon)
- CSV export for transaction data

### 🔐 Security & Privacy
- All sensitive data stored locally in browser
- No tracking or analytics
- Optional data clearing
- Secure message passing between scripts

## 📦 Installation

### For Development

1. **Clone the repository**
```bash
git clone https://github.com/Parthkk90/ZetaPay.git
cd ZetaPay/web
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the extension**
```bash
npm run build
npm run build:extension
```

4. **Load in Chrome**
- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode" (top right)
- Click "Load unpacked"
- Select the `web/extension-build` folder

### For Production

1. Download the latest release from Chrome Web Store (coming soon)
2. Click "Add to Chrome"
3. Grant necessary permissions

## 🔧 How It Works

### Content Script (`content.js`)
- Scans web pages for checkout indicators
- Detects merchant platform (Amazon, Shopify, etc.)
- Extracts order details (amount, currency, merchant)
- Injects payment button on valid checkout pages
- Listens for payment status updates

### Background Service Worker (`background.js`)
- Manages browser notifications
- Handles payment flow coordination
- Stores transaction history (local storage)
- Monitors price alerts
- Updates extension badge with transaction count
- Manages context menu and alarms

### QR Code Scanner (`qr-scanner.js`)
- Passively scans images and canvas elements
- Detects QR codes using pattern analysis
- Parses payment URIs (ethereum:, bitcoin:, etc.)
- Highlights detected QR codes on page
- Extracts payment information (address, amount, currency)

## 🎯 Supported Platforms

Currently auto-detects:
- **Amazon**: `amazon.com`, `amazon.co.uk`, etc.
- **Shopify**: All Shopify-powered stores
- **Stripe**: Stripe checkout pages
- **eBay**: `ebay.com`, `ebay.co.uk`, etc.
- **WooCommerce**: WordPress + WooCommerce stores

## 🛠️ Configuration

### Permissions Required
- `storage`: Save transactions and settings
- `activeTab`: Access current tab information
- `scripting`: Inject payment buttons
- `notifications`: Show payment status alerts
- `alarms`: Periodic tasks (badge updates, price checks)
- `contextMenus`: Right-click payment option
- `host_permissions`: Access all URLs for payment detection

### Settings Options
- **Auto-detect Payments**: Toggle automatic checkout detection
- **Browser Notifications**: Enable/disable notifications
- **Show Payment Button**: Toggle button injection
- **Preferred Network**: Choose default blockchain network
- **Transaction Timeout**: Set timeout duration (60-600 seconds)
- **Gas Price Preference**: Fast, Standard, or Slow

## 📊 Transaction History

Access via:
1. Click extension icon → "View History" button
2. Right-click extension icon → "Transaction History"
3. Open `history.html` directly

Features:
- Filter by status (All, Success, Failed)
- Filter by date (Today, All time)
- Export to CSV
- View transaction details
- Click transaction hash to view on block explorer

## 🔔 Price Alerts

Set alerts for:
- Bitcoin (BTC)
- Ethereum (ETH)
- ZetaChain (ZETA)
- BNB
- Polygon (MATIC)

Alerts trigger browser notifications when target price is reached.

## 🗺️ Roadmap

### Phase 2 (2-3 weeks)
- [ ] Multi-token support (BTC, ETH, USDT, USDC)
- [ ] Token swap integration
- [ ] Gas estimation
- [ ] Transaction preview

### Phase 3 (3-4 weeks)
- [ ] Multi-language support (Spanish, Chinese, Hindi)
- [ ] Dark mode
- [ ] Merchant verification badges
- [ ] Advanced analytics

### Phase 4 (4-6 weeks)
- [ ] NFT payment support
- [ ] Recurring payments integration
- [ ] Invoice management
- [ ] API for merchants

### Phase 5 (2 months)
- [ ] Mobile app (React Native)
- [ ] Merchant dashboard
- [ ] Advanced security features
- [ ] Partnership integrations

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 Development

### File Structure
```
web/public/
├── background.js       # Service worker
├── content.js          # Content script
├── qr-scanner.js       # QR code detection
├── history.html        # Transaction history UI
├── history.js          # History logic
├── settings.html       # Settings UI
├── settings.js         # Settings logic
├── manifest.json       # Extension manifest
└── images/             # Icons
```

### Testing
1. Load extension in Chrome
2. Navigate to Amazon/Shopify checkout
3. Verify button appears
4. Test payment flow
5. Check transaction history
6. Test notifications

### Debug Console
- Content script: Right-click page → Inspect → Console
- Background script: `chrome://extensions/` → Extension → "service worker" link

## 🐛 Known Issues

1. QR scanner requires jsQR library integration (placeholder implemented)
2. Some dynamic checkout pages may require manual refresh
3. Price alerts use mock data (requires CoinGecko API integration)

## 📜 License

MIT License - see LICENSE file

## 🔗 Links

- **Website**: https://zetapay.app
- **Documentation**: https://docs.zetapay.app
- **GitHub**: https://github.com/Parthkk90/ZetaPay
- **Support**: support@zetapay.app

## 💬 Support

For issues or questions:
1. Check existing GitHub issues
2. Create new issue with details
3. Join Discord community (coming soon)
4. Email support@zetapay.app

---

**Built with ❤️ using ZetaChain**
