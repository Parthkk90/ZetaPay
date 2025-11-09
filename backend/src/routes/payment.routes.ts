import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { AppDataSource } from '../db/connection';
import { Payment, PaymentStatus, PaymentSource } from '../models/Payment';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authenticateApiKey, AuthRequest } from '../middleware/auth';
import { generatePaymentReference } from '../utils/crypto';
import { getCryptoPrice, convertFiatToCrypto } from '../services/priceService';
import * as stripeService from '../services/stripe';
import * as paypalService from '../services/paypal';
import * as amlService from '../services/aml';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/payments/create
 * Create a new payment
 */
router.post(
  '/create',
  authenticateApiKey,
  [
    body('amount').isNumeric().isFloat({ min: 0.01 }),
    body('currency').isString().isLength({ min: 3, max: 4 }),
    body('source').isIn(['crypto', 'stripe', 'paypal']),
    body('token').optional().isString(),
    body('orderId').optional().isString(),
    body('description').optional().isString(),
    body('customerEmail').optional().isEmail(),
    body('returnUrl').optional().isURL(),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const {
        amount,
        currency,
        source,
        orderId,
        description,
        customerEmail,
        returnUrl,
        metadata,
      } = req.body;

      const paymentRepo = AppDataSource.getRepository(Payment);

      // Generate unique payment reference
      const paymentReference = generatePaymentReference();

      // Create base payment record
      const payment = paymentRepo.create({
        paymentReference,
        merchantId: merchant.id,
        source: source as PaymentSource,
        status: PaymentStatus.PENDING,
        orderId,
        description,
        customerEmail,
        metadata,
      });

      // Handle different payment sources
      if (source === 'stripe') {
        // Create Stripe Payment Intent
        const paymentIntent = await stripeService.createPaymentIntent({
          amount: parseFloat(amount) * 100, // Convert to cents
          currency,
          merchantId: merchant.id,
          orderId,
          customerEmail,
          metadata: {
            paymentReference,
            ...metadata,
          },
        });

        payment.processorPaymentId = paymentIntent.id;
        payment.amountFiat = amount;
        payment.fiatCurrency = currency.toUpperCase();
        payment.processorMetadata = {
          clientSecret: paymentIntent.client_secret,
        };
      } else if (source === 'paypal') {
        // Create PayPal Order
        const order = await paypalService.createOrder({
          amount: parseFloat(amount),
          currency,
          merchantId: merchant.id,
          orderId,
          returnUrl: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
          cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
        });

        payment.processorPaymentId = order.id;
        payment.amountFiat = amount;
        payment.fiatCurrency = currency.toUpperCase();
        payment.processorMetadata = {
          approvalUrl: order.links.find((link: any) => link.rel === 'approve')?.href,
        };
      } else if (source === 'crypto') {
        // Crypto payment - determine token to use
        const requestedToken = (req.body.token as string) || merchant.paymentSettings?.acceptedTokens?.[0] || 'ZETA';

        // Validate merchant accepts this token
        const acceptedTokens: string[] = merchant.paymentSettings?.acceptedTokens || [];
        if (acceptedTokens.length > 0 && !acceptedTokens.includes(requestedToken)) {
          throw new AppError('Requested token not accepted by merchant', 400);
        }

        const conversion = await convertFiatToCrypto(
          parseFloat(amount),
          currency,
          requestedToken
        );

        payment.amountCrypto = conversion.cryptoAmount.toFixed(8);
        payment.cryptoCurrency = requestedToken;
        payment.amountFiat = amount;
        payment.fiatCurrency = currency.toUpperCase();
        payment.exchangeRate = conversion.exchangeRate.toFixed(8);
        payment.toAddress = process.env.UNIVERSAL_PAYMENT_CONTRACT;

        // Set expiration (15 minutes for crypto payments)
        payment.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      }

      await paymentRepo.save(payment);

      // Run AML monitoring on the payment
      try {
        await amlService.monitorPayment(payment.id);
      } catch (amlError) {
        // Log but don't fail the payment if AML check fails
        logger.error(`AML monitoring failed for payment ${payment.id}:`, amlError);
      }

      logger.info(`Payment created: ${payment.id} (${payment.source})`);

      res.status(201).json({
        success: true,
        data: {
          id: payment.id,
          paymentReference: payment.paymentReference,
          source: payment.source,
          status: payment.status,
          amount: source === 'crypto' ? payment.amountCrypto : payment.amountFiat,
          currency: source === 'crypto' ? payment.cryptoCurrency : payment.fiatCurrency,
          ...(source === 'crypto' && {
            toAddress: payment.toAddress,
            exchangeRate: payment.exchangeRate,
            expiresAt: payment.expiresAt,
          }),
          ...(payment.processorMetadata && {
            processorData: payment.processorMetadata,
          }),
          createdAt: payment.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/payments/:id
 * Get payment details
 */
router.get(
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
      const paymentRepo = AppDataSource.getRepository(Payment);

      const payment = await paymentRepo.findOne({
        where: {
          id: req.params.id,
          merchantId: merchant.id,
        },
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
  }
);

/**
 * GET /api/v1/payments
 * List merchant payments
 */
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const merchant = req.merchant!;
    const { status, source, limit = 50, offset = 0 } = req.query;

    const paymentRepo = AppDataSource.getRepository(Payment);

    const where: any = { merchantId: merchant.id };
    if (status) where.status = status;
    if (source) where.source = source;

    const [payments, total] = await paymentRepo.findAndCount({
      where,
      take: Number(limit),
      skip: Number(offset),
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/payments/:id/confirm
 * Confirm a payment (for Stripe/PayPal)
 */
router.post(
  '/:id/confirm',
  authenticateApiKey,
  [param('id').isUUID()],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const paymentRepo = AppDataSource.getRepository(Payment);

      const payment = await paymentRepo.findOne({
        where: {
          id: req.params.id,
          merchantId: merchant.id,
        },
      });

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new AppError('Payment cannot be confirmed', 400);
      }

      payment.status = PaymentStatus.PROCESSING;

      if (payment.source === PaymentSource.STRIPE && payment.processorPaymentId) {
        const paymentIntent = await stripeService.confirmPaymentIntent(
          payment.processorPaymentId
        );
        payment.processorMetadata = {
          ...payment.processorMetadata,
          status: paymentIntent.status,
        };
      } else if (payment.source === PaymentSource.PAYPAL && payment.processorPaymentId) {
        const order = await paypalService.captureOrder(payment.processorPaymentId);
        payment.status = PaymentStatus.COMPLETED;
        payment.completedAt = new Date();
        payment.processorMetadata = {
          ...payment.processorMetadata,
          captureId: order.purchase_units[0].payments.captures[0].id,
        };
      }

      await paymentRepo.save(payment);

      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/payments/:id/refund
 * Refund a payment
 */
router.post(
  '/:id/refund',
  authenticate,
  [
    param('id').isUUID(),
    body('amount').optional().isNumeric(),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { amount } = req.body;
      const paymentRepo = AppDataSource.getRepository(Payment);

      const payment = await paymentRepo.findOne({
        where: {
          id: req.params.id,
          merchantId: merchant.id,
        },
      });

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new AppError('Only completed payments can be refunded', 400);
      }

      if (payment.source === PaymentSource.STRIPE && payment.processorPaymentId) {
        await stripeService.createRefund(
          payment.processorPaymentId,
          amount ? parseFloat(amount) * 100 : undefined
        );
      } else if (payment.source === PaymentSource.PAYPAL) {
        const captureId = payment.processorMetadata?.captureId;
        if (captureId) {
          await paypalService.createRefund(
            captureId,
            amount ? parseFloat(amount) : undefined,
            payment.fiatCurrency
          );
        }
      }

      payment.status = PaymentStatus.REFUNDED;
      await paymentRepo.save(payment);

      logger.info(`Payment refunded: ${payment.id}`);

      res.json({
        success: true,
        message: 'Payment refunded successfully',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
