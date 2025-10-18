import { ethers } from "hardhat";

async function main() {
  const UniversalPaymentFactory = await ethers.getContractFactory("UniversalPayment");
  // IMPORTANT: The address of the ZetaChain connector contract for the target network.
  // You can find the latest addresses here: https://www.zetachain.com/docs/reference/network/contracts/
  const connectorAddress = ethers.constants.AddressZero; // Using zero address for local testing

  const universalPayment = await UniversalPaymentFactory.deploy(connectorAddress);

  await universalPayment.deployed();

  console.log(`UniversalPayment deployed to: ${universalPayment.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
