import { AppDataSource } from '../db/connection';
import { Payment, PaymentStatus } from '../models/Payment';
import { Merchant } from '../models/Merchant';
import { TransactionAlert, AlertType, AlertSeverity, AlertStatus } from '../models/TransactionAlert';
import logger from '../utils/logger';

// AML thresholds configuration
const AML_THRESHOLDS = {
  HIGH_VALUE_TRANSACTION: parseFloat(process.env.AML_HIGH_VALUE_THRESHOLD || '10000'), // $10,000
  DAILY_TRANSACTION_LIMIT: parseFloat(process.env.AML_DAILY_LIMIT || '50000'), // $50,000
  VELOCITY_COUNT: parseInt(process.env.AML_VELOCITY_COUNT || '10'), // 10 transactions
  VELOCITY_WINDOW_HOURS: parseInt(process.env.AML_VELOCITY_WINDOW || '24'), // 24 hours
};

/**
 * Monitor a payment for AML compliance
 */
export const monitorPayment = async (paymentId: string): Promise<void> => {
  try {
    const paymentRepo = AppDataSource.getRepository(Payment);
    const alertRepo = AppDataSource.getRepository(TransactionAlert);

    const payment = await paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['merchant'],
    });

    if (!payment) {
      logger.warn(`Payment ${paymentId} not found for AML monitoring`);
      return;
    }

    // Check 1: High-value transaction
    const fiatAmount = payment.amountFiat ? parseFloat(payment.amountFiat) : 0;
    if (fiatAmount >= AML_THRESHOLDS.HIGH_VALUE_TRANSACTION) {
      await alertRepo.save({
        merchantId: payment.merchantId,
        paymentId: payment.id,
        type: AlertType.HIGH_VALUE_TRANSACTION,
        severity: AlertSeverity.HIGH,
        status: AlertStatus.OPEN,
        description: `High-value transaction detected: ${payment.fiatCurrency} ${fiatAmount}`,
        details: {
          amount: fiatAmount,
          currency: payment.fiatCurrency || 'USD',
          threshold: AML_THRESHOLDS.HIGH_VALUE_TRANSACTION,
        },
        riskScore: 75,
      });

      logger.warn(`High-value transaction alert created for payment ${paymentId}`);
    }

    // Check 2: Velocity check (multiple transactions in short time)
    const velocityWindow = new Date();
    velocityWindow.setHours(velocityWindow.getHours() - AML_THRESHOLDS.VELOCITY_WINDOW_HOURS);

    const recentPayments = await paymentRepo.count({
      where: {
        merchantId: payment.merchantId,
        status: PaymentStatus.COMPLETED,
        createdAt: velocityWindow as any,
      },
    });

    if (recentPayments >= AML_THRESHOLDS.VELOCITY_COUNT) {
      await alertRepo.save({
        merchantId: payment.merchantId,
        paymentId: payment.id,
        type: AlertType.VELOCITY_BREACH,
        severity: AlertSeverity.MEDIUM,
        status: AlertStatus.OPEN,
        description: `Velocity breach: ${recentPayments} transactions in ${AML_THRESHOLDS.VELOCITY_WINDOW_HOURS} hours`,
        details: {
          velocity: {
            count: recentPayments,
            timeWindow: `${AML_THRESHOLDS.VELOCITY_WINDOW_HOURS}h`,
            threshold: AML_THRESHOLDS.VELOCITY_COUNT,
          },
        },
        riskScore: 60,
      });

      logger.warn(`Velocity breach alert created for merchant ${payment.merchantId}`);
    }

    // Check 3: Blacklist check (wallet address)
    if (payment.fromAddress) {
      const isBlacklisted = await checkBlacklist(payment.fromAddress);
      if (isBlacklisted) {
        await alertRepo.save({
          merchantId: payment.merchantId,
          paymentId: payment.id,
          type: AlertType.BLACKLIST_MATCH,
          severity: AlertSeverity.CRITICAL,
          status: AlertStatus.OPEN,
          description: `Payment from blacklisted wallet address: ${payment.fromAddress}`,
          details: {
            matchedEntity: payment.fromAddress,
          },
          riskScore: 95,
        });

        logger.error(`Blacklist match alert created for payment ${paymentId}`);
      }
    }

    // Check 4: Daily transaction volume
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const dailyVolume = await paymentRepo
      .createQueryBuilder('payment')
      .where('payment.merchantId = :merchantId', { merchantId: payment.merchantId })
      .andWhere('payment.createdAt >= :todayStart', { todayStart })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .select('SUM(CAST(payment.amountFiat AS DECIMAL))', 'total')
      .getRawOne();

    const totalDaily = parseFloat(dailyVolume?.total || '0');
    if (totalDaily >= AML_THRESHOLDS.DAILY_TRANSACTION_LIMIT) {
      await alertRepo.save({
        merchantId: payment.merchantId,
        paymentId: payment.id,
        type: AlertType.UNUSUAL_ACTIVITY,
        severity: AlertSeverity.HIGH,
        status: AlertStatus.OPEN,
        description: `Daily transaction limit exceeded: ${payment.fiatCurrency} ${totalDaily}`,
        details: {
          amount: totalDaily,
          currency: payment.fiatCurrency || 'USD',
          threshold: AML_THRESHOLDS.DAILY_TRANSACTION_LIMIT,
        },
        riskScore: 70,
      });

      logger.warn(`Daily limit alert created for merchant ${payment.merchantId}`);
    }

    logger.info(`AML monitoring completed for payment ${paymentId}`);
  } catch (error) {
    logger.error(`AML monitoring failed for payment ${paymentId}:`, error);
  }
};

