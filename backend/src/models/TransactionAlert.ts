import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Merchant } from './Merchant';
import { Payment } from './Payment';

export enum AlertType {
  HIGH_VALUE_TRANSACTION = 'high_value_transaction',
  VELOCITY_BREACH = 'velocity_breach',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  BLACKLIST_MATCH = 'blacklist_match',
  SANCTIONS_MATCH = 'sanctions_match',
  GEOGRAPHIC_ANOMALY = 'geographic_anomaly',
  UNUSUAL_ACTIVITY = 'unusual_activity',
  CHARGEBACK = 'chargeback',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
  ESCALATED = 'escalated',
}

@Entity('transaction_alerts')
export class TransactionAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => Merchant, { nullable: true })
  @JoinColumn({ name: 'merchantId' })
  merchant?: Merchant;

  @Column({ nullable: true })
  paymentId?: string;

  @ManyToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: 'paymentId' })
  payment?: Payment;

  @Column({ type: 'enum', enum: AlertType })
  type!: AlertType;

  @Column({ type: 'enum', enum: AlertSeverity })
  severity!: AlertSeverity;

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.OPEN })
  status!: AlertStatus;

  @Column()
  description!: string;

  @Column({ type: 'jsonb' })
  details!: {
    amount?: number;
    currency?: string;
    threshold?: number;
    velocity?: {
      count: number;
      timeWindow: string;
      threshold: number;
    };
    pattern?: string;
    matchedEntity?: string;
    location?: {
      ip: string;
      country: string;
      city?: string;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  riskIndicators?: string[];

  @Column({ type: 'integer', default: 0 })
  riskScore!: number; // 0-100

  @Column({ default: false })
  autoResolved!: boolean;

  @Column({ nullable: true })
  reviewedBy?: string; // Admin user ID

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
