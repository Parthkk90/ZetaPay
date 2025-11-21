# Smart Contract Deployment Information

## Deployment Details

**Contract Name:** UniversalPayment
**Network:** ZetaChain Athens 3 Testnet
**Deployment Date:** November 21, 2025
**Deployer Address:** (From PRIVATE_KEY in .env)

## Contract Address

```
0xaC24d3E7b5cFDCf2DD1c3a1feB0AbCCd98301852
```

## Network Configuration

- **Chain ID:** 7001 (0x1b59 in hex)
- **RPC URL:** https://zetachain-athens-evm.blockpi.network/v1/rpc/public
- **Block Explorer:** https://athens.explorer.zetachain.com
- **Contract Link:** https://athens.explorer.zetachain.com/address/0xaC24d3E7b5cFDCf2DD1c3a1feB0AbCCd98301852

## Constructor Arguments

- **Gateway Address:** 0x6c533f7fe93fae114d0954697069df33c9b74fd7
- **System Contract Address:** 0x91d18e54DAf4F677cB28167158d6dd21F6aB3921

## Verification Command

```bash
npx hardhat verify --network zeta_testnet \
  0xaC24d3E7b5cFDCf2DD1c3a1feB0AbCCd98301852 \
  0x6c533f7fe93fae114d0954697069df33c9b74fd7 \
  0x91d18e54DAf4F677cB28167158d6dd21F6aB3921
```

## Key Features

1. **initiatePayment()** - Start a cross-chain payment
2. **confirmPayment()** - Confirm payment completion
3. **cancelPayment()** - Cancel pending payment
4. **payments mapping** - Track all payment states

## Integration in Extension

The contract is integrated in the browser extension via:
- **File:** `web/public/contract-config.js`
- **Usage:** Popup.js automatically uses the contract when available
- **Fallback:** Simple transactions if contract fails

## Testing

To test the contract:

```bash
# In contracts directory
npx hardhat test

# Test specific file
npx hardhat test test/UniversalPayment.test.ts
```

## Funding

Ensure the deployer wallet has testnet ZETA tokens:
- Get from faucet: https://labs.zetachain.com/get-zeta

## Next Steps

1. ✅ Contract deployed
2. ✅ Contract config created
3. ✅ Extension integrated
4. ⏳ Test extension with contract
5. ⏳ Verify contract on explorer
6. ⏳ Production deployment (mainnet)
