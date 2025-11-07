import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Merchant } from './Merchant';

export enum WebhookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FAILED = 'failed',
}

export enum WebhookEvent {
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
}

@Entity('webhooks')
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  merchantId!: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.webhooks)
  @JoinColumn({ name: 'merchantId' })
  merchant!: Merchant;

  @Column()
  url!: string;

  @Column({ type: 'jsonb' })
  events!: WebhookEvent[]; // Events this webhook listens to

  @Column({ type: 'enum', enum: WebhookStatus, default: WebhookStatus.ACTIVE })
  status!: WebhookStatus;

  @Column()
  secret!: string; // For signature verification

  @Column({ type: 'integer', default: 0 })
  failureCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggeredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSuccessAt?: Date;

  @Column({ nullable: true })
  lastError?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
