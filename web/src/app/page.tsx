"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ConnectBitcoin } from "@zetachain/universalkit";
import { Welcome } from "./welcome";
import { Payment } from "./Payment";

const Page = () => {
  return (
    <div className="m-4">
      <div className="flex justify-end gap-2 mb-10">
        <ConnectBitcoin />
        <ConnectButton label="Connect EVM" showBalance={false} />
      </div>
      <Welcome />
      <div className="flex justify-center mt-10">
        <Payment />
      </div>
    </div>
  );
};

export default Page;
