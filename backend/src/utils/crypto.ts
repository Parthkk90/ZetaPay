import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a random API key
 * Format: zpk_live_xxxxx or zpk_test_xxxxx
 */
export const generateApiKey = (isTestMode: boolean = false): string => {
  const prefix = isTestMode ? 'zpk_test' : 'zpk_live';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${randomBytes}`;
};

/**
 * Hash an API key for storage
 */
export const hashApiKey = async (apiKey: string): Promise<string> => {
  const saltRounds = parseInt(process.env.API_KEY_SALT_ROUNDS || '10');
  return bcrypt.hash(apiKey, saltRounds);
};

/**
 * Generate a webhook secret
 */
export const generateWebhookSecret = (): string => {
  return `whsec_${crypto.randomBytes(32).toString('hex')}`;
};

/**
 * Create HMAC signature for webhook verification
 */
export const createWebhookSignature = (payload: string, secret: string): string => {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
};

/**
 * Verify webhook signature
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = createWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

/**
 * Generate a unique payment reference
 */
export const generatePaymentReference = (): string => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(6).toString('hex');
  return `PAY_${timestamp}_${random}`.toUpperCase();
};
