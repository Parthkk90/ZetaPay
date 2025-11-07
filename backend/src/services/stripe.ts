import Stripe from 'stripe';
import logger from '../utils/logger';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

export interface CreatePaymentIntentParams {
  amount: number; // Amount in cents (e.g., 10.00 USD = 1000)
  currency: string; // 'usd', 'eur', etc.
  merchantId: string;
  orderId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface ConvertFiatToCryptoParams {
  fiatAmount: number;
  fiatCurrency: string;
  cryptoCurrency: string; // 'ZETA', 'ETH', etc.
}

/**
 * Create a Stripe Payment Intent for fiat payment
 */
export const createPaymentIntent = async (
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount), // Stripe expects amount in smallest currency unit
      currency: params.currency.toLowerCase(),
      metadata: {
        merchantId: params.merchantId,
        orderId: params.orderId || '',
        platform: 'zetapay',
        ...params.metadata,
      },
      receipt_email: params.customerEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logger.info(`Created Stripe PaymentIntent: ${paymentIntent.id}`);
    return paymentIntent;
  } catch (error) {
    logger.error('Stripe PaymentIntent creation failed:', error);
    throw error;
  }
};

/**
 * Retrieve a Stripe Payment Intent
 */
export const getPaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    logger.error(`Failed to retrieve PaymentIntent ${paymentIntentId}:`, error);
    throw error;
  }
};

/**
 * Confirm a Payment Intent
 */
export const confirmPaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  try {
    return await stripe.paymentIntents.confirm(paymentIntentId);
  } catch (error) {
    logger.error(`Failed to confirm PaymentIntent ${paymentIntentId}:`, error);
    throw error;
  }
};

/**
 * Cancel a Payment Intent
 */
export const cancelPaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  try {
    return await stripe.paymentIntents.cancel(paymentIntentId);
  } catch (error) {
    logger.error(`Failed to cancel PaymentIntent ${paymentIntentId}:`, error);
    throw error;
  }
};

/**
 * Create a refund
 */
export const createRefund = async (
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount, // If undefined, refunds full amount
    });

    logger.info(`Created Stripe Refund: ${refund.id}`);
    return refund;
  } catch (error) {
    logger.error(`Failed to create refund for ${paymentIntentId}:`, error);
    throw error;
  }
};

/**
 * Create a Stripe Connected Account for merchant
 */
export const createConnectedAccount = async (
  email: string,
  businessName: string
): Promise<Stripe.Account> => {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_type: 'company',
      company: {
        name: businessName,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    logger.info(`Created Stripe Connected Account: ${account.id}`);
    return account;
  } catch (error) {
    logger.error('Failed to create Stripe Connected Account:', error);
    throw error;
  }
};

/**
 * Create account link for onboarding
 */
export const createAccountLink = async (
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<Stripe.AccountLink> => {
  try {
    return await stripe.accountLinks.create({
      account: accountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: 'account_onboarding',
    });
  } catch (error) {
    logger.error('Failed to create account link:', error);
    throw error;
  }
};

/**
 * Verify webhook signature
 */
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event => {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    logger.error('Stripe webhook signature verification failed:', error);
    throw error;
  }
};

export default stripe;
