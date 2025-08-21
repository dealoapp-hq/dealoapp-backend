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
import { Job } from '../../jobs/entities/job.entity';

export enum EscrowStatus {
  PENDING = 'pending',
  FUNDED = 'funded',
  IN_PROGRESS = 'in_progress',
  CLIENT_REVIEW = 'client_review',
  FREELANCER_REVIEW = 'freelancer_review',
  DISPUTED = 'disputed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISPUTED = 'disputed',
}

@Entity('escrows')
@Index(['jobId'])
@Index(['clientId'])
@Index(['freelancerId'])
@Index(['status'])
@Index(['createdAt'])
export class Escrow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  reference: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  job: Job;

  @Column()
  jobId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  client: User;

  @Column()
  clientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  freelancer: User;

  @Column()
  freelancerId: string;

  @Column({ type: 'enum', enum: EscrowStatus, default: EscrowStatus.PENDING })
  status: EscrowStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  freelancerAmount: number; // 70% of total

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platformFee: number; // 30% of total

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @Column({ type: 'timestamp', nullable: true })
  fundedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  releasedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  // Client Review
  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })
  clientReviewStatus: ReviewStatus;

  @Column({ type: 'int', nullable: true })
  clientRating: number;

  @Column({ type: 'text', nullable: true })
  clientReview: string;

  @Column({ type: 'timestamp', nullable: true })
  clientReviewedAt: Date;

  @Column({ type: 'json', nullable: true })
  clientReviewData: {
    quality: number;
    communication: number;
    timeliness: number;
    professionalism: number;
    overall: number;
    comments: string;
    wouldRecommend: boolean;
  };

  // Freelancer Review
  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })
  freelancerReviewStatus: ReviewStatus;

  @Column({ type: 'int', nullable: true })
  freelancerRating: number;

  @Column({ type: 'text', nullable: true })
  freelancerReview: string;

  @Column({ type: 'timestamp', nullable: true })
  freelancerReviewedAt: Date;

  @Column({ type: 'json', nullable: true })
  freelancerReviewData: {
    payment: number;
    communication: number;
    clarity: number;
    fairness: number;
    overall: number;
    comments: string;
    wouldWorkAgain: boolean;
  };

  // Dispute Resolution
  @Column({ type: 'boolean', default: false })
  isDisputed: boolean;

  @Column({ type: 'text', nullable: true })
  disputeReason: string;

  @Column({ type: 'timestamp', nullable: true })
  disputedAt: Date;

  @Column({ type: 'json', nullable: true })
  disputeData: {
    initiator: 'client' | 'freelancer';
    reason: string;
    evidence: string[];
    resolution: string;
    resolvedBy: string;
    resolvedAt: Date | null;
  };

  // Milestones and Deliverables
  @Column({ type: 'json', nullable: true })
  milestones: {
    id: string;
    title: string;
    description: string;
    amount: number;
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'approved';
    completedAt: Date;
    approvedAt: Date;
  }[];

  @Column({ type: 'json', nullable: true })
  deliverables: {
    id: string;
    title: string;
    description: string;
    fileUrl: string;
    submittedAt: Date;
    approvedAt: Date;
    rejectedAt: Date;
    rejectionReason: string;
  }[];

  // Communication and Updates
  @Column({ type: 'json', nullable: true })
  updates: {
    id: string;
    type: 'milestone' | 'deliverable' | 'communication' | 'issue';
    title: string;
    description: string;
    from: 'client' | 'freelancer';
    createdAt: Date;
    attachments: string[];
  }[];

  // Payment Tracking
  @Column({ type: 'json', nullable: true })
  paymentHistory: {
    id: string;
    type: 'escrow_funded' | 'milestone_released' | 'final_payment' | 'refund';
    amount: number;
    description: string;
    processedAt: Date;
    transactionId: string;
  }[];

  // Metadata
  @Column({ type: 'json', nullable: true })
  metadata: {
    jobTitle: string;
    jobDescription: string;
    agreedTerms: string;
    specialConditions: string[];
    platformFeePercentage: number;
    freelancerPercentage: number;
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  isTest: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isFunded(): boolean {
    return this.status === EscrowStatus.FUNDED;
  }

  get isInProgress(): boolean {
    return this.status === EscrowStatus.IN_PROGRESS;
  }

  get isCompleted(): boolean {
    return this.status === EscrowStatus.COMPLETED;
  }

  get isInDispute(): boolean {
    return this.status === EscrowStatus.DISPUTED;
  }

  get canBeReleased(): boolean {
    return (
      this.status === EscrowStatus.IN_PROGRESS &&
      this.clientReviewStatus === ReviewStatus.APPROVED &&
      this.freelancerReviewStatus === ReviewStatus.APPROVED
    );
  }

  get bothPartiesReviewed(): boolean {
    return (
      this.clientReviewStatus !== ReviewStatus.PENDING &&
      this.freelancerReviewStatus !== ReviewStatus.PENDING
    );
  }

  get averageRating(): number {
    const ratings: number[] = [];
    if (this.clientRating) ratings.push(this.clientRating);
    if (this.freelancerRating) ratings.push(this.freelancerRating);

    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }

  get daysSinceCreated(): number {
    const now = new Date();
    const created = new Date(this.createdAt);
    return Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  get isOverdue(): boolean {
    if (!this.job?.deadline) return false;
    return new Date() > this.job.deadline;
  }

  get formattedTotalAmount(): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: this.currency,
    }).format(this.totalAmount);
  }

  get formattedFreelancerAmount(): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: this.currency,
    }).format(this.freelancerAmount);
  }

  get formattedPlatformFee(): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: this.currency,
    }).format(this.platformFee);
  }
}
