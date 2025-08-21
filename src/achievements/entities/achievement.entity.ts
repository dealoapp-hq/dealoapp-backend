import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AchievementType {
  CERTIFICATION = 'certification',
  BADGE = 'badge',
  MILESTONE = 'milestone',
  AWARD = 'award',
  SPECIALIZATION = 'specialization',
}

export enum AchievementCategory {
  LEARNING = 'learning',
  EARNING = 'earning',
  NETWORKING = 'networking',
  SKILLS = 'skills',
  LEADERSHIP = 'leadership',
  INNOVATION = 'innovation',
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

@Entity('achievements')
@Index(['type'])
@Index(['category'])
@Index(['rarity'])
@Index(['isActive'])
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: AchievementType })
  type: AchievementType;

  @Column({ type: 'enum', enum: AchievementCategory })
  category: AchievementCategory;

  @Column({
    type: 'enum',
    enum: AchievementRarity,
    default: AchievementRarity.COMMON,
  })
  rarity: AchievementRarity;

  @Column({ length: 255, nullable: true })
  icon: string;

  @Column({ length: 255, nullable: true })
  badge: string;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'json', nullable: true })
  criteria: {
    type:
      | 'courses_completed'
      | 'jobs_completed'
      | 'connections_made'
      | 'skills_verified'
      | 'earnings_reached'
      | 'rating_achieved';
    value: number;
    timeframe?: number; // in days
    conditions?: {
      field: string;
      operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
      value: any;
    }[];
  };

  @Column({ type: 'json', nullable: true })
  rewards: {
    points: number;
    badges: string[];
    privileges: string[];
    unlocks: string[];
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @Column({ type: 'int', default: 0 })
  totalEarned: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionRate: number;

  @Column({ type: 'json', nullable: true })
  metadata: {
    issuer?: string;
    validUntil?: Date;
    prerequisites?: string[];
    tags?: string[];
  };

  @ManyToMany(() => User)
  @JoinTable({
    name: 'user_achievements',
    joinColumn: { name: 'achievementId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isRare(): boolean {
    return (
      this.rarity === AchievementRarity.RARE ||
      this.rarity === AchievementRarity.EPIC ||
      this.rarity === AchievementRarity.LEGENDARY
    );
  }

  get isLegendary(): boolean {
    return this.rarity === AchievementRarity.LEGENDARY;
  }

  get rarityMultiplier(): number {
    switch (this.rarity) {
      case AchievementRarity.COMMON:
        return 1;
      case AchievementRarity.UNCOMMON:
        return 2;
      case AchievementRarity.RARE:
        return 5;
      case AchievementRarity.EPIC:
        return 10;
      case AchievementRarity.LEGENDARY:
        return 25;
      default:
        return 1;
    }
  }

  get totalPoints(): number {
    return this.points * this.rarityMultiplier;
  }
}
