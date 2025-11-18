/**
 * Privacy Service
 * Implements transaction privacy features including stealth addresses and transaction obfuscation
 */

import { ethers } from 'ethers';
import logger from '../utils/logger';

interface PrivacySettings {
  enabled: boolean;
  stealthAddress: boolean;
  splitTransactions: boolean;
  minDelayMs: number;
  maxDelayMs: number;
}

interface StealthAddress {
  address: string;
  privateKey: string;
  expiresAt: Date;
}

interface TransactionSplit {
  from: string;
  to: string;
  amount: bigint;
  delayMs: number;
}

class PrivacyService {
  private readonly DEFAULT_SETTINGS: PrivacySettings = {
    enabled: false,
    stealthAddress: false,
    splitTransactions: false,
    minDelayMs: 1000,
    maxDelayMs: 30000,
  };

  /**
   * Generate a stealth address for one-time use
   */
  async generateStealthAddress(): Promise<StealthAddress> {
    const wallet = ethers.Wallet.createRandom();
    
    // Stealth address expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    logger.info(`Generated stealth address: ${wallet.address}`);

    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      expiresAt,
    };
  }

  /**
   * Split a large transaction into multiple smaller ones to obscure the amount
   */
  splitTransaction(
    from: string,
    to: string,
    totalAmount: bigint,
    numberOfSplits: number = 3
  ): TransactionSplit[] {
    if (numberOfSplits < 2) {
      throw new Error('Number of splits must be at least 2');
    }

    const splits: TransactionSplit[] = [];
    let remainingAmount = totalAmount;

    // Generate random split amounts
    for (let i = 0; i < numberOfSplits - 1; i++) {
      // Random amount between 10% and 40% of remaining
      const minAmount = remainingAmount / BigInt(10);
      const maxAmount = (remainingAmount * BigInt(40)) / BigInt(100);
      const randomAmount = this.randomBigInt(minAmount, maxAmount);
      
      splits.push({
        from,
        to,
        amount: randomAmount,
        delayMs: this.randomDelay(),
      });

      remainingAmount -= randomAmount;
    }

    // Add final split with remaining amount
    splits.push({
      from,
      to,
      amount: remainingAmount,
      delayMs: this.randomDelay(),
    });

    logger.info(`Split transaction into ${numberOfSplits} parts`);
    return splits;
  }

  /**
   * Get privacy settings for a merchant
   */
  async getPrivacySettings(merchantId: string): Promise<PrivacySettings> {
    // In production, fetch from database
    logger.debug(`Fetching privacy settings for merchant ${merchantId}`);
    return { ...this.DEFAULT_SETTINGS };
  }

  /**
   * Update privacy settings for a merchant
   */
  async updatePrivacySettings(
    merchantId: string,
    settings: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    logger.info(`Updating privacy settings for merchant ${merchantId}`);
    
    // In production, save to database
    const updatedSettings = {
      ...this.DEFAULT_SETTINGS,
      ...settings,
    };

    return updatedSettings;
  }

  /**
   * Generate a random delay for transaction timing obfuscation
   */
  private randomDelay(): number {
    const min = this.DEFAULT_SETTINGS.minDelayMs;
    const max = this.DEFAULT_SETTINGS.maxDelayMs;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate a random BigInt between min and max
   */
  private randomBigInt(min: bigint, max: bigint): bigint {
    const range = max - min;
    const rangeStr = range.toString();
    const randomStr = Math.floor(Math.random() * Number(rangeStr)).toString();
    return min + BigInt(randomStr);
  }

  /**
   * Apply privacy features to a payment
   */
  async applyPrivacyFeatures(
    paymentId: string,
    merchantId: string,
    amount: bigint,
    recipientAddress: string
  ): Promise<{
    useStealth: boolean;
    stealthAddress?: StealthAddress;
    splits?: TransactionSplit[];
  }> {
    const settings = await this.getPrivacySettings(merchantId);

    if (!settings.enabled) {
      return { useStealth: false };
    }

    const result: {
      useStealth: boolean;
      stealthAddress?: StealthAddress;
      splits?: TransactionSplit[];
    } = {
      useStealth: settings.stealthAddress,
    };

    // Generate stealth address if enabled
    if (settings.stealthAddress) {
      result.stealthAddress = await this.generateStealthAddress();
      logger.info(`Using stealth address for payment ${paymentId}`);
    }

    // Split transaction if enabled and amount is significant
    if (settings.splitTransactions && amount > BigInt(1000)) {
      const targetAddress = result.stealthAddress?.address || recipientAddress;
      result.splits = this.splitTransaction(
        recipientAddress,
        targetAddress,
        amount,
        3
      );
      logger.info(`Split payment ${paymentId} into ${result.splits.length} transactions`);
    }

    return result;
  }

  /**
   * Validate privacy settings
   */
  validateSettings(settings: Partial<PrivacySettings>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (settings.minDelayMs !== undefined && settings.minDelayMs < 0) {
      errors.push('Minimum delay cannot be negative');
    }

    if (settings.maxDelayMs !== undefined && settings.maxDelayMs < 0) {
      errors.push('Maximum delay cannot be negative');
    }

    if (
      settings.minDelayMs !== undefined &&
      settings.maxDelayMs !== undefined &&
      settings.minDelayMs > settings.maxDelayMs
    ) {
      errors.push('Minimum delay cannot be greater than maximum delay');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const privacyService = new PrivacyService();
export { PrivacyService };
