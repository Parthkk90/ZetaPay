import axios from 'axios';
import logger from '../utils/logger';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const PRICE_CACHE: Map<string, { price: number; timestamp: number }> = new Map();
const CACHE_DURATION = 60000; // 1 minute

export interface PriceData {
  cryptoCurrency: string;
  fiatCurrency: string;
  price: number;
  timestamp: number;
}

/**
 * Get crypto to fiat exchange rate
 */
export const getCryptoPrice = async (
  cryptoCurrency: string,
  fiatCurrency: string = 'usd'
): Promise<number> => {
  const cacheKey = `${cryptoCurrency}-${fiatCurrency}`.toLowerCase();
  const cached = PRICE_CACHE.get(cacheKey);

  // Return cached price if fresh
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }

  try {
    // Map crypto symbols to CoinGecko IDs
    const coinGeckoIds: Record<string, string> = {
      'ZETA': 'zetachain',
      'ETH': 'ethereum',
      'BTC': 'bitcoin',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'DAI': 'dai',
    };

    const coinId = coinGeckoIds[cryptoCurrency.toUpperCase()] || cryptoCurrency.toLowerCase();

    const response = await axios.get(
      `${COINGECKO_API_BASE}/simple/price`,
      {
        params: {
          ids: coinId,
          vs_currencies: fiatCurrency.toLowerCase(),
        },
        headers: process.env.COINGECKO_API_KEY
          ? { 'X-CG-API-KEY': process.env.COINGECKO_API_KEY }
          : {},
      }
    );

    const price = response.data[coinId]?.[fiatCurrency.toLowerCase()];

    if (!price) {
      throw new Error(`Price not found for ${cryptoCurrency}/${fiatCurrency}`);
    }

    // Cache the price
    PRICE_CACHE.set(cacheKey, { price, timestamp: Date.now() });

    logger.info(`Fetched price: 1 ${cryptoCurrency} = ${price} ${fiatCurrency.toUpperCase()}`);
    return price;
  } catch (error) {
    logger.error(`Failed to fetch price for ${cryptoCurrency}/${fiatCurrency}:`, error);
    throw error;
  }
};

/**
 * Convert fiat amount to crypto amount
 */
export const convertFiatToCrypto = async (
  fiatAmount: number,
  fiatCurrency: string,
  cryptoCurrency: string
): Promise<{ cryptoAmount: number; exchangeRate: number }> => {
  const exchangeRate = await getCryptoPrice(cryptoCurrency, fiatCurrency);
  const cryptoAmount = fiatAmount / exchangeRate;

  return {
    cryptoAmount,
    exchangeRate,
  };
};

/**
 * Convert crypto amount to fiat amount
 */
export const convertCryptoToFiat = async (
  cryptoAmount: number,
  cryptoCurrency: string,
  fiatCurrency: string
): Promise<{ fiatAmount: number; exchangeRate: number }> => {
  const exchangeRate = await getCryptoPrice(cryptoCurrency, fiatCurrency);
  const fiatAmount = cryptoAmount * exchangeRate;

  return {
    fiatAmount,
    exchangeRate,
  };
};

/**
 * Get multiple crypto prices at once
 */
export const getMultiplePrices = async (
  cryptoCurrencies: string[],
  fiatCurrency: string = 'usd'
): Promise<Record<string, number>> => {
  try {
    const prices: Record<string, number> = {};

    for (const crypto of cryptoCurrencies) {
      prices[crypto] = await getCryptoPrice(crypto, fiatCurrency);
    }

    return prices;
  } catch (error) {
    logger.error('Failed to fetch multiple prices:', error);
    throw error;
  }
};

/**
 * Clear price cache (useful for testing)
 */
export const clearPriceCache = () => {
  PRICE_CACHE.clear();
  logger.info('Price cache cleared');
};
