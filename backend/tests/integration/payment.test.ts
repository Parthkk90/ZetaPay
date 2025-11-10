import request from 'supertest';
import { Express } from 'express';
import { testDataSource, setupTestDB, teardownTestDB, clearTestDB } from '../setup';
import { Merchant } from '../../src/models/Merchant';
import { Payment } from '../../src/models/Payment';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock Express app - will be set in beforeAll
let app: Express;

describe('Payment Flow Integration Tests', () => {
  let merchantToken: string;
  let merchantId: string;
  let apiKey: string;

  beforeAll(async () => {
    await setupTestDB();
    
    // Create test merchant
    const merchantRepo = testDataSource.getRepository(Merchant);
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    const merchant = merchantRepo.create({
      email: 'test@merchant.com',
      passwordHash: hashedPassword,
      businessName: 'Test Merchant',
      status: 'active',
      kycStatus: 'approved',
      emailVerified: true,
      paymentSettings: {
        acceptedTokens: ['ZETA', 'USDT'],
        autoConvert: false,
      },
    });
    
    await merchantRepo.save(merchant);
    merchantId = merchant.id;
    
    // Generate JWT token
    merchantToken = jwt.sign(
      { merchantId: merchant.id, email: merchant.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    // Mock API key (in real test, create via API key route)
    apiKey = 'zpk_test_' + Math.random().toString(36).substring(7);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/v1/payments/create', () => {
    it('should create a crypto payment with default token', async () => {
      const response = await request(app)
        .post('/api/v1/payments/create')
        .set('X-API-Key', apiKey)
        .send({
          amount: 100,
          currency: 'USD',
          source: 'crypto',
          orderId: 'order-123',
          description: 'Test payment',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentReference');
      expect(response.body.data.source).toBe('crypto');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.currency).toBe('ZETA'); // Default token
    });

    it('should create a crypto payment with specific token', async () => {
      const response = await request(app)
        .post('/api/v1/payments/create')
        .set('X-API-Key', apiKey)
        .send({
          amount: 50,
          currency: 'USD',
          source: 'crypto',
          token: 'USDT',
          orderId: 'order-456',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currency).toBe('USDT');
    });

    it('should reject payment with unaccepted token', async () => {
      const response = await request(app)
        .post('/api/v1/payments/create')
        .set('X-API-Key', apiKey)
        .send({
          amount: 50,
          currency: 'USD',
          source: 'crypto',
          token: 'DAI', // Not in acceptedTokens
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not accepted');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/payments/create')
        .set('X-API-Key', apiKey)
        .send({
          // Missing amount and currency
          source: 'crypto',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/v1/payments/:id', () => {
    let paymentId: string;

    beforeEach(async () => {
      // Create a test payment
      const paymentRepo = testDataSource.getRepository(Payment);
      const payment = paymentRepo.create({
        paymentReference: 'pay_test_123',
        merchantId,
        source: 'crypto',
        status: 'pending',
        amountCrypto: '1.5',
        cryptoCurrency: 'ZETA',
        amountFiat: '100.00',
        fiatCurrency: 'USD',
      });
      await paymentRepo.save(payment);
      paymentId = payment.id;
    });

    it('should get payment details', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(paymentId);
      expect(response.body.data.paymentReference).toBe('pay_test_123');
    });

    it('should return 404 for non-existent payment', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/payments/${fakeId}`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/payments', () => {
    beforeEach(async () => {
      // Create multiple test payments
      const paymentRepo = testDataSource.getRepository(Payment);
      
      for (let i = 0; i < 5; i++) {
        const payment = paymentRepo.create({
          paymentReference: `pay_test_${i}`,
          merchantId,
          source: 'crypto',
          status: i % 2 === 0 ? 'completed' : 'pending',
          amountCrypto: '1.0',
          cryptoCurrency: 'ZETA',
          amountFiat: '50.00',
          fiatCurrency: 'USD',
        });
        await paymentRepo.save(payment);
      }
    });

    it('should list all merchant payments', async () => {
      const response = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toHaveLength(5);
      expect(response.body.data.pagination.total).toBe(5);
    });

    it('should filter payments by status', async () => {
      const response = await request(app)
        .get('/api/v1/payments?status=completed')
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toHaveLength(3); // 0, 2, 4 are completed
      expect(response.body.data.payments.every((p: any) => p.status === 'completed')).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/payments?limit=2&offset=0')
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toHaveLength(2);
      expect(response.body.data.pagination.limit).toBe(2);
    });
  });
});
