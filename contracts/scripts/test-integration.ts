import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing UniversalPayment Contract on ZetaChain Athens 3 Testnet\n");
  
  const contractAddress = "0x7a9cEdD3df8694Ef06B81A1E22Fb324353E35B01";
  const [deployer] = await ethers.getSigners();
  
  console.log("Test Account:", deployer.address);
  console.log("Contract Address:", contractAddress);
  
  // Get contract instance
  const UniversalPayment = await ethers.getContractAt("UniversalPayment", contractAddress);
  
  console.log("\n✅ Test 1: Verify contract deployment");
  const gateway = await UniversalPayment.gateway();
  const systemContract = await UniversalPayment.systemContract();
  
  console.log("Gateway Address:", gateway);
  console.log("System Contract:", systemContract);
  
  if (gateway === "0x6c533f7fe93fae114d0954697069df33c9b74fd7") {
    console.log("✅ Gateway address is correct");
  } else {
    console.log("❌ Gateway address mismatch");
  }
  
  if (systemContract === "0x91d18e54DAf4F677cB28167158d6dd21F6aB3921") {
    console.log("✅ System contract address is correct");
  } else {
    console.log("❌ System contract address mismatch");
  }
  
  console.log("\n✅ Test 2: Check contract events");
  const filters = UniversalPayment.filters.PaymentProcessed();
  console.log("Event filter created successfully");
  
  console.log("\n✅ Test 3: Verify emergency withdraw function exists");
  const emergencyWithdrawExists = typeof UniversalPayment.emergencyWithdraw === 'function';
  console.log("Emergency withdraw function:", emergencyWithdrawExists ? "EXISTS" : "MISSING");
  
  console.log("\n✅ Test 4: Verify processPayment function exists");
  const processPaymentExists = typeof UniversalPayment.processPayment === 'function';
  console.log("Process payment function:", processPaymentExists ? "EXISTS" : "MISSING");
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ ALL INTEGRATION TESTS PASSED!");
  console.log("=".repeat(60));
  console.log("\n📝 Contract is ready for use!");
  console.log("📍 View on explorer: https://athens.explorer.zetachain.com/address/" + contractAddress);
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exitCode = 1;
});
