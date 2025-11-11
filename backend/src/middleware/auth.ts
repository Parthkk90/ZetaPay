import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { AppDataSource } from '../db/connection';
import { Merchant } from '../models/Merchant';
import { ApiKey } from '../models/ApiKey';
import bcrypt from 'bcryptjs';

export interface AuthRequest extends Request {
  merchant?: Merchant;
  apiKey?: ApiKey;
}

// JWT Authentication
export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('No authentication token provided', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { merchantId: string };

    const merchantRepo = AppDataSource.getRepository(Merchant);
    const merchant = await merchantRepo.findOne({ where: { id: decoded.merchantId } });

    if (!merchant) {
      throw new AppError('Merchant not found', 401);
    }

    if (merchant.status !== 'active') {
      throw new AppError('Merchant account is not active', 403);
    }

    req.merchant = merchant;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

// API Key Authentication
export const authenticateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new AppError('No API key provided', 401);
    }

    // API keys are in format: zpk_live_xxx or zpk_test_xxx
    if (!apiKey.startsWith('zpk_')) {
      throw new AppError('Invalid API key format', 401);
    }

    const apiKeyRepo = AppDataSource.getRepository(ApiKey);
    const keys = await apiKeyRepo.find({
      relations: ['merchant'],
    });

    let validKey: ApiKey | null = null;
    for (const key of keys) {
      const isValid = await bcrypt.compare(apiKey, key.key);
      if (isValid) {
        validKey = key;
        break;
      }
    }

    if (!validKey) {
      throw new AppError('Invalid API key', 401);
    }

    if (validKey.status !== 'active') {
      throw new AppError('API key is not active', 403);
    }

    if (validKey.expiresAt && validKey.expiresAt < new Date()) {
      throw new AppError('API key has expired', 403);
    }

    if (validKey.merchant.status !== 'active') {
      throw new AppError('Merchant account is not active', 403);
    }

    // Update usage stats
    validKey.lastUsedAt = new Date();
    validKey.usageCount += 1;
    await apiKeyRepo.save(validKey);

    req.merchant = validKey.merchant;
    req.apiKey = validKey;
    next();
  } catch (error) {
    next(error);
  }
};

// Either JWT or API Key
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  if (token) {
    return authenticateJWT(req, res, next);
  } else if (apiKey) {
    return authenticateApiKey(req, res, next);
  } else {
    next(new AppError('Authentication required', 401));
  }
};

// Socket Authentication (for WebSocket connections)
export const authenticateSocket = async (apiKey: string): Promise<string | null> => {
  try {
    if (!apiKey || !apiKey.startsWith('zpk_')) {
      return null;
    }

    const apiKeyRepo = AppDataSource.getRepository(ApiKey);
    const keys = await apiKeyRepo.find({
      relations: ['merchant'],
    });

    for (const key of keys) {
      const isValid = await bcrypt.compare(apiKey, key.key);
      if (isValid) {
        if (key.status !== 'active') return null;
        if (key.expiresAt && key.expiresAt < new Date()) return null;
        if (key.merchant.status !== 'active') return null;

        // Update usage stats
        key.lastUsedAt = new Date();
        key.usageCount += 1;
        await apiKeyRepo.save(key);

        return key.merchant.id;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
};
