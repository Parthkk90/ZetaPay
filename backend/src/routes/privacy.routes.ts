import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { privacyService } from '../services/privacy.service';

const router = Router();

/**
 * GET /api/v1/privacy/settings
 * Get privacy settings for the authenticated merchant
 */
router.get('/settings', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.merchant?.id;

    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Merchant not found',
      });
    }

    const settings = await privacyService.getPrivacySettings(merchantId);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/privacy/settings
 * Update privacy settings for the authenticated merchant
 */
router.put('/settings', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.merchant?.id;

    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Merchant not found',
      });
    }

    const { enabled, stealthAddress, splitTransactions, minDelayMs, maxDelayMs } = req.body;

    // Validate settings
    const validation = privacyService.validateSettings({
      enabled,
      stealthAddress,
      splitTransactions,
      minDelayMs,
      maxDelayMs,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid privacy settings',
        errors: validation.errors,
      });
    }

    const updatedSettings = await privacyService.updatePrivacySettings(merchantId, {
      enabled,
      stealthAddress,
      splitTransactions,
      minDelayMs,
      maxDelayMs,
    });

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: updatedSettings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/privacy/stealth-address
 * Generate a new stealth address for one-time use
 */
router.post('/stealth-address', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stealthAddress = await privacyService.generateStealthAddress();

    res.json({
      success: true,
      data: {
        address: stealthAddress.address,
        expiresAt: stealthAddress.expiresAt,
        // Never expose private key in API response in production
        // This is for demonstration only
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/privacy/preview-split
 * Preview how a transaction would be split (without executing)
 */
router.post('/preview-split', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to, amount, numberOfSplits } = req.body;

    if (!from || !to || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: from, to, amount',
      });
    }

    const splits = privacyService.splitTransaction(
      from,
      to,
      BigInt(amount),
      numberOfSplits || 3
    );

    res.json({
      success: true,
      data: {
        originalAmount: amount,
        numberOfSplits: splits.length,
        splits: splits.map(s => ({
          amount: s.amount.toString(),
          delayMs: s.delayMs,
        })),
        totalDelayMs: splits.reduce((sum, s) => sum + s.delayMs, 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
