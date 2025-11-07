# KYC/AML Integration Complete

## Overview
Complete KYC/AML compliance system has been implemented for ZetaPay, providing identity verification, document validation, and real-time transaction monitoring capabilities.

## Features Implemented

### 1. Identity Verification (KYC)
- **Dual Provider Support**: Persona + Onfido for redundancy
- **4-Tier Verification Levels**:
  - TIER_0: No verification required (limited functionality)
  - TIER_1: Basic information (email, phone)
  - TIER_2: Identity document verification (passport, driver's license)
  - TIER_3: Enhanced verification with background checks
- **Document Support**: Passport, driver's license, national ID, proof of address
- **Expiration Tracking**: 2-year KYC validity with re-verification alerts

### 2. AML Transaction Monitoring
- **Real-time Monitoring**: Automated checks on every payment
- **4 Automated Checks**:
  1. High-value transaction alert (≥$10,000)
  2. Velocity breach (≥10 transactions in 24 hours)
  3. Blacklist screening (wallet address check)
  4. Daily volume limit (≥$50,000)
- **Alert System**: 8 alert types with 4 severity levels (low, medium, high, critical)
- **Risk Scoring**: 0-100 merchant risk score calculation
- **Auto-resolution**: Automatic closure of low-risk alerts >30 days old

### 3. Compliance Dashboard
- **Merchant Risk Profiles**: Real-time risk assessment
- **Alert Management**: Review, resolve, or escalate alerts
- **Compliance Reports**: Payment volume, alert summary, KYC status
- **Screening Results**: PEP, sanctions, adverse media checks

## Files Created

### Models (Database Entities)
1. **`backend/src/models/KYCVerification.ts`** (170 lines)
   - Stores merchant identity verification records
   - Fields: personal info, address, documents, risk assessment, AML screening
   - Relations: ManyToOne with Merchant

2. **`backend/src/models/TransactionAlert.ts`** (90 lines)
   - Stores AML transaction alerts
   - Fields: type, severity, status, details, risk score, review data
   - Relations: ManyToOne with Merchant and Payment

### Services (Business Logic)
3. **`backend/src/services/persona.ts`** (130 lines)
   - Persona API integration for identity verification
   - Functions: createInquiry, getInquiry, getVerification, resumeInquiry, verifyWebhookSignature
   - API Version: 2023-01-05

4. **`backend/src/services/onfido.ts`** (140 lines)
   - Onfido API integration for document verification
   - Functions: createApplicant, getApplicant, createSDKToken, createCheck, getCheck, listChecks, verifyWebhookSignature
   - API Version: v3.6

5. **`backend/src/services/aml.ts`** (280 lines)
   - AML transaction monitoring service
   - Functions: monitorPayment, calculateMerchantRiskScore, checkBlacklist, screenMerchant, autoResolveAlerts, generateComplianceReport
   - Configurable thresholds via environment variables

### API Routes
6. **`backend/src/routes/kyc.routes.ts`** (410 lines)
   - Endpoints:
     - POST `/api/v1/kyc/initiate` - Start KYC verification
     - GET `/api/v1/kyc/status` - Check verification status
     - POST `/api/v1/kyc/webhook/persona` - Persona webhook receiver
     - POST `/api/v1/kyc/webhook/onfido` - Onfido webhook receiver
     - POST `/api/v1/kyc/screen` - Run AML screening

7. **`backend/src/routes/compliance.routes.ts`** (220 lines)
   - Endpoints:
     - GET `/api/v1/compliance/dashboard` - Compliance overview
     - GET `/api/v1/compliance/alerts` - List transaction alerts
     - GET `/api/v1/compliance/alerts/:id` - Get alert details
     - PUT `/api/v1/compliance/alerts/:id/resolve` - Resolve alert
     - PUT `/api/v1/compliance/alerts/:id/escalate` - Escalate alert
     - GET `/api/v1/compliance/risk-score` - Get merchant risk score

## Database Updates
- Added `KYCVerification` and `TransactionAlert` entities to `backend/src/db/connection.ts`
- Database will auto-sync in development mode
- For production, run migrations: `npm run migrate`

## Environment Variables Added
```bash
# Persona Identity Verification
PERSONA_API_KEY=persona_sandbox_your_api_key
PERSONA_TEMPLATE_ID=itmpl_your_template_id
PERSONA_WEBHOOK_SECRET=your_persona_webhook_secret
PERSONA_ENVIRONMENT=sandbox

# Onfido Document Verification
ONFIDO_API_TOKEN=api_sandbox.your_onfido_token
ONFIDO_API_BASE=https://api.us.onfido.com/v3.6
ONFIDO_WEBHOOK_TOKEN=your_onfido_webhook_token

# AML Transaction Monitoring
AML_HIGH_VALUE_THRESHOLD=10000
AML_DAILY_LIMIT=50000
AML_VELOCITY_COUNT=10
AML_VELOCITY_WINDOW=86400000

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## Integration Points

### Payment Flow Integration
- **Automatic Monitoring**: AML checks run automatically on payment creation
- **Non-blocking**: Payment creation succeeds even if AML check fails (logged for review)
- **Alert Generation**: Alerts created automatically for violations

### Webhook Integration
- **Persona Webhooks**: Receive inquiry completion/approval events
- **Onfido Webhooks**: Receive check completion events
- **Signature Verification**: HMAC-SHA256 webhook authentication
- **Automatic Status Updates**: Merchant KYC status updated on approval

## API Usage Examples

### 1. Initiate KYC Verification (Persona)
```bash
POST /api/v1/kyc/initiate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "provider": "persona",
  "tier": "tier_2",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "phoneNumber": "+1234567890"
}
```

Response:
```json
{
  "success": true,
  "message": "KYC verification initiated",
  "data": {
    "kycId": "uuid",
    "provider": "persona",
    "tier": "tier_2",
    "status": "pending",
    "providerData": {
      "id": "inq_123456",
      "type": "inquiry",
      "attributes": {
        "status": "pending",
        "reference_id": "merchant_id"
      }
    }
  }
}
```

### 2. Check KYC Status
```bash
GET /api/v1/kyc/status
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "provider": "persona",
    "status": "approved",
    "tier": "tier_2",
    "riskScore": 15,
    "riskLevel": "low",
    "submittedAt": "2024-01-15T10:00:00Z",
    "approvedAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2026-01-15T10:30:00Z",
    "pepScreeningPassed": true,
    "sanctionsScreeningPassed": true,
    "adverseMediaScreeningPassed": true
  }
}
```

### 3. Get Compliance Dashboard
```bash
GET /api/v1/compliance/dashboard
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "merchantId": "uuid",
    "totalPayments": 150,
    "totalVolume": 45000,
    "averagePaymentAmount": 300,
    "openAlerts": 2,
    "criticalAlerts": 0,
    "riskScore": 25,
    "kycStatus": "approved",
    "lastUpdated": "2024-01-20T15:00:00Z"
  }
}
```

### 4. List Transaction Alerts
```bash
GET /api/v1/compliance/alerts?status=open&severity=high&limit=20
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "uuid",
        "type": "HIGH_VALUE_TRANSACTION",
        "severity": "HIGH",
        "status": "OPEN",
        "description": "Transaction exceeds high-value threshold",
        "details": {
          "amount": 15000,
          "currency": "USD",
          "threshold": 10000
        },
        "riskScore": 60,
        "createdAt": "2024-01-20T14:00:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 20,
      "offset": 0
    }
  }
}
```

### 5. Resolve Alert
```bash
PUT /api/v1/compliance/alerts/:id/resolve
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "resolution": "Verified legitimate business transaction with supporting documentation",
  "notes": "Customer provided invoice and purchase order confirmation"
}
```

Response:
```json
{
  "success": true,
  "message": "Alert resolved successfully",
  "data": {
    "id": "uuid",
    "status": "RESOLVED",
    "resolution": "Verified legitimate business transaction...",
    "reviewedAt": "2024-01-20T15:00:00Z",
    "reviewedBy": "merchant_id"
  }
}
```

## Testing

### 1. Test KYC Flow
```bash
# 1. Start backend server
cd backend
npm run dev

