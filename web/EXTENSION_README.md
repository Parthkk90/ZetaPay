# ZetaPay Browser Extension

> Pay with cryptocurrency on Amazon, Flipkart, and other e-commerce platforms using ZetaChain Universal Apps.

## 🚀 Quick Start

### For Users
1. Download the extension from:
   - [Chrome Web Store](https://chrome.google.com/webstore) *(coming soon)*
   - [Firefox Add-ons](https://addons.mozilla.org) *(coming soon)*
2. Click the extension icon and connect your wallet
3. Shop normally and click "Pay with Crypto via ZetaChain" at checkout
4. Approve the transaction in your wallet

### For Developers

#### Prerequisites
- Node.js 18+ and Yarn
- MetaMask or compatible Web3 wallet
- Basic familiarity with React and Next.js

#### Development Setup
```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Open browser to http://localhost:3000
```

#### Build Extension
```bash
# Generate icons
yarn generate:icons

# Build production extension
yarn build:extension
```

This creates:
- `extension-build/` - Unpacked extension folder
- `zetapay-extension-v{version}.zip` - Package for store submission

#### Load Unpacked Extension (Testing)

**Chrome:**
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension-build/` directory

**Firefox:**
1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `manifest.json` from `extension-build/`

## 📁 Project Structure

```
web/
├── public/
│   ├── manifest.json          # Extension manifest
│   ├── background.js          # Background service worker
│   ├── content.js             # Content script (page injection)
│   └── images/                # Extension icons
├── src/
│   ├── app/
│   │   ├── Payment.tsx        # Main payment component
│   │   ├── providers.tsx      # Wagmi/RainbowKit setup
│   │   └── layout.tsx         # App layout
│   ├── wagmi.ts               # Wagmi configuration
│   └── UniversalPayment.abi.json  # Smart contract ABI
├── scripts/
│   ├── build-extension.js     # Extension build script
│   └── generate-icons.js      # Icon generation script
├── PRIVACY_POLICY.md          # Privacy policy
├── PUBLISHING_GUIDE.md        # Store publishing guide
└── package.json
```

## 🔧 Configuration

### Environment Variables
Create `.env.local` for development:

```env
NEXT_PUBLIC_UNIVERSAL_PAYMENT_ADDRESS=0x7a9cEdD3df8694Ef06B81A1E22Fb324353E35B01
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Supported Networks
- ZetaChain Athens Testnet (Chain ID: 7001)
- *(Mainnet support coming soon)*

### Token Support
Currently supports:
- ZETA (native)
- ETH.ETH (ZRC20)
- BTC.BTC (ZRC20)

## 🛠 Development

### Tech Stack
- **Framework:** Next.js 14 (static export)
- **Wallet Integration:** RainbowKit + Wagmi
- **Blockchain:** ZetaChain, ethers/viem
- **Styling:** Tailwind CSS
- **Extension APIs:** Chrome Extension Manifest V3

### Key Components

**Payment.tsx**
- Wallet connection UI
- Transaction form and submission
- Network verification
- Transaction status tracking

**content.js**
- Detects checkout pages
- Injects payment button
- Communicates with popup

**background.js**
- Service worker for message handling
- Manages extension state
- Coordinates between content script and popup

### Making Changes

1. **Add a new token:**
   Edit `TOKENS` array in `src/app/Payment.tsx`

2. **Update smart contract:**
   - Recompile contract in `contracts/`
   - Run `yarn postcompile` to copy ABI
   - Update `UNIVERSAL_PAYMENT_ADDRESS` in Payment.tsx

3. **Customize UI:**
   - Edit `src/app/Payment.tsx`
   - Styles in `src/styles/global.css`

4. **Change checkout detection:**
   - Modify `isCheckoutPage()` in `public/content.js`
   - Add merchant-specific selectors

## 🧪 Testing

### Manual Testing Checklist
- [ ] Wallet connects successfully
- [ ] Network switches to ZetaChain Athens
- [ ] Payment button appears on checkout pages
- [ ] Token selection works
- [ ] Amount input validates correctly
- [ ] Transaction submits and confirms
- [ ] Transaction status updates in real-time
- [ ] Error handling displays properly

### Testing on Real Sites
1. Visit any site with "checkout" in the URL
2. Payment button should appear (bottom-right)
3. Click button to open payment flow
4. Test transaction with testnet tokens

## 📦 Publishing

See [PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md) for detailed instructions on:
- Building for production
- Creating store assets
- Submitting to Chrome Web Store
- Submitting to Firefox Add-ons
- Version updates

## 🔐 Security

- **No private key access:** Extension never touches your private keys
- **Explicit approvals:** All transactions require wallet signature
- **Local storage only:** Data stored in browser, not on servers
- **Open source:** Code is publicly auditable

## 📄 Privacy

See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) for our complete privacy policy.

**Quick summary:**
- We don't collect personal information
- We don't track your browsing
- We don't store your wallet keys
- All data stays in your browser

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

See LICENSE file in repository root.

## 🆘 Support

- **GitHub Issues:** [Report bugs or request features](https://github.com/Parthkk90/ZetaPay/issues)
- **Documentation:** [ZetaChain Docs](https://docs.zetachain.com/)
- **Community:** Join our Discord *(link TBD)*

## 🗺 Roadmap

- [x] Wallet integration (MetaMask, WalletConnect)
- [x] Transaction signing and confirmation
- [x] Checkout page detection and button injection
- [ ] Chrome Web Store listing
- [ ] Firefox Add-ons listing
- [ ] Mainnet deployment
- [ ] Multi-chain support (Ethereum, BSC, etc.)
- [ ] Enhanced merchant integration
- [ ] Mobile wallet support
- [ ] Transaction history dashboard

## 📊 Status

**Current Version:** 0.2.0  
**Status:** Beta (Testnet only)  
**Testnet Contract:** 0x7a9cEdD3df8694Ef06B81A1E22Fb324353E35B01

## 🙏 Acknowledgments

- [ZetaChain](https://zetachain.com/) for Universal Apps infrastructure
- [RainbowKit](https://rainbowkit.com/) for wallet UI
- [Wagmi](https://wagmi.sh/) for React hooks
- Open source community

---

**Made with ❤️ by the ZetaPay team**
