import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Checking balance for account:", deployer.address);
  
  const balance = await deployer.getBalance();
  const balanceInZeta = ethers.utils.formatEther(balance);
  
  console.log("Balance:", balanceInZeta, "ZETA");
  
  if (balance.eq(0)) {
    console.log("\n⚠️  WARNING: Account has 0 ZETA!");
    console.log("You need testnet ZETA tokens to deploy.");
    console.log("\nTo get testnet tokens:");
    console.log("1. Join Discord: https://discord.gg/zetachain");
    console.log("2. Go to #zeta-faucet channel");
    console.log(`3. Run: /zeta faucet drip ${deployer.address}`);
    process.exit(1);
  }
  
  console.log("✅ Account has sufficient balance for deployment");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
