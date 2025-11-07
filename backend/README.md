# ZetaPay Backend API

Backend server for ZetaPay payment processing platform, supporting crypto payments via ZetaChain and fiat payments via Stripe/PayPal.

## Features

- ✅ **Merchant Management**: Registration, authentication, profile management
- ✅ **Payment Processing**: Crypto, Stripe, and PayPal integrations
- ✅ **API Key Management**: Secure API key generation and validation
- ✅ **Webhook Support**: Real-time payment notifications
- ✅ **Price Feeds**: Real-time crypto-to-fiat conversion
- ✅ **Rate Limiting**: Protection against API abuse
- ✅ **Logging & Monitoring**: Winston logging, Sentry integration
- ✅ **TypeScript**: Full type safety
- ✅ **PostgreSQL/MongoDB**: Flexible database options

---

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (with TypeORM)
- **Authentication**: JWT + API Keys (bcrypt hashing)
- **Payment Processors**: Stripe, PayPal
- **Blockchain**: ZetaChain (ethers.js)
- **Logging**: Winston
- **Validation**: express-validator
- **Security**: Helmet, CORS, rate limiting

---

## Installation

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14 (or MongoDB as alternative)
- Redis (for caching, optional)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure the following **required** variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zetapay
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=your_super_secret_jwt_key

# ZetaChain
UNIVERSAL_PAYMENT_CONTRACT=0x7a9cEdD3df8694Ef06B81A1E22Fb324353E35B01

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

### 3. Database Setup

Create PostgreSQL database:

```bash
createdb zetapay
```

Run migrations (auto-sync in development):

```bash
npm run migrate
```

### 4. Start Server

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

Server runs on `http://localhost:3001`

---

## API Endpoints

### Authentication

#### Register Merchant
```http
POST /api/v1/merchants/register
Content-Type: application/json

{
  "email": "merchant@example.com",
  "password": "securepassword123",
  "businessName": "My Business",
  "website": "https://mybusiness.com"
}
```

#### Login
```http
POST /api/v1/merchants/login
Content-Type: application/json

{
  "email": "merchant@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "merchant": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Payments

#### Create Payment (API Key Required)
```http
POST /api/v1/payments/create
X-API-Key: zpk_live_...
Content-Type: application/json

{
  "amount": 100.00,
  "currency": "USD",
  "source": "stripe",
  "orderId": "ORDER_123",
  "description": "Payment for services",
  "customerEmail": "customer@example.com",
  "returnUrl": "https://yoursite.com/success"
}
```

**Sources:** `crypto`, `stripe`, `paypal`

#### Get Payment
```http
GET /api/v1/payments/:id
Authorization: Bearer <jwt_token>
```

#### List Payments
```http
GET /api/v1/payments?status=completed&limit=50&offset=0
Authorization: Bearer <jwt_token>
```

#### Confirm Payment
```http
POST /api/v1/payments/:id/confirm
X-API-Key: zpk_live_...
```

#### Refund Payment
```http
POST /api/v1/payments/:id/refund
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 50.00
}
```

### API Keys

#### Create API Key
```http
POST /api/v1/api-keys
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Production API Key",
  "isTestMode": false,
  "permissions": ["payments:read", "payments:write"],
  "expiresIn": 365
}
```

**Response** (⚠️ key shown ONLY once):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "zpk_live_abc123...",
    "name": "Production API Key",
    "keyPrefix": "zpk_live_abc123...",
    "isTestMode": false,
    "expiresAt": "2025-11-07T00:00:00.000Z"
  }
}
```

#### List API Keys
```http
GET /api/v1/api-keys
Authorization: Bearer <jwt_token>
```

#### Revoke API Key
```http
DELETE /api/v1/api-keys/:id
Authorization: Bearer <jwt_token>
```

### Webhooks

#### Create Webhook
```http
POST /api/v1/webhooks
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "url": "https://yoursite.com/webhooks/zetapay",
  "events": ["payment.created", "payment.completed", "payment.failed"]
}
```

**Events:**
- `payment.created`
- `payment.completed`
- `payment.failed`
- `payment.refunded`

#### List Webhooks
```http
GET /api/v1/webhooks
Authorization: Bearer <jwt_token>
```

