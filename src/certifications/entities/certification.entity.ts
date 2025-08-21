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
import { Course } from '../../courses/entities/course.entity';

export enum CertificationStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export enum CertificationType {
  COURSE_COMPLETION = 'course_completion',
  SKILL_ASSESSMENT = 'skill_assessment',
  PROFESSIONAL_CERTIFICATION = 'professional_certification',
  MICRO_CREDENTIAL = 'micro_credential',
}

@Entity('certifications')
@Index(['userId'])
@Index(['courseId'])
@Index(['status'])
@Index(['certificationNumber'])
@Index(['issuedAt'])
export class Certification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  certificationNumber: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: CertificationType })
  type: CertificationType;

  @Column({
    type: 'enum',
    enum: CertificationStatus,
    default: CertificationStatus.PENDING,
  })
  status: CertificationStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  examScore: number;

  @Column({ type: 'int', nullable: true })
  passingScore: number;

  @Column({ type: 'int', nullable: true })
  maxScore: number;

  @Column({ type: 'json', nullable: true })
  examResults: {
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number; // in minutes
    sections: {
      name: string;
      score: number;
      maxScore: number;
    }[];
  };

  @Column({ type: 'json', nullable: true })
  skills: string[];

  @Column({ type: 'json', nullable: true })
  competencies: {
    skill: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    score: number;
  }[];

  @Column({ type: 'date', nullable: true })
  validUntil: Date;

  @Column({ type: 'timestamp', nullable: true })
  issuedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date;

  @Column({ type: 'text', nullable: true })
  revocationReason: string;

  @Column({ type: 'json', nullable: true })
  certificateData: {
    templateId: string;
    customFields: Record<string, any>;
    design: {
      primaryColor: string;
      secondaryColor: string;
      logo: string;
      watermark: string;
    };
  };

  @Column({ type: 'json', nullable: true })
  aiValidation: {
    examIntegrity: number; // 0-100
    plagiarismScore: number; // 0-100
    timeAnomalies: boolean;
    suspiciousActivity: string[];
    validationNotes: string;
  };

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'text', nullable: true })
  verificationNotes: string;

  @Column({ type: 'json', nullable: true })
  metadata: {
    issuer: string;
    accreditingBody?: string;
    cpeCredits?: number;
    industry?: string;
    tags?: string[];
  };

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  course: Course;

  @Column()
  courseId: string;

  @ManyToOne(() => User, { nullable: true })
  instructor: User;

  @Column({ nullable: true })
  instructorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isActive(): boolean {
    return (
      this.status === CertificationStatus.PASSED &&
      (!this.validUntil || this.validUntil > new Date())
    );
  }

  get isExpired(): boolean {
    return this.validUntil && this.validUntil <= new Date();
  }

  get scorePercentage(): number {
    if (!this.examScore || !this.maxScore) return 0;
    return Math.round((this.examScore / this.maxScore) * 100);
  }

  get passed(): boolean {
    return this.status === CertificationStatus.PASSED;
  }

  get certificateUrl(): string {
    return `/certificates/${this.certificationNumber}`;
  }

  get verificationUrl(): string {
    return `/verify/${this.certificationNumber}`;
  }
}
