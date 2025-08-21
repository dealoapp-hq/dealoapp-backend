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

export enum CourseType {
  AI_GENERATED = 'ai_generated',
  INSTRUCTOR_LED = 'instructor_led',
  YOUTUBE_BASED = 'youtube_based',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  SUSPENDED = 'suspended',
}

export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

@Entity('courses')
@Index(['slug'], { unique: true })
@Index(['instructorId'])
@Index(['status'])
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 500 })
  description: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({
    type: 'enum',
    enum: CourseType,
    default: CourseType.INSTRUCTOR_LED,
  })
  type: CourseType;

  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.DRAFT })
  status: CourseStatus;

  @Column({ type: 'enum', enum: CourseLevel, default: CourseLevel.BEGINNER })
  level: CourseLevel;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'json', nullable: true })
  skills: string[];

  @Column({ length: 255, nullable: true })
  thumbnail: string;

  @Column({ length: 255, nullable: true })
  videoUrl: string;

  @Column({ type: 'int', default: 0 })
  duration: number; // in minutes

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  originalPrice: number;

  @Column({ type: 'boolean', default: false })
  isFree: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'int', default: 0 })
  enrolledStudents: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @Column({ type: 'json', nullable: true })
  curriculum: {
    sections: Array<{
      title: string;
      lessons: Array<{
        title: string;
        type: 'video' | 'quiz' | 'assignment' | 'text';
        duration?: number;
        content?: string;
        videoUrl?: string;
        quizId?: string;
      }>;
    }>;
  };

  @Column({ type: 'json', nullable: true })
  requirements: string[];

  @Column({ type: 'json', nullable: true })
  learningOutcomes: string[];

  @Column({ type: 'json', nullable: true })
  certificates: {
    enabled: boolean;
    criteria: {
      minScore?: number;
      completeAllLessons?: boolean;
    };
  };

  // AI-specific fields
  @Column({ type: 'json', nullable: true })
  aiConfig: {
    sourceType?: 'youtube' | 'text' | 'custom';
    sourceUrl?: string;
    prompt?: string;
    model?: string;
  };

  @Column({ type: 'json', nullable: true })
  quizQuestions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  instructor: User;

  @Column()
  instructorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  // Virtual properties
  get isPublished(): boolean {
    return this.status === CourseStatus.PUBLISHED;
  }

  get hasDiscount(): boolean {
    return this.originalPrice > this.price;
  }

  get discountPercentage(): number {
    if (this.originalPrice === 0) return 0;
    return Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100,
    );
  }
}



