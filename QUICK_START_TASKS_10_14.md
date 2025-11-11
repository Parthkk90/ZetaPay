# 🚀 Quick Start: Complete Tasks 10 & 14

## ⚠️ CURRENT BLOCKER

**Node.js is not installed or not in your system PATH.**

Both tasks require Node.js to run npm commands. You MUST complete Step 0 before proceeding.

---

## Step 0: Install Node.js (REQUIRED)

### Option 1: Download and Install (Recommended)

1. **Go to:** https://nodejs.org/
2. **Download:** LTS version (v18.x or higher)
3. **Install:** Run the installer
   - Check "Add to PATH" during installation
   - Accept all defaults
4. **Restart PowerShell**
5. **Verify:**
   ```powershell
   node --version
   npm --version
   ```

### Option 2: If Already Installed (Check PATH)

```powershell
# Find Node.js installation
where.exe node

# If not found, add to PATH manually:
# 1. Search "Environment Variables" in Windows
# 2. Edit "Path" variable
# 3. Add Node.js path (usually C:\Program Files\nodejs)
# 4. Restart PowerShell
```

---

## ✅ After Node.js is Available

### Task 14: Deploy Multi-Token Contract (15-20 minutes)

**Quick Commands:**
```powershell
# 1. Install dependencies
cd f:\W3\Zeta\zetachain-payment-app\contracts
npm install

# 2. Create .env file
notepad .env
# Add: PRIVATE_KEY=your_private_key_without_0x

# 3. Get testnet ZETA
# Visit: https://labs.zetachain.com/get-zeta

# 4. Compile contracts
npx hardhat compile

# 5. Deploy to testnet
npx hardhat run scripts/deploy.ts --network zeta_testnet
# SAVE THE CONTRACT ADDRESS!

# 6. Initialize tokens
# First, add contract address to .env:
# UNIVERSAL_PAYMENT_ADDRESS=0xYourContractAddress
npx hardhat run scripts/initialize-tokens.ts --network zeta_testnet

# 7. Verify
npx hardhat run scripts/test-multi-token.ts --network zeta_testnet
```

**📖 Detailed Guide:** See `TASK14_DEPLOYMENT_CHECKLIST.md`

---

### Task 10: Run E2E Integration Tests (10-15 minutes)

**Quick Commands:**
```powershell
# 1. Install dependencies
cd f:\W3\Zeta\zetachain-payment-app\backend
npm install

# 2. Setup test database
psql -U postgres
# In psql:
CREATE DATABASE zetapay_test;
CREATE USER zetapay_test_user WITH PASSWORD 'test_password_123';
GRANT ALL PRIVILEGES ON DATABASE zetapay_test TO zetapay_test_user;
\q

# 3. Run tests
npm test

# 4. Run with coverage
npm test -- --coverage
```

**📖 Detailed Guide:** See `TASK10_TESTING_CHECKLIST.md`

---

## 📊 What You'll Accomplish

### Task 14 Results:
- ✅ Contract deployed to Athens-3 testnet
- ✅ 6 tokens whitelisted (ZETA, ETH, BTC, USDT, USDC, DAI)
- ✅ Multi-token payments enabled
- ✅ Contract verified on block explorer

### Task 10 Results:
- ✅ 14 integration tests passing
- ✅ Test coverage >78%
- ✅ Payment flows validated
- ✅ Analytics endpoints tested

---

## 🎯 Success Indicators

You'll know you're done when:

**Task 14:**
```
✅ Token whitelist initialization complete!
🎉 All 6 tokens verified and accepted
```

**Task 10:**
```
Test Suites: 2 passed, 2 total
Tests:       14 passed, 14 total
Time:        5.234 s
```

---

## 🐛 If You Get Stuck

### Task 14 Issues:
- **"Insufficient funds"** → Get testnet ZETA: https://labs.zetachain.com/get-zeta
- **"Cannot estimate gas"** → Check private key and balance
- **"Network error"** → Check internet connection

### Task 10 Issues:
- **"Database connection failed"** → Start PostgreSQL service
- **"Port already in use"** → Kill process or change port
- **Tests failing** → Check `.env.test` configuration

---

## 📞 Need Help?

1. **Check detailed guides:**
   - `TASK14_DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment
   - `TASK10_TESTING_CHECKLIST.md` - Complete testing guide

2. **Check existing docs:**
   - `contracts/DEPLOYMENT_GUIDE.md` - Contract deployment
   - `backend/tests/README.md` - Test documentation

3. **Common fixes:**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules: `rm -rf node_modules; npm install`
   - Reset database: Drop and recreate test database

---

## ⏱️ Estimated Timeline

**Total Time:** 25-35 minutes

| Task | Time | Complexity |
|------|------|------------|
| Node.js Installation | 5 min | Easy |
| Task 14 - Contract Deployment | 15-20 min | Medium |
| Task 10 - Run Tests | 10-15 min | Easy |

---

## 🎉 After Completion

Both tasks will be marked complete in the todo list:

```
✅ Task 10: E2E Integration Tests - COMPLETED
✅ Task 14: Multi-Token Support - COMPLETED
```

This will bring ZetaPay to **75% completion** (15/20 tasks done)!

---

**STATUS:** Waiting for Node.js installation
**NEXT ACTION:** Install Node.js, then follow this guide
**BLOCKERS:** None (after Node.js is installed)
