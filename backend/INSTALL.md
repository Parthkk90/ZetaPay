# ZetaPay Backend - Quick Start Guide

## Installation Steps

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages including:
- express, cors, helmet
- typeorm, pg, mongoose
- stripe, axios
- bcryptjs, jsonwebtoken
- winston, morgan
- And all TypeScript dev dependencies

### 3. Setup PostgreSQL Database

#### Option A: Local PostgreSQL
```bash
# Create database
createdb zetapay

# Or using psql
psql -U postgres
CREATE DATABASE zetapay;
\q
```

#### Option B: Docker PostgreSQL
```bash
docker run --name zetapay-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=zetapay \
  -p 5432:5432 \
  -d postgres:14
```

### 4. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values
# At minimum, configure:
# - DB_PASSWORD
# - JWT_SECRET
# - STRIPE_SECRET_KEY (optional, for testing)
# - PAYPAL_CLIENT_ID (optional, for testing)
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

### 6. Test the API

```bash
# Health check
curl http://localhost:3001/health

# Should return:
# {"success":true,"status":"healthy","timestamp":"..."}
```

---

## First Steps After Installation

### 1. Register a Merchant Account

```bash
curl -X POST http://localhost:3001/api/v1/merchants/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "businessName": "Test Business"
  }'
```

Save the `token` from the response.

### 2. Create an API Key

```bash
curl -X POST http://localhost:3001/api/v1/api-keys \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test API Key",
    "isTestMode": true
  }'
```

**⚠️ IMPORTANT:** Save the `key` from the response - it won't be shown again!

### 3. Create a Test Payment

```bash
curl -X POST http://localhost:3001/api/v1/payments/create \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10.00,
    "currency": "USD",
    "source": "crypto",
    "orderId": "TEST_001",
    "description": "Test payment"
  }'
```

---

## Common Issues & Solutions

### Issue: "Cannot find module 'typeorm'"
**Solution:** Run `npm install` again

### Issue: "Database connection failed"
**Solution:** 
1. Check PostgreSQL is running: `pg_isready`
2. Verify `.env` database credentials
3. Ensure database exists: `psql -l | grep zetapay`

### Issue: "JWT_SECRET is not defined"
**Solution:** Add `JWT_SECRET=...` to `.env` file

### Issue: Port 3001 already in use
**Solution:** 
1. Change `PORT=3002` in `.env`
2. Or kill existing process: `lsof -ti:3001 | xargs kill`

---

## Development Workflow

### File Watching (Auto-reload)
```bash
npm run dev
```

### TypeScript Checking
```bash
npm run lint
```

### Code Formatting
```bash
npm run format
```

### Build for Production
```bash
npm run build
npm start
```

---

## Next Steps

1. **Read the API Documentation**: `README.md`
2. **Test Payment Flows**: Try Stripe/PayPal integrations
3. **Setup Webhooks**: Configure webhook endpoints
4. **Connect Frontend**: Integrate with browser extension

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Check TypeScript |
| `npm run format` | Format code |

---

**Ready to go!** 🚀 Server is running at `http://localhost:3001`
