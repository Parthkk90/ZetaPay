import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Script to initialize accepted tokens whitelist on UniversalPayment contract
 * Run this after deploying the contract to Athens-3 testnet
 */

// ZRC20 token addresses on Athens-3 testnet
const ACCEPTED_TOKENS = [
  {
    symbol: "ZETA",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
  },
  {
    symbol: "ETH",
    address: "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf",
    decimals: 18,
  },
  {
    symbol: "BTC",
    address: "0x13A0c5930C028511Dc02665E7285134B6d11A5f4",
    decimals: 8,
  },
  {
    symbol: "USDT",
    address: "0x0cbe0dF132a6c6B4a2974Fa1b7Fb953CF0Cc798a",
    decimals: 6,
  },
  {
    symbol: "USDC",
    address: "0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0",
    decimals: 6,
  },
  {
    symbol: "DAI",
    address: "0x4c5f4d519dff3c1aea8581e207fd93d44f65e09e",
    decimals: 18,
  },
];

async function main() {
  const contractAddress = process.env.UNIVERSAL_PAYMENT_ADDRESS;

  if (!contractAddress) {
    console.error("❌ Error: UNIVERSAL_PAYMENT_ADDRESS not set in .env");
    console.log("Please add: UNIVERSAL_PAYMENT_ADDRESS=your_contract_address");
    process.exit(1);
  }

  console.log("Initializing token whitelist on UniversalPayment contract...");
  console.log("Contract Address:", contractAddress);

  const UniversalPaymentFactory = await ethers.getContractFactory("UniversalPayment");
  const contract = UniversalPaymentFactory.attach(contractAddress);

  // Get signer info
  const [signer] = await ethers.getSigners();
  console.log("Signer Address:", signer.address);
  const balance = await signer.getBalance();
  console.log("Signer Balance:", ethers.utils.formatEther(balance), "ZETA");

  // Check if signer is owner
  try {
    const owner = await contract.owner();
    console.log("Contract Owner:", owner);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.error("❌ Error: Signer is not the contract owner!");
      console.log("Only the owner can whitelist tokens.");
      process.exit(1);
    }
  } catch (error) {
    console.warn("⚠️  Could not verify owner (contract may not have owner() function)");
  }

  console.log("\n📋 Tokens to whitelist:");
  ACCEPTED_TOKENS.forEach((token, i) => {
    console.log(`  ${i + 1}. ${token.symbol.padEnd(6)} - ${token.address}`);
  });

  console.log("\n🔄 Whitelisting tokens...");
  
  try {
    const tokenAddresses = ACCEPTED_TOKENS.map(t => t.address);
    const accepted = new Array(tokenAddresses.length).fill(true);

    // Estimate gas first
    const gasEstimate = await contract.estimateGas.setAcceptedTokens(tokenAddresses, accepted);
    console.log("Estimated Gas:", gasEstimate.toString());

    // Execute transaction
    const tx = await contract.setAcceptedTokens(tokenAddresses, accepted);
    console.log("Transaction Hash:", tx.hash);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());

    // Verify tokens are whitelisted
    console.log("\n✅ Verifying whitelisted tokens:");
    for (const token of ACCEPTED_TOKENS) {
      const isAccepted = await contract.acceptedTokens(token.address);
      const status = isAccepted ? "✅" : "❌";
      console.log(`  ${status} ${token.symbol.padEnd(6)} - ${token.address}`);
    }

    console.log("\n🎉 Token whitelist initialization complete!");
    console.log("\nNext steps:");
    console.log("1. Update backend .env with UNIVERSAL_PAYMENT_ADDRESS");
    console.log("2. Update frontend .env.local with NEXT_PUBLIC_UNIVERSAL_PAYMENT_ADDRESS");
    console.log("3. Test payment flow with different tokens");

  } catch (error: any) {
    console.error("❌ Transaction failed:", error.message);
    
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    
    if (error.code === "INSUFFICIENT_FUNDS") {
      console.log("\n💡 Solution: Add more ZETA to your wallet from the faucet:");
      console.log("   https://labs.zetachain.com/get-zeta");
    }
    
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
