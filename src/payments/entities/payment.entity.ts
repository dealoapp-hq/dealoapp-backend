import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PaymentType {
  COURSE_PURCHASE = 'course_purchase',
  COURSE_CREATION = 'course_creation',
  SUBSCRIPTION = 'subscription',
  CERTIFICATION = 'certification',
  MARKETPLACE_PURCHASE = 'marketplace_purchase',
  WITHDRAWAL = 'withdrawal',
  REFUND = 'refund',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
  PAYPAL = 'paypal',
  CRYPTO = 'crypto',
  WALLET = 'wallet',
}

export enum PaymentProcessor {
  FLUTTERWAVE = 'flutterwave',
  PAYSTACK = 'paystack',
  MONNIFY = 'monnify',
  STRIPE = 'stripe',
  INTERNAL = 'internal',
}

@Entity('payments')
@Index(['userId'])
@Index(['status'])
@Index(['type'])
@Index(['reference'])
@Index(['processor'])
@Index(['createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  reference: string;

  @Column({ type: 'enum', enum: PaymentType })
  type: PaymentType;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentProcessor })
  processor: PaymentProcessor;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'json', nullable: true })
  metadata: {
    courseId?: string;
    courseTitle?: string;
    jobId?: string;
    subscriptionId?: string;
    certificationId?: string;
    marketplaceListingId?: string;
    description?: string;
    gatewayResponse?: any;
    userEmail?: string;
    userPhone?: string;
  };

  @Column({ type: 'json', nullable: true })
  gatewayData: {
    transactionId?: string;
    gateway?: string;
    response?: any;
    authorizationUrl?: string;
    accessCode?: string;
    flwRef?: string; // Flutterwave reference
    paystackRef?: string; // Paystack reference
    monnifyRef?: string; // Monnify reference
    stripePaymentIntentId?: string; // Stripe payment intent
  };

  @Column({ type: 'json', nullable: true })
  customerData: {
    email: string;
    phone?: string;
    name: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
  };

  @Column({ type: 'json', nullable: true })
  bankDetails?: {
    accountNumber?: string;
    accountName?: string;
    bankCode?: string;
    bankName?: string;
  };

  @Column({ type: 'json', nullable: true })
  cardDetails?: {
    last4?: string;
    brand?: string;
    expMonth?: number;
    expYear?: number;
    country?: string;
  };

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ type: 'text', nullable: true })
  refundReason: string;

  @Column({ type: 'boolean', default: false })
  isTest: boolean;

  @Column({ type: 'json', nullable: true })
  webhookData: {
    receivedAt: Date;
    payload: any;
    signature?: string;
    verified: boolean;
  };

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isCompleted(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  get isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  get isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  get isCancelled(): boolean {
    return this.status === PaymentStatus.CANCELLED;
  }

  get isRefunded(): boolean {
    return this.status === PaymentStatus.REFUNDED;
  }

  get netAmount(): number {
    return this.amount - this.fee - this.tax;
  }

  get formattedAmount(): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: this.currency,
    }).format(this.totalAmount);
  }

  get isNigerianProcessor(): boolean {
    return [
      PaymentProcessor.FLUTTERWAVE,
      PaymentProcessor.PAYSTACK,
      PaymentProcessor.MONNIFY,
    ].includes(this.processor);
  }

  get requiresAuthorization(): boolean {
    return !!(
      this.gatewayData?.authorizationUrl &&
      this.status === PaymentStatus.PENDING
    );
  }
}
