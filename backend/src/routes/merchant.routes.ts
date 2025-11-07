import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../db/connection';
import { Merchant, MerchantStatus, KYCStatus } from '../models/Merchant';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * POST /api/v1/merchants/register
 * Register a new merchant account
 */
router.post(
  '/register',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('businessName').notEmpty().trim(),
    body('website').optional().isURL(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password, businessName, website, description } = req.body;

      const merchantRepo = AppDataSource.getRepository(Merchant);

      // Check if merchant already exists
      const existing = await merchantRepo.findOne({ where: { email } });
      if (existing) {
        throw new AppError('Merchant with this email already exists', 409);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create merchant
      const merchant = merchantRepo.create({
        email,
        passwordHash,
        businessName,
        website,
        description,
        status: MerchantStatus.PENDING,
        kycStatus: KYCStatus.NOT_STARTED,
      });

      await merchantRepo.save(merchant);

      // Generate JWT token
      const token = jwt.sign(
        { merchantId: merchant.id },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Merchant registered successfully',
        data: {
          merchant: {
            id: merchant.id,
            email: merchant.email,
            businessName: merchant.businessName,
            status: merchant.status,
            kycStatus: merchant.kycStatus,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/merchants/login
 * Merchant login
 */
router.post(
  '/login',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;

      const merchantRepo = AppDataSource.getRepository(Merchant);
      const merchant = await merchantRepo.findOne({ where: { email } });

      if (!merchant) {
        throw new AppError('Invalid email or password', 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, merchant.passwordHash);
      if (!isValidPassword) {
        throw new AppError('Invalid email or password', 401);
      }

      // Update last login
      merchant.lastLoginAt = new Date();
      await merchantRepo.save(merchant);

      // Generate JWT token
      const token = jwt.sign(
        { merchantId: merchant.id },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        data: {
          merchant: {
            id: merchant.id,
            email: merchant.email,
            businessName: merchant.businessName,
            status: merchant.status,
            kycStatus: merchant.kycStatus,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/merchants/me
 * Get current merchant profile
 */
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const merchant = req.merchant!;

    res.json({
      success: true,
      data: {
        id: merchant.id,
        email: merchant.email,
        businessName: merchant.businessName,
        website: merchant.website,
        description: merchant.description,
        status: merchant.status,
        kycStatus: merchant.kycStatus,
        walletAddress: merchant.walletAddress,
        paymentSettings: merchant.paymentSettings,
        emailVerified: merchant.emailVerified,
        createdAt: merchant.createdAt,
        lastLoginAt: merchant.lastLoginAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/merchants/me
 * Update merchant profile
 */
router.put(
  '/me',
  authenticate,
  [
    body('businessName').optional().trim(),
    body('website').optional().isURL(),
    body('walletAddress').optional().isEthereumAddress(),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { businessName, website, description, walletAddress, paymentSettings } = req.body;

      const merchantRepo = AppDataSource.getRepository(Merchant);

      if (businessName) merchant.businessName = businessName;
      if (website) merchant.website = website;
      if (description) merchant.description = description;
      if (walletAddress) merchant.walletAddress = walletAddress;
      if (paymentSettings) merchant.paymentSettings = paymentSettings;

      await merchantRepo.save(merchant);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: merchant,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
