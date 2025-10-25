import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { bscTestnet, sepolia, zetachainAthensTestnet } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "RainbowKit demo",
  projectId: "9dd3b957e87a350c83ab1b87a7fcf40c",
  chains: [sepolia, bscTestnet, zetachainAthensTestnet],
});
