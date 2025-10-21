import { ethers } from "hardhat";

async function main() {
  console.log("Deploying UniversalPayment contract to ZetaChain Athens 3 testnet...");
  
  const UniversalPaymentFactory = await ethers.getContractFactory("UniversalPayment");
  
  // ZetaChain Athens 3 Testnet Addresses
  // Gateway ZEVM: https://www.zetachain.com/docs/reference/network/contracts/
  const gatewayAddress = "0x6c533f7fe93fae114d0954697069df33c9b74fd7"; // Gateway ZEVM on testnet
  const systemContractAddress = "0x91d18e54DAf4F677cB28167158d6dd21F6aB3921"; // System Contract on testnet
  
  console.log("Gateway Address:", gatewayAddress);
  console.log("System Contract Address:", systemContractAddress);

  console.log("\nDeploying contract...");
  const universalPayment = await UniversalPaymentFactory.deploy(
    gatewayAddress,
    systemContractAddress
  );

  await universalPayment.deployed();

  console.log("\n✅ UniversalPayment deployed successfully!");
  console.log("Contract Address:", universalPayment.address);
  console.log("\nVerification command:");
  console.log(`npx hardhat verify --network zeta_testnet ${universalPayment.address} ${gatewayAddress} ${systemContractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
