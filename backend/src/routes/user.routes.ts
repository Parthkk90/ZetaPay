import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AppDataSource } from '../db/connection';
import { User, UserStatus } from '../models/User';
import { Payment, PaymentStatus } from '../models/Payment';
import { AppError } from '../middleware/errorHandler';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

const router = Router();

interface AuthRequest extends Request {
  user?: User;
}

/**
 * POST /api/v1/users/auth
 * Authenticate user with wallet address (for extension)
 */
router.post(
  '/auth',
  [
    body('walletAddress').isString().matches(/^0x[a-fA-F0-9]{40}$/),
    body('signature').optional().isString(),
    body('message').optional().isString(),
  ],
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { walletAddress, signature, message } = req.body;

      const userRepo = AppDataSource.getRepository(User);

      // Find or create user
      let user = await userRepo.findOne({ where: { walletAddress: walletAddress.toLowerCase() } });

      if (!user) {
        // Create new user
        user = userRepo.create({
          walletAddress: walletAddress.toLowerCase(),
          status: UserStatus.ACTIVE,
          lastLoginAt: new Date(),
        });
        await userRepo.save(user);
        logger.info(`New user created: ${walletAddress}`);
      } else {
        // Update last login
        user.lastLoginAt = new Date();
        await userRepo.save(user);
      }

      // TODO: Verify signature if provided (optional for now)
      // if (signature && message) {
      //   const isValid = verifySignature(walletAddress, message, signature);
      //   if (!isValid) {
      //     throw new AppError('Invalid signature', 401);
      //   }
      // }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, walletAddress: user.walletAddress },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            walletAddress: user.walletAddress,
            email: user.email,
            username: user.username,
            status: user.status,
            settings: user.settings,
            createdAt: user.createdAt,
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
 * GET /api/v1/users/me
 * Get current user profile
 */
router.get('/me', authenticateUser, async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email,
        username: user.username,
        status: user.status,
        settings: user.settings,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/users/settings
 * Update user settings
 */
router.put(
  '/settings',
  authenticateUser,
  [
    body('notifications').optional().isBoolean(),
    body('autoDetect').optional().isBoolean(),
    body('showButton').optional().isBoolean(),
    body('gasPreference').optional().isIn(['fast', 'standard', 'slow']),
    body('txTimeout').optional().isInt({ min: 60, max: 600 }),
    body('preferredCurrency').optional().isString(),
    body('preferredNetwork').optional().isString(),
  ],
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const user = req.user;
      const userRepo = AppDataSource.getRepository(User);

      // Update settings
      user.settings = {
        ...user.settings,
        notifications: req.body.notifications ?? user.settings?.notifications,
        autoDetect: req.body.autoDetect ?? user.settings?.autoDetect,
        showButton: req.body.showButton ?? user.settings?.showButton,
        gasPreference: req.body.gasPreference ?? user.settings?.gasPreference,
        txTimeout: req.body.txTimeout ?? user.settings?.txTimeout,
      };

      if (req.body.preferredCurrency) {
        user.preferredCurrency = req.body.preferredCurrency;
      }
      if (req.body.preferredNetwork) {
        user.preferredNetwork = req.body.preferredNetwork;
      }

      await userRepo.save(user);

      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: {
          settings: user.settings,
          preferredCurrency: user.preferredCurrency,
          preferredNetwork: user.preferredNetwork,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/users/payments
 * Get user's payment history
 */
router.get('/payments', authenticateUser, async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { limit = '50', offset = '0', status } = req.query;

    const paymentRepo = AppDataSource.getRepository(Payment);
    
    const queryBuilder = paymentRepo.createQueryBuilder('payment')
      .where('payment.customerWallet = :wallet', { wallet: user.walletAddress })
      .orderBy('payment.createdAt', 'DESC')
      .take(parseInt(limit as string))
      .skip(parseInt(offset as string));

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    const [payments, total] = await queryBuilder.getManyAndCount();

    res.json({
      success: true,
      data: {
        payments: payments.map(p => ({
          id: p.id,
          reference: p.reference,
          amount: p.amount,
          currency: p.currency,
          cryptoAmount: p.cryptoAmount,
          cryptoCurrency: p.cryptoCurrency,
          status: p.status,
          txHash: p.txHash,
          merchantId: p.merchantId,
          orderId: p.orderId,
          description: p.description,
          createdAt: p.createdAt,
          completedAt: p.completedAt,
        })),
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/users/payments/:id
 * Get specific payment details
 */
router.get('/payments/:id', authenticateUser, async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const paymentRepo = AppDataSource.getRepository(Payment);
    const payment = await paymentRepo.findOne({
      where: { id, customerWallet: user.walletAddress },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Middleware to authenticate user via JWT
 */
async function authenticateUser(req: any, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: decoded.userId } });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError('User account is suspended', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
}

export default router;
