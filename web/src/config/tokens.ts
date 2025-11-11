/**
 * Token configuration for ZetaChain Athens-3 Testnet
 * ZRC20 token addresses and metadata
 */

export interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon?: string;
  isNative?: boolean;
  isStablecoin?: boolean;
}

/**
 * Supported tokens on ZetaChain Athens-3 testnet
 * Note: Update these addresses after deploying the contract with token whitelist
 */
export const SUPPORTED_TOKENS: TokenConfig[] = [
  {
    symbol: "ZETA",
    name: "ZetaChain",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    isNative: true,
    isStablecoin: false,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    address: "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf", // ZRC20 wrapped ETH
    decimals: 18,
    isNative: false,
    isStablecoin: false,
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    address: "0x13A0c5930C028511Dc02665E7285134B6d11A5f4", // ZRC20 wrapped BTC
    decimals: 8,
    isNative: false,
    isStablecoin: false,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x0cbe0dF132a6c6B4a2974Fa1b7Fb953CF0Cc798a", // ZRC20 USDT (BSC)
    decimals: 6,
    isNative: false,
    isStablecoin: true,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0", // ZRC20 USDC (ETH)
    decimals: 6,
    isNative: false,
    isStablecoin: true,
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x4c5f4d519dff3c1aea8581e207fd93d44f65e09e", // ZRC20 DAI (example)
    decimals: 18,
    isNative: false,
    isStablecoin: true,
  },
];

/**
 * Get token by address
 */
export const getTokenByAddress = (address: string): TokenConfig | undefined => {
  return SUPPORTED_TOKENS.find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  );
};

/**
 * Get token by symbol
 */
export const getTokenBySymbol = (symbol: string): TokenConfig | undefined => {
  return SUPPORTED_TOKENS.find(
    (token) => token.symbol.toLowerCase() === symbol.toLowerCase()
  );
};

/**
 * Get all stablecoins
 */
export const getStablecoins = (): TokenConfig[] => {
  return SUPPORTED_TOKENS.filter((token) => token.isStablecoin);
};

/**
 * Get all non-stablecoins
 */
export const getCryptoTokens = (): TokenConfig[] => {
  return SUPPORTED_TOKENS.filter((token) => !token.isStablecoin);
};

/**
 * Format token amount for display
 */
export const formatTokenAmount = (
  amount: string | number,
  decimals: number,
  maxDecimals: number = 6
): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0";
  
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(decimals, maxDecimals),
  });
};
