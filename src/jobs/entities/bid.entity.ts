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
import { Job } from './job.entity';

export enum BidStatus {
  ACTIVE = 'active',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired',
}

export enum BidType {
  FIXED_PRICE = 'fixed_price',
  HOURLY = 'hourly',
  MILESTONE = 'milestone',
}

@Entity('bids')
@Index(['jobId'])
@Index(['freelancerId'])
@Index(['status'])
@Index(['amount'])
@Index(['createdAt'])
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: BidType, default: BidType.FIXED_PRICE })
  type: BidType;

  @Column({ type: 'int', nullable: true })
  estimatedHours: number;

  @Column({ type: 'int', nullable: true })
  estimatedDays: number;

  @Column({ type: 'text' })
  proposal: string;

  @Column({ type: 'json', nullable: true })
  milestones: {
    title: string;
    description: string;
    amount: number;
    dueDate: Date;
    deliverables: string[];
  }[];

  @Column({ type: 'json', nullable: true })
  portfolio: {
    title: string;
    description: string;
    url: string;
    image: string;
    relevance: number;
  }[];

  @Column({ type: 'json', nullable: true })
  attachments: string[];

  @Column({ type: 'enum', enum: BidStatus, default: BidStatus.ACTIVE })
  status: BidStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  withdrawnAt: Date;

  @Column({ type: 'boolean', default: false })
  isHighlighted: boolean;

  @Column({ type: 'boolean', default: false })
  isFastDelivery: boolean;

  @Column({ type: 'boolean', default: false })
  isUnlimitedRevisions: boolean;

  @Column({ type: 'int', default: 0 })
  revisionCount: number;

  @Column({ type: 'json', nullable: true })
  aiScore: {
    relevanceScore: number;
    skillMatchScore: number;
    experienceScore: number;
    pricingScore: number;
    overallScore: number;
    recommendations: string[];
  };

  @Column({ type: 'json', nullable: true })
  clientFeedback: {
    rating: number;
    comment: string;
    category: 'communication' | 'quality' | 'timeline' | 'value';
  };

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  clientRating: number;

  @Column({ type: 'text', nullable: true })
  clientComment: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  job: Job;

  @Column()
  jobId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  freelancer: User;

  @Column()
  freelancerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isActive(): boolean {
    return this.status === BidStatus.ACTIVE;
  }

  get isAccepted(): boolean {
    return this.status === BidStatus.ACCEPTED;
  }

  get isRejected(): boolean {
    return this.status === BidStatus.REJECTED;
  }

  get totalAmount(): number {
    if (this.type === BidType.HOURLY && this.estimatedHours) {
      return this.amount * this.estimatedHours;
    }
    return this.amount;
  }

  get averageRating(): number {
    return this.clientRating || 0;
  }
}
