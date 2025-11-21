import { DataSource } from 'typeorm';
import logger from '../utils/logger';
import { Merchant } from '../models/Merchant';
import { Payment } from '../models/Payment';
import { ApiKey } from '../models/ApiKey';
import { Webhook } from '../models/Webhook';
import { KYCVerification } from '../models/KYCVerification';
import { TransactionAlert } from '../models/TransactionAlert';
import { Subscription } from '../models/Subscription';
import { Invoice } from '../models/Invoice';
import { User } from '../models/User';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zetapay',
  synchronize: process.env.NODE_ENV === 'development', // Auto-sync in dev only
  logging: process.env.NODE_ENV === 'development',
  entities: [Merchant, Payment, ApiKey, Webhook, KYCVerification, TransactionAlert, Subscription, Invoice, User],
  migrations: ['src/db/migrations/*.ts'],
  subscribers: [],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pooling for scalability
  extra: {
    max: parseInt(process.env.DB_POOL_MAX || '10'), // Maximum connections
    min: parseInt(process.env.DB_POOL_MIN || '2'), // Minimum connections
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'), // 30s
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '2000'), // 2s
  },
});

export const connectDB = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await AppDataSource.destroy();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting database:', error);
  }
};