/**
 * Check if wallet address is blacklisted
 */
const checkBlacklist = async (address: string): Promise<boolean> => {
  // TODO: Integrate with Chainalysis, Elliptic, or other AML screening services
  // For now, maintain a simple in-memory blacklist
  const blacklistedAddresses = [
    // Add known malicious addresses
  ];

  return blacklistedAddresses.includes(address.toLowerCase());
};

/**
 * Calculate merchant risk score
 */
export const calculateMerchantRiskScore = async (merchantId: string): Promise<number> => {
  try {
    const paymentRepo = AppDataSource.getRepository(Payment);
    const alertRepo = AppDataSource.getRepository(TransactionAlert);

    // Get merchant statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalPayments, failedPayments, totalAlerts, criticalAlerts] = await Promise.all([
      paymentRepo.count({ where: { merchantId } }),
      paymentRepo.count({
        where: {
          merchantId,
          status: PaymentStatus.FAILED,
          createdAt: thirtyDaysAgo as any,
        },
      }),
      alertRepo.count({ where: { merchantId, status: AlertStatus.OPEN } }),
      alertRepo.count({
        where: {
          merchantId,
          status: AlertStatus.OPEN,
          severity: AlertSeverity.CRITICAL,
        },
      }),
    ]);

    // Calculate risk score (0-100)
    let riskScore = 0;

    // Factor 1: Failure rate (max 30 points)
    if (totalPayments > 0) {
      const failureRate = failedPayments / totalPayments;
      riskScore += Math.min(failureRate * 100, 30);
    }

    // Factor 2: Open alerts (max 40 points)
    riskScore += Math.min(totalAlerts * 5, 40);

    // Factor 3: Critical alerts (max 30 points)
    riskScore += Math.min(criticalAlerts * 10, 30);

    return Math.min(Math.round(riskScore), 100);
  } catch (error) {
    logger.error(`Failed to calculate risk score for merchant ${merchantId}:`, error);
    return 0;
  }
};

/**
 * Screen merchant against sanctions lists (PEP, OFAC, etc.)
 */
export const screenMerchant = async (
  firstName: string,
  lastName: string,
  dateOfBirth?: Date,
  nationality?: string
): Promise<{
  pepMatches: number;
  sanctionMatches: number;
  adverseMediaMatches: number;
}> => {
  try {
    // TODO: Integrate with ComplyAdvantage, Dow Jones, or similar screening service
    // This is a placeholder implementation
    
    logger.info(`Screening merchant: ${firstName} ${lastName}`);

    // Simulated screening results
    return {
      pepMatches: 0,
      sanctionMatches: 0,
      adverseMediaMatches: 0,
    };
  } catch (error) {
    logger.error('Merchant screening failed:', error);
    throw error;
  }
};

/**
 * Auto-resolve low-risk alerts
 */
export const autoResolveAlerts = async (): Promise<number> => {
  try {
    const alertRepo = AppDataSource.getRepository(TransactionAlert);

    // Auto-resolve alerts older than 30 days with low severity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await alertRepo
      .createQueryBuilder()
      .update(TransactionAlert)
      .set({
        status: AlertStatus.RESOLVED,
        autoResolved: true,
        resolution: 'Auto-resolved: Low severity alert older than 30 days',
      })
      .where('status = :status', { status: AlertStatus.OPEN })
      .andWhere('severity = :severity', { severity: AlertSeverity.LOW })
      .andWhere('createdAt < :date', { date: thirtyDaysAgo })
      .execute();

    const resolvedCount = result.affected || 0;
    logger.info(`Auto-resolved ${resolvedCount} low-risk alerts`);

    return resolvedCount;
  } catch (error) {
    logger.error('Auto-resolve alerts failed:', error);
    return 0;
  }
};

/**
 * Generate compliance report for a merchant
 */
export const generateComplianceReport = async (merchantId: string): Promise<{
  totalPayments: number;
  totalVolume: number;
  openAlerts: number;
  riskScore: number;
  kycStatus: string;
  lastReviewDate?: Date;
}> => {
  try {
    const paymentRepo = AppDataSource.getRepository(Payment);
    const alertRepo = AppDataSource.getRepository(TransactionAlert);
    const merchantRepo = AppDataSource.getRepository(Merchant);

    const merchant = await merchantRepo.findOne({ where: { id: merchantId } });
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const [totalPayments, volumeResult, openAlerts, riskScore] = await Promise.all([
      paymentRepo.count({ where: { merchantId } }),
      paymentRepo
        .createQueryBuilder('payment')
        .where('payment.merchantId = :merchantId', { merchantId })
        .select('SUM(CAST(payment.amountFiat AS DECIMAL))', 'total')
        .getRawOne(),
      alertRepo.count({ where: { merchantId, status: AlertStatus.OPEN } }),
      calculateMerchantRiskScore(merchantId),
    ]);

    return {
      totalPayments,
      totalVolume: parseFloat(volumeResult?.total || '0'),
      openAlerts,
      riskScore,
      kycStatus: merchant.kycStatus,
    };
  } catch (error) {
    logger.error(`Failed to generate compliance report for merchant ${merchantId}:`, error);
    throw error;
  }
};
