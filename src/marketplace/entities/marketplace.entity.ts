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

export enum MarketplaceType {
  SERVICE = 'service',
  GIG = 'gig',
  DIGITAL_PRODUCT = 'digital_product',
  COURSE = 'course',
  TEMPLATE = 'template',
  TOOL = 'tool',
}

export enum MarketplaceStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  SOLD_OUT = 'sold_out',
  ARCHIVED = 'archived',
  SUSPENDED = 'suspended',
}

export enum DeliveryTime {
  ONE_DAY = '1_day',
  THREE_DAYS = '3_days',
  ONE_WEEK = '1_week',
  TWO_WEEKS = '2_weeks',
  ONE_MONTH = '1_month',
  CUSTOM = 'custom',
}

@Entity('marketplace_listings')
@Index(['sellerId'])
@Index(['type'])
@Index(['status'])
@Index(['category'])
@Index(['price'])
@Index(['rating'])
@Index(['createdAt'])
export class MarketplaceListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: MarketplaceType })
  type: MarketplaceType;

  @Column({
    type: 'enum',
    enum: MarketplaceStatus,
    default: MarketplaceStatus.DRAFT,
  })
  status: MarketplaceStatus;

  @Column({ length: 100 })
  category: string;

  @Column({ type: 'json', nullable: true })
  subcategories: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ type: 'boolean', default: false })
  isNegotiable: boolean;

  @Column({ type: 'enum', enum: DeliveryTime, nullable: true })
  deliveryTime: DeliveryTime;

  @Column({ type: 'int', nullable: true })
  customDeliveryDays: number;

  @Column({ type: 'json', nullable: true })
  packages: {
    name: string;
    description: string;
    price: number;
    deliveryTime: DeliveryTime;
    features: string[];
    isPopular: boolean;
  }[];

  @Column({ type: 'json', nullable: true })
  features: string[];

  @Column({ type: 'json', nullable: true })
  requirements: string[];

  @Column({ type: 'json', nullable: true })
  deliverables: string[];

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ type: 'json', nullable: true })
  videos: string[];

  @Column({ type: 'json', nullable: true })
  attachments: string[];

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'json', nullable: true })
  skills: string[];

  @Column({ type: 'int', default: 0 })
  viewsCount: number;

  @Column({ type: 'int', default: 0 })
  favoritesCount: number;

  @Column({ type: 'int', default: 0 })
  ordersCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewsCount: number;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'json', nullable: true })
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };

  @Column({ type: 'json', nullable: true })
  analytics: {
    conversionRate: number;
    averageOrderValue: number;
    customerSatisfaction: number;
    responseTime: number;
  };

  @Column({ type: 'json', nullable: true })
  policies: {
    refundPolicy: string;
    revisionPolicy: string;
    cancellationPolicy: string;
    termsOfService: string;
  };

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  seller: User;

  @Column()
  sellerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isActive(): boolean {
    return this.status === MarketplaceStatus.ACTIVE;
  }

  get isDraft(): boolean {
    return this.status === MarketplaceStatus.DRAFT;
  }

  get hasDiscount(): boolean {
    return !!(this.originalPrice && this.originalPrice > this.price);
  }

  get discountPercentage(): number {
    if (!this.hasDiscount) return 0;
    return Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100,
    );
  }

  get averageRating(): number {
    return this.rating || 0;
  }

  get isPopular(): boolean {
    return this.ordersCount > 10 && this.rating >= 4.5;
  }

  get isTrending(): boolean {
    return this.viewsCount > 100 && this.favoritesCount > 5;
  }
}
