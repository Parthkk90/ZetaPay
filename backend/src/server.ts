import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';
import { connectDB } from './db/connection';
import { initializeWebSocket } from './services/websocket';

// Routes
import merchantRoutes from './routes/merchant.routes';
import paymentRoutes from './routes/payment.routes';
import webhookRoutes from './routes/webhook.routes';
import healthRoutes from './routes/health.routes';
import apiKeyRoutes from './routes/apiKey.routes';
import kycRoutes from './routes/kyc.routes';
import complianceRoutes from './routes/compliance.routes';
import analyticsRoutes from './routes/analytics.routes';
import monitoringRoutes from './routes/monitoring.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;
const API_VERSION = process.env.API_VERSION || 'v1';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

// Rate limiting
app.use(rateLimiter);

// Health check (no rate limit)
app.use('/health', healthRoutes);

// API Routes
app.use(`/api/${API_VERSION}/merchants`, merchantRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${API_VERSION}/webhooks`, webhookRoutes);
app.use(`/api/${API_VERSION}/api-keys`, apiKeyRoutes);
app.use(`/api/${API_VERSION}/kyc`, kycRoutes);
app.use(`/api/${API_VERSION}/compliance`, complianceRoutes);
app.use(`/api/${API_VERSION}/analytics`, analyticsRoutes);
app.use(`/api/${API_VERSION}/monitoring`, monitoringRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'ZetaPay API',
    version: API_VERSION,
    status: 'running',
    endpoints: {
      health: '/health',
      merchants: `/api/${API_VERSION}/merchants`,
      payments: `/api/${API_VERSION}/payments`,
      webhooks: `/api/${API_VERSION}/webhooks`,
      apiKeys: `/api/${API_VERSION}/api-keys`,
      kyc: `/api/${API_VERSION}/kyc`,
      compliance: `/api/${API_VERSION}/compliance`,
      analytics: `/api/${API_VERSION}/analytics`,
      monitoring: `/api/${API_VERSION}/monitoring`,
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize WebSocket
    initializeWebSocket(server);
    logger.info('✅ WebSocket service initialized');
    
    server.listen(PORT, () => {
      logger.info(`🚀 ZetaPay API Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Base URL: http://localhost:${PORT}`);
      logger.info(`📚 API Version: ${API_VERSION}`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  const { getWebSocketService } = await import('./services/websocket');
  await getWebSocketService().disconnectAll();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  const { getWebSocketService } = await import('./services/websocket');
  await getWebSocketService().disconnectAll();
  process.exit(0);
});

startServer();

export default app;
