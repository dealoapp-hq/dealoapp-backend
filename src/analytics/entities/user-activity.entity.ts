import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PROFILE_UPDATE = 'profile_update',
  COURSE_VIEW = 'course_view',
  COURSE_ENROLL = 'course_enroll',
  COURSE_COMPLETE = 'course_complete',
  JOB_VIEW = 'job_view',
  JOB_APPLY = 'job_apply',
  JOB_AWARD = 'job_award',
  JOB_COMPLETE = 'job_complete',
  PAYMENT_MADE = 'payment_made',
  PAYMENT_RECEIVED = 'payment_received',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_READ = 'message_read',
  PROFILE_VIEW = 'profile_view',
  SEARCH_PERFORMED = 'search_performed',
  NOTIFICATION_READ = 'notification_read',
  SETTINGS_CHANGED = 'settings_changed',
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
}

@Entity('user_activities')
@Index(['userId'])
@Index(['type'])
@Index(['createdAt'])
@Index(['sessionId'])
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ActivityType })
  type: ActivityType;

  @Column({ length: 255, nullable: true })
  sessionId: string;

  @Column({ type: 'json', nullable: true })
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    deviceType?: DeviceType;
    browser?: string;
    os?: string;
    location?: {
      country?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
    referrer?: string;
    url?: string;
    duration?: number;
    score?: number;
    amount?: number;
    currency?: string;
    targetId?: string;
    targetType?: string;
    searchQuery?: string;
    filters?: any;
  };

  @Column({ type: 'json', nullable: true })
  context: {
    page?: string;
    section?: string;
    action?: string;
    category?: string;
    tags?: string[];
  };

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  // Virtual properties
  get isLoginActivity(): boolean {
    return (
      this.type === ActivityType.LOGIN || this.type === ActivityType.LOGOUT
    );
  }

  get isLearningActivity(): boolean {
    return [
      ActivityType.COURSE_VIEW,
      ActivityType.COURSE_ENROLL,
      ActivityType.COURSE_COMPLETE,
    ].includes(this.type);
  }

  get isJobActivity(): boolean {
    return [
      ActivityType.JOB_VIEW,
      ActivityType.JOB_APPLY,
      ActivityType.JOB_AWARD,
      ActivityType.JOB_COMPLETE,
    ].includes(this.type);
  }

  get isFinancialActivity(): boolean {
    return [ActivityType.PAYMENT_MADE, ActivityType.PAYMENT_RECEIVED].includes(
      this.type,
    );
  }

  get isCommunicationActivity(): boolean {
    return [ActivityType.MESSAGE_SENT, ActivityType.MESSAGE_READ].includes(
      this.type,
    );
  }
}


