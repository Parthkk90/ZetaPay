import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AppDataSource } from '../db/connection';
import { Webhook, WebhookStatus, WebhookEvent } from '../models/Webhook';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateWebhookSecret } from '../utils/crypto';

const router = Router();

/**
 * POST /api/v1/webhooks
 * Create a webhook endpoint
 */
router.post(
  '/',
  authenticate,
  [
    body('url').isURL(),
    body('events').isArray().notEmpty(),
    body('events.*').isIn(Object.values(WebhookEvent)),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { url, events } = req.body;

      // Generate webhook secret
      const secret = generateWebhookSecret();

      const webhookRepo = AppDataSource.getRepository(Webhook);
      const webhook = webhookRepo.create({
        merchantId: merchant.id,
        url,
        events,
        secret,
        status: WebhookStatus.ACTIVE,
      });

      await webhookRepo.save(webhook);

      res.status(201).json({
        success: true,
        message: 'Webhook created successfully',
        data: {
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          secret: webhook.secret, // ⚠️ Save this for signature verification
          status: webhook.status,
          createdAt: webhook.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/webhooks
 * List merchant webhooks
 */
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const merchant = req.merchant!;
    const webhookRepo = AppDataSource.getRepository(Webhook);

    const webhooks = await webhookRepo.find({
      where: { merchantId: merchant.id },
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: webhooks,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/webhooks/:id
 * Delete a webhook
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const merchant = req.merchant!;
    const webhookRepo = AppDataSource.getRepository(Webhook);

    const webhook = await webhookRepo.findOne({
      where: {
        id: req.params.id,
        merchantId: merchant.id,
      },
    });

    if (!webhook) {
      throw new AppError('Webhook not found', 404);
    }

    await webhookRepo.remove(webhook);

    res.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/webhooks/stripe
 * Stripe webhook receiver
 */
router.post('/stripe', async (req: Request, res: Response) => {
  // Stripe webhook handler (receives payment events from Stripe)
  // Verify signature and process events
  res.json({ received: true });
});

/**
 * POST /api/v1/webhooks/paypal
 * PayPal webhook receiver
 */
router.post('/paypal', async (req: Request, res: Response) => {
  // PayPal webhook handler (receives payment events from PayPal)
  // Verify signature and process events
  res.json({ received: true });
});

export default router;