#### Delete Webhook
```http
DELETE /api/v1/webhooks/:id
Authorization: Bearer <jwt_token>
```

### Health Check

```http
GET /health
```

---

## Authentication

### JWT Token (Merchant Dashboard)
```http
Authorization: Bearer <token>
```

### API Key (Payment Integration)
```http
X-API-Key: zpk_live_...
```

---

## Payment Flows

### Crypto Payment Flow

1. **Create payment** with `source: "crypto"`
2. **Receive payment details** (crypto amount, address, expiration)
3. **Customer sends crypto** to contract address
4. **Backend monitors** blockchain for transaction
5. **Webhook notification** sent on confirmation

### Stripe Payment Flow

1. **Create payment** with `source: "stripe"`
2. **Receive client secret**
3. **Customer completes** payment on frontend (Stripe Elements)
4. **Confirm payment** via API
5. **Webhook notification** sent

### PayPal Payment Flow

1. **Create payment** with `source: "paypal"`
2. **Receive approval URL**
3. **Redirect customer** to PayPal
4. **Capture payment** after approval
5. **Webhook notification** sent

---

## Webhook Payload

All webhooks receive this format:

```json
{
  "event": "payment.completed",
  "timestamp": "2025-11-07T12:00:00.000Z",
  "data": {
    "paymentId": "uuid",
    "paymentReference": "PAY_...",
    "merchantId": "uuid",
    "amount": "100.00",
    "currency": "USD",
    "status": "completed",
    "orderId": "ORDER_123"
  },
  "signature": "sha256_hmac_signature"
}
```

**Verify signature:**
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

---

## Price Feed Integration

Backend automatically fetches crypto prices from CoinGecko:

```typescript
// Convert $100 USD to ZETA
const { cryptoAmount, exchangeRate } = await convertFiatToCrypto(
  100,
  'usd',
  'ZETA'
);
```

Supported currencies:
- **Crypto**: ZETA, ETH, BTC, USDT, USDC, DAI
- **Fiat**: USD, EUR, GBP, etc.

---

## Error Handling

All errors return:

```json
{
  "success": false,
  "message": "Error description",
  "stack": "..." // Development only
}
```

**HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid token/API key)
- `403` - Forbidden (account suspended)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 attempts per 15 minutes

Override in `.env`:
```env
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Testing

Run tests:

```bash
npm test
```

Run with coverage:

```bash
npm test -- --coverage
```

---

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t zetapay-backend .
docker run -p 3001:3001 --env-file .env zetapay-backend
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001
LOG_LEVEL=warn

# Use production DB
DB_HOST=your-db-host
DB_SSL=true

# Production secrets
STRIPE_SECRET_KEY=sk_live_...
PAYPAL_MODE=production

# Monitoring
SENTRY_DSN=https://...
```

---

## Security Checklist

- [ ] Use strong `JWT_SECRET` (min 32 bytes)
- [ ] Enable SSL/TLS in production
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS properly
- [ ] Rotate API keys regularly
- [ ] Monitor rate limit violations
- [ ] Enable Sentry error tracking
- [ ] Use environment variables (never commit secrets)
- [ ] Enable PostgreSQL SSL in production
- [ ] Implement IP whitelisting for webhooks

---

## Project Structure

```
backend/
├── src/
│   ├── server.ts              # Express app entry point
│   ├── db/
│   │   └── connection.ts      # TypeORM database connection
│   ├── models/                # Database entities
│   │   ├── Merchant.ts
│   │   ├── Payment.ts
│   │   ├── ApiKey.ts
│   │   └── Webhook.ts
│   ├── routes/                # API endpoints
│   │   ├── merchant.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── apiKey.routes.ts
│   │   ├── webhook.routes.ts
│   │   └── health.routes.ts
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── services/              # Business logic
│   │   ├── stripe.ts
│   │   ├── paypal.ts
│   │   └── priceService.ts
│   └── utils/                 # Utilities
│       ├── logger.ts
│       └── crypto.ts
├── logs/                      # Application logs
├── dist/                      # Compiled JavaScript
├── package.json
├── tsconfig.json
└── .env
```

---

## Support

- **Documentation**: `docs/MERCHANT_API.md`
- **Issues**: GitHub Issues
- **Email**: support@zetapay.io

---

## License

MIT License - see LICENSE file
