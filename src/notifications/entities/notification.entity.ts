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

export enum NotificationType {
  JOB_APPLICATION = 'job_application',
  JOB_AWARDED = 'job_awarded',
  JOB_COMPLETED = 'job_completed',
  COURSE_ENROLLMENT = 'course_enrollment',
  COURSE_COMPLETION = 'course_completion',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_SENT = 'payment_sent',
  MESSAGE_RECEIVED = 'message_received',
  PROFILE_VIEW = 'profile_view',
  ENDORSEMENT_RECEIVED = 'endorsement_received',
  SYSTEM_UPDATE = 'system_update',
  SECURITY_ALERT = 'security_alert',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

@Entity('notifications')
@Index(['userId'])
@Index(['type'])
@Index(['status'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'json', nullable: true })
  data: {
    jobId?: string;
    courseId?: string;
    paymentId?: string;
    messageId?: string;
    senderId?: string;
    amount?: number;
    currency?: string;
    url?: string;
    imageUrl?: string;
    actionUrl?: string;
    actionText?: string;
  };

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: {
    source?: string;
    category?: string;
    tags?: string[];
    expiresAt?: Date;
  };

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  recipient: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isUrgent(): boolean {
    return this.priority === NotificationPriority.URGENT;
  }

  get isHighPriority(): boolean {
    return (
      this.priority === NotificationPriority.HIGH ||
      this.priority === NotificationPriority.URGENT
    );
  }

  get isExpired(): boolean {
    return this.metadata?.expiresAt
      ? new Date() > this.metadata.expiresAt
      : false;
  }

  get hasAction(): boolean {
    return !!(this.data?.actionUrl && this.data?.actionText);
  }
}


