import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Merchant } from './Merchant';

export enum ApiKeyStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  merchantId!: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.apiKeys)
  @JoinColumn({ name: 'merchantId' })
  merchant!: Merchant;

  @Column({ unique: true })
  key!: string; // The actual API key (hashed)

  @Column({ unique: true })
  keyPrefix!: string; // First 8 chars for display (e.g., "zpk_live_abc123...")

  @Column()
  name!: string; // User-friendly name

  @Column({ type: 'enum', enum: ApiKeyStatus, default: ApiKeyStatus.ACTIVE })
  status!: ApiKeyStatus;

  @Column({ type: 'boolean', default: false })
  isTestMode!: boolean; // Live vs Test key

  @Column({ type: 'jsonb', nullable: true })
  permissions?: string[]; // ['payments:read', 'payments:write', 'webhooks:write']

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  @Column({ type: 'integer', default: 0 })
  usageCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
