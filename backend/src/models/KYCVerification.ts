import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Merchant } from './Merchant';

export enum KYCProvider {
  PERSONA = 'persona',
  ONFIDO = 'onfido',
  SUMSUB = 'sumsub',
  MANUAL = 'manual',
}

export enum KYCVerificationStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum KYCTier {
  TIER_0 = 'tier_0', // No verification (limited functionality)
  TIER_1 = 'tier_1', // Basic verification (name, email, phone)
  TIER_2 = 'tier_2', // Identity verification (ID document)
  TIER_3 = 'tier_3', // Enhanced verification (ID + proof of address)
}

@Entity('kyc_verifications')
export class KYCVerification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  merchantId!: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchantId' })
  merchant!: Merchant;

  @Column({ type: 'enum', enum: KYCProvider })
  provider!: KYCProvider;

  @Column({ type: 'enum', enum: KYCVerificationStatus, default: KYCVerificationStatus.NOT_STARTED })
  status!: KYCVerificationStatus;

  @Column({ type: 'enum', enum: KYCTier, default: KYCTier.TIER_0 })
  tier!: KYCTier;

  @Column({ nullable: true })
  providerReferenceId?: string; // Persona inquiry ID, Onfido applicant ID, etc.

  @Column({ nullable: true })
  providerCheckId?: string; // Provider's check/verification ID

  // Personal Information
  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ nullable: true })
  nationality?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  // Address Information
  @Column({ type: 'jsonb', nullable: true })
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  // Document Information
  @Column({ type: 'jsonb', nullable: true })
  documents?: Array<{
    type: 'passport' | 'drivers_license' | 'national_id' | 'proof_of_address';
    documentNumber?: string;
    issuingCountry?: string;
    expiryDate?: string;
    verified: boolean;
  }>;

  // Risk Assessment
  @Column({ type: 'integer', default: 0 })
  riskScore!: number; // 0-100

  @Column({ type: 'enum', enum: ['low', 'medium', 'high'], default: 'low' })
  riskLevel!: 'low' | 'medium' | 'high';

  @Column({ type: 'jsonb', nullable: true })
  riskFactors?: string[];

  // AML Screening
  @Column({ default: false })
  pepScreeningPassed!: boolean; // Politically Exposed Person

  @Column({ default: false })
  sanctionsScreeningPassed!: boolean;

  @Column({ default: false })
  adverseMediaScreeningPassed!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  screeningResults?: {
    pepMatches?: number;
    sanctionMatches?: number;
    adverseMediaMatches?: number;
    screenedAt?: Date;
  };

  // Verification Metadata
  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ type: 'jsonb', nullable: true })
  verificationMetadata?: Record<string, any>;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date; // KYC verification expiry (typically 1-2 years)

  @Column({ nullable: true })
  reviewedBy?: string; // Admin user ID

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