# 2. Register merchant
curl -X POST http://localhost:3001/api/v1/merchants/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "businessName": "Test Business Inc"
  }'

# 3. Login and get JWT token
curl -X POST http://localhost:3001/api/v1/merchants/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# 4. Initiate KYC
curl -X POST http://localhost:3001/api/v1/kyc/initiate \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "persona",
    "tier": "tier_2",
    "firstName": "John",
    "lastName": "Doe"
  }'

# 5. Check status
curl -X GET http://localhost:3001/api/v1/kyc/status \
  -H "Authorization: Bearer <jwt_token>"
```

### 2. Test AML Monitoring
```bash
# Create high-value payment (triggers alert)
curl -X POST http://localhost:3001/api/v1/payments/create \
  -H "X-API-Key: <api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 15000,
    "currency": "USD",
    "source": "stripe",
    "customerEmail": "customer@example.com"
  }'

# Check for alerts
curl -X GET http://localhost:3001/api/v1/compliance/alerts \
  -H "Authorization: Bearer <jwt_token>"

# Get risk score
curl -X GET http://localhost:3001/api/v1/compliance/risk-score \
  -H "Authorization: Bearer <jwt_token>"
```

## Webhook Setup

### Persona Webhooks
1. Go to Persona Dashboard > Webhooks
2. Add webhook URL: `https://your-domain.com/api/v1/kyc/webhook/persona`
3. Subscribe to events:
   - `inquiry.completed`
   - `inquiry.approved`
   - `inquiry.declined`
