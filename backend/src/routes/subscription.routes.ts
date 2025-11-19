import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { subscriptionService } from '../services/subscription.service';
import { BillingInterval } from '../models/Subscription';

const router = Router();

/**
 * POST /api/v1/subscriptions
 */
router.post(
  '/',
  authenticate,
  [
    body('customerId').isString().notEmpty(),
    body('customerEmail').isEmail(),
    body('amount').isNumeric().isFloat({ min: 0 }),
    body('currency').isString().isLength({ min: 3, max: 4 }),
    body('token').isString().notEmpty(),
    body('interval').isIn(Object.values(BillingInterval)),
    body('intervalCount').isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchantId = req.merchant!.id;
      const subscription = await subscriptionService.createSubscription({
        merchantId,
        ...req.body,
      });

      res.status(201).json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/subscriptions
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.merchant!.id;
    const subscriptions = await subscriptionService.getMerchantSubscriptions(merchantId);

    res.json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/subscriptions/:id/cancel
 */
router.post('/:id/cancel', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.cancelSubscription(id);

    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

export default router;
