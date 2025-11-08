import { AppDataSource } from '../db/connection';
import { Payment, PaymentStatus } from '../models/Payment';
import { Merchant } from '../models/Merchant';
import { TransactionAlert } from '../models/TransactionAlert';
import { Between, MoreThan } from 'typeorm';
import logger from '../utils/logger';

export interface AnalyticsOverview {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  totalVolume: string; // in USD
  successRate: number; // percentage
  averagePaymentValue: string;
  activeAlerts: number;
  kycApproved: boolean;
  periodStart: Date;
  periodEnd: Date;
}

export interface PaymentTrend {
  date: string;
  count: number;
  volume: string; // in USD
  successCount: number;
  failedCount: number;
}

export interface TokenBreakdown {
  token: string;
  count: number;
  volume: string;
  percentage: number;
}

export interface RevenueMetrics {
  totalRevenue: string;
  revenueByToken: TokenBreakdown[];
  revenueByDay: {
    date: string;
    revenue: string;
  }[];
  revenueGrowth: number; // percentage change
}

export interface TopCustomer {
  walletAddress: string;
  totalSpent: string;
  paymentCount: number;
  lastPayment: Date;
}

/**
 * Get analytics overview for merchant dashboard
 */
export async function getAnalyticsOverview(
  merchantId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsOverview> {
  const paymentRepo = AppDataSource.getRepository(Payment);
  const merchantRepo = AppDataSource.getRepository(Merchant);
  const alertRepo = AppDataSource.getRepository(TransactionAlert);

  try {
    // Get merchant
    const merchant = await merchantRepo.findOne({ where: { id: merchantId } });
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Get payments in date range
    const payments = await paymentRepo.find({
      where: {
        merchantId,
        createdAt: Between(startDate, endDate),
      },
    });

    // Calculate metrics
    const totalPayments = payments.length;
    const successfulPayments = payments.filter(p => p.status === PaymentStatus.COMPLETED).length;
    const failedPayments = payments.filter(p => p.status === PaymentStatus.FAILED || p.status === PaymentStatus.EXPIRED).length;
    const pendingPayments = payments.filter(p => p.status === PaymentStatus.PENDING).length;

    const totalVolume = payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + parseFloat(p.usdAmount), 0);

    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
    const averagePaymentValue = successfulPayments > 0 ? (totalVolume / successfulPayments).toFixed(2) : '0.00';

    // Count active alerts
    const activeAlerts = await alertRepo.count({
      where: {
        merchantId,
        status: 'open',
      },
    });

    return {
      totalPayments,
      successfulPayments,
      failedPayments,
      pendingPayments,
      totalVolume: totalVolume.toFixed(2),
      successRate: parseFloat(successRate.toFixed(2)),
      averagePaymentValue,
      activeAlerts,
      kycApproved: merchant.kycStatus === 'approved',
      periodStart: startDate,
      periodEnd: endDate,
    };
  } catch (error) {
    logger.error('Error getting analytics overview:', error);
    throw error;
  }
}

/**
 * Get payment trends (daily breakdown)
 */
export async function getPaymentTrends(
  merchantId: string,
  startDate: Date,
  endDate: Date
): Promise<PaymentTrend[]> {
  const paymentRepo = AppDataSource.getRepository(Payment);

  try {
    const payments = await paymentRepo.find({
      where: {
        merchantId,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'ASC' },
    });

    // Group by date
    const trendMap = new Map<string, PaymentTrend>();

    payments.forEach((payment) => {
      const date = payment.createdAt.toISOString().split('T')[0];

      if (!trendMap.has(date)) {
        trendMap.set(date, {
          date,
          count: 0,
          volume: '0',
          successCount: 0,
          failedCount: 0,
        });
      }

      const trend = trendMap.get(date)!;
      trend.count++;

      if (payment.status === PaymentStatus.COMPLETED) {
        trend.successCount++;
        trend.volume = (parseFloat(trend.volume) + parseFloat(payment.usdAmount)).toFixed(2);
      } else if (payment.status === PaymentStatus.FAILED || payment.status === PaymentStatus.EXPIRED) {
        trend.failedCount++;
      }
    });

    return Array.from(trendMap.values());
  } catch (error) {
    logger.error('Error getting payment trends:', error);
    throw error;
  }
}

/**
 * Get token distribution breakdown
 */
