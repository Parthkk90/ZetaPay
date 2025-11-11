# 🚀 How to Run ZetaPay Project

Complete guide to running your ZetaPay application locally for development and testing.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Smart Contracts Setup](#smart-contracts-setup)
6. [Running the Complete Stack](#running-the-complete-stack)
7. [Browser Extension](#browser-extension)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software

#### 1. Node.js (CRITICAL - Currently Missing)
```powershell
# Download from: https://nodejs.org/
# Required version: 18.x or higher (LTS recommended)

# After installation, verify:
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

**⚠️ IMPORTANT:** Your system currently doesn't have Node.js in PATH. **Install this first!**

#### 2. PostgreSQL Database
```powershell
# Download from: https://www.postgresql.org/download/windows/
# Required version: 14.x or higher

# After installation, verify:
psql --version  # Should show psql (PostgreSQL) 14.x
```

#### 3. Git (Already Installed ✅)
```powershell
git --version  # Should show git version 2.x.x
```

#### 4. MetaMask Wallet
- Install MetaMask browser extension
- Create/import a wallet
- Get testnet ZETA from: https://labs.zetachain.com/get-zeta

---

## ⚡ Quick Start

**Once Node.js is installed**, run these commands to get everything up:

```powershell
# 1. Navigate to project
cd f:\W3\Zeta\zetachain-payment-app

# 2. Install all dependencies (3 projects)
cd backend
npm install

cd ..\contracts
npm install

cd ..\web
npm install

# 3. Setup databases
cd ..\backend
# Create PostgreSQL database (see Backend Setup section)

# 4. Configure environment files
# Copy .env.example to .env in each folder and configure
# (See detailed setup sections below)

# 5. Start development servers
# Terminal 1 - Backend API
cd backend
npm run dev

# Terminal 2 - Frontend/Extension
cd web
npm run dev

# Terminal 3 - Smart Contracts (optional)
cd contracts
npx hardhat node  # Local blockchain for testing
```

---

## 🔙 Backend Setup

### Step 1: Install Dependencies

```powershell
cd f:\W3\Zeta\zetachain-payment-app\backend
npm install
```

**Expected output:**
```
added 350+ packages in 30s
```

### Step 2: Setup PostgreSQL Database

#### Create Database
```powershell
# Open PostgreSQL command line
psql -U postgres

# In psql prompt, run:
CREATE DATABASE zetapay;
CREATE USER zetapay_user WITH PASSWORD 'zetapay_password';
GRANT ALL PRIVILEGES ON DATABASE zetapay TO zetapay_user;

# Exit psql
\q
```

#### Verify Database
```powershell
psql -U zetapay_user -d zetapay -c "SELECT version();"
```

### Step 3: Configure Environment Variables

```powershell
# Copy example file
cd f:\W3\Zeta\zetachain-payment-app\backend
copy .env.example .env

# Edit .env file
notepad .env
```

**Minimum required configuration:**

```env
# Server
NODE_ENV=development
PORT=3001

# Database (REQUIRED)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zetapay
DB_USER=zetapay_user
DB_PASSWORD=zetapay_password

# JWT Secret (REQUIRED - generate a strong secret)
JWT_SECRET=your_super_secret_key_change_this_please_12345678

# ZetaChain (for testing, use testnet)
ZETACHAIN_RPC_URL=https://zetachain-athens-evm.blockpi.network/v1/rpc/public
UNIVERSAL_PAYMENT_ADDRESS=0x0000000000000000000000000000000000000000

# Optional (can add later)
SENDGRID_API_KEY=optional_for_emails
STRIPE_SECRET_KEY=optional_for_stripe_payments
```

### Step 4: Run Database Migrations

TypeORM will auto-sync in development mode, but you can manually run:

```powershell
npm run migrate
```

### Step 5: Start Backend Server

```powershell
npm run dev
```

**Expected output:**
```
[INFO] Starting ZetaPay Backend API Server...
[INFO] Environment: development
[INFO] Database connected successfully
[INFO] WebSocket server initialized
[INFO] Server running on http://localhost:3001
[INFO] Health check available at http://localhost:3001/health
```

### Step 6: Test Backend

Open a new terminal:

```powershell
# Test health endpoint
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-11T...","uptime":1.234}
```

Or open in browser: http://localhost:3001/health

---

## 🌐 Frontend Setup

### Step 1: Install Dependencies

```powershell
cd f:\W3\Zeta\zetachain-payment-app\web
npm install
```

### Step 2: Configure Environment Variables

```powershell
# Create .env.local file
notepad .env.local
```

**Add this configuration:**

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# ZetaChain Network
NEXT_PUBLIC_ZETACHAIN_NETWORK=zeta_testnet
NEXT_PUBLIC_ZETACHAIN_RPC=https://zetachain-athens-evm.blockpi.network/v1/rpc/public

# Smart Contract (use deployed contract address)
NEXT_PUBLIC_UNIVERSAL_PAYMENT_ADDRESS=0x0000000000000000000000000000000000000000

# WalletConnect Project ID (optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Environment
NEXT_PUBLIC_ENVIRONMENT=development
```

### Step 3: Start Frontend Development Server

```powershell
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- info  Loaded env from f:\W3\Zeta\zetachain-payment-app\web\.env.local
- event compiled client and server successfully in 2.5s
```

### Step 4: Access Frontend

Open browser: **http://localhost:3000**

You should see the ZetaPay dashboard/payment interface.

---

## 📜 Smart Contracts Setup

### Step 1: Install Dependencies

```powershell
cd f:\W3\Zeta\zetachain-payment-app\contracts
npm install
```

### Step 2: Configure Environment Variables

```powershell
# Create .env file
notepad .env
```

**Add this configuration:**

```env
# Your wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# After deployment, add contract address:
UNIVERSAL_PAYMENT_ADDRESS=will_be_set_after_deployment
```

**⚠️ SECURITY WARNING:**
- NEVER commit .env to git
- Use a test wallet, not your main wallet
- Get testnet ZETA from: https://labs.zetachain.com/get-zeta

### Step 3: Compile Contracts

```powershell
npx hardhat compile
```

**Expected output:**
```
Compiling 15 Solidity files
Compiled 15 Solidity files successfully
Generating typings for: 15 artifacts
Successfully generated 50 typings!
```

### Step 4: Run Local Blockchain (Optional)

For local testing:

```powershell
# Terminal 1 - Start local blockchain
npx hardhat node

# Terminal 2 - Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost
```

### Step 5: Deploy to Testnet (When Ready)

See detailed guide: `TASK14_DEPLOYMENT_CHECKLIST.md`

```powershell
# Check your balance first
npx hardhat run scripts/check-balance.ts --network zeta_testnet

# Deploy contract
npx hardhat run scripts/deploy.ts --network zeta_testnet

# Initialize tokens
npx hardhat run scripts/initialize-tokens.ts --network zeta_testnet
```

---

## 🎯 Running the Complete Stack

### Development Mode (3 Terminals)

#### Terminal 1: Backend API Server
```powershell
cd f:\W3\Zeta\zetachain-payment-app\backend
npm run dev
```
Runs on: **http://localhost:3001**

#### Terminal 2: Frontend/Extension
```powershell
cd f:\W3\Zeta\zetachain-payment-app\web
npm run dev
```
Runs on: **http://localhost:3000**

#### Terminal 3: Local Blockchain (Optional)
```powershell
cd f:\W3\Zeta\zetachain-payment-app\contracts
npx hardhat node
```
Runs on: **http://localhost:8545**

### What You Can Do Now

1. **Access Frontend Dashboard:** http://localhost:3000
2. **Test API Endpoints:** http://localhost:3001/api/v1/
3. **View API Health:** http://localhost:3001/health
4. **Connect MetaMask:** To local or testnet blockchain
5. **Create Test Payments:** Using the frontend interface

---

## 🔌 Browser Extension

### Build and Load Extension

```powershell
cd f:\W3\Zeta\zetachain-payment-app\web

# Build extension
npm run build:extension
```

**Expected output:**
```
✓ Extension built successfully!
📦 Output: extension-build/
```

### Install in Chrome/Edge

1. **Open Extensions Page:**
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`

2. **Enable Developer Mode:**
   - Toggle "Developer mode" in top-right corner

3. **Load Extension:**
   - Click "Load unpacked"
   - Navigate to: `f:\W3\Zeta\zetachain-payment-app\web\extension-build`
   - Click "Select Folder"

4. **Verify Installation:**
   - You should see "ZetaPay" extension with version 0.2.0
   - Click the extension icon to open popup

---

## 🧪 Testing

### Backend Tests

```powershell
cd f:\W3\Zeta\zetachain-payment-app\backend

# Install test dependencies (if not already done)
npm install

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test tests/integration/payment.test.ts
```

**See detailed guide:** `TASK10_TESTING_CHECKLIST.md`

### Smart Contract Tests

```powershell
cd f:\W3\Zeta\zetachain-payment-app\contracts

# Run all tests
npx hardhat test

# Run specific test
npx hardhat test test/UniversalPayment.test.ts

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "node is not recognized" or "npm is not recognized"

**Problem:** Node.js not installed or not in PATH

**Solution:**
```powershell
# Install Node.js from: https://nodejs.org/
# During installation, check "Add to PATH"
# Restart PowerShell
# Verify:
node --version
npm --version
```

#### 2. Backend won't start - Database connection error

**Problem:** PostgreSQL not running or wrong credentials

**Solution:**
```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*

# If not running, start it:
Start-Service postgresql-x64-14  # Adjust version number

# Test connection:
psql -U zetapay_user -d zetapay

# If connection fails, check .env credentials match database user
```

#### 3. Port already in use (EADDRINUSE)

**Problem:** Port 3000 or 3001 already in use

**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :3001

# Kill the process (replace <PID> with actual PID)
taskkill /PID <PID> /F

# Or change port in .env:
PORT=3002
```

#### 4. Frontend can't connect to backend

**Problem:** CORS or wrong API URL

**Solution:**
```powershell
# 1. Check backend is running on port 3001
# 2. Check web/.env.local has correct API URL:
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# 3. Check backend/.env has frontend in ALLOWED_ORIGINS:
ALLOWED_ORIGINS=http://localhost:3000
```

#### 5. npm install fails with errors

**Problem:** Network issues or package conflicts

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules
rm package-lock.json

# Reinstall
npm install

# If still fails, try:
npm install --legacy-peer-deps
```

#### 6. "Cannot find module" errors

**Problem:** TypeScript compilation or missing dependencies

**Solution:**
```powershell
# Make sure all dependencies are installed
npm install

# For contracts, regenerate typechain types:
npx hardhat compile

# For backend, rebuild:
npm run build
```

#### 7. MetaMask not connecting

**Problem:** Wrong network or no testnet funds

**Solution:**
1. **Add ZetaChain Testnet to MetaMask:**
   - Network Name: ZetaChain Athens Testnet
   - RPC URL: https://zetachain-athens-evm.blockpi.network/v1/rpc/public
   - Chain ID: 7001
   - Currency: ZETA
   - Explorer: https://athens.explorer.zetachain.com/

2. **Get Testnet ZETA:**
   - Visit: https://labs.zetachain.com/get-zeta
   - Enter your wallet address
   - Wait 1-2 minutes

#### 8. Hardhat network errors

**Problem:** Wrong network configuration

**Solution:**
```powershell
# Check hardhat.config.ts has correct network settings
# For testnet, use:
# - RPC: https://zetachain-athens-evm.blockpi.network/v1/rpc/public
# - Chain ID: 7001

# Check your private key is in .env (without 0x prefix)
# Check you have testnet ZETA
```

---

## 📊 Project Status Check

After starting everything, verify:

### ✅ Backend Health
```powershell
curl http://localhost:3001/health
# Should return: {"status":"ok",...}
```

### ✅ Frontend Access
Open: http://localhost:3000
- Should see ZetaPay interface
- No console errors

### ✅ Database Connection
```powershell
psql -U zetapay_user -d zetapay -c "\dt"
# Should list tables: merchants, payments, api_keys, etc.
```

### ✅ Smart Contracts
```powershell
cd contracts
npx hardhat compile
# Should compile successfully with no errors
```

---

## 🔄 Development Workflow

### Starting Your Day

```powershell
# 1. Start PostgreSQL (if not auto-start)
Start-Service postgresql-x64-14

# 2. Pull latest changes
cd f:\W3\Zeta\zetachain-payment-app
git pull origin main

# 3. Install any new dependencies
cd backend
npm install
cd ..\web
npm install
cd ..\contracts
npm install

# 4. Start servers (3 terminals)
# Terminal 1: Backend
cd f:\W3\Zeta\zetachain-payment-app\backend
npm run dev

# Terminal 2: Frontend
cd f:\W3\Zeta\zetachain-payment-app\web
npm run dev

# Terminal 3: Available for commands/tests
```

### Making Changes

1. **Edit Code:** Use VS Code
2. **Auto-Reload:** Both backend and frontend have hot reload
3. **Test Changes:** Use browser or curl
4. **Run Tests:** `npm test` before committing
5. **Commit:** `git add .`, `git commit`, `git push`

### Before Committing

```powershell
# 1. Run linter
cd backend
npm run lint

# 2. Run tests
npm test

# 3. Check for TypeScript errors
npm run build

# 4. Commit if all pass
git add .
git commit -m "your message"
git push origin main
```

---

## 🎯 Next Steps

Now that you can run the project:

1. ✅ **Install Node.js** (CRITICAL - do this first!)
2. ✅ **Setup PostgreSQL database**
3. ✅ **Configure environment variables**
4. ✅ **Start all services**
5. 🔄 **Complete Task 14** - Deploy multi-token contract (see `TASK14_DEPLOYMENT_CHECKLIST.md`)
6. 🔄 **Complete Task 10** - Run integration tests (see `TASK10_TESTING_CHECKLIST.md`)
7. 📚 **Read API documentation** - `backend/README.md`
8. 🧪 **Test payment flows** - Create test payments
9. 🎨 **Customize frontend** - Modify React components
10. 🚀 **Deploy to testnet** - When ready for testing

---

## 📞 Need Help?

### Documentation
- **Backend API:** `backend/README.md`
- **Smart Contracts:** `contracts/README.md`
- **Deployment:** `TASK14_DEPLOYMENT_CHECKLIST.md`
- **Testing:** `TASK10_TESTING_CHECKLIST.md`
- **WebSocket:** `backend/WEBSOCKET_GUIDE.md`

### Quick References
- **API Endpoints:** 38 endpoints documented in `backend/README.md`
- **Environment Variables:** `.env.example` files in each folder
- **Test Coverage:** 14 integration tests ready to run

---

## 🎉 Success Indicators

You're ready to develop when:

- [x] Node.js installed and working
- [x] PostgreSQL running
- [x] Backend API responding on port 3001
- [x] Frontend loading on port 3000
- [x] No errors in terminal windows
- [x] Can connect MetaMask wallet
- [x] Health check returns success

**Happy Coding! 🚀**
