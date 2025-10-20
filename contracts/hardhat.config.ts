import "@nomicfoundation/hardhat-toolbox";
import "@zetachain/toolkit/tasks";

import { getHardhatConfigNetworks } from "@zetachain/networks";
import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const config: HardhatUserConfig = {
  networks: {
    ...getHardhatConfigNetworks(),
    zeta_testnet: {
      ...getHardhatConfigNetworks().zeta_testnet,
      // Only add accounts if PRIVATE_KEY is defined in .env
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.26",
      },
      {
        version: "0.8.20",
      },
      {
        version: "0.8.7",
      },
    ],
  },
};

export default config;