4. Copy webhook secret to `.env` as `PERSONA_WEBHOOK_SECRET`

### Onfido Webhooks
1. Go to Onfido Dashboard > Webhooks
2. Add webhook URL: `https://your-domain.com/api/v1/kyc/webhook/onfido`
3. Subscribe to events:
   - `check.completed`
   - `check.withdrawn`
4. Copy webhook token to `.env` as `ONFIDO_WEBHOOK_TOKEN`

## Configuration Recommendations

### Development
- Use sandbox environments for both providers
- Set low AML thresholds for testing ($100 high-value, $500 daily)
- Enable detailed logging

### Production
- Switch to production API keys
- Use recommended thresholds ($10,000 high-value, $50,000 daily)
- Enable Sentry error tracking
- Set up monitoring alerts for critical AML violations
- Implement manual review process for escalated alerts

## Security Considerations

1. **API Key Protection**: Store provider API keys in environment variables
2. **Webhook Verification**: Always verify webhook signatures (HMAC-SHA256)
3. **Data Privacy**: PII stored encrypted, comply with GDPR/CCPA
4. **Access Control**: Only authenticated merchants can access their own data
5. **Audit Trail**: All alert actions logged with timestamps and reviewer IDs

## Compliance Notes

- **KYC Expiration**: Merchants must re-verify every 2 years
- **Alert Response**: High/critical alerts should be reviewed within 24 hours
- **Record Retention**: Keep KYC/AML records for 5 years (regulatory requirement)
- **Sanctions Screening**: Integrate with ComplyAdvantage or Dow Jones for production
- **Blacklist Updates**: Integrate with Chainalysis or Elliptic for real-time wallet screening

## Next Steps

1. **Setup Provider Accounts**:
   - Register for Persona sandbox account
   - Register for Onfido sandbox account
   - Get API keys and add to `.env`

2. **Test Integration**:
   - Run backend server
   - Test KYC initiation flow
   - Create test payments
   - Verify alert generation

3. **Build Frontend**:
   - Create KYC verification UI component
   - Add compliance dashboard to merchant portal
   - Implement alert review interface

4. **Production Setup**:
   - Upgrade to production API keys
   - Configure webhook endpoints
   - Set up monitoring and alerting
   - Train support team on alert review process

## Support

For issues or questions:
- Persona Docs: https://docs.withpersona.com/
- Onfido Docs: https://documentation.onfido.com/
- ZetaPay Issues: https://github.com/Parthkk90/ZetaPay/issues

---

**Task 7 Status**: ✅ KYC/AML Implementation Complete
**Files Created**: 7 files (~1,640 lines of code)
**API Endpoints**: 10 new endpoints
**Next Task**: Task 10 - Integration Tests or Task 18 - Merchant Onboarding UI
