import { AppDataSource } from '../db/connection';
import { Subscription, SubscriptionStatus, BillingInterval } from '../models/Subscription';
import { Payment, PaymentStatus } from '../models/Payment';
import logger from '../utils/logger';

class SubscriptionService {
  /**
   * Create a new subscription
   */
  async createSubscription(data: {
    merchantId: string;
    customerId: string;
    customerEmail: string;
    amount: number;
    currency: string;
    token: string;
    interval: BillingInterval;
    intervalCount: number;
    trialDays?: number;
    metadata?: Record<string, any>;
  }): Promise<Subscription> {
    const repo = AppDataSource.getRepository(Subscription);

    const now = new Date();
    const trialEnd = data.trialDays
      ? new Date(now.getTime() + data.trialDays * 24 * 60 * 60 * 1000)
      : null;

    const currentPeriodStart = trialEnd || now;
    const currentPeriodEnd = this.calculateNextBillingDate(
      currentPeriodStart,
      data.interval,
      data.intervalCount
    );

    const subscription = repo.create({
      ...data,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart,
      currentPeriodEnd,
      nextBillingDate: currentPeriodEnd,
      trialEnd,
      billingCycleCount: 0,
    });

    await repo.save(subscription);
    logger.info(`Subscription created: ${subscription.id}`);

    return subscription;
  }

  /**
   * Process subscription billing
   */
  async processBilling(subscriptionId: string): Promise<Payment | null> {
    const subscriptionRepo = AppDataSource.getRepository(Subscription);
    const subscription = await subscriptionRepo.findOne({
      where: { id: subscriptionId },
      relations: ['merchant'],
    });

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      return null;
    }

    // Check if billing is due
    if (subscription.nextBillingDate > new Date()) {
      return null;
    }

    try {
      // Create payment for subscription
      const paymentRepo = AppDataSource.getRepository(Payment);
      const payment = paymentRepo.create({
        merchantId: subscription.merchantId,
        amount: subscription.amount,
        currency: subscription.currency,
        token: subscription.token,
        source: 'crypto',
        status: PaymentStatus.PENDING,
        customerEmail: subscription.customerEmail,
        metadata: {
          subscriptionId: subscription.id,
          billingCycle: subscription.billingCycleCount + 1,
        },
      });

      await paymentRepo.save(payment);

      // Update subscription
      subscription.billingCycleCount += 1;
      subscription.currentPeriodStart = subscription.currentPeriodEnd;
      subscription.currentPeriodEnd = this.calculateNextBillingDate(
        subscription.currentPeriodEnd,
        subscription.interval,
        subscription.intervalCount
      );
      subscription.nextBillingDate = subscription.currentPeriodEnd;

      await subscriptionRepo.save(subscription);

      logger.info(`Billing processed for subscription ${subscriptionId}`);
      return payment;
    } catch (error) {
      logger.error(`Failed to process billing for subscription ${subscriptionId}:`, error);
      return null;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    const repo = AppDataSource.getRepository(Subscription);
    const subscription = await repo.findOne({ where: { id: subscriptionId } });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();

    await repo.save(subscription);
    logger.info(`Subscription cancelled: ${subscriptionId}`);

    return subscription;
  }

  /**
   * Calculate next billing date
   */
  private calculateNextBillingDate(
    startDate: Date,
    interval: BillingInterval,
    count: number
  ): Date {
    const next = new Date(startDate);

    switch (interval) {
      case BillingInterval.DAILY:
        next.setDate(next.getDate() + count);
        break;
      case BillingInterval.WEEKLY:
        next.setDate(next.getDate() + count * 7);
        break;
      case BillingInterval.MONTHLY:
        next.setMonth(next.getMonth() + count);
        break;
      case BillingInterval.QUARTERLY:
        next.setMonth(next.getMonth() + count * 3);
        break;
      case BillingInterval.YEARLY:
        next.setFullYear(next.getFullYear() + count);
        break;
    }

    return next;
  }

  /**
   * Get active subscriptions for merchant
   */
  async getMerchantSubscriptions(merchantId: string): Promise<Subscription[]> {
    const repo = AppDataSource.getRepository(Subscription);
    return repo.find({
      where: { merchantId, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }
}

export const subscriptionService = new SubscriptionService();
export { SubscriptionService };
