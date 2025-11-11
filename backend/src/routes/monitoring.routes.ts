import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getWebSocketService } from '../services/websocket';
import { AppDataSource } from '../db/connection';
import { Payment, PaymentStatus } from '../models/Payment';
import { MoreThan } from 'typeorm';

const router = Router();

/**
 * GET /api/v1/monitoring/websocket
 * Get WebSocket connection statistics
 */
router.get('/websocket', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const wsService = getWebSocketService();
    const stats = wsService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/monitoring/health
 * Get real-time system health metrics
 */
router.get('/health', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paymentRepo = AppDataSource.getRepository(Payment);
    
    // Get metrics for last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const [
      activePayments,
      recentPayments,
      failedPayments,
    ] = await Promise.all([
      paymentRepo.count({ 
        where: { status: PaymentStatus.PROCESSING }
      }),
      paymentRepo.count({ 
        where: { createdAt: MoreThan(fiveMinutesAgo) }
      }),
      paymentRepo.count({ 
        where: { 
          status: PaymentStatus.FAILED,
          createdAt: MoreThan(fiveMinutesAgo)
        }
      }),
    ]);

    // Calculate success rate
    const successRate = recentPayments > 0 
      ? ((recentPayments - failedPayments) / recentPayments) * 100 
      : 100;

    const health = {
      status: 'healthy',
      timestamp: new Date(),
      metrics: {
        activePayments,
        recentPayments,
        failedPayments,
        successRate: Math.round(successRate * 100) / 100,
      },
      database: {
        connected: AppDataSource.isInitialized,
      },
      websocket: getWebSocketService().getStats(),
    };

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/monitoring/payments/live
 * Get live payment activity (last 10 payments)
 */
router.get('/payments/live', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.merchant!.id;
    const paymentRepo = AppDataSource.getRepository(Payment);

    const payments = await paymentRepo.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
