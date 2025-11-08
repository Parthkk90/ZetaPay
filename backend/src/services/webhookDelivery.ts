import axios from 'axios';
import crypto from 'crypto';
import { AppDataSource } from '../db/connection';
import { Webhook } from '../models/Webhook';
import logger from '../utils/logger';

export interface WebhookPayload {
  event: string;
  timestamp: Date;
  data: any;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
  attempt: number;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Deliver webhook to merchant endpoint with retry logic
 */
export async function deliverWebhook(
  webhookId: string,
  url: string,
  payload: WebhookPayload,
  secret: string,
  attempt: number = 1
): Promise<WebhookDeliveryResult> {
  const maxAttempts = 3;
  const webhookRepo = AppDataSource.getRepository(Webhook);

  try {
    // Generate signature
    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, secret);

    // Calculate exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Max 30 seconds
    if (attempt > 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Send webhook
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-ZetaPay-Signature': signature,
        'X-ZetaPay-Event': payload.event,
        'X-ZetaPay-Timestamp': payload.timestamp.toISOString(),
        'User-Agent': 'ZetaPay-Webhooks/1.0',
      },
      timeout: 10000, // 10 second timeout
      validateStatus: (status) => status >= 200 && status < 300,
    });

    // Update webhook record on success
    await webhookRepo.update(webhookId, {
      deliveredAt: new Date(),
      attempts: attempt,
      lastAttemptAt: new Date(),
      responseStatus: response.status,
      responseBody: JSON.stringify(response.data),
    });

    logger.info(`Webhook ${webhookId} delivered successfully on attempt ${attempt}`);

    return {
      success: true,
      statusCode: response.status,
      response: response.data,
      attempt,
    };
  } catch (error: any) {
    logger.error(`Webhook ${webhookId} delivery failed (attempt ${attempt}):`, error.message);

    // Update webhook record on failure
    await webhookRepo.update(webhookId, {
      attempts: attempt,
      lastAttemptAt: new Date(),
      responseStatus: error.response?.status,
      responseBody: error.response?.data ? JSON.stringify(error.response.data) : error.message,
    });

    // Retry if not max attempts
    if (attempt < maxAttempts) {
      logger.info(`Retrying webhook ${webhookId} (attempt ${attempt + 1}/${maxAttempts})...`);
      return deliverWebhook(webhookId, url, payload, secret, attempt + 1);
    }

    // Mark as failed after max attempts
    await webhookRepo.update(webhookId, {
      failedAt: new Date(),
    });

    return {
      success: false,
      statusCode: error.response?.status,
      error: error.message,
      attempt,
    };
  }
}

/**
 * Queue webhook for delivery
 */
export async function queueWebhook(
  merchantId: string,
  event: string,
  data: any,
  url?: string
): Promise<string> {
  const webhookRepo = AppDataSource.getRepository(Webhook);

  // Create webhook record
  const webhook = webhookRepo.create({
    merchantId,
    event,
    url: url || '', // Will be set from merchant webhook URL if not provided
    payload: {
      event,
      timestamp: new Date(),
      data,
    },
    attempts: 0,
  });

  await webhookRepo.save(webhook);

  logger.info(`Webhook queued: ${webhook.id} for event ${event}`);

  return webhook.id;
}

/**
 * Process queued webhooks
 */
export async function processQueuedWebhooks(): Promise<void> {
  const webhookRepo = AppDataSource.getRepository(Webhook);

  try {
    // Find webhooks that are not delivered and not failed
    const pendingWebhooks = await webhookRepo
      .createQueryBuilder('webhook')
      .leftJoinAndSelect('webhook.merchant', 'merchant')
      .where('webhook.deliveredAt IS NULL')
      .andWhere('webhook.failedAt IS NULL')
      .andWhere('webhook.attempts < 3')
      .orderBy('webhook.createdAt', 'ASC')
      .limit(10) // Process 10 at a time
      .getMany();

    if (pendingWebhooks.length === 0) {
      return;
    }

    logger.info(`Processing ${pendingWebhooks.length} pending webhooks...`);

    // Process webhooks in parallel
    await Promise.allSettled(
      pendingWebhooks.map(async (webhook) => {
        const merchant = webhook.merchant;
        if (!merchant || !merchant.webhookUrl) {
          logger.warn(`Webhook ${webhook.id}: No webhook URL for merchant ${webhook.merchantId}`);
          await webhookRepo.update(webhook.id, { failedAt: new Date() });
          return;
        }

        // Use webhook secret from merchant settings
        const secret = merchant.webhookSecret || process.env.WEBHOOK_SECRET || 'default-secret';

        await deliverWebhook(
          webhook.id,
          webhook.url || merchant.webhookUrl,
          webhook.payload as WebhookPayload,
          secret,
          webhook.attempts + 1
        );
      })
    );

    logger.info('Webhook processing batch completed');
  } catch (error) {
    logger.error('Error processing queued webhooks:', error);
  }
}

/**
 * Retry failed webhook
 */
export async function retryWebhook(webhookId: string): Promise<WebhookDeliveryResult> {
  const webhookRepo = AppDataSource.getRepository(Webhook);

  const webhook = await webhookRepo.findOne({
    where: { id: webhookId },
    relations: ['merchant'],
  });

  if (!webhook) {
    throw new Error('Webhook not found');
  }

  if (webhook.deliveredAt) {
    throw new Error('Webhook already delivered');
  }

  const merchant = webhook.merchant;
  if (!merchant || !merchant.webhookUrl) {
    throw new Error('No webhook URL configured for merchant');
  }

  const secret = merchant.webhookSecret || process.env.WEBHOOK_SECRET || 'default-secret';

  // Reset webhook state
  await webhookRepo.update(webhookId, {
    failedAt: null,
    attempts: 0,
  });

  return deliverWebhook(
    webhookId,
    webhook.url || merchant.webhookUrl,
    webhook.payload as WebhookPayload,
    secret
  );
}

/**
 * Start webhook processing worker
 */
export function startWebhookWorker(intervalMs: number = 30000): NodeJS.Timeout {
  logger.info(`Starting webhook worker (interval: ${intervalMs}ms)...`);

  return setInterval(async () => {
    try {
      await processQueuedWebhooks();
    } catch (error) {
      logger.error('Webhook worker error:', error);
    }
  }, intervalMs);
}
