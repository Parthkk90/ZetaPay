import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { AppDataSource } from '../db/connection';
import { ApiKey, ApiKeyStatus } from '../models/ApiKey';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateApiKey, hashApiKey } from '../utils/crypto';

const router = Router();

/**
 * POST /api/v1/api-keys
 * Create a new API key
 */
router.post(
  '/',
  authenticate,
  [
    body('name').notEmpty().trim(),
    body('isTestMode').optional().isBoolean(),
    body('permissions').optional().isArray(),
    body('expiresIn').optional().isInt({ min: 1 }), // Days until expiration
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { name, isTestMode = false, permissions, expiresIn } = req.body;

      // Generate API key
      const rawKey = generateApiKey(isTestMode);
      const hashedKey = await hashApiKey(rawKey);

      // Calculate expiration
      let expiresAt: Date | undefined;
      if (expiresIn) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresIn);
      }

      // Create API key record
      const apiKeyRepo = AppDataSource.getRepository(ApiKey);
      const apiKey = apiKeyRepo.create({
        merchantId: merchant.id,
        key: hashedKey,
        keyPrefix: rawKey.substring(0, 16) + '...', // Save prefix for display
        name,
        isTestMode,
        permissions: permissions || ['payments:read', 'payments:write'],
        expiresAt,
      });

      await apiKeyRepo.save(apiKey);

      // Return the raw key ONLY once (cannot be retrieved again)
      res.status(201).json({
        success: true,
        message: 'API key created successfully. Save this key - it will not be shown again!',
        data: {
          id: apiKey.id,
          key: rawKey, // ⚠️ Only shown once
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          isTestMode: apiKey.isTestMode,
          permissions: apiKey.permissions,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/api-keys
 * List merchant's API keys
 */
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const merchant = req.merchant!;
    const apiKeyRepo = AppDataSource.getRepository(ApiKey);

    const apiKeys = await apiKeyRepo.find({
      where: { merchantId: merchant.id },
      order: { createdAt: 'DESC' },
    });

    // Don't return actual keys, only metadata
    const sanitized = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      status: key.status,
      isTestMode: key.isTestMode,
      permissions: key.permissions,
      lastUsedAt: key.lastUsedAt,
      usageCount: key.usageCount,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    }));

    res.json({
      success: true,
      data: sanitized,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/api-keys/:id
 * Revoke an API key
 */
router.delete(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const apiKeyRepo = AppDataSource.getRepository(ApiKey);

      const apiKey = await apiKeyRepo.findOne({
        where: {
          id: req.params.id,
          merchantId: merchant.id,
        },
      });

      if (!apiKey) {
        throw new AppError('API key not found', 404);
      }

      apiKey.status = ApiKeyStatus.REVOKED;
      await apiKeyRepo.save(apiKey);

      res.json({
        success: true,
        message: 'API key revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
