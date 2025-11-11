# Task 14: Multi-Token Support - Deployment Checklist

## ✅ Already Completed
- [x] Smart contract token whitelist implementation
- [x] Backend token validation
- [x] Frontend token selector (6 tokens)
- [x] Price service integration (CoinGecko)
- [x] Deployment documentation

## 📋 Step-by-Step Deployment Guide

### Prerequisites Check
```powershell
# 1. Verify Node.js is installed (v18+)
node --version
# Expected output: v18.x.x or higher

# 2. Verify npm is available
npm --version
# Expected output: 9.x.x or higher
```

If these commands fail, you need to:
1. Download Node.js from https://nodejs.org/ (LTS version)
2. Install it
3. Restart PowerShell
4. Run the commands again

---

### Step 1: Install Contract Dependencies

```powershell
cd f:\W3\Zeta\zetachain-payment-app\contracts
npm install
```

**Expected output:**
```
added 500+ packages in 30s
```

**If you see errors:**
- Check your internet connection
- Try: `npm install --legacy-peer-deps`
- Clear npm cache: `npm cache clean --force`

---

### Step 2: Create Environment File

Create `contracts/.env` file:

```powershell
cd f:\W3\Zeta\zetachain-payment-app\contracts
notepad .env
```

Add this content (replace with your actual private key):
```env
PRIVATE_KEY=your_wallet_private_key_without_0x_prefix
```

⚠️ **IMPORTANT:**
- Get testnet ZETA from: https://labs.zetachain.com/get-zeta
- NEVER commit .env to git
- Keep your private key secret

---

### Step 3: Compile Contracts

```powershell
npx hardhat compile
```

**Expected output:**
```
Compiling 15 Solidity files
Compiled 15 Solidity files successfully (one or more may have warnings)
Generating typings for: 15 artifacts
Successfully generated 50 typings!
```

**Common issues:**
- If you see "Cannot find module": Run `npm install` again
- If you see "Solidity version mismatch": Already configured correctly, ignore

---

### Step 4: Check Your Testnet Balance

```powershell
npx hardhat run scripts/check-balance.ts --network zeta_testnet
```

**Expected output:**
```
Wallet Address: 0x...
Balance: 5.5 ZETA
```

**If balance is 0:**
1. Go to https://labs.zetachain.com/get-zeta
2. Enter your wallet address
3. Request testnet ZETA
4. Wait 1-2 minutes
5. Check balance again

---

### Step 5: Deploy UniversalPayment Contract

```powershell
npx hardhat run scripts/deploy.ts --network zeta_testnet
```

**Expected output:**
```
Deploying UniversalPayment contract to ZetaChain Athens 3 testnet...
Gateway Address: 0x6c533f7fe93fae114d0954697069df33c9b74fd7
System Contract Address: 0x91d18e54DAf4F677cB28167158d6dd21F6aB3921

Deploying contract...
✅ UniversalPayment deployed successfully!
Contract Address: 0x... (SAVE THIS ADDRESS!)

Verification command:
npx hardhat verify --network zeta_testnet 0x... 0x6c533f7fe93fae114d0954697069df33c9b74fd7 0x91d18e54DAf4F677cB28167158d6dd21F6aB3921
```

**⚠️ CRITICAL: Save the Contract Address!**

Copy the contract address (starts with 0x...) - you'll need it for the next steps.

---

### Step 6: Initialize Token Whitelist

Update `contracts/.env` with your deployed contract address:
```env
PRIVATE_KEY=your_private_key
UNIVERSAL_PAYMENT_ADDRESS=0xYourContractAddressFromStep5
```

Then run:
```powershell
npx hardhat run scripts/initialize-tokens.ts --network zeta_testnet
```

**Expected output:**
```
Initializing token whitelist on UniversalPayment contract...
Contract Address: 0x...
Signer Address: 0x...
Signer Balance: 4.2 ZETA

📋 Tokens to whitelist:
  1. ZETA   - 0x0000000000000000000000000000000000000000
  2. ETH    - 0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf
  3. BTC    - 0x13A0c5930C028511Dc02665E7285134B6d11A5f4
  4. USDT   - 0x0cbe0dF132a6c6B4a2974Fa1b7Fb953CF0Cc798a
  5. USDC   - 0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0
  6. DAI    - 0x4c5f4d519dff3c1aea8581e207fd93d44f65e09e

🔄 Whitelisting tokens...
Transaction Hash: 0x...
⏳ Waiting for confirmation...
✅ Transaction confirmed in block: 123456
Gas Used: 150000

✅ Verifying whitelisted tokens:
  ✅ ZETA   - 0x0000000000000000000000000000000000000000
  ✅ ETH    - 0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf
  ✅ BTC    - 0x13A0c5930C028511Dc02665E7285134B6d11A5f4
  ✅ USDT   - 0x0cbe0dF132a6c6B4a2974Fa1b7Fb953CF0Cc798a
  ✅ USDC   - 0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0
  ✅ DAI    - 0x4c5f4d519dff3c1aea8581e207fd93d44f65e09e

🎉 Token whitelist initialization complete!
```

