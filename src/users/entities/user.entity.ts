import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  FREELANCER = 'freelancer',
  CLIENT = 'client',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum UserType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  AGENCY = 'agency',
}

@Entity('users')
@Index(['email'])
@Index(['role'])
@Index(['status'])
@Index(['location'])
@Index(['skills'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255, nullable: true })
  phone: string;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({ type: 'enum', enum: UserType, default: UserType.INDIVIDUAL })
  userType: UserType;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @Column({ length: 255, nullable: true })
  coverPhoto: string;

  @Column({ length: 255, nullable: true })
  headline: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 255, nullable: true })
  website: string;

  @Column({ type: 'json', nullable: true })
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    portfolio?: string;
    youtube?: string;
  };

  @Column({ type: 'json', nullable: true })
  skills: string[];

  @Column({ type: 'json', nullable: true })
  verifiedSkills: {
    skill: string;
    verifiedBy: string;
    verifiedAt: Date;
    endorsements: number;
  }[];

  @Column({ type: 'json', nullable: true })
  certifications: {
    name: string;
    issuer: string;
    issuedAt: Date;
    expiresAt?: Date;
    credentialId: string;
    url: string;
  }[];

  @Column({ type: 'json', nullable: true })
  experience: {
    title: string;
    company: string;
    location: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    description: string;
  }[];

  @Column({ type: 'json', nullable: true })
  education: {
    degree: string;
    institution: string;
    field: string;
    startDate: Date;
    endDate?: Date;
    gpa?: number;
    description: string;
  }[];

  @Column({ type: 'json', nullable: true })
  achievements: {
    title: string;
    description: string;
    type: 'certification' | 'badge' | 'milestone' | 'award';
    earnedAt: Date;
    icon: string;
    points: number;
  }[];

  @Column({ type: 'json', nullable: true })
  endorsements: {
    skill: string;
    endorsedBy: string;
    endorsedAt: Date;
    message?: string;
  }[];

  @Column({ type: 'json', nullable: true })
  recommendations: {
    from: string;
    message: string;
    relationship: string;
    createdAt: Date;
    isVerified: boolean;
  }[];

  @Column({ type: 'json', nullable: true })
  portfolio: {
    title: string;
    description: string;
    url: string;
    image: string;
    tags: string[];
    featured: boolean;
  }[];

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @Column({ type: 'int', default: 0 })
  completedJobs: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ type: 'int', default: 0 })
  totalHoursWorked: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'json', nullable: true })
  availability: {
    available: boolean;
    hoursPerWeek: number;
    timezone: string;
    preferredSchedule: string[];
  };

  @Column({ type: 'json', nullable: true })
  preferences: {
    jobTypes: string[];
    projectSizes: string[];
    industries: string[];
    languages: string[];
    timezone: string;
  };

  @Column({ type: 'json', nullable: true })
  badges: {
    name: string;
    description: string;
    icon: string;
    earnedAt: Date;
    category: string;
  }[];

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'int', default: 0 })
  level: number;

  @Column({ type: 'json', nullable: true })
  stats: {
    coursesCompleted: number;
    certificatesEarned: number;
    jobsCompleted: number;
    totalEarnings: number;
    clientSatisfaction: number;
    responseTime: number;
    onTimeDelivery: number;
  };

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date;

  @Column({ type: 'json', nullable: true })
  settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    jobAlerts: boolean;
    privacyLevel: 'public' | 'connections' | 'private';
    profileVisibility: 'public' | 'connections' | 'private';
  };

  @ManyToMany(() => User)
  @JoinTable({
    name: 'user_connections',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'connectionId', referencedColumnName: 'id' },
  })
  connections: User[];

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  phoneVerifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  get isUserVerified(): boolean {
    return this.isVerified;
  }

  get profileCompleteness(): number {
    let score = 0;
    const fields = [
      'avatar',
      'headline',
      'bio',
      'location',
      'skills',
      'experience',
      'education',
      'portfolio',
      'website',
    ];

    fields.forEach((field) => {
      if (
        this[field] &&
        (Array.isArray(this[field]) ? this[field].length > 0 : true)
      ) {
        score += 100 / fields.length;
      }
    });

    return Math.round(score);
  }
}
