import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AppDataSource } from '../db/connection';
import { KYCVerification, KYCProvider, KYCVerificationStatus, KYCTier } from '../models/KYCVerification';
import { Merchant, KYCStatus, MerchantStatus } from '../models/Merchant';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as personaService from '../services/persona';
import * as onfidoService from '../services/onfido';
import * as amlService from '../services/aml';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/kyc/initiate
 * Start KYC verification process
 */
router.post(
  '/initiate',
  authenticate,
  [
    body('provider').isIn(['persona', 'onfido']),
    body('tier').optional().isIn(['tier_1', 'tier_2', 'tier_3']),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('dateOfBirth').optional().isISO8601(),
    body('phoneNumber').optional().trim(),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const {
        provider,
        tier = KYCTier.TIER_2,
        firstName,
        lastName,
        dateOfBirth,
        phoneNumber,
      } = req.body;

      const kycRepo = AppDataSource.getRepository(KYCVerification);
      const merchantRepo = AppDataSource.getRepository(Merchant);

      // Check if KYC already exists
      let kyc = await kycRepo.findOne({
        where: { merchantId: merchant.id },
        order: { createdAt: 'DESC' },
      });

      // Create new KYC record if none exists or previous is complete
      if (!kyc || kyc.status === KYCVerificationStatus.APPROVED || kyc.status === KYCVerificationStatus.REJECTED) {
        kyc = kycRepo.create({
          merchantId: merchant.id,
          provider: provider as KYCProvider,
          tier: tier as KYCTier,
          status: KYCVerificationStatus.PENDING,
          firstName,
          lastName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          phoneNumber,
        });
      }

      // Initiate verification with chosen provider
      let providerData: any;

      if (provider === 'persona') {
        // Create Persona inquiry
        providerData = await personaService.createInquiry({
          referenceId: merchant.id,
          redirectUri: `${process.env.FRONTEND_URL}/kyc/complete`,
          fields: {
            nameFirst: firstName,
            nameLast: lastName,
            emailAddress: merchant.email,
            phoneNumber,
          },
        });

        kyc.providerReferenceId = providerData.id;
      } else if (provider === 'onfido') {
        // Create Onfido applicant
        const applicant = await onfidoService.createApplicant({
          firstName: firstName || merchant.businessName.split(' ')[0],
          lastName: lastName || merchant.businessName.split(' ').slice(1).join(' '),
          email: merchant.email,
          dob: dateOfBirth,
        });

        kyc.providerReferenceId = applicant.id;

        // Generate SDK token for embedded flow
        const sdkToken = await onfidoService.createSDKToken(applicant.id);
        providerData = {
          applicantId: applicant.id,
          sdkToken: sdkToken.token,
        };
      }

      kyc.submittedAt = new Date();
      await kycRepo.save(kyc);

      // Update merchant KYC status
      merchant.kycStatus = KYCStatus.PENDING;
      merchant.kycProvider = provider;
      merchant.kycReferenceId = kyc.providerReferenceId;
      await merchantRepo.save(merchant);

      logger.info(`KYC verification initiated for merchant ${merchant.id} via ${provider}`);

      res.status(201).json({
        success: true,
        message: 'KYC verification initiated',
        data: {
          kycId: kyc.id,
          provider: kyc.provider,
          tier: kyc.tier,
          status: kyc.status,
          providerData,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/kyc/status
 * Get current KYC verification status
 */
router.get('/status', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const merchant = req.merchant!;
    const kycRepo = AppDataSource.getRepository(KYCVerification);

    const kyc = await kycRepo.findOne({
      where: { merchantId: merchant.id },
      order: { createdAt: 'DESC' },
    });

    if (!kyc) {
      return res.json({
        success: true,
        data: {
          status: 'not_started',
          tier: 'tier_0',
        },
      });
    }

    // Fetch latest status from provider if pending
    if (kyc.status === KYCVerificationStatus.PENDING && kyc.providerReferenceId) {
      try {
        if (kyc.provider === KYCProvider.PERSONA) {
          const inquiry = await personaService.getInquiry(kyc.providerReferenceId);
          // Update status based on Persona response
          if (inquiry.status === 'completed') {
            kyc.status = KYCVerificationStatus.IN_REVIEW;
          }
        } else if (kyc.provider === KYCProvider.ONFIDO) {
          const checks = await onfidoService.listChecks(kyc.providerReferenceId);
          if (checks.length > 0) {
            const latestCheck = checks[0];
            if (latestCheck.status === 'complete') {
              kyc.status = latestCheck.result === 'clear'
                ? KYCVerificationStatus.APPROVED
                : KYCVerificationStatus.REJECTED;
              kyc.reviewedAt = new Date();
            }
          }
        }
        await kycRepo.save(kyc);
      } catch (error) {
        logger.error('Failed to fetch KYC status from provider:', error);
      }
    }

    res.json({
      success: true,
      data: {
        id: kyc.id,
        provider: kyc.provider,
        status: kyc.status,
        tier: kyc.tier,
        riskScore: kyc.riskScore,
        riskLevel: kyc.riskLevel,
        submittedAt: kyc.submittedAt,
        reviewedAt: kyc.reviewedAt,
        approvedAt: kyc.approvedAt,
        expiresAt: kyc.expiresAt,
        pepScreeningPassed: kyc.pepScreeningPassed,
        sanctionsScreeningPassed: kyc.sanctionsScreeningPassed,
        adverseMediaScreeningPassed: kyc.adverseMediaScreeningPassed,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/kyc/webhook/persona
 * Persona webhook receiver
 */
router.post('/webhook/persona', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['persona-signature'] as string;
    const webhookSecret = process.env.PERSONA_WEBHOOK_SECRET || '';

    // Verify signature
    const isValid = personaService.verifyWebhookSignature(
      JSON.stringify(req.body),
      signature,
      webhookSecret
    );

    if (!isValid) {
      logger.warn('Invalid Persona webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    logger.info(`Received Persona webhook: ${event.type}`);

    // Handle different event types
    if (event.type === 'inquiry.completed' || event.type === 'inquiry.approved') {
      const inquiryId = event.data.id;
      const kycRepo = AppDataSource.getRepository(KYCVerification);
      const merchantRepo = AppDataSource.getRepository(Merchant);

      const kyc = await kycRepo.findOne({
        where: { providerReferenceId: inquiryId },
      });

      if (kyc) {
        kyc.status = event.type === 'inquiry.approved'
          ? KYCVerificationStatus.APPROVED
          : KYCVerificationStatus.IN_REVIEW;
        kyc.reviewedAt = new Date();

        if (kyc.status === KYCVerificationStatus.APPROVED) {
          kyc.approvedAt = new Date();
          // Set expiration (2 years)
          kyc.expiresAt = new Date();
          kyc.expiresAt.setFullYear(kyc.expiresAt.getFullYear() + 2);

          // Update merchant status
          const merchant = await merchantRepo.findOne({ where: { id: kyc.merchantId } });
          if (merchant) {
            merchant.kycStatus = KYCStatus.APPROVED;
            merchant.status = 'active';
            await merchantRepo.save(merchant);
          }
        }

        await kycRepo.save(kyc);
        logger.info(`Updated KYC status for inquiry ${inquiryId}`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Persona webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/v1/kyc/webhook/onfido
 * Onfido webhook receiver
 */
router.post('/webhook/onfido', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-sha2-signature'] as string;
    const webhookToken = process.env.ONFIDO_WEBHOOK_TOKEN || '';

    // Verify signature
    const isValid = onfidoService.verifyWebhookSignature(
      JSON.stringify(req.body),
      signature,
      webhookToken
    );

    if (!isValid) {
      logger.warn('Invalid Onfido webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    logger.info(`Received Onfido webhook: ${event.action}`);

    // Handle check completion
    if (event.action === 'check.completed') {
      const checkId = event.object.id;
      const kycRepo = AppDataSource.getRepository(KYCVerification);
      const merchantRepo = AppDataSource.getRepository(Merchant);

      const check = await onfidoService.getCheck(checkId);
      const kyc = await kycRepo.findOne({
        where: { providerCheckId: checkId },
      });

      if (kyc) {
        kyc.status = check.result === 'clear'
          ? KYCVerificationStatus.APPROVED
          : KYCVerificationStatus.REJECTED;
        kyc.reviewedAt = new Date();

        if (kyc.status === KYCVerificationStatus.APPROVED) {
          kyc.approvedAt = new Date();
          kyc.expiresAt = new Date();
          kyc.expiresAt.setFullYear(kyc.expiresAt.getFullYear() + 2);

          const merchant = await merchantRepo.findOne({ where: { id: kyc.merchantId } });
          if (merchant) {
            merchant.kycStatus = KYCStatus.APPROVED;
            merchant.status = MerchantStatus.ACTIVE;
            await merchantRepo.save(merchant);
          }
        }

        await kycRepo.save(kyc);
        logger.info(`Updated KYC status for check ${checkId}`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Onfido webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/v1/kyc/screen
 * Run AML screening on merchant
 */
router.post(
  '/screen',
  authenticate,
  [
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('dateOfBirth').optional().isISO8601(),
    body('nationality').optional().trim(),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchant = req.merchant!;
      const { firstName, lastName, dateOfBirth, nationality } = req.body;

      // Run AML screening
      const screeningResults = await amlService.screenMerchant(
        firstName,
        lastName,
        dateOfBirth ? new Date(dateOfBirth) : undefined,
        nationality
      );

      // Update KYC record
      const kycRepo = AppDataSource.getRepository(KYCVerification);
      const kyc = await kycRepo.findOne({
        where: { merchantId: merchant.id },
        order: { createdAt: 'DESC' },
      });

      if (kyc) {
        kyc.pepScreeningPassed = screeningResults.pepMatches === 0;
        kyc.sanctionsScreeningPassed = screeningResults.sanctionMatches === 0;
        kyc.adverseMediaScreeningPassed = screeningResults.adverseMediaMatches === 0;
        kyc.screeningResults = {
          ...screeningResults,
          screenedAt: new Date(),
        };

        // Calculate risk score based on screening
        let riskScore = kyc.riskScore || 0;
        riskScore += screeningResults.pepMatches * 20;
        riskScore += screeningResults.sanctionMatches * 30;
        riskScore += screeningResults.adverseMediaMatches * 10;
        kyc.riskScore = Math.min(riskScore, 100);

        if (kyc.riskScore > 70) {
          kyc.riskLevel = 'high';
        } else if (kyc.riskScore > 40) {
          kyc.riskLevel = 'medium';
        } else {
          kyc.riskLevel = 'low';
        }

        await kycRepo.save(kyc);
      }

      res.json({
        success: true,
        data: {
          screeningResults,
          allClear: screeningResults.pepMatches === 0 &&
                    screeningResults.sanctionMatches === 0 &&
                    screeningResults.adverseMediaMatches === 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