---

### Step 7: Test Multi-Token Support

```powershell
npx hardhat run scripts/test-multi-token.ts --network zeta_testnet
```

**Expected output:**
```
Testing Multi-Token Support
Contract Address: 0x...

📋 Testing Token Acceptance:
  ✅ ZETA - 0x0000000000000000000000000000000000000000
  ✅ USDT - 0x0cbe0dF132a6c6B4a2974Fa1b7Fb953CF0Cc798a
  ✅ USDC - 0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0
  ✅ DAI  - 0x4c5f4d519dff3c1aea8581e207fd93d44f65e09e

✅ Test complete!
```

---

### Step 8: Update Environment Variables

#### Backend (.env)
```powershell
cd f:\W3\Zeta\zetachain-payment-app\backend
notepad .env
```

Add/update:
```env
UNIVERSAL_PAYMENT_ADDRESS=0xYourContractAddressFromStep5
ZETACHAIN_RPC_URL=https://zetachain-athens-evm.blockpi.network/v1/rpc/public
```

#### Frontend (.env.local)
```powershell
cd f:\W3\Zeta\zetachain-payment-app\web
notepad .env.local
```

Add/update:
```env
NEXT_PUBLIC_UNIVERSAL_PAYMENT_ADDRESS=0xYourContractAddressFromStep5
NEXT_PUBLIC_ZETACHAIN_NETWORK=zeta_testnet
```

---

### Step 9: Commit Contract Address

```powershell
cd f:\W3\Zeta\zetachain-payment-app
git add backend/.env contracts/.env web/.env.local
git commit -m "deploy multi-token contract to testnet"
git push origin main
```

---

### Step 10: Verify on Block Explorer

1. Go to: https://athens.explorer.zetachain.com/
2. Search for your contract address
3. Verify:
   - Contract is deployed
   - Token whitelist transactions are visible
   - Contract has correct owner

---

## ✅ Success Criteria

After completing all steps, you should have:

- [x] Contract deployed to Athens-3 testnet
- [x] 6 tokens whitelisted (ZETA, ETH, BTC, USDT, USDC, DAI)
- [x] Contract address saved in environment variables
- [x] Token acceptance verified
- [x] Backend configured with contract address
- [x] Frontend configured with contract address
- [x] All changes committed to git

---

## 🐛 Troubleshooting

### Error: "Insufficient funds"
**Solution:** Get more testnet ZETA from https://labs.zetachain.com/get-zeta

### Error: "Nonce too high"
**Solution:** Reset MetaMask account (Settings → Advanced → Reset Account)

### Error: "Cannot estimate gas"
**Solution:** 
1. Check your private key is correct
2. Ensure you have enough ZETA for gas
3. Try again in a few minutes

### Error: "Network not found: zeta_testnet"
**Solution:** Already configured in hardhat.config.ts, just run `npm install` again

### Transaction pending for >5 minutes
**Solution:**
1. Check Athens-3 testnet status: https://status.zetachain.com/
2. Try increasing gas price in hardhat.config.ts
3. Wait a bit longer (testnet can be slow)

---

## 📊 Task Completion Report

Once all steps are done, create a comment in GitHub Issue:

```markdown
## Task 14: Multi-Token Support - COMPLETED ✅

**Contract Address:** 0x... (your address)
**Network:** ZetaChain Athens-3 Testnet
**Deployment Date:** [Date]
**Gas Used:** ~150,000

**Whitelisted Tokens:**
- ✅ ZETA
- ✅ ETH
- ✅ BTC
- ✅ USDT
- ✅ USDC
- ✅ DAI

**Next Steps:**
- Frontend testing with real payments
- Integration with backend API
- User acceptance testing
```

---

## 🎯 What This Enables

After completing this task, merchants will be able to:
1. Accept payments in any of 6 tokens
2. Customers can choose their preferred token
3. Automatic price conversion
4. Cross-chain payment support
5. Token swapping via Uniswap

---

**Status:** READY FOR DEPLOYMENT (once Node.js is available)
**Estimated Time:** 15-20 minutes
**Prerequisites:** Node.js installed, testnet ZETA in wallet
