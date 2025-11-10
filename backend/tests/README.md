# Integration Test Suite

Integration tests for ZetaPay backend API.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Test Database**
   Create a PostgreSQL database for testing:
   ```sql
   CREATE DATABASE zetapay_test;
   ```

3. **Configure Environment**
   Copy `.env.test` and adjust if needed:
   ```bash
   cp .env.test .env.test.local
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## Test Structure

- `setup.ts` - Test database connection and utilities
- `integration/payment.test.ts` - Payment API tests
- `integration/analytics.test.ts` - Analytics API tests

## Test Coverage

### Payment Tests
- ✅ Create crypto payment with default token
- ✅ Create crypto payment with specific token
- ✅ Reject unaccepted tokens
- ✅ Validate required fields
- ✅ Get payment details
- ✅ List payments with pagination
- ✅ Filter payments by status

### Analytics Tests
- ✅ Analytics overview (total, success rate, volume)
- ✅ Payment trends by day
- ✅ Token distribution breakdown
- ✅ Revenue metrics with growth
- ✅ Top customers by spending
- ✅ Conversion rate calculation

## Notes

- Tests use a separate test database that is dropped and recreated on each run
- External services (SendGrid, Stripe, PayPal) are mocked/disabled in tests
- Each test file sets up its own test data in `beforeAll`
- Database is cleared between individual tests with `beforeEach`
