import { ethers } from "hardhat";

async function main() {
  const UniversalPaymentFactory = await ethers.getContractFactory("UniversalPayment");
  const universalPayment = await UniversalPaymentFactory.deploy(ethers.constants.AddressZero); // Replace with actual connector address for deployment

  await universalPayment.deployed();

  console.log(`UniversalPayment deployed to: ${universalPayment.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
