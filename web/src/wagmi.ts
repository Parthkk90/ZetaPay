import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { bscTestnet, sepolia, zetachainAthensTestnet } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "ZetaPay",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "002a4547b312e2882994fdd76c272b8f",
  chains: [sepolia, bscTestnet, zetachainAthensTestnet],
});
