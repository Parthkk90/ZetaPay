import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import logger from '../utils/logger';
import { authenticateSocket } from '../middleware/auth';

export interface WebSocketEvents {
  // Client -> Server
  'auth': (apiKey: string) => void;
  'subscribe:payment': (paymentId: string) => void;
  'unsubscribe:payment': (paymentId: string) => void;
  'subscribe:merchant': (merchantId: string) => void;
  'unsubscribe:merchant': (merchantId: string) => void;
  
  // Server -> Client
  'payment:created': (payment: any) => void;
  'payment:updated': (payment: any) => void;
  'payment:completed': (payment: any) => void;
  'payment:failed': (payment: any) => void;
  'transaction:confirmed': (transaction: any) => void;
  'alert:created': (alert: any) => void;
  'system:health': (health: any) => void;
}

export class WebSocketService {
  private io: SocketIOServer;
  private authenticatedSockets: Map<string, string> = new Map(); // socketId -> merchantId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    logger.info('WebSocket service initialized');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Authentication
      socket.on('auth', async (apiKey: string) => {
        try {
          const merchantId = await authenticateSocket(apiKey);
          if (merchantId) {
            this.authenticatedSockets.set(socket.id, merchantId);
            socket.join(`merchant:${merchantId}`);
            socket.emit('auth:success', { merchantId });
            logger.info(`Socket ${socket.id} authenticated for merchant ${merchantId}`);
          } else {
            socket.emit('auth:failed', { error: 'Invalid API key' });
            socket.disconnect();
          }
        } catch (error) {
          logger.error('Socket authentication error:', error);
          socket.emit('auth:failed', { error: 'Authentication failed' });
          socket.disconnect();
        }
      });

      // Subscribe to specific payment updates
      socket.on('subscribe:payment', (paymentId: string) => {
        const merchantId = this.authenticatedSockets.get(socket.id);
        if (!merchantId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }
        socket.join(`payment:${paymentId}`);
        logger.debug(`Socket ${socket.id} subscribed to payment ${paymentId}`);
      });

      // Unsubscribe from payment updates
      socket.on('unsubscribe:payment', (paymentId: string) => {
        socket.leave(`payment:${paymentId}`);
        logger.debug(`Socket ${socket.id} unsubscribed from payment ${paymentId}`);
      });

      // Subscribe to all merchant payments
      socket.on('subscribe:merchant', (merchantId: string) => {
        const authenticatedMerchantId = this.authenticatedSockets.get(socket.id);
        if (!authenticatedMerchantId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }
        if (authenticatedMerchantId !== merchantId) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }
        socket.join(`merchant:${merchantId}`);
        logger.debug(`Socket ${socket.id} subscribed to merchant ${merchantId}`);
      });

      // Disconnect
      socket.on('disconnect', () => {
        const merchantId = this.authenticatedSockets.get(socket.id);
        this.authenticatedSockets.delete(socket.id);
        logger.info(`Client disconnected: ${socket.id} (merchant: ${merchantId})`);
      });
    });
  }

  // Emit payment events
  public emitPaymentCreated(payment: any): void {
    this.io.to(`merchant:${payment.merchantId}`).emit('payment:created', payment);
    this.io.to(`payment:${payment.id}`).emit('payment:created', payment);
  }

  public emitPaymentUpdated(payment: any): void {
    this.io.to(`merchant:${payment.merchantId}`).emit('payment:updated', payment);
    this.io.to(`payment:${payment.id}`).emit('payment:updated', payment);
  }

  public emitPaymentCompleted(payment: any): void {
    this.io.to(`merchant:${payment.merchantId}`).emit('payment:completed', payment);
    this.io.to(`payment:${payment.id}`).emit('payment:completed', payment);
  }

  public emitPaymentFailed(payment: any): void {
    this.io.to(`merchant:${payment.merchantId}`).emit('payment:failed', payment);
    this.io.to(`payment:${payment.id}`).emit('payment:failed', payment);
  }

  // Emit transaction confirmation
  public emitTransactionConfirmed(payment: any, txHash: string): void {
    this.io.to(`merchant:${payment.merchantId}`).emit('transaction:confirmed', {
      paymentId: payment.id,
      txHash,
      timestamp: new Date(),
    });
    this.io.to(`payment:${payment.id}`).emit('transaction:confirmed', {
      paymentId: payment.id,
      txHash,
      timestamp: new Date(),
    });
  }

  // Emit alerts
  public emitAlert(alert: any): void {
    this.io.to(`merchant:${alert.merchantId}`).emit('alert:created', alert);
  }

  // Broadcast system health
  public broadcastSystemHealth(health: any): void {
    this.io.emit('system:health', health);
  }

  // Get connection stats
  public getStats() {
    return {
      totalConnections: this.io.sockets.sockets.size,
      authenticatedConnections: this.authenticatedSockets.size,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
    };
  }

  // Disconnect all clients (for graceful shutdown)
  public async disconnectAll(): Promise<void> {
    return new Promise((resolve) => {
      this.io.disconnectSockets(true);
      this.io.close(() => {
        logger.info('WebSocket service closed');
        resolve();
      });
    });
  }
}

export let wsService: WebSocketService | null = null;

export const initializeWebSocket = (server: HTTPServer): WebSocketService => {
  if (!wsService) {
    wsService = new WebSocketService(server);
  }
  return wsService;
};

export const getWebSocketService = (): WebSocketService => {
  if (!wsService) {
    throw new Error('WebSocket service not initialized');
  }
  return wsService;
};
