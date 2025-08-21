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
import { Post } from './post.entity';

export enum CommentType {
  POST = 'post',
  GIG = 'gig',
  PORTFOLIO = 'portfolio',
  COURSE = 'course',
  JOB = 'job',
  MARKETPLACE = 'marketplace',
}

export enum CommentStatus {
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  DELETED = 'deleted',
  SPAM = 'spam',
}

@Entity('comments')
@Index(['authorId'])
@Index(['contentType'])
@Index(['contentId'])
@Index(['status'])
@Index(['createdAt'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: CommentType })
  contentType: CommentType;

  @Column()
  contentId: string;

  @Column({ type: 'enum', enum: CommentStatus, default: CommentStatus.ACTIVE })
  status: CommentStatus;

  @Column({ type: 'json', nullable: true })
  media: {
    images?: string[];
    videos?: string[];
    files?: string[];
  };

  @Column({ type: 'json', nullable: true })
  mentions: string[]; // user IDs

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @Column({ type: 'int', default: 0 })
  repliesCount: number;

  @Column({ type: 'boolean', default: false })
  isEdited: boolean;

  @Column({ type: 'timestamp', nullable: true })
  editedAt: Date;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ type: 'boolean', default: false })
  isAuthorResponse: boolean; // For business responses

  @Column({ type: 'json', nullable: true })
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    location?: string;
    platform?: string;
  };

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Comment, { nullable: true })
  parentComment: Comment;

  @Column({ nullable: true })
  parentCommentId: string;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies: Comment[];

  @ManyToOne(() => Post, { nullable: true })
  post: Post;

  @Column({ nullable: true })
  postId: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'comment_likes',
    joinColumn: { name: 'commentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  likedBy: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isReply(): boolean {
    return !!this.parentCommentId;
  }

  get isTopLevel(): boolean {
    return !this.parentCommentId;
  }

  get hasMedia(): boolean {
    return !!(
      this.media?.images?.length ||
      this.media?.videos?.length ||
      this.media?.files?.length
    );
  }

  get isHidden(): boolean {
    return this.status === CommentStatus.HIDDEN;
  }

  get isDeleted(): boolean {
    return this.status === CommentStatus.DELETED;
  }

  get isSpam(): boolean {
    return this.status === CommentStatus.SPAM;
  }

  get formattedContent(): string {
    // Process mentions for display
    let content = this.content;

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

  get depth(): number {
    let depth = 0;
    let currentComment: Comment | null = this;

    while (currentComment?.parentComment) {
      depth++;
      currentComment = currentComment.parentComment;
    }

    return depth;
  }
}
