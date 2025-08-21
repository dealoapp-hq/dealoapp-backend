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

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  LINK = 'link',
  PORTFOLIO = 'portfolio',
  ACHIEVEMENT = 'achievement',
  COURSE_COMPLETION = 'course_completion',
  JOB_COMPLETION = 'job_completion',
}

export enum PostVisibility {
  PUBLIC = 'public',
  CONNECTIONS = 'connections',
  PRIVATE = 'private',
}

@Entity('posts')
@Index(['authorId'])
@Index(['type'])
@Index(['visibility'])
@Index(['createdAt'])
@Index(['isPublished'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: PostType, default: PostType.TEXT })
  type: PostType;

  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  visibility: PostVisibility;

  @Column({ type: 'json', nullable: true })
  media: {
    images?: string[];
    videos?: string[];
    thumbnail?: string;
    duration?: number; // for videos
  };

  @Column({ type: 'json', nullable: true })
  link: {
    url: string;
    title?: string;
    description?: string;
    thumbnail?: string;
  };

  @Column({ type: 'json', nullable: true })
  portfolio: {
    title: string;
    description: string;
    image: string;
    url?: string;
    tags: string[];
  };

  @Column({ type: 'json', nullable: true })
  achievement: {
    title: string;
    description: string;
    icon: string;
    points: number;
    rarity: string;
  };

  @Column({ type: 'json', nullable: true })
  courseCompletion: {
    courseId: string;
    courseTitle: string;
    instructorName: string;
    completionDate: Date;
    certificateUrl?: string;
  };

  @Column({ type: 'json', nullable: true })
  jobCompletion: {
    jobId: string;
    jobTitle: string;
    clientName: string;
    completionDate: Date;
    rating: number;
    earnings: number;
  };

  @Column({ type: 'json', nullable: true })
  hashtags: string[];

  @Column({ type: 'json', nullable: true })
  mentions: string[]; // user IDs

  @Column({ type: 'json', nullable: true })
  location: {
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @Column({ type: 'int', default: 0 })
  sharesCount: number;

  @Column({ type: 'int', default: 0 })
  viewsCount: number;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @Column({ type: 'boolean', default: false })
  isEdited: boolean;

  @Column({ type: 'timestamp', nullable: true })
  editedAt: Date;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'json', nullable: true })
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @Column({ type: 'json', nullable: true })
  analytics: {
    engagementRate: number;
    reach: number;
    impressions: number;
    clickThroughRate: number;
  };

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Post, { nullable: true })
  parentPost: Post;

  @Column({ nullable: true })
  parentPostId: string;

  @OneToMany(() => Post, (post) => post.parentPost)
  replies: Post[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'post_likes',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  likedBy: User[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'post_shares',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  sharedBy: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isReply(): boolean {
    return !!this.parentPostId;
  }

  get isOriginalPost(): boolean {
    return !this.parentPostId;
  }

  get hasMedia(): boolean {
    return !!(this.media?.images?.length || this.media?.videos?.length);
  }

  get isVideo(): boolean {
    return this.type === PostType.VIDEO;
  }

  get isImage(): boolean {
    return this.type === PostType.IMAGE;
  }

  get isLink(): boolean {
    return this.type === PostType.LINK;
  }

  get isPortfolio(): boolean {
    return this.type === PostType.PORTFOLIO;
  }

  get isAchievement(): boolean {
    return this.type === PostType.ACHIEVEMENT;
  }

  get engagementRate(): number {
    if (this.viewsCount === 0) return 0;
    return Math.round(
      ((this.likesCount + this.commentsCount + this.sharesCount) /
        this.viewsCount) *
        100,
    );
  }

  get formattedContent(): string {
    // Process hashtags and mentions for display
    let content = this.content;

    // Convert hashtags to clickable links
    this.hashtags?.forEach((tag) => {
      const regex = new RegExp(`#${tag}\\b`, 'g');
      content = content.replace(
        regex,
        `<a href="/hashtag/${tag}" class="hashtag">#${tag}</a>`,
      );
    });

    // Convert mentions to clickable links
    this.mentions?.forEach((mention) => {
      const regex = new RegExp(`@${mention}\\b`, 'g');
      content = content.replace(
        regex,
        `<a href="/user/${mention}" class="mention">@${mention}</a>`,
      );
    });

    return content;
  }
}
