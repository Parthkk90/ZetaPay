import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as analyticsService from '../services/analytics';
import logger from '../utils/logger';

const router = Router();

/**
 * Helper to parse date range from query params
 */
function parseDateRange(req: any): { startDate: Date; endDate: Date } {
  const { startDate, endDate, period } = req.query;

  let start: Date;
  let end = new Date();

  if (startDate && endDate) {
    start = new Date(startDate as string);
    end = new Date(endDate as string);
  } else {
    // Default to period or last 30 days
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    start = new Date();
    start.setDate(start.getDate() - days);
  }

  return { startDate: start, endDate: end };
}

/**
 * GET /api/v1/analytics/overview
 * Get comprehensive analytics overview
 */
router.get(
  '/overview',
  authenticate,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('period').optional().isIn(['7d', '30d', '90d']),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { startDate, endDate } = parseDateRange(req);

      const overview = await analyticsService.getAnalyticsOverview(
        merchant.id,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/trends
 * Get payment trends over time
 */
router.get(
  '/trends',
  authenticate,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('period').optional().isIn(['7d', '30d', '90d']),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { startDate, endDate } = parseDateRange(req);

      const trends = await analyticsService.getPaymentTrends(
        merchant.id,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/tokens
 * Get token distribution breakdown
 */
router.get(
  '/tokens',
  authenticate,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('period').optional().isIn(['7d', '30d', '90d']),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { startDate, endDate } = parseDateRange(req);

      const tokenBreakdown = await analyticsService.getTokenBreakdown(
        merchant.id,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: tokenBreakdown,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/revenue
 * Get revenue metrics
 */
router.get(
  '/revenue',
  authenticate,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('period').optional().isIn(['7d', '30d', '90d']),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { startDate, endDate } = parseDateRange(req);

      const revenue = await analyticsService.getRevenueMetrics(
        merchant.id,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: revenue,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/customers
 * Get top customers
 */
router.get(
  '/customers',
  authenticate,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('period').optional().isIn(['7d', '30d', '90d']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { startDate, endDate } = parseDateRange(req);
      const limit = parseInt(req.query.limit as string) || 10;

      const customers = await analyticsService.getTopCustomers(
        merchant.id,
        startDate,
        endDate,
        limit
      );

      res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/conversion
 * Get conversion rate
 */
router.get(
  '/conversion',
  authenticate,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('period').optional().isIn(['7d', '30d', '90d']),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { startDate, endDate } = parseDateRange(req);

      const conversion = await analyticsService.getConversionRate(
        merchant.id,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: conversion,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/alerts
 * Get alert statistics
 */
router.get(
  '/alerts',
  authenticate,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('period').optional().isIn(['7d', '30d', '90d']),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { startDate, endDate } = parseDateRange(req);

      const alertStats = await analyticsService.getAlertStatistics(
        merchant.id,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: alertStats,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
