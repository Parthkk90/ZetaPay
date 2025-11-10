import request from 'supertest';
import { Express } from 'express';
import { testDataSource, setupTestDB, teardownTestDB, clearTestDB } from '../setup';
import { Merchant } from '../../src/models/Merchant';
import { Payment } from '../../src/models/Payment';
import jwt from 'jsonwebtoken';

let app: Express;

describe('Analytics API Integration Tests', () => {
  let merchantToken: string;
  let merchantId: string;

  beforeAll(async () => {
    await setupTestDB();
    
    const merchantRepo = testDataSource.getRepository(Merchant);
    const merchant = merchantRepo.create({
      email: 'analytics@test.com',
      passwordHash: 'hash',
      businessName: 'Analytics Test',
      status: 'active',
      kycStatus: 'approved',
    });
    await merchantRepo.save(merchant);
    merchantId = merchant.id;
    
    merchantToken = jwt.sign(
      { merchantId: merchant.id, email: merchant.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test payment data
    const paymentRepo = testDataSource.getRepository(Payment);
    const now = new Date();
    
    for (let i = 0; i < 10; i++) {
      const payment = paymentRepo.create({
        paymentReference: `pay_analytics_${i}`,
        merchantId,
        source: 'crypto',
        status: i < 8 ? 'completed' : 'failed',
        amountCrypto: '1.0',
        cryptoCurrency: i % 2 === 0 ? 'ZETA' : 'USDT',
        amountFiat: (50 + i * 10).toString(),
        fiatCurrency: 'USD',
        fromAddress: `0xCustomer${i % 3}`, // 3 unique customers
        createdAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000), // Spread over 10 days
      });
      await paymentRepo.save(payment);
    }
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /api/v1/analytics/overview', () => {
    it('should return analytics overview', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/overview?period=30d')
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalPayments');
      expect(response.body.data).toHaveProperty('successfulPayments');
      expect(response.body.data).toHaveProperty('totalVolume');
      expect(response.body.data).toHaveProperty('successRate');
      expect(response.body.data.totalPayments).toBe(10);
      expect(response.body.data.successfulPayments).toBe(8);
    });
  });

  describe('GET /api/v1/analytics/trends', () => {
    it('should return payment trends by day', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/trends?period=30d')
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('date');
      expect(response.body.data[0]).toHaveProperty('count');
      expect(response.body.data[0]).toHaveProperty('volume');
    });
  });

  describe('GET /api/v1/analytics/tokens', () => {
    it('should return token distribution', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/tokens?period=30d')
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Should have ZETA and USDT
      const tokens = response.body.data.map((t: any) => t.token);
      expect(tokens).toContain('ZETA');
      expect(tokens).toContain('USDT');
      
      // Check token data structure
      expect(response.body.data[0]).toHaveProperty('token');
      expect(response.body.data[0]).toHaveProperty('count');
      expect(response.body.data[0]).toHaveProperty('volume');
      expect(response.body.data[0]).toHaveProperty('percentage');
    });
  });

  describe('GET /api/v1/analytics/revenue', () => {
    it('should return revenue metrics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/revenue?period=30d')
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('revenueByToken');
      expect(response.body.data).toHaveProperty('revenueByDay');
      expect(response.body.data).toHaveProperty('revenueGrowth');
      
      expect(Array.isArray(response.body.data.revenueByToken)).toBe(true);
      expect(Array.isArray(response.body.data.revenueByDay)).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/customers', () => {
    it('should return top customers', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/customers?period=30d&limit=5')
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
      
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('walletAddress');
        expect(response.body.data[0]).toHaveProperty('totalSpent');
        expect(response.body.data[0]).toHaveProperty('paymentCount');
        expect(response.body.data[0]).toHaveProperty('lastPayment');
      }
    });
  });

  describe('GET /api/v1/analytics/conversion', () => {
    it('should return conversion rate', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/conversion?period=30d')
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('rate');
      expect(response.body.data).toHaveProperty('successful');
      expect(response.body.data).toHaveProperty('total');
      
      // 8 successful out of 10 total = 80%
      expect(response.body.data.rate).toBe(80);
      expect(response.body.data.successful).toBe(8);
      expect(response.body.data.total).toBe(10);
    });
  });
});
