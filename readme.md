# 🚀 ZetaPay - Omnichain Crypto Payment Gateway

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![ZetaChain](https://img.shields.io/badge/Powered%20by-ZetaChain-blue)](https://www.zetachain.com/)
[![Version](https://img.shields.io/badge/version-0.3.0-green.svg)](https://github.com/Parthkk90/ZetaPay)

**Pay with crypto on any e-commerce site** using ZetaChain's omnichain technology. ZetaPay is a browser extension that enables seamless cryptocurrency payments across the web.

---

## 🌟 Features

- ✅ **Universal Payment Gateway** - Works on any e-commerce website
- ✅ **Multi-Token Support** - Pay with USDC, ETH, ZETA, or other tokens
- ✅ **Omnichain Technology** - Powered by ZetaChain for cross-chain transactions
- ✅ **Non-Custodial** - Users maintain full control of their funds
- ✅ **MetaMask Integration** - Seamless wallet connection
- ✅ **Real-Time Price Conversion** - Automatic fiat-to-crypto conversion
- ✅ **Transaction History** - Complete payment tracking
- ✅ **Professional Dark Mode UI** - Modern, sleek design

---

## 📦 Project Structure

```
zetachain-payment-app/
├── contracts/              # Smart contracts (Solidity)
│   ├── UniversalPayment.sol
│   ├── SwapHelperLib.sol
│   └── test/
├── web/
│   └── public/            # Browser extension
│       ├── index.html     # Popup interface
│       ├── popup.js       # Extension logic
│       ├── wallet-manager.js
│       ├── content.js     # Page injection
│       └── manifest.json
├── backend/               # API server (Node.js)
└── test-checkout.html    # Test page
```

---

## 🔗 Smart Contract

**Deployed on ZetaChain Athens Testnet**

- **Contract Address:** `0xaC24d3E7b5cFDCf2DD1c3a1feB0AbCCd98301852`
- **Network:** ZetaChain Athens 3 Testnet (Chain ID: 7001)
- **Explorer:** [View Contract](https://athens.explorer.zetachain.com/address/0xaC24d3E7b5cFDCf2DD1c3a1feB0AbCCd98301852)

### Contract Features:
- Multi-token payment processing
- Automatic token swapping via UniswapV2
- Payment state management (pending → completed/cancelled)
- Secure fund transfers with reentrancy protection

---

## 🛠️ Tech Stack

### **Frontend**
- Chrome Extension (Manifest V3)
- Vanilla JavaScript
- Web3.js / Ethers.js
- MetaMask Integration

### **Smart Contracts**
- Solidity ^0.8.26
- Hardhat
- OpenZeppelin
- ZetaChain Protocol

### **Backend**
- Node.js + Express
- PostgreSQL
- WebSocket (real-time updates)
- JWT Authentication

---

## 🚀 Quick Start

### **1. Install Extension**

#### Load Unpacked Extension (Development)
```bash
1. Open Chrome
2. Navigate to chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select: zetachain-payment-app/web/public
```

### **2. Configure MetaMask**

Add ZetaChain Athens Testnet:
```
Network Name: ZetaChain Athens
RPC URL: https://zetachain-athens-evm.blockpi.network/v1/rpc/public
Chain ID: 7001
Currency Symbol: ZETA
Block Explorer: https://athens.explorer.zetachain.com
```

### **3. Get Testnet Tokens**

Get testnet ZETA for gas fees:
- **Faucet:** https://labs.zetachain.com/get-zeta

### **4. Test the Extension**

1. Open `test-checkout.html` in your browser
2. Click the ZetaPay extension icon
3. Connect your MetaMask wallet
4. Click "Pay with Crypto" on the test page
5. Confirm the transaction

---

## 📖 Usage

### **For Users**

1. **Connect Wallet**
   - Click the ZetaPay extension icon
   - Click "Connect Wallet"
   - Approve in MetaMask

2. **Make a Payment**
   - Browse any e-commerce site
   - ZetaPay automatically detects checkout pages
   - Click "Pay with Crypto" button
   - Select your preferred token (USDC, ETH, ZETA)
   - Confirm the transaction

3. **View History**
   - Click the extension icon
   - Navigate to "History" tab
   - View all past transactions with blockchain links

---

## 🔧 Development Setup

### **Prerequisites**
- Node.js v18+
- npm or yarn
- MetaMask browser extension
- Git

### **Install Dependencies**

#### Smart Contracts
```bash
cd contracts
npm install
```

#### Browser Extension
```bash
cd web
npm install
```

#### Backend API
```bash
cd backend
npm install
```

### **Environment Variables**

Create `.env` files in each directory:

#### `contracts/.env`
```env
PRIVATE_KEY=your_wallet_private_key
ZETA_TESTNET_RPC=https://zetachain-athens-evm.blockpi.network/v1/rpc/public
```

#### `backend/.env`
```env
DATABASE_URL=postgresql://user:password@localhost:5432/zetapay
JWT_SECRET=your_secret_key
PORT=3000
```

### **Deploy Smart Contract**

```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.ts --network zeta_testnet
```

### **Run Backend**

```bash
cd backend
npm run dev
```

### **Build Extension**

```bash
cd web
npm run build
```

---

## 🧪 Testing

### **Smart Contract Tests**
```bash
cd contracts
npx hardhat test
```

### **Run Test Checkout Page**
```bash
# Open test-checkout.html in browser
# Or serve with a local server:
npx serve . -p 8000
# Navigate to http://localhost:8000/test-checkout.html
```

---

## 📊 Architecture

### **Payment Flow**

```
User → E-commerce Site → ZetaPay Extension → MetaMask → Smart Contract → ZetaChain
                                                              ↓
                                                    Transaction Confirmed
                                                              ↓
                                                    Backend API (tracking)
                                                              ↓
                                                    Transaction History
```

### **Key Components**

1. **Content Script** (`content.js`)
   - Detects checkout pages
   - Injects "Pay with Crypto" button
   - Extracts order details

2. **Popup Interface** (`index.html` + `popup.js`)
   - Wallet connection
   - Payment confirmation
   - Transaction status

3. **Wallet Manager** (`wallet-manager.js`)
   - MetaMask integration
   - Account management
   - Transaction signing

4. **Smart Contract** (`UniversalPayment.sol`)
   - Payment processing
   - Token swapping
   - State management

5. **Backend API**
   - Transaction tracking
   - User authentication
   - Payment history

---

## 🔐 Security

- ✅ **Non-custodial** - Users control their private keys
- ✅ **Reentrancy protection** - OpenZeppelin ReentrancyGuard
- ✅ **Secure contract** - Audited code patterns
- ✅ **No private key storage** - MetaMask handles all signing
- ✅ **Content Security Policy** - Prevents XSS attacks

---

## 🗺️ Roadmap

### **Phase 1: Core Functionality** ✅
- [x] Smart contract development
- [x] Browser extension UI
- [x] MetaMask integration
- [x] Basic payment flow

### **Phase 2: Testing & Deployment** ✅
- [x] Contract deployment to testnet
- [x] Extension testing
- [x] Test checkout page

### **Phase 3: Enhanced Features** 🔄
- [ ] Multi-chain support (Ethereum, Polygon, BSC)
- [ ] Merchant dashboard
- [ ] Payment gateway API
- [ ] Off-ramp integration (crypto → fiat)

### **Phase 4: Production** 🔜
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] Chrome Web Store submission
- [ ] Partnership with payment processors

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **GitHub:** [Parthkk90/ZetaPay](https://github.com/Parthkk90/ZetaPay)
- **ZetaChain:** [zetachain.com](https://www.zetachain.com/)
- **Smart Contract:** [View on Explorer](https://athens.explorer.zetachain.com/address/0xaC24d3E7b5cFDCf2DD1c3a1feB0AbCCd98301852)
- **Testnet Faucet:** [Get ZETA](https://labs.zetachain.com/get-zeta)

---

## 👥 Team

**Developer:** [Parthkk90](https://github.com/Parthkk90)

---

## 📞 Support

For issues, questions, or suggestions:
- Open an [Issue](https://github.com/Parthkk90/ZetaPay/issues)
- Contact via GitHub

---

## 🙏 Acknowledgments

- **ZetaChain** for omnichain infrastructure
- **OpenZeppelin** for secure smart contract libraries
- **MetaMask** for wallet integration
- **Community** for feedback and support

---

<div align="center">

**Made with ❤️ using ZetaChain**

⭐ Star this repo if you find it useful!

</div>
