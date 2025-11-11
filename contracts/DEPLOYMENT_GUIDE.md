# UniversalPayment Contract Deployment Guide

## Prerequisites

1. **Node.js** v18+ installed
2. **Private Key** with testnet ZETA tokens for deployment
3. **ZetaChain Athens-3 Testnet** wallet funded (get testnet tokens from [faucet](https://labs.zetachain.com/get-zeta))

## Environment Setup

1. Navigate to contracts directory:
```bash
cd contracts
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
# Copy example or create new
echo "PRIVATE_KEY=your_private_key_here" > .env
```

⚠️ **Never commit `.env` file to git!**

## Deployment Steps

### 1. Compile Contracts

```bash
npx hardhat compile
```

Expected output:
```
Compiled 15 Solidity files successfully
```

### 2. Deploy to Athens-3 Testnet

```bash
npx hardhat run scripts/deploy.ts --network zeta_testnet
```

Expected output:
```
Deploying UniversalPayment contract to ZetaChain Athens 3 testnet...
Gateway Address: 0x6c533f7fe93fae114d0954697069df33c9b74fd7
System Contract Address: 0x91d18e54DAf4F677cB28167158d6dd21F6aB3921

Deploying contract...
✅ UniversalPayment deployed successfully!
Contract Address: 0x...

Verification command:
npx hardhat verify --network zeta_testnet 0x... 0x6c533f7fe93fae114d0954697069df33c9b74fd7 0x91d18e54DAf4F677cB28167158d6dd21F6aB3921
```

### 3. Set Accepted Tokens

After deployment, whitelist the tokens your merchants will accept:

```bash
# Create interaction script or use Hardhat console
npx hardhat console --network zeta_testnet
```

In the console:
```javascript
const UniversalPayment = await ethers.getContractFactory("UniversalPayment");
const contract = await UniversalPayment.attach("YOUR_CONTRACT_ADDRESS");

// ZRC20 token addresses on Athens-3 testnet
const tokens = [
  "0x0000000000000000000000000000000000000000", // ZETA (native)
  "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf", // ETH.ETH
  "0x13A0c5930C028511Dc02665E7285134B6d11A5f4", // BTC.BTC
  "0x0cbe0dF132a6c6B4a2974Fa1b7Fb953CF0Cc798a", // USDT (BSC)
  "0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0", // USDC (ETH)
  "0x4c5f4d519dff3c1aea8581e207fd93d44f65e09e", // DAI
];

// Batch whitelist all tokens
const tx = await contract.setAcceptedTokens(tokens, true);
await tx.wait();

console.log("✅ Tokens whitelisted successfully!");
```

### 4. Verify Contract (Optional)

```bash
npx hardhat verify --network zeta_testnet \
  YOUR_CONTRACT_ADDRESS \
  0x6c533f7fe93fae114d0954697069df33c9b74fd7 \
  0x91d18e54DAf4F677cB28167158d6dd21F6aB3921
```

### 5. Update Environment Variables

#### Backend (.env)
```env
UNIVERSAL_PAYMENT_ADDRESS=YOUR_CONTRACT_ADDRESS
ZETACHAIN_RPC_URL=https://zetachain-athens-evm.blockpi.network/v1/rpc/public
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_UNIVERSAL_PAYMENT_ADDRESS=YOUR_CONTRACT_ADDRESS
```

## Post-Deployment Testing

### 1. Test Payment Flow

```bash
cd ..
npx hardhat run scripts/test-integration.ts --network zeta_testnet
```

### 2. Test Multi-Token Support

Create a test script `scripts/test-multi-token.ts`:
```typescript
import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.UNIVERSAL_PAYMENT_ADDRESS!;
  const UniversalPayment = await ethers.getContractFactory("UniversalPayment");
  const contract = await UniversalPayment.attach(contractAddress);

  // Test accepted tokens
  const tokens = [
    "0x0000000000000000000000000000000000000000", // ZETA
    "0x0cbe0dF132a6c6B4a2974Fa1b7Fb953CF0Cc798a", // USDT
    "0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0", // USDC
  ];

  console.log("Testing accepted tokens:");
  for (const token of tokens) {
    const accepted = await contract.acceptedTokens(token);
    console.log(`${token}: ${accepted ? "✅" : "❌"}`);
  }
}

main().catch(console.error);
```

Run:
```bash
npx hardhat run scripts/test-multi-token.ts --network zeta_testnet
```

## Token Addresses Reference

### ZetaChain Athens-3 Testnet ZRC20 Tokens

| Token | Symbol | Address | Decimals |
|-------|--------|---------|----------|
| ZetaChain | ZETA | `0x0000000000000000000000000000000000000000` | 18 |
| Ethereum | ETH | `0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf` | 18 |
| Bitcoin | BTC | `0x13A0c5930C028511Dc02665E7285134B6d11A5f4` | 8 |
| Tether (BSC) | USDT | `0x0cbe0dF132a6c6B4a2974Fa1b7Fb953CF0Cc798a` | 6 |
| USD Coin (ETH) | USDC | `0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0` | 6 |
| Dai | DAI | `0x4c5f4d519dff3c1aea8581e207fd93d44f65e09e` | 18 |

⚠️ **Note**: Verify these addresses from [ZetaChain Docs](https://www.zetachain.com/docs/developers/tokens/zrc20/) before deployment.

## Troubleshooting

### Error: "Insufficient funds"
- Get testnet ZETA from [faucet](https://labs.zetachain.com/get-zeta)
- Ensure wallet has at least 5 ZETA for deployment

### Error: "Invalid private key"
- Check `.env` file has valid private key (without 0x prefix in some cases)
- Ensure private key is from a wallet with testnet ZETA

### Error: "Network not found"
- Verify `hardhat.config.ts` has `zeta_testnet` network configured
- Check RPC URL is accessible

### Gas Price Issues
- Athens-3 testnet can have variable gas prices
- Add `gasPrice` to deployment if needed:
```typescript
const universalPayment = await UniversalPaymentFactory.deploy(
  gatewayAddress,
  systemContractAddress,
  { gasPrice: ethers.utils.parseUnits("50", "gwei") }
);
```

## Mainnet Deployment (Future)

⚠️ **DO NOT deploy to mainnet without:**
1. Complete security audit
2. Comprehensive testing on testnet
3. Insurance/risk management setup
4. Legal compliance review
5. Incident response plan

Mainnet addresses will differ. Update accordingly.

## Support

- ZetaChain Docs: https://www.zetachain.com/docs/
- Discord: https://discord.gg/zetachain
- GitHub Issues: https://github.com/Parthkk90/ZetaPay/issues
