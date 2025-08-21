import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum TokenType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  PHONE_VERIFICATION = 'phone_verification',
  TWO_FACTOR = 'two_factor',
}

export enum TokenStatus {
  PENDING = 'pending',
  USED = 'used',
  EXPIRED = 'expired',
}

@Entity('verification_tokens')
@Index(['token'], { unique: true })
@Index(['userId', 'type'])
@Index(['email', 'type'])
export class VerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  token: string;

  @Column({ type: 'enum', enum: TokenType })
  type: TokenType;

  @Column({ type: 'enum', enum: TokenStatus, default: TokenStatus.PENDING })
  status: TokenStatus;

  @Column()
  userId: string;

  @Column({ length: 255 })
  email: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    attempts?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  // Virtual properties
  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  get isUsed(): boolean {
    return this.status === TokenStatus.USED;
  }

  get isValid(): boolean {
    return this.status === TokenStatus.PENDING && !this.isExpired;
  }

  get timeUntilExpiry(): number {
    return Math.max(0, this.expiresAt.getTime() - new Date().getTime());
  }
}


