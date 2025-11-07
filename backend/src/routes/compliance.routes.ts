import { Router, Response, NextFunction } from 'express';
import { param, body, query, validationResult } from 'express-validator';
import { AppDataSource } from '../db/connection';
import { TransactionAlert, AlertStatus, AlertType, AlertSeverity } from '../models/TransactionAlert';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as amlService from '../services/aml';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/compliance/dashboard
 * Get compliance dashboard overview
 */
router.get('/dashboard', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const merchant = req.merchant!;

    const report = await amlService.generateComplianceReport(merchant.id);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/compliance/alerts
 * List transaction alerts
 */
router.get(
  '/alerts',
  authenticate,
  [
    query('status').optional().isIn(Object.values(AlertStatus)),
    query('severity').optional().isIn(Object.values(AlertSeverity)),
    query('type').optional().isIn(Object.values(AlertType)),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { status, severity, type, limit = 50, offset = 0 } = req.query;

      const alertRepo = AppDataSource.getRepository(TransactionAlert);

      const where: any = { merchantId: merchant.id };
      if (status) where.status = status;
      if (severity) where.severity = severity;
      if (type) where.type = type;

      const [alerts, total] = await alertRepo.findAndCount({
        where,
        take: Number(limit),
        skip: Number(offset),
        order: { createdAt: 'DESC' },
        relations: ['payment'],
      });

      res.json({
        success: true,
        data: {
          alerts,
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
  }
);

/**
 * GET /api/v1/compliance/alerts/:id
 * Get alert details
 */
router.get(
  '/alerts/:id',
  authenticate,
  [param('id').isUUID()],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const alertRepo = AppDataSource.getRepository(TransactionAlert);

      const alert = await alertRepo.findOne({
        where: {
          id: req.params.id,
          merchantId: merchant.id,
        },
        relations: ['payment', 'merchant'],
      });

      if (!alert) {
        throw new AppError('Alert not found', 404);
      }

      res.json({
        success: true,
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/compliance/alerts/:id/resolve
 * Resolve an alert
 */
router.put(
  '/alerts/:id/resolve',
  authenticate,
  [
    param('id').isUUID(),
    body('resolution').notEmpty().trim(),
    body('notes').optional().trim(),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { resolution, notes } = req.body;
      const alertRepo = AppDataSource.getRepository(TransactionAlert);

      const alert = await alertRepo.findOne({
        where: {
          id: req.params.id,
          merchantId: merchant.id,
        },
      });

      if (!alert) {
        throw new AppError('Alert not found', 404);
      }

      if (alert.status === AlertStatus.RESOLVED) {
        throw new AppError('Alert already resolved', 400);
      }

      alert.status = AlertStatus.RESOLVED;
      alert.resolution = resolution;
      alert.notes = notes;
      alert.reviewedAt = new Date();
      alert.reviewedBy = merchant.id;

      await alertRepo.save(alert);

      logger.info(`Alert ${alert.id} resolved by merchant ${merchant.id}`);

      res.json({
        success: true,
        message: 'Alert resolved successfully',
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/compliance/alerts/:id/escalate
 * Escalate an alert
 */
router.put(
  '/alerts/:id/escalate',
  authenticate,
  [
    param('id').isUUID(),
    body('notes').optional().trim(),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { notes } = req.body;
      const alertRepo = AppDataSource.getRepository(TransactionAlert);

      const alert = await alertRepo.findOne({
        where: {
          id: req.params.id,
          merchantId: merchant.id,
        },
      });

      if (!alert) {
        throw new AppError('Alert not found', 404);
      }

      alert.status = AlertStatus.ESCALATED;
      alert.notes = notes;

      await alertRepo.save(alert);

      logger.warn(`Alert ${alert.id} escalated by merchant ${merchant.id}`);

      res.json({
        success: true,
        message: 'Alert escalated successfully',
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/compliance/risk-score
 * Get merchant risk score
 */
router.get('/risk-score', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const merchant = req.merchant!;

    const riskScore = await amlService.calculateMerchantRiskScore(merchant.id);

    let riskLevel: 'low' | 'medium' | 'high';
    if (riskScore > 70) {
      riskLevel = 'high';
    } else if (riskScore > 40) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    res.json({
      success: true,
      data: {
        riskScore,
        riskLevel,
        calculatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
