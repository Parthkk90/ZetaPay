"use client";

import { useState, useCallback } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from "wagmi";
import { parseUnits } from "viem";
import UniversalPaymentAbi from "../UniversalPayment.abi.json";

const UNIVERSAL_PAYMENT_ADDRESS = (process.env.NEXT_PUBLIC_UNIVERSAL_PAYMENT_ADDRESS || "0x7a9cEdD3df8694Ef06B81A1E22Fb324353E35B01") as `0x${string}`;
const ZETA_ATHENS_CHAIN_ID = 7001;

// Token addresses on ZetaChain Athens testnet (examples - replace with actual ZRC20 addresses)
const TOKENS = [
  { symbol: "ZETA", address: "0x0000000000000000000000000000000000000000", decimals: 18 },
  { symbol: "ETH.ETH", address: "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf", decimals: 18 },
  { symbol: "BTC.BTC", address: "0x13A0c5930C028511Dc02665E7285134B6d11A5f4", decimals: 8 },
];

export const Payment = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [inputToken, setInputToken] = useState(TOKENS[0].address);
  const [targetToken, setTargetToken] = useState(TOKENS[0].address);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  const { data: txReceipt, isLoading: isTxPending } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const { writeContractAsync } = useWriteContract();

  const handleSend = useCallback(async () => {
    if (!isConnected) return setStatus("Please connect your wallet first.");
    if (chainId !== ZETA_ATHENS_CHAIN_ID) {
      if (switchChain) {
        switchChain({ chainId: ZETA_ATHENS_CHAIN_ID });
      }
      return setStatus("Please switch to ZetaChain Athens testnet.");
    }
    if (!recipient) return setStatus("Recipient address required");
    if (!amount) return setStatus("Amount required");

    try {
      setStatus("Preparing transaction...");
      const selectedToken = TOKENS.find(t => t.address === inputToken);
      const weiAmount = parseUnits(amount, selectedToken?.decimals || 18);

      const hash = await writeContractAsync({
        address: UNIVERSAL_PAYMENT_ADDRESS,
        abi: UniversalPaymentAbi,
        functionName: "processPayment",
        args: [
          inputToken as `0x${string}`,
          weiAmount,
          targetToken as `0x${string}`,
          recipient as `0x${string}`,
        ],
      });

      setTxHash(hash);
      setStatus(`Transaction submitted: ${hash}`);
    } catch (err: any) {
      setStatus(`Failed: ${err?.message ?? String(err)}`);
      setTxHash(undefined);
    }
  }, [isConnected, chainId, switchChain, recipient, amount, inputToken, targetToken, writeContractAsync]);

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-zeta-grey-800">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Send Payment</h2>
        <ConnectButton />
      </div>

      {chainId !== ZETA_ATHENS_CHAIN_ID && (
        <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
          Please switch to ZetaChain Athens testnet
        </div>
      )}

      <div>
        <label htmlFor="inputToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Input Token
        </label>
        <select
          name="inputToken"
          id="inputToken"
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
          className="block w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-zeta-grey-700 dark:border-zeta-grey-600 dark:text-white"
        >
          {TOKENS.map(token => (
            <option key={token.address} value={token.address}>{token.symbol}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Amount
        </label>
        <input
          type="text"
          name="amount"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="block w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-zeta-grey-700 dark:border-zeta-grey-600 dark:text-white"
          placeholder="0.0"
        />
      </div>

      <div>
        <label htmlFor="targetToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Target Token
        </label>
        <select
          name="targetToken"
          id="targetToken"
          value={targetToken}
          onChange={(e) => setTargetToken(e.target.value)}
          className="block w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-zeta-grey-700 dark:border-zeta-grey-600 dark:text-white"
        >
          {TOKENS.map(token => (
            <option key={token.address} value={token.address}>{token.symbol}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Recipient Address
        </label>
        <input
          type="text"
          name="recipient"
          id="recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="block w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-zeta-grey-700 dark:border-zeta-grey-600 dark:text-white"
          placeholder="0x..."
        />
      </div>

      <button
        onClick={handleSend}
        disabled={!isConnected || isTxPending || chainId !== ZETA_ATHENS_CHAIN_ID}
        className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-zeta-blue-700 dark:hover:bg-zeta-blue-800"
      >
        {isTxPending ? "Processing..." : "Send Payment"}
      </button>

      {status && (
        <div className="pt-2 text-sm text-gray-700 dark:text-gray-300">
          {status}
          {txReceipt && <div className="mt-1 text-green-600 dark:text-green-400">✓ Confirmed</div>}
        </div>
      )}
    </div>
  );
};
