import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiKey } from './ApiKey';
import { Payment } from './Payment';
import { Webhook } from './Webhook';

export enum MerchantStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export enum KYCStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column()
  businessName!: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: MerchantStatus, default: MerchantStatus.PENDING })
  status!: MerchantStatus;

  @Column({ type: 'enum', enum: KYCStatus, default: KYCStatus.NOT_STARTED })
  kycStatus!: KYCStatus;

  @Column({ nullable: true })
  kycProvider?: string; // 'persona', 'onfido', etc.

  @Column({ nullable: true })
  kycReferenceId?: string;

  @Column({ nullable: true })
  walletAddress?: string; // Merchant's ZetaChain wallet

  @Column({ type: 'jsonb', nullable: true })
  paymentSettings?: {
    acceptedTokens: string[];
    minPaymentAmount?: number;
    maxPaymentAmount?: number;
    autoConvert?: boolean;
    targetCurrency?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  stripeConfig?: {
    accountId?: string;
    onboardingComplete?: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  paypalConfig?: {
    merchantId?: string;
    onboardingComplete?: boolean;
  };

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  // Relations
  @OneToMany(() => ApiKey, (apiKey) => apiKey.merchant)
  apiKeys!: ApiKey[];

  @OneToMany(() => Payment, (payment) => payment.merchant)
  payments!: Payment[];

  @OneToMany(() => Webhook, (webhook) => webhook.merchant)
  webhooks!: Webhook[];
}
