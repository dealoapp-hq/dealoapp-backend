import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Job } from './job.entity';

export enum ProposalStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired',
}

@Entity('proposals')
@Index(['jobId'])
@Index(['freelancerId'])
@Index(['status'])
@Index(['createdAt'])
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  coverLetter: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  proposedAmount: number;

  @Column({ type: 'int', nullable: true })
  estimatedDays: number;

  @Column({ type: 'json', nullable: true })
  milestones: {
    title: string;
    description: string;
    amount: number;
    dueDate: Date;
  }[];

  @Column({ type: 'json', nullable: true })
  attachments: string[];

  @Column({ type: 'json', nullable: true })
  portfolio: {
    title: string;
    description: string;
    url: string;
    image: string;
  }[];

  @Column({
    type: 'enum',
    enum: ProposalStatus,
    default: ProposalStatus.PENDING,
  })
  status: ProposalStatus;

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

  @Column({ type: 'int', default: 0 })
  viewsCount: number;

  @Column({ type: 'json', nullable: true })
  aiScore: {
    relevanceScore: number;
    skillMatchScore: number;
    experienceScore: number;
    overallScore: number;
    recommendations: string[];
  };

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
    return this.status === ProposalStatus.PENDING;
  }

  get isAccepted(): boolean {
    return this.status === ProposalStatus.ACCEPTED;
  }

  get isRejected(): boolean {
    return this.status === ProposalStatus.REJECTED;
  }
}