export async function getTokenBreakdown(
  merchantId: string,
  startDate: Date,
  endDate: Date
): Promise<TokenBreakdown[]> {
  const paymentRepo = AppDataSource.getRepository(Payment);

  try {
    const payments = await paymentRepo.find({
      where: {
        merchantId,
        status: PaymentStatus.COMPLETED,
        createdAt: Between(startDate, endDate),
      },
    });

    // Group by token
    const tokenMap = new Map<string, { count: number; volume: number }>();
    let totalVolume = 0;

    payments.forEach((payment) => {
      const token = payment.token;
      if (!tokenMap.has(token)) {
        tokenMap.set(token, { count: 0, volume: 0 });
      }

      const data = tokenMap.get(token)!;
      data.count++;
      data.volume += parseFloat(payment.usdAmount);
      totalVolume += parseFloat(payment.usdAmount);
    });

    // Convert to array with percentages
    return Array.from(tokenMap.entries()).map(([token, data]) => ({
      token,
      count: data.count,
      volume: data.volume.toFixed(2),
      percentage: totalVolume > 0 ? parseFloat(((data.volume / totalVolume) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume));
  } catch (error) {
    logger.error('Error getting token breakdown:', error);
    throw error;
  }
}

/**
 * Get revenue metrics
 */
export async function getRevenueMetrics(
  merchantId: string,
  startDate: Date,
  endDate: Date
): Promise<RevenueMetrics> {
  const paymentRepo = AppDataSource.getRepository(Payment);

  try {
    const payments = await paymentRepo.find({
      where: {
        merchantId,
        status: PaymentStatus.COMPLETED,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'ASC' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.usdAmount), 0);

    // Revenue by token
    const revenueByToken = await getTokenBreakdown(merchantId, startDate, endDate);

    // Revenue by day
    const revenueByDayMap = new Map<string, number>();

    payments.forEach((payment) => {
      const date = payment.createdAt.toISOString().split('T')[0];
      const current = revenueByDayMap.get(date) || 0;
      revenueByDayMap.set(date, current + parseFloat(payment.usdAmount));
    });

    const revenueByDay = Array.from(revenueByDayMap.entries()).map(([date, revenue]) => ({
      date,
      revenue: revenue.toFixed(2),
    }));

    // Calculate growth (compare to previous period)
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodLength);
    const previousEnd = new Date(startDate.getTime());

    const previousPayments = await paymentRepo.find({
      where: {
        merchantId,
        status: PaymentStatus.COMPLETED,
        createdAt: Between(previousStart, previousEnd),
      },
    });

    const previousRevenue = previousPayments.reduce((sum, p) => sum + parseFloat(p.usdAmount), 0);
    const revenueGrowth = previousRevenue > 0
      ? parseFloat((((totalRevenue - previousRevenue) / previousRevenue) * 100).toFixed(2))
      : 0;

    return {
      totalRevenue: totalRevenue.toFixed(2),
      revenueByToken,
      revenueByDay,
      revenueGrowth,
    };
  } catch (error) {
    logger.error('Error getting revenue metrics:', error);
    throw error;
  }
}

/**
 * Get top customers by spending
 */
export async function getTopCustomers(
  merchantId: string,
  startDate: Date,
  endDate: Date,
  limit: number = 10
): Promise<TopCustomer[]> {
  const paymentRepo = AppDataSource.getRepository(Payment);

  try {
    const payments = await paymentRepo.find({
      where: {
        merchantId,
        status: PaymentStatus.COMPLETED,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });

    // Group by customer wallet
    const customerMap = new Map<string, { totalSpent: number; count: number; lastPayment: Date }>();

    payments.forEach((payment) => {
      const wallet = payment.customerWallet;
      if (!customerMap.has(wallet)) {
        customerMap.set(wallet, { totalSpent: 0, count: 0, lastPayment: payment.createdAt });
      }

      const data = customerMap.get(wallet)!;
      data.totalSpent += parseFloat(payment.usdAmount);
      data.count++;

      if (payment.createdAt > data.lastPayment) {
        data.lastPayment = payment.createdAt;
      }
    });

    // Convert to array and sort by total spent
    return Array.from(customerMap.entries())
      .map(([wallet, data]) => ({
        walletAddress: wallet,
        totalSpent: data.totalSpent.toFixed(2),
        paymentCount: data.count,
        lastPayment: data.lastPayment,
      }))
      .sort((a, b) => parseFloat(b.totalSpent) - parseFloat(a.totalSpent))
      .slice(0, limit);
  } catch (error) {
    logger.error('Error getting top customers:', error);
    throw error;
  }
}

/**
 * Get conversion rate (successful vs total payments)
 */
export async function getConversionRate(
  merchantId: string,
  startDate: Date,
  endDate: Date
): Promise<{ rate: number; successful: number; total: number }> {
  const paymentRepo = AppDataSource.getRepository(Payment);

  try {
    const totalPayments = await paymentRepo.count({
      where: {
        merchantId,
        createdAt: Between(startDate, endDate),
      },
    });

    const successfulPayments = await paymentRepo.count({
      where: {
        merchantId,
        status: PaymentStatus.COMPLETED,
        createdAt: Between(startDate, endDate),
      },
    });

    const rate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

    return {
      rate: parseFloat(rate.toFixed(2)),
      successful: successfulPayments,
      total: totalPayments,
    };
  } catch (error) {
    logger.error('Error getting conversion rate:', error);
    throw error;
  }
}

/**
 * Get alert statistics
 */
export async function getAlertStatistics(
  merchantId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  total: number;
  open: number;
  resolved: number;
  bySeverity: { severity: string; count: number }[];
  byType: { type: string; count: number }[];
}> {
  const alertRepo = AppDataSource.getRepository(TransactionAlert);

  try {
    const alerts = await alertRepo.find({
      where: {
        merchantId,
        createdAt: Between(startDate, endDate),
      },
    });

    const total = alerts.length;
    const open = alerts.filter(a => a.status === 'open').length;
    const resolved = alerts.filter(a => a.status === 'resolved').length;

    // Group by severity
    const severityMap = new Map<string, number>();
    alerts.forEach((alert) => {
      const count = severityMap.get(alert.severity) || 0;
      severityMap.set(alert.severity, count + 1);
    });

    const bySeverity = Array.from(severityMap.entries()).map(([severity, count]) => ({
      severity,
      count,
    }));

    // Group by type
    const typeMap = new Map<string, number>();
    alerts.forEach((alert) => {
      const count = typeMap.get(alert.alertType) || 0;
      typeMap.set(alert.alertType, count + 1);
    });

    const byType = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    return {
      total,
      open,
      resolved,
      bySeverity,
      byType,
    };
  } catch (error) {
    logger.error('Error getting alert statistics:', error);
    throw error;
  }
}
