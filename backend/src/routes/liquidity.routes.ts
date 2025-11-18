import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { liquidityManager } from '../services/liquidityManager';

const router = Router();

/**
 * GET /api/v1/liquidity/stats
 * Get liquidity pool statistics
 */
router.get('/stats', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await liquidityManager.getPoolStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/liquidity/rebalance/:poolAddress
 * Manually trigger rebalancing for a specific pool
 */
router.post('/rebalance/:poolAddress', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { poolAddress } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(poolAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pool address format',
      });
    }

    await liquidityManager.triggerManualRebalance(poolAddress);

    res.json({
      success: true,
      message: 'Rebalancing triggered successfully',
      data: {
        poolAddress,
        triggeredAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/liquidity/balances
 * Get token balances for monitored tokens
 */
router.get('/balances', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tokenAddresses = [
      '0x0000000000000000000000000000000000000000', // ZETA
      '0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf', // ETH
      '0x13A0c5930C028511Dc02665E7285134B6d11A5f4', // BTC
      '0x0cbe0dF132a6c6B4a2974Fa1b7Fb953CF0Cc798a', // USDT
      '0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0', // USDC
      '0x4c5f4d519dff3c1aea8581e207fd93d44f65e09e', // DAI
    ];

    const balances = await liquidityManager.getTokenBalances(tokenAddresses);

    res.json({
      success: true,
      data: balances,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
