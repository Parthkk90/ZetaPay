import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Merchant } from './Merchant';
import { Payment } from './Payment';

export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column()
  merchantId: string;

  @Column()
  customerId: string;

  @Column()
  customerEmail: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ type: 'text', nullable: true })
  customerAddress: string;

  @Column('decimal', { precision: 18, scale: 8 })
  subtotal: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  tax: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  discount: number;

  @Column('decimal', { precision: 18, scale: 8 })
  total: number;

  @Column()
  currency: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ type: 'timestamp' })
  issueDate: Date;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'jsonb' })
  items: InvoiceItem[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  terms: string;

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}
