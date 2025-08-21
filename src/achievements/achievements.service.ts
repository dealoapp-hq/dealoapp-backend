import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Achievement,
  AchievementType,
  AchievementCategory,
} from './entities/achievement.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createAchievementDto: any): Promise<Achievement> {
    const achievement = this.achievementRepository.create(createAchievementDto);
    const result = await this.achievementRepository.save(achievement);
    return Array.isArray(result) ? result[0] : result;
  }

  async findAll(filters: any = {}): Promise<Achievement[]> {
    const queryBuilder =
      this.achievementRepository.createQueryBuilder('achievement');

    if (filters.type) {
      queryBuilder.andWhere('achievement.type = :type', { type: filters.type });
    }

    if (filters.category) {
      queryBuilder.andWhere('achievement.category = :category', {
        category: filters.category,
      });
    }

    if (filters.rarity) {
      queryBuilder.andWhere('achievement.rarity = :rarity', {
        rarity: filters.rarity,
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('achievement.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Achievement> {
    const achievement = await this.achievementRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!achievement) {
      throw new NotFoundException('Achievement not found');
    }

    return achievement;
  }

  async checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['achievements'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const allAchievements = await this.achievementRepository.find({
      where: { isActive: true },
    });

    const newlyAwarded: Achievement[] = [];

    for (const achievement of allAchievements) {
      // Skip if user already has this achievement
      if (user.achievements?.some((a) => a.title === achievement.title)) {
        continue;
      }

      // Check if user meets criteria
      if (await this.meetsCriteria(user, achievement)) {
        // Award achievement
        user.achievements = user.achievements || [];
        user.achievements.push({
          title: achievement.title,
          description: achievement.description,
          type: achievement.type as
            | 'certification'
            | 'badge'
            | 'milestone'
            | 'award',
          earnedAt: new Date(),
          icon: achievement.icon || '',
          points: achievement.totalPoints,
        });

        // Add points
        user.points += achievement.totalPoints;

        // Update level based on points
        user.level = Math.floor(user.points / 1000) + 1;

        await this.userRepository.save(user);
        newlyAwarded.push(achievement);
      }
    }

    return newlyAwarded;
  }

  async getUserAchievements(userId: string): Promise<any[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['achievements'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.achievements || [];
  }

  async getAchievementProgress(userId: string): Promise<any[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const allAchievements = await this.achievementRepository.find({
      where: { isActive: true },
    });

    const userAchievements = await this.getUserAchievements(userId);
    const userAchievementIds = userAchievements.map((a) => a.id);

    return allAchievements.map((achievement) => {
      const isEarned = userAchievementIds.includes(achievement.id);
      const progress = this.calculateProgress(user, achievement);

      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        type: achievement.type,
        category: achievement.category,
        rarity: achievement.rarity,
        points: achievement.points,
        icon: achievement.icon,
        isEarned,
        progress,
        earnedAt: isEarned
          ? userAchievements.find((a) => a.id === achievement.id)?.createdAt
          : null,
      };
    });
  }

  async getLeaderboard(
    category?: AchievementCategory,
    limit: number = 10,
  ): Promise<any[]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.achievements', 'achievements')
      .where('user.status = :status', { status: 'active' });

    if (category) {
      queryBuilder.andWhere('achievements.category = :category', { category });
    }

    const users = await queryBuilder
      .orderBy('user.points', 'DESC')
      .addOrderBy('user.level', 'DESC')
      .limit(limit)
      .getMany();

    return users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      points: user.points,
      level: user.level,
      achievementsCount: user.achievements?.length || 0,
      isVerified: user.isVerified,
    }));
  }

  async getAchievementStats(): Promise<any> {
    const totalAchievements = await this.achievementRepository.count({
      where: { isActive: true },
    });

    const achievementsByCategory = await this.achievementRepository
      .createQueryBuilder('achievement')
      .select('achievement.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('achievement.isActive = :isActive', { isActive: true })
      .groupBy('achievement.category')
      .getRawMany();

    const achievementsByRarity = await this.achievementRepository
      .createQueryBuilder('achievement')
      .select('achievement.rarity', 'rarity')
      .addSelect('COUNT(*)', 'count')
      .where('achievement.isActive = :isActive', { isActive: true })
      .groupBy('achievement.rarity')
      .getRawMany();

    return {
      totalAchievements,
      byCategory: achievementsByCategory,
      byRarity: achievementsByRarity,
    };
  }

  private async meetsCriteria(
    user: User,
    achievement: Achievement,
  ): Promise<boolean> {
    if (!achievement.criteria) return false;

    const { type, value, timeframe, conditions } = achievement.criteria;

    switch (type) {
      case 'courses_completed':
        return (user.stats?.coursesCompleted || 0) >= value;

      case 'jobs_completed':
        return (user.stats?.jobsCompleted || 0) >= value;

      case 'connections_made':
        // This would need to be calculated from connections table
        return false;

      case 'skills_verified':
        return (user.verifiedSkills?.length || 0) >= value;

      case 'earnings_reached':
        return (user.stats?.totalEarnings || 0) >= value;

      case 'rating_achieved':
        return (user.rating || 0) >= value;

      default:
        return false;
    }
  }

  private calculateProgress(user: User, achievement: Achievement): number {
    if (!achievement.criteria) return 0;

    const { type, value } = achievement.criteria;
    let currentValue = 0;

    switch (type) {
      case 'courses_completed':
        currentValue = user.stats?.coursesCompleted || 0;
        break;

      case 'jobs_completed':
        currentValue = user.stats?.jobsCompleted || 0;
        break;

      case 'skills_verified':
        currentValue = user.verifiedSkills?.length || 0;
        break;

      case 'earnings_reached':
        currentValue = user.stats?.totalEarnings || 0;
        break;

      case 'rating_achieved':
        currentValue = user.rating || 0;
        break;

      default:
        return 0;
    }

    return Math.min(Math.round((currentValue / value) * 100), 100);
  }

  async createDefaultAchievements(): Promise<void> {
    const defaultAchievements = [
      {
        title: 'First Steps',
        description: 'Complete your first course',
        type: AchievementType.MILESTONE,
        category: AchievementCategory.LEARNING,
        rarity: 'common',
        points: 50,
        criteria: {
          type: 'courses_completed',
          value: 1,
        },
      },
      {
        title: 'Knowledge Seeker',
        description: 'Complete 5 courses',
        type: AchievementType.BADGE,
        category: AchievementCategory.LEARNING,
        rarity: 'uncommon',
        points: 100,
        criteria: {
          type: 'courses_completed',
          value: 5,
        },
      },
      {
        title: 'First Gig',
        description: 'Complete your first job',
        type: AchievementType.MILESTONE,
        category: AchievementCategory.EARNING,
        rarity: 'common',
        points: 100,
        criteria: {
          type: 'jobs_completed',
          value: 1,
        },
      },
      {
        title: 'Top Performer',
        description: 'Achieve a 4.5+ rating',
        type: AchievementType.AWARD,
        category: AchievementCategory.SKILLS,
        rarity: 'rare',
        points: 200,
        criteria: {
          type: 'rating_achieved',
          value: 4.5,
        },
      },
      {
        title: 'Network Builder',
        description: 'Make 10 connections',
        type: AchievementType.BADGE,
        category: AchievementCategory.NETWORKING,
        rarity: 'uncommon',
        points: 150,
        criteria: {
          type: 'connections_made',
          value: 10,
        },
      },
    ];

    for (const achievementData of defaultAchievements) {
      const existing = await this.achievementRepository.findOne({
        where: { title: achievementData.title },
      });

      if (!existing) {
        await this.create(achievementData);
      }
    }
  }
}
