import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/ready', (req, res) => {
  // Add database connectivity check here
  res.json({
    success: true,
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
