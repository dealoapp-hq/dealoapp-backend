import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum JobStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum JobType {
  FIXED_PRICE = 'fixed_price',
  HOURLY = 'hourly',
  MILESTONE = 'milestone',
}

export enum JobCategory {
  WEB_DEVELOPMENT = 'web_development',
  MOBILE_DEVELOPMENT = 'mobile_development',
  DESIGN = 'design',
  WRITING = 'writing',
  MARKETING = 'marketing',
  DATA_ANALYSIS = 'data_analysis',
  AI_ML = 'ai_ml',
  OTHER = 'other',
}

@Entity('jobs')
@Index(['clientId'])
@Index(['status'])
@Index(['category'])
@Index(['budgetMin', 'budgetMax'])
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: JobType, default: JobType.FIXED_PRICE })
  type: JobType;

  @Column({ type: 'enum', enum: JobCategory, default: JobCategory.OTHER })
  category: JobCategory;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.OPEN })
  status: JobStatus;

  @Column({ type: 'json', nullable: true })
  skills: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetMax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'int', nullable: true })
  estimatedHours: number;

  @Column({ type: 'json', nullable: true })
  requirements: string[];

  @Column({ type: 'json', nullable: true })
  deliverables: string[];

  @Column({ type: 'date', nullable: true })
  deadline: Date;

  @Column({ type: 'int', default: 0 })
  proposalsCount: number;

  @Column({ type: 'int', default: 0 })
  viewsCount: number;

  @Column({ type: 'boolean', default: false })
  isUrgent: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'json', nullable: true })
  attachments: string[];

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  additionalInfo: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  client: User;

  @Column()
  clientId: string;

  @ManyToOne(() => User, { nullable: true })
  assignedFreelancer: User;

  @Column({ nullable: true })
  assignedFreelancerId: string;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isAssigned(): boolean {
    return !!this.assignedFreelancerId;
  }

  get isCompleted(): boolean {
    return this.status === JobStatus.COMPLETED;
  }

  get budgetRange(): string {
    if (this.type === JobType.HOURLY) {
      return `$${this.hourlyRate}/hour`;
    }
    if (this.budgetMin && this.budgetMax) {
      return `$${this.budgetMin} - $${this.budgetMax}`;
    }
    if (this.budgetMin) {
      return `$${this.budgetMin}+`;
    }
    return 'Negotiable';
  }

  get isExpired(): boolean {
    if (!this.deadline) return false;
    return new Date() > this.deadline;
  }
}



