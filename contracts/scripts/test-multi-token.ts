import { ethers } from "hardhat";

/**
 * Test multi-token acceptance and payment processing
 */

async function main() {
  const contractAddress = process.env.UNIVERSAL_PAYMENT_ADDRESS || "YOUR_CONTRACT_ADDRESS";
  
  console.log("Testing Multi-Token Support");
  console.log("Contract Address:", contractAddress);
  
  const UniversalPayment = await ethers.getContractFactory("UniversalPayment");
  const contract = UniversalPayment.attach(contractAddress);

  // Test tokens
  const tokens = [
    { symbol: "ZETA", address: "0x0000000000000000000000000000000000000000" },
    { symbol: "USDT", address: "0x0cbe0dF132a6c6B4a2974Fa1b7Fb953CF0Cc798a" },
    { symbol: "USDC", address: "0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0" },
    { symbol: "DAI", address: "0x4c5f4d519dff3c1aea8581e207fd93d44f65e09e" },
  ];

  console.log("\n📋 Testing Token Acceptance:");
  for (const token of tokens) {
    try {
      // Note: This will work after typechain types are regenerated
      const accepted = await contract.acceptedTokens(token.address);
      console.log(`  ${accepted ? "✅" : "❌"} ${token.symbol} - ${token.address}`);
    } catch (error) {
      console.log(`  ⚠️  ${token.symbol} - Could not check (function may not exist yet)`);
    }
  }

  console.log("\n🔍 Contract Info:");
  try {
    const owner = await contract.owner();
    console.log("Owner:", owner);
  } catch {
    console.log("Owner: N/A");
  }

  console.log("\n✅ Test complete!");
}

main().catch(console.error);
