# 🚀 Phase 5: Deployment & Integration

**Status:** 🔄 IN PROGRESS  
**Updated:** November 3, 2025  
**Target:** 2 weeks completion

---

## 📋 Detailed Task Breakdown

### 1. Browser Extension Development (HIGH PRIORITY)

#### 1.1 Wallet Connection & Integration
- [ ] Implement MetaMask provider detection (`window.ethereum`)
- [ ] Add Phantom wallet support (`window.solana`)
- [ ] Network validation for ZetaChain (testnet: 7001, mainnet: 7000)
- [ ] Account selection and switching UI
- [ ] Connection state persistence (localStorage)
- [ ] Disconnect and account change listeners

**Files:** `web/src/app/Payment.tsx`, `web/src/wagmi.ts`, `web/public/content.js`

#### 1.2 Transaction Signing Flow
- [ ] Build transaction payload for `processPayment()` call
- [ ] Gas estimation and fee preview
- [ ] Present wallet signature request
- [ ] Handle tx confirmation/rejection
- [ ] Poll for transaction receipt
- [ ] Listen for `PaymentProcessed` event
- [ ] Display tx hash and block explorer link

**Contract:** `0x7a9cEdD3df8694Ef06B81A1E22Fb324353E35B01` (testnet)

#### 1.3 UI/UX Implementation
- [ ] Design "Pay with Crypto via ZetaChain" button
- [ ] DOM injection for Amazon.in and Flipkart.com checkout
- [ ] Modal popup for payment flow
- [ ] Token selector (ETH, BTC, SOL, USDC)
- [ ] Amount display with live conversion rates
- [ ] Loading/processing states
- [ ] Success/error notifications with retry

**Target Sites:** Amazon.in, Flipkart.com

#### 1.4 Extension Build & Publishing
- [ ] Production build with environment configs
- [ ] Create extension package (manifest v3)
- [ ] Design icons: 16px, 48px, 128px
- [ ] Write privacy policy and terms
- [ ] Create store listing with screenshots
- [ ] Submit to Chrome Web Store
- [ ] Submit to Firefox Add-ons

---

### 2. Payment Processor Integration (HIGH PRIORITY)

#### 2.1 Backend Architecture
- [ ] Set up Node.js/Express backend
- [ ] Choose hosting: AWS Lambda / GCP Cloud Run / Azure Functions
- [ ] Configure CI/CD pipeline (GitHub Actions)
- [ ] Implement API endpoints:
  - `POST /api/payment/initiate`
  - `POST /api/payment/webhook`
  - `GET /api/payment/status/:txHash`
- [ ] Database setup (PostgreSQL/MongoDB) for tx tracking

#### 2.2 Crypto → Fiat Conversion
- [ ] Research processor options:
  - **Razorpay** (India-focused, check crypto support)
  - **PayU** (established, needs partnership)
  - **Custom:** Exchange API + traditional gateway
- [ ] Implement ZRC20 → USDC swap (via contract)
- [ ] Implement USDC → INR conversion API
- [ ] Handle merchant INR settlement
- [ ] Implement retry logic for failed conversions

#### 2.3 Payment Flow Design
```
User → Extension → Wallet → Contract → Swap
                              ↓
                        Event Emitted
                              ↓
Backend Listener → Convert to INR → Settle Merchant
                              ↓
                    Webhook to Amazon/Flipkart
```

---

### 3. Testing & QA (MEDIUM PRIORITY)

#### 3.1 Smart Contract Unit Tests
- [ ] Write Hardhat tests for `UniversalPayment.sol`
- [ ] Test `SwapHelperLib.sol` functions
- [ ] Mock Uniswap router for isolated testing
- [ ] Test edge cases: insufficient balance, revert scenarios
- [ ] Gas profiling and optimization

#### 3.2 Integration Testing
- [ ] E2E test: Extension → Contract → Payment Processor
- [ ] Test with real testnet tokens (ZETA, gETH)
- [ ] Simulate merchant settlement flow
- [ ] Test failure recovery and rollbacks
- [ ] Performance testing (response times)

#### 3.3 User Acceptance Testing
- [ ] Internal team testing (5 users)
- [ ] Beta group testing (10-20 users)
- [ ] Collect feedback on UX/UI
- [ ] Bug tracking and fixes
- [ ] Iterate based on feedback

---

### 4. Security & Compliance (HIGH PRIORITY)

#### 4.1 Smart Contract Hardening
- [ ] Add `Ownable` for emergency functions
- [ ] Implement `ReentrancyGuard` from OpenZeppelin
- [ ] Add slippage protection (calculate minAmountOut)
- [ ] Implement `Pausable` for emergency stops
- [ ] Professional audit (Book before mainnet)

**Audit Findings to Fix:**
- Access control on `emergencyWithdraw()`
- Non-zero slippage tolerance
- Gas optimization opportunities
- Enhanced event logging

#### 4.2 Legal & Compliance
- [ ] Research India KYC/AML requirements
- [ ] Document compliance strategy
- [ ] Draft privacy policy (GDPR/India compliant)
- [ ] Draft terms of service
- [ ] Consult crypto legal expert
- [ ] Prepare for regulatory changes

---

### 5. Deployment Strategy (HIGH PRIORITY)

#### 5.1 Testnet (CURRENT)
- [x] ✅ Smart contract deployed to ZetaChain Athens 3
- [x] ✅ Integration tests passing
- [ ] Backend staging environment
- [ ] Extension internal release (unpacked)

#### 5.2 Mainnet (After Audit)
- [ ] Deploy hardened `UniversalPayment.sol` to ZetaChain mainnet
- [ ] Deploy backend to production
- [ ] Configure mainnet RPC and contract addresses
- [ ] Production monitoring setup
- [ ] Staged rollout (10% → 50% → 100%)

---

### 6. Operations & Monitoring (MEDIUM PRIORITY)

#### 6.1 Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Transaction monitoring (on-chain events)
- [ ] Backend health checks and uptime monitoring
- [ ] Alert system for critical failures
- [ ] Dashboard for real-time metrics

#### 6.2 Analytics
- [ ] Payment volume tracking
- [ ] Token usage breakdown (ETH/BTC/SOL/USDC)
- [ ] Conversion success rates
- [ ] User acquisition funnel
- [ ] Merchant settlement tracking

#### 6.3 Logging
- [ ] Centralized logging (CloudWatch/Stackdriver)
- [ ] Audit trail for all payments
- [ ] Debug logs with request IDs
- [ ] Log retention policy (90 days)

---

## 📊 Project Progress

```
✅ Phase 1: Feasibility & Research       [████████████] 100%
✅ Phase 2: Architecture Design          [████████████] 100%
✅ Phase 3: Development                  [████████████] 100%
✅ Phase 4: Testing & QA                 [████████████] 100%
🔄 Phase 5: Deployment & Integration     [█░░░░░░░░░░░]  10% (In Progress)
⏳ Phase 6: Maintenance & Expansion      [░░░░░░░░░░░░]   0%
```
