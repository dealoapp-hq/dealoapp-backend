import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'role',
        'status',
        'rating',
        'totalReviews',
        'completedJobs',
        'totalEarnings',
        'isVerified',
        'avatar',
        'createdAt',
      ],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.findById(userId);

    // Update allowed fields
    if (updateProfileDto.firstName) {
      user.firstName = updateProfileDto.firstName;
    }
    if (updateProfileDto.lastName) {
      user.lastName = updateProfileDto.lastName;
    }
    if (updateProfileDto.bio) {
      user.bio = updateProfileDto.bio;
    }
    if (updateProfileDto.location) {
      user.location = updateProfileDto.location;
    }
    if (updateProfileDto.country) {
      user.country = updateProfileDto.country;
    }
    if (updateProfileDto.skills) {
      user.skills = updateProfileDto.skills;
    }
    if (updateProfileDto.socialLinks) {
      user.socialLinks = {
        ...user.socialLinks,
        ...updateProfileDto.socialLinks,
      };
    }
    if (updateProfileDto.avatar) {
      user.avatar = updateProfileDto.avatar;
    }

    // Check if profile is complete
    // Profile completeness is calculated as a getter in the entity

    return this.userRepository.save(user);
  }

  async updateRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.findById(userId);
    user.role = role;
    return this.userRepository.save(user);
  }

  async updateStatus(userId: string, status: UserStatus): Promise<User> {
    const user = await this.findById(userId);
    user.status = status;
    return this.userRepository.save(user);
  }

  async verifyUser(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.isVerified = true;
    user.status = UserStatus.ACTIVE;
    user.emailVerifiedAt = new Date();
    return this.userRepository.save(user);
  }

  async updateRating(userId: string, rating: number): Promise<User> {
    const user = await this.findById(userId);

    // Calculate new average rating
    const totalRating = user.rating * user.totalReviews + rating;
    user.totalReviews += 1;
    user.rating = totalRating / user.totalReviews;

    return this.userRepository.save(user);
  }

  async incrementCompletedJobs(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.completedJobs += 1;
    return this.userRepository.save(user);
  }

  async updateEarnings(userId: string, amount: number): Promise<User> {
    const user = await this.findById(userId);
    user.totalEarnings += amount;
    return this.userRepository.save(user);
  }

  async searchUsers(query: string, filters?: any): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (query) {
      queryBuilder.where(
        '(user.firstName LIKE :query OR user.lastName LIKE :query OR user.email LIKE :query)',
        { query: `%${query}%` },
      );
    }

    if (filters?.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.skills) {
      queryBuilder.andWhere('JSON_CONTAINS(user.skills, :skills)', {
        skills: JSON.stringify(filters.skills),
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('user.status = :status', {
        status: filters.status,
      });
    }

    return queryBuilder
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.role',
        'user.status',
        'user.rating',
        'user.totalReviews',
        'user.completedJobs',
        'user.totalEarnings',
        'user.isVerified',
        'user.avatar',
        'user.skills',
        'user.location',
        'user.country',
      ])
      .getMany();
  }

  private isProfileComplete(user: User): boolean {
    return !!(
      user.firstName &&
      user.lastName &&
      user.email &&
      user.bio &&
      user.location &&
      user.country &&
      user.skills?.length > 0
    );
  }

  async getTopFreelancers(limit: number = 10): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.FREELANCER, status: UserStatus.ACTIVE },
      order: { rating: 'DESC', completedJobs: 'DESC' },
      take: limit,
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'rating',
        'totalReviews',
        'completedJobs',
        'totalEarnings',
        'isVerified',
        'avatar',
        'skills',
        'location',
        'country',
      ],
    });
  }

  async getTopInstructors(limit: number = 10): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.INSTRUCTOR, status: UserStatus.ACTIVE },
      order: { rating: 'DESC' },
      take: limit,
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'rating',
        'totalReviews',
        'isVerified',
        'avatar',
        'skills',
        'location',
        'country',
      ],
    });
  }
}
