import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  VerificationToken,
  TokenType,
  TokenStatus,
} from './entities/verification-token.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationToken)
    private readonly verificationTokenRepository: Repository<VerificationToken>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async createVerificationToken(
    userId: string,
    email: string,
    type: TokenType,
    metadata?: any,
  ): Promise<VerificationToken> {
    // Invalidate any existing tokens of the same type for this user
    await this.invalidateExistingTokens(userId, type);

    const token = this.generateToken();
    const expiresAt = this.getExpiryTime(type);

    const verificationToken = this.verificationTokenRepository.create({
      token,
      type,
      userId,
      email,
      expiresAt,
      metadata,
    });

    return this.verificationTokenRepository.save(verificationToken);
  }

  async verifyToken(
    token: string,
    type: TokenType,
  ): Promise<VerificationToken> {
    const verificationToken = await this.verificationTokenRepository.findOne({
      where: { token, type },
    });

    if (!verificationToken) {
      throw new NotFoundException('Invalid verification token');
    }

    if (verificationToken.status !== TokenStatus.PENDING) {
      throw new BadRequestException('Token has already been used or expired');
    }

    if (verificationToken.isExpired) {
      // Mark as expired
      verificationToken.status = TokenStatus.EXPIRED;
      await this.verificationTokenRepository.save(verificationToken);
      throw new BadRequestException('Verification token has expired');
    }

    return verificationToken;
  }

  async useToken(token: string, type: TokenType): Promise<VerificationToken> {
    const verificationToken = await this.verifyToken(token, type);

    // Mark token as used
    verificationToken.status = TokenStatus.USED;
    verificationToken.usedAt = new Date();

    return this.verificationTokenRepository.save(verificationToken);
  }

  async sendEmailVerification(
    userId: string,
    email: string,
    name: string,
  ): Promise<boolean> {
    const token = await this.createVerificationToken(
      userId,
      email,
      TokenType.EMAIL_VERIFICATION,
    );

    const verificationUrl = `${this.configService.get('APP_URL')}/verify-email?token=${token.token}`;
    const expiresIn = this.getExpiryTimeString(TokenType.EMAIL_VERIFICATION);

    return this.emailService.sendEmailVerification(email, {
      name,
      verificationUrl,
      expiresIn,
    });
  }

  async sendPasswordReset(email: string, name: string): Promise<boolean> {
    // Find user by email
    const user = await this.findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return true;
    }

    const token = await this.createVerificationToken(
      user.id,
      email,
      TokenType.PASSWORD_RESET,
    );

    const resetUrl = `${this.configService.get('APP_URL')}/reset-password?token=${token.token}`;
    const expiresIn = this.getExpiryTimeString(TokenType.PASSWORD_RESET);

    return this.emailService.sendPasswordReset(email, {
      name,
      resetUrl,
      expiresIn,
    });
  }

  async verifyEmail(token: string): Promise<boolean> {
    const verificationToken = await this.useToken(
      token,
      TokenType.EMAIL_VERIFICATION,
    );

    // Update user's email verification status
    await this.updateUserEmailVerification(verificationToken.userId);

    return true;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const verificationToken = await this.useToken(
      token,
      TokenType.PASSWORD_RESET,
    );

    // Update user's password
    await this.updateUserPassword(verificationToken.userId, newPassword);

    return true;
  }

  async resendVerificationEmail(
    userId: string,
    email: string,
    name: string,
  ): Promise<boolean> {
    // Check if user is already verified
    const user = await this.findUserById(userId);
    if (user?.emailVerifiedAt) {
      throw new BadRequestException('Email is already verified');
    }

    return this.sendEmailVerification(userId, email, name);
  }

  async getTokenInfo(
    token: string,
    type: TokenType,
  ): Promise<Partial<VerificationToken>> {
    const verificationToken = await this.verificationTokenRepository.findOne({
      where: { token, type },
      select: [
        'id',
        'type',
        'status',
        'expiresAt',
        'createdAt',
        'isExpired',
        'isValid',
      ],
    });

    if (!verificationToken) {
      throw new NotFoundException('Token not found');
    }

    return verificationToken;
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.verificationTokenRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .andWhere('status = :status', { status: TokenStatus.PENDING })
      .execute();

    return result.affected || 0;
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private getExpiryTime(type: TokenType): Date {
    const now = new Date();
    let expiryMinutes: number;

    switch (type) {
      case TokenType.EMAIL_VERIFICATION:
        expiryMinutes = 24 * 60; // 24 hours
        break;
      case TokenType.PASSWORD_RESET:
        expiryMinutes = 60; // 1 hour
        break;
      case TokenType.PHONE_VERIFICATION:
        expiryMinutes = 10; // 10 minutes
        break;
      case TokenType.TWO_FACTOR:
        expiryMinutes = 5; // 5 minutes
        break;
      default:
        expiryMinutes = 60; // 1 hour default
    }

    return new Date(now.getTime() + expiryMinutes * 60 * 1000);
  }

  private getExpiryTimeString(type: TokenType): string {
    switch (type) {
      case TokenType.EMAIL_VERIFICATION:
        return '24 hours';
      case TokenType.PASSWORD_RESET:
        return '1 hour';
      case TokenType.PHONE_VERIFICATION:
        return '10 minutes';
      case TokenType.TWO_FACTOR:
        return '5 minutes';
      default:
        return '1 hour';
    }
  }

  private async invalidateExistingTokens(
    userId: string,
    type: TokenType,
  ): Promise<void> {
    await this.verificationTokenRepository.update(
      { userId, type, status: TokenStatus.PENDING },
      { status: TokenStatus.EXPIRED },
    );
  }

  // These methods would need to be implemented based on your user service
  private async findUserByEmail(email: string): Promise<any> {
    // Implementation depends on your user service
    // This is a placeholder
    return null;
  }

  private async findUserById(userId: string): Promise<any> {
    // Implementation depends on your user service
    // This is a placeholder
    return null;
  }

  private async updateUserEmailVerification(userId: string): Promise<void> {
    // Implementation depends on your user service
    // This is a placeholder
  }

  private async updateUserPassword(
    userId: string,
    newPassword: string,
  ): Promise<void> {
    // Implementation depends on your user service
    // This is a placeholder
  }
}


