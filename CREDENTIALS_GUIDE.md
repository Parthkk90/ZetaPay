# 🔑 Complete Credentials & API Keys Guide

This guide explains **every credential** you need to run ZetaPay in development and production, including what's required vs. optional, where to get them, and how to configure them.

---

## 📋 Table of Contents

1. [Quick Overview](#quick-overview)
2. [Development vs Production](#development-vs-production)
3. [Backend Credentials](#backend-credentials)
4. [Frontend Credentials](#frontend-credentials)
5. [Smart Contract Credentials](#smart-contract-credentials)
6. [Third-Party Services](#third-party-services)
7. [Step-by-Step Setup](#step-by-step-setup)

---

## 🎯 Quick Overview

### ✅ **REQUIRED for Basic Development** (Minimum to run locally)

```env
# Backend (.env)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zetapay
DB_USER=postgres
DB_PASSWORD=your_db_password
JWT_SECRET=generate_a_random_32_char_string

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=get_from_walletconnect

# Contracts (.env)
PRIVATE_KEY=your_test_wallet_private_key_for_deployment
```

### ⚠️ **OPTIONAL for Development** (Can add later)

- Stripe/PayPal (for fiat payments)
- SendGrid (for emails)
- KYC providers (Persona/Onfido)
- Sentry (error tracking)
- CoinGecko API (for price feeds - has free tier)

### 🚀 **REQUIRED for Production**

All of the above + production API keys for all services.

---

## 🔄 Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| **Database** | Local PostgreSQL | Cloud PostgreSQL (AWS RDS, etc.) |
| **JWT Secret** | Any random string | Cryptographically secure 32+ chars |
| **ZetaChain** | Athens Testnet | Mainnet |
| **Stripe** | Test mode keys | Live mode keys |
| **PayPal** | Sandbox mode | Production mode |
| **Emails** | Optional/Console logs | SendGrid required |
| **KYC** | Optional/Mock | Persona/Onfido required |
| **Monitoring** | Optional | Sentry required |

---

## 🔙 Backend Credentials

### 1. Database (PostgreSQL) - **REQUIRED**

**What it is:** Your main database for storing merchants, payments, users.

**How to get:**
```powershell
# Install PostgreSQL locally
# Download from: https://www.postgresql.org/download/windows/

# After installation, create database:
psql -U postgres
CREATE DATABASE zetapay;
CREATE USER zetapay_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE zetapay TO zetapay_user;
\q
```

**Environment Variables:**
```env
DB_HOST=localhost                  # Local dev
DB_PORT=5432                       # Default PostgreSQL port
DB_NAME=zetapay                    # Your database name
DB_USER=zetapay_user               # Your database user
DB_PASSWORD=your_secure_password   # Your database password
```

**Cost:** ✅ FREE (local development)

**Production:** Use AWS RDS, DigitalOcean, or similar ($15-50/month)

---

### 2. JWT Secret - **REQUIRED**

**What it is:** Secret key for signing authentication tokens.

**How to get:**
```powershell
# Option 1: Generate random string (32+ characters)
# Use a password generator or:

# Option 2: Generate with Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Environment Variable:**
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRES_IN=7d  # Token expiration time
```

**Cost:** ✅ FREE (just a random string)

**Security:** 
- ⚠️ NEVER commit to git
- Use different secrets for dev/prod
- Rotate periodically in production

---

### 3. ZetaChain RPC - **REQUIRED**

**What it is:** Connection to ZetaChain blockchain for processing crypto payments.

**How to get:**
```env
# Testnet (Development) - FREE
ZETA_NETWORK=testnet
ZETA_RPC_URL=https://zetachain-athens-evm.blockpi.network/v1/rpc/public

# Mainnet (Production)
ZETA_NETWORK=mainnet
ZETA_RPC_URL=https://zetachain-evm.blockpi.network/v1/rpc/public
```

**Cost:** ✅ FREE (public RPC nodes)

**Alternative:** 
- Get dedicated RPC from: https://www.alchemy.com/ or https://infura.io/
- Better performance but costs $50-200/month

---

### 4. Stripe Integration - **OPTIONAL for Dev** (for fiat payments)

**What it is:** Accept credit card payments alongside crypto.

**How to get:**
1. **Sign up:** https://stripe.com/
2. **Get API Keys:** Dashboard → Developers → API Keys
3. **Copy keys:**
   - Publishable Key: `pk_test_...`
   - Secret Key: `sk_test_...`
   - Webhook Secret: `whsec_...` (after creating webhook)

**Environment Variables:**
```env
# Test Mode (Development)
STRIPE_SECRET_KEY=sk_test_51ABC...xyz
STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...xyz
STRIPE_WEBHOOK_SECRET=whsec_test_abc...xyz

# Live Mode (Production)
STRIPE_SECRET_KEY=sk_live_51ABC...xyz
STRIPE_PUBLISHABLE_KEY=pk_live_51ABC...xyz
STRIPE_WEBHOOK_SECRET=whsec_live_abc...xyz
```

**Cost:** 
- ✅ FREE to sign up
- 💰 2.9% + $0.30 per transaction (when you go live)

**Do you need it NOW?** 
- ❌ NO - Only if you want to accept credit cards
- You can skip this and only use crypto payments

---

### 5. PayPal Integration - **OPTIONAL for Dev**

**What it is:** Accept PayPal payments.

**How to get:**
1. **Sign up:** https://developer.paypal.com/
2. **Create App:** Dashboard → My Apps & Credentials → Create App
3. **Copy credentials:**
   - Client ID: `ABC...xyz`
   - Client Secret: `ABC...xyz`

**Environment Variables:**
```env
# Sandbox Mode (Development)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=ABC...xyz
PAYPAL_CLIENT_SECRET=ABC...xyz

# Live Mode (Production)
PAYPAL_MODE=production
PAYPAL_CLIENT_ID=ABC...xyz
PAYPAL_CLIENT_SECRET=ABC...xyz
```

**Cost:** 
- ✅ FREE to sign up
- 💰 2.9% + $0.30 per transaction (when you go live)

**Do you need it NOW?** 
- ❌ NO - Optional, only for PayPal payments

---

### 6. SendGrid (Email Notifications) - **OPTIONAL for Dev**

**What it is:** Send email notifications (payment confirmations, KYC updates).

**How to get:**
1. **Sign up:** https://sendgrid.com/
2. **Create API Key:** Settings → API Keys → Create API Key
3. **Copy key:** `SG.abc123...xyz`
4. **Verify sender email:** Settings → Sender Authentication

**Environment Variables:**
```env
SENDGRID_API_KEY=SG.abc123...xyz
FROM_EMAIL=noreply@yourdomain.com  # Must be verified in SendGrid
```

**Cost:** 
- ✅ FREE tier: 100 emails/day
- 💰 Paid: $15/month for 40,000 emails

**Do you need it NOW?** 
- ❌ NO - In development, emails can be logged to console
- ✅ YES for production

---

### 7. CoinGecko API (Price Feeds) - **OPTIONAL**

**What it is:** Get real-time crypto prices for USD conversion.

**How to get:**
1. **Sign up:** https://www.coingecko.com/en/api
2. **Get Free API Key:** (optional, public API works without key)
3. **Copy key:** If you want higher rate limits

**Environment Variables:**
```env
# Optional - Public API works without this
COINGECKO_API_KEY=CG-abc123...xyz
PRICE_UPDATE_INTERVAL=60000  # Update every 60 seconds
```

**Cost:** 
- ✅ FREE: 10-50 calls/minute (sufficient for development)
- 💰 Paid: $129/month for 500 calls/minute

**Do you need it NOW?** 
- ❌ NO - Free tier works fine
- App will still work without it (uses cached prices)

---

### 8. KYC Providers - **OPTIONAL for Dev**

#### Option A: Persona (Identity Verification)

**What it is:** Verify merchant identities for compliance.

**How to get:**
1. **Sign up:** https://withpersona.com/
2. **Get Sandbox API Key:** Dashboard → API Keys
3. **Create Template:** Dashboard → Inquiry Templates
4. **Copy credentials:**
   - API Key: `persona_sandbox_...`
   - Template ID: `itmpl_...`

**Environment Variables:**
```env
# Sandbox (Development)
PERSONA_API_KEY=persona_sandbox_abc123...xyz
PERSONA_TEMPLATE_ID=itmpl_abc123...xyz
PERSONA_WEBHOOK_SECRET=your_webhook_secret
PERSONA_ENVIRONMENT=sandbox

# Production
PERSONA_API_KEY=persona_production_abc123...xyz
PERSONA_ENVIRONMENT=production
```

**Cost:** 
- ✅ FREE sandbox for testing
- 💰 Production: $1-3 per verification

#### Option B: Onfido (Document Verification)

**Alternative to Persona, similar setup**

**Environment Variables:**
```env
ONFIDO_API_TOKEN=api_sandbox.abc123...xyz
ONFIDO_API_BASE=https://api.us.onfido.com/v3.6
ONFIDO_WEBHOOK_TOKEN=your_webhook_token
```

**Do you need it NOW?** 
- ❌ NO - Only needed if you want KYC verification
- Can build without it and add later

---

### 9. Sentry (Error Monitoring) - **OPTIONAL for Dev**

**What it is:** Track errors and crashes in production.

**How to get:**
1. **Sign up:** https://sentry.io/
2. **Create Project:** Projects → Create Project → Node.js
3. **Copy DSN:** Project Settings → Client Keys (DSN)

**Environment Variables:**
```env
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
LOG_LEVEL=info  # Development: debug, Production: warn
```

**Cost:** 
- ✅ FREE: 5,000 events/month
- 💰 Paid: $26/month for 50,000 events

**Do you need it NOW?** 
- ❌ NO - Only useful in production
- Use console logs during development

---

### 10. Redis (Caching & Rate Limiting) - **OPTIONAL for Dev**

**What it is:** In-memory cache for better performance.

**How to get:**
```powershell
# Option 1: Install locally (Windows)
# Download from: https://github.com/microsoftarchive/redis/releases

# Option 2: Use Docker
docker run -d -p 6379:6379 redis:alpine

# Option 3: Cloud Redis (Production)
# Use: Redis Labs, AWS ElastiCache, etc.
```

**Environment Variables:**
```env
REDIS_URL=redis://localhost:6379  # Local dev
# Or for cloud:
REDIS_URL=redis://username:password@redis-host:6379
```

**Cost:** 
- ✅ FREE (local development)
- 💰 Production: $5-50/month depending on size

**Do you need it NOW?** 
- ❌ NO - App works without it
- ✅ YES for production (better performance)

---

## 🌐 Frontend Credentials

### 1. API URL - **REQUIRED**

**What it is:** URL where your backend API is running.

**Environment Variables:**
```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

**Cost:** ✅ FREE

---

### 2. WalletConnect Project ID - **REQUIRED**

**What it is:** Allows users to connect crypto wallets (MetaMask, etc.).

**How to get:**
1. **Sign up:** https://cloud.walletconnect.com/
2. **Create Project:** Dashboard → New Project
3. **Copy Project ID:** From dashboard

**Current Configuration:**
```typescript
// web/src/wagmi.ts
projectId: "9dd3b957e87a350c83ab1b87a7fcf40c"  // Default demo ID
```

**Environment Variables:**
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

**Cost:** 
- ✅ FREE tier: Unlimited for development
- 💰 Paid: $49/month for production features

**Do you need it NOW?** 
- ✅ YES - Required for wallet connections
- Can use the demo ID for now, but create your own for production

---

### 3. Smart Contract Address - **REQUIRED (after deployment)**

**What it is:** Address of your deployed UniversalPayment contract.

**How to get:**
- Deploy contract to testnet (see Task 14)
- Copy contract address from deployment output

**Environment Variables:**
```env
# Before deployment (placeholder)
NEXT_PUBLIC_UNIVERSAL_PAYMENT_ADDRESS=0x0000000000000000000000000000000000000000

# After deployment
NEXT_PUBLIC_UNIVERSAL_PAYMENT_ADDRESS=0xYourActualContractAddress
```

**Cost:** 
- ✅ FREE (testnet deployment)
- 💰 Mainnet: ~$50-100 in ETH/ZETA for gas

---

### 4. ZetaChain RPC - **REQUIRED**

**Environment Variables:**
```env
NEXT_PUBLIC_ZETACHAIN_NETWORK=zeta_testnet  # or zeta_mainnet
NEXT_PUBLIC_ZETACHAIN_RPC=https://zetachain-athens-evm.blockpi.network/v1/rpc/public
```

**Cost:** ✅ FREE

---

### 5. Environment Mode - **REQUIRED**

**Environment Variables:**
```env
NEXT_PUBLIC_ENVIRONMENT=development  # or production
```

**Cost:** ✅ FREE

---

## 📜 Smart Contract Credentials

### 1. Private Key - **REQUIRED for Deployment**

**What it is:** Your wallet's private key to deploy contracts and pay gas fees.

**How to get:**
```powershell
# Option 1: Export from MetaMask
# MetaMask → Account Details → Export Private Key
# (Remove "0x" prefix when copying)

# Option 2: Create new wallet with Hardhat
npx hardhat create-account
```

**Environment Variables:**
```env
# WITHOUT 0x prefix!
PRIVATE_KEY=abc123def456...xyz
```

**Cost:** ✅ FREE

**Security:** 
- ⚠️ **CRITICAL:** Use a TEST wallet, never your main wallet!
- ⚠️ NEVER commit .env to git
- ⚠️ Keep private keys secret
- Get testnet ZETA for free: https://labs.zetachain.com/get-zeta

---

### 2. Contract Address - **REQUIRED (after deployment)**

**What it is:** Address where your contract is deployed.

**How to get:**
- Run deployment script
- Copy address from output

**Environment Variables:**
```env
UNIVERSAL_PAYMENT_ADDRESS=0xYourContractAddress
```

**Cost:** ✅ FREE (testnet) / 💰 Mainnet deployment cost

---

## 🎯 Step-by-Step Setup

### Phase 1: Absolute Minimum (30 minutes)

**Goal:** Get the app running locally with basic functionality.

#### Step 1: Backend Minimum Config

Create `backend/.env`:
```env
# ✅ REQUIRED
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zetapay
DB_USER=zetapay_user
DB_PASSWORD=your_db_password
JWT_SECRET=generate_random_32_char_string_here_abc123xyz456

# ✅ REQUIRED (use public endpoints)
ZETACHAIN_RPC_URL=https://zetachain-athens-evm.blockpi.network/v1/rpc/public
UNIVERSAL_PAYMENT_ADDRESS=0x0000000000000000000000000000000000000000

# ✅ REQUIRED (basic settings)
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://your-extension-id
LOG_LEVEL=debug

# ❌ OPTIONAL (leave empty for now)
SENDGRID_API_KEY=
STRIPE_SECRET_KEY=
PAYPAL_CLIENT_ID=
PERSONA_API_KEY=
ONFIDO_API_TOKEN=
SENTRY_DSN=
REDIS_URL=
```

#### Step 2: Frontend Minimum Config

Create `web/.env.local`:
```env
# ✅ REQUIRED
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_ENVIRONMENT=development

# ✅ REQUIRED (create your own or use demo)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=9dd3b957e87a350c83ab1b87a7fcf40c

# ✅ REQUIRED
NEXT_PUBLIC_ZETACHAIN_NETWORK=zeta_testnet
NEXT_PUBLIC_ZETACHAIN_RPC=https://zetachain-athens-evm.blockpi.network/v1/rpc/public

# ✅ REQUIRED (placeholder until deployed)
NEXT_PUBLIC_UNIVERSAL_PAYMENT_ADDRESS=0x0000000000000000000000000000000000000000
```

#### Step 3: Contracts Minimum Config

Create `contracts/.env`:
```env
# ✅ REQUIRED (create test wallet)
PRIVATE_KEY=your_test_wallet_private_key_without_0x_prefix

# ✅ REQUIRED (will be set after deployment)
UNIVERSAL_PAYMENT_ADDRESS=
```

**Get testnet ZETA:** https://labs.zetachain.com/get-zeta

---

### Phase 2: Add Payment Providers (1-2 hours)

**Goal:** Enable credit card and PayPal payments.

1. **Create Stripe Account** (30 min)
   - Sign up: https://stripe.com/
   - Get test API keys
   - Add to `backend/.env`

2. **Create PayPal Developer Account** (30 min)
   - Sign up: https://developer.paypal.com/
   - Create sandbox app
   - Add to `backend/.env`

---

### Phase 3: Add Email & KYC (2-3 hours)

**Goal:** Send emails and verify merchant identities.

1. **Setup SendGrid** (30 min)
   - Sign up: https://sendgrid.com/
   - Verify sender email
   - Get API key

2. **Setup Persona KYC** (1 hour)
   - Sign up: https://withpersona.com/
   - Create inquiry template
   - Get sandbox API keys

---

### Phase 4: Production Ready (4-6 hours)

**Goal:** Deploy to production with monitoring.

1. **Setup Production Database** (1 hour)
   - AWS RDS or similar
   - Migrate data

2. **Setup Sentry Monitoring** (30 min)
   - Create account
   - Add DSN

3. **Setup Redis Cache** (1 hour)
   - Redis Labs or ElastiCache
   - Configure connection

4. **Deploy Smart Contracts to Mainnet** (1 hour)
   - Get mainnet ZETA
   - Deploy contracts
   - Update addresses

5. **Switch All Services to Production Mode** (2 hours)
   - Change all API keys to live
   - Update environment variables
   - Test everything

---

## 📊 Cost Breakdown

### Development (FREE)
- PostgreSQL: FREE (local)
- Node.js/Backend: FREE
- Frontend: FREE
- ZetaChain Testnet: FREE
- CoinGecko: FREE tier
- SendGrid: FREE tier (100 emails/day)
- Stripe/PayPal: FREE to test
- **TOTAL: $0/month**

### Small Production Setup ($50-150/month)
- Cloud Database: $15-30/month
- Hosting (Vercel/Heroku): $25-50/month
- Domain: $10-15/year
- SendGrid: $15/month (optional)
- Redis: $5-10/month (optional)
- **TOTAL: ~$60-105/month**

### Enterprise Setup ($500-2000/month)
- Dedicated servers
- Premium RPC nodes
- Enterprise KYC
- High-volume email
- Premium monitoring
- Load balancers
- CDN

---

## ✅ What You Need RIGHT NOW

For **basic development**, you only need:

### Immediate (< 10 minutes):
1. ✅ **PostgreSQL installed** - Local database
2. ✅ **Generate JWT Secret** - Random 32+ char string
3. ✅ **Create .env files** - Copy from examples above

### Soon (< 1 hour):
4. ⏳ **WalletConnect Project ID** - Sign up at cloud.walletconnect.com
5. ⏳ **Test Wallet with ZETA** - Get from faucet

### Later (when ready to deploy):
6. 🔜 **Deploy Smart Contract** - Task 14
7. 🔜 **Payment Providers** - Stripe/PayPal (if needed)
8. 🔜 **Email Service** - SendGrid (if needed)

---

## 🎯 Summary

**Can you run the project without any external APIs?**
- ✅ YES - Just need local PostgreSQL and environment variables
- The app will work with crypto payments only
- Credit cards, emails, KYC can be added later

**What's the absolute minimum to start?**
1. PostgreSQL database (free, local)
2. JWT_SECRET (random string)
3. WalletConnect Project ID (free account)
4. Test wallet with testnet ZETA (free from faucet)

**Everything else is optional and can be added when needed!** 🚀

---

## 📞 Quick Reference

| Credential | Required? | Free? | Where to Get |
|------------|-----------|-------|--------------|
| PostgreSQL | ✅ Yes | ✅ Yes | postgresql.org |
| JWT Secret | ✅ Yes | ✅ Yes | Generate random string |
| WalletConnect | ✅ Yes | ✅ Yes | cloud.walletconnect.com |
| Test Wallet | ✅ Yes | ✅ Yes | MetaMask + faucet |
| Stripe | ❌ No | ✅ Yes | stripe.com |
| PayPal | ❌ No | ✅ Yes | developer.paypal.com |
| SendGrid | ❌ No | ✅ Limited | sendgrid.com |
| Persona KYC | ❌ No | ✅ Sandbox | withpersona.com |
| CoinGecko | ❌ No | ✅ Yes | coingecko.com |
| Sentry | ❌ No | ✅ Limited | sentry.io |
| Redis | ❌ No | ✅ Yes | Local install |

**Happy Building! 🎉**
