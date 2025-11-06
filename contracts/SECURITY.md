# ZetaPay Security Features

## Overview
ZetaPay implements industry-standard security patterns from OpenZeppelin to ensure safe operation on mainnet. This document outlines all security mechanisms implemented in the smart contracts.

## Security Mechanisms

### 1. Access Control (OpenZeppelin Ownable)
**Purpose**: Restrict sensitive functions to authorized addresses only.

**Implementation**:
- Contract inherits from `Ownable`
- Owner is set during deployment (deployer address)
- Owner-only functions: `pause()`, `unpause()`, `setMinSlippage()`, `emergencyWithdraw()`

**Usage**:
```solidity
// Owner can transfer ownership
function transferOwnership(address newOwner) external onlyOwner;

// Only owner can update slippage tolerance
function setMinSlippage(uint256 newSlippageBps) external onlyOwner;
```

### 2. Reentrancy Protection (OpenZeppelin ReentrancyGuard)
**Purpose**: Prevent reentrancy attacks on payment processing.

**Implementation**:
- Contract inherits from `ReentrancyGuard`
- `processPayment()` function protected with `nonReentrant` modifier
- Prevents malicious contracts from re-entering during token transfers

**Attack Vector Prevented**:
```
1. Attacker calls processPayment()
2. Contract transfers tokens to attacker
3. Attacker's receive() tries to call processPayment() again (BLOCKED)
```

### 3. Emergency Pause (OpenZeppelin Pausable)
**Purpose**: Halt all operations in case of emergency (exploit, bug discovery, upgrade).

**Implementation**:
- Contract inherits from `Pausable`
- `processPayment()` protected with `whenNotPaused` modifier
- `pause()` and `unpause()` restricted to owner
- `emergencyWithdraw()` only works when paused

**Emergency Workflow**:
```
1. Exploit detected → owner calls pause()
2. All payments halt immediately
3. Owner calls emergencyWithdraw() to rescue funds
4. Contract upgraded/fixed
5. Owner calls unpause() when safe
```

### 4. Slippage Protection
**Purpose**: Protect users from sandwich attacks and excessive price slippage during DEX swaps.

**Implementation**:
- Configurable minimum slippage tolerance (`minSlippageBps`, default 0.5%)
- Maximum slippage cap (`MAX_SLIPPAGE_BPS` = 5%)
- `minAmountOut` parameter enforces minimum acceptable output
- Reverts with `InsufficientOutput` if swap produces less than minimum

**Calculation**:
```solidity
// Calculate minimum acceptable output
uint256 calculatedMinOut = (amount * (10000 - minSlippageBps)) / 10000;
uint256 effectiveMinOut = max(minAmountOut, calculatedMinOut);

// After swap, verify output
if (outputAmount < effectiveMinOut) revert InsufficientOutput();
```

**Frontend Integration**:
```typescript
// Calculate 0.5% slippage tolerance
const minAmountOut = (weiAmount * 995n) / 1000n; // 99.5% of input

// Pass to contract
await processPayment(inputToken, weiAmount, targetToken, recipient, minAmountOut);
```

### 5. Input Validation
**Purpose**: Prevent invalid or malicious inputs.

**Validations**:
- Zero amount check: `if (amount == 0) revert InvalidAmount()`
- Zero address check: `if (recipient == address(0)) revert InvalidRecipient()`
- Constructor validation: Gateway and SystemContract addresses cannot be zero
- Slippage bounds: `1 <= newSlippageBps <= MAX_SLIPPAGE_BPS`

### 6. Custom Errors (Gas Optimization)
**Purpose**: Save gas compared to string-based `require()` statements.

**Implemented Errors**:
```solidity
error InvalidAmount();           // Zero or negative amount
error InvalidRecipient();        // Zero address recipient
error InvalidSlippage();         // Slippage out of bounds
error TokenTransferFailed();     // ERC20 transfer returned false
error InsufficientOutput();      // Swap output below minimum
```

**Gas Savings**: ~50 gas per revert vs. `require("message")`

### 7. Immutable State Variables
**Purpose**: Prevent accidental modification of critical addresses.

**Variables**:
```solidity
SystemContract public immutable systemContract;
IGatewayZEVM public immutable gateway;
```

**Benefits**:
- Cannot be changed after deployment
- Prevents owner from maliciously changing router/gateway
- Gas savings on reads

## Security Tests

Comprehensive test suite in `test/UniversalPayment.security.test.ts`:

- ✅ Access control verification (owner-only functions)
- ✅ Pause/unpause workflow
- ✅ Emergency withdrawal (only when paused)
- ✅ Reentrancy protection (via modifier)
- ✅ Input validation (zero amounts, zero addresses)
- ✅ Slippage calculation and enforcement
- ✅ Token transfer failure handling
- ✅ Event emission verification

Run tests:
```bash
cd contracts
yarn hardhat test test/UniversalPayment.security.test.ts
```

## Security Best Practices

### For Developers
1. **Never disable security modifiers** (nonReentrant, whenNotPaused, onlyOwner)
2. **Test all edge cases** before deploying changes
3. **Use custom errors** for new validations (gas efficient)
4. **Validate all inputs** at function entry
5. **Emit events** for all state changes (audit trail)

### For Operators
1. **Monitor contract for suspicious activity** (large transactions, failed txs)
2. **Keep owner private key secure** (hardware wallet, multisig recommended)
3. **Test pause/unpause** on testnet before mainnet deployment
4. **Have emergency response plan** (who to contact, how to pause)
5. **Regular security audits** (professional audit before mainnet launch)

### For Users
1. **Set appropriate slippage tolerance** (higher slippage = more vulnerable to sandwich attacks)
2. **Double-check recipient address** (transactions are irreversible)
3. **Start with small amounts** when using new features
4. **Monitor transaction status** (check for reverts/failures)

## Audit Recommendations

Before mainnet deployment, conduct professional security audit focusing on:

1. **Reentrancy vectors** (especially in swap logic)
2. **Access control enforcement** (owner privileges, privilege escalation)
3. **Arithmetic operations** (overflow/underflow, rounding errors)
4. **DEX integration** (Uniswap router, token approvals)
5. **Emergency mechanisms** (pause effectiveness, withdrawal safety)
6. **Upgrade path** (how to handle bug fixes post-deployment)

## Version History

- **v1.0.0** (Current): Initial security hardening
  - Added Ownable, ReentrancyGuard, Pausable
  - Implemented slippage protection
  - Custom errors for gas efficiency
  - Emergency withdrawal mechanism
  - Comprehensive test suite

## Contact

**Security Issues**: security@zetapay.io (report vulnerabilities privately)
**General Support**: support@zetapay.io

---

*Last Updated*: Phase 5 - Mainnet Readiness
*Contract Version*: 1.0.0
