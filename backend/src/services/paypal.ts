import axios from 'axios';
import logger from '../utils/logger';

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  logger.warn('PayPal credentials not configured');
}

let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get PayPal access token
 */
const getAccessToken = async (): Promise<string> => {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1min early

    return accessToken;
  } catch (error) {
    logger.error('Failed to get PayPal access token:', error);
    throw error;
  }
};

export interface CreateOrderParams {
  amount: number;
  currency: string;
  merchantId: string;
  orderId?: string;
  returnUrl: string;
  cancelUrl: string;
}

/**
 * Create a PayPal order
 */
export const createOrder = async (params: CreateOrderParams): Promise<any> => {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: params.orderId || `ORDER_${Date.now()}`,
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: params.amount.toFixed(2),
          },
          custom_id: params.merchantId,
        }],
        application_context: {
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
          brand_name: 'ZetaPay',
          user_action: 'PAY_NOW',
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`Created PayPal Order: ${response.data.id}`);
    return response.data;
  } catch (error) {
    logger.error('PayPal order creation failed:', error);
    throw error;
  }
};

/**
 * Capture a PayPal order
 */
export const captureOrder = async (orderId: string): Promise<any> => {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`Captured PayPal Order: ${orderId}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to capture PayPal order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Get order details
 */
export const getOrder = async (orderId: string): Promise<any> => {
  try {
    const token = await getAccessToken();

    const response = await axios.get(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    logger.error(`Failed to get PayPal order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Create a refund
 */
export const createRefund = async (
  captureId: string,
  amount?: number,
  currency?: string
): Promise<any> => {
  try {
    const token = await getAccessToken();

    const data: any = {};
    if (amount && currency) {
      data.amount = {
        value: amount.toFixed(2),
        currency_code: currency.toUpperCase(),
      };
    }

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/payments/captures/${captureId}/refund`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`Created PayPal Refund: ${response.data.id}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to create PayPal refund for ${captureId}:`, error);
    throw error;
  }
};

/**
 * Verify webhook signature
 */
export const verifyWebhookSignature = async (
  webhookId: string,
  eventBody: any,
  headers: any
): Promise<boolean> => {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: eventBody,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.verification_status === 'SUCCESS';
  } catch (error) {
    logger.error('PayPal webhook verification failed:', error);
    return false;
  }
};
