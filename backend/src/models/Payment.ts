import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Merchant } from './Merchant';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  EXPIRED = 'expired',
}

export enum PaymentSource {
  CRYPTO = 'crypto',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  paymentReference!: string; // Unique reference for this payment

  @Column()
  merchantId!: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.payments)
  @JoinColumn({ name: 'merchantId' })
  merchant!: Merchant;

  @Column({ type: 'enum', enum: PaymentSource })
  source!: PaymentSource;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  // Amounts
  @Column({ type: 'decimal', precision: 18, scale: 8 })
  amountCrypto!: string; // Amount in crypto (e.g., ZETA)

  @Column()
  cryptoCurrency!: string; // ZETA, USDT, etc.

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountFiat?: string; // Amount in fiat if converted

  @Column({ nullable: true })
  fiatCurrency?: string; // USD, EUR, etc.

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  exchangeRate?: string; // Crypto to fiat rate at payment time

  // Blockchain data
  @Column({ nullable: true })
  txHash?: string; // ZetaChain transaction hash

  @Column({ nullable: true })
  fromAddress?: string; // Payer's wallet address

  @Column({ nullable: true })
  toAddress?: string; // Payment contract or merchant address

  @Column({ type: 'integer', nullable: true })
  blockNumber?: number;

  @Column({ type: 'timestamp', nullable: true })
  blockTimestamp?: Date;

  // Payment processor data (Stripe/PayPal)
  @Column({ nullable: true })
  processorPaymentId?: string; // Stripe payment intent ID or PayPal order ID

  @Column({ nullable: true })
  processorCustomerId?: string;

  @Column({ type: 'jsonb', nullable: true })
  processorMetadata?: Record<string, any>;

  // Customer info
  @Column({ nullable: true })
  customerEmail?: string;

  @Column({ type: 'jsonb', nullable: true })
  customerMetadata?: {
    name?: string;
    phone?: string;
    address?: any;
  };

  // Order details
  @Column({ nullable: true })
  orderId?: string; // Merchant's order ID

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;

  // Fees
  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  platformFee?: string;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  networkFee?: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  failureReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
