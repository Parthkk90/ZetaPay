import "@nomicfoundation/hardhat-toolbox";
import "@zetachain/toolkit/tasks";

import { getHardhatConfigNetworks } from "@zetachain/networks";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  networks: {
    ...getHardhatConfigNetworks(),
    zeta_testnet: {
      ...getHardhatConfigNetworks().zeta_testnet,
      accounts: ["YOUR_PRIVATE_KEY"],
    },
  },
  solidity: "0.8.20",
};

export default config;
