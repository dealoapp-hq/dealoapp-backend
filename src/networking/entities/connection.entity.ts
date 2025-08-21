import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

export enum ConnectionType {
  COLLEAGUE = 'colleague',
  MENTOR = 'mentor',
  MENTEE = 'mentee',
  CLIENT = 'client',
  FREELANCER = 'freelancer',
  FRIEND = 'friend',
  ACQUAINTANCE = 'acquaintance',
}

@Entity('connections')
@Index(['requesterId'])
@Index(['recipientId'])
@Index(['status'])
@Index(['type'])
@Index(['createdAt'])
export class Connection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ConnectionStatus,
    default: ConnectionStatus.PENDING,
  })
  status: ConnectionStatus;

  @Column({ type: 'enum', enum: ConnectionType, nullable: true })
  type: ConnectionType;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'text', nullable: true })
  responseMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  blockedAt: Date;

  @Column({ type: 'boolean', default: false })
  isMuted: boolean;

  @Column({ type: 'json', nullable: true })
  sharedInterests: string[];

  @Column({ type: 'json', nullable: true })
  collaborationHistory: {
    projectId: string;
    projectTitle: string;
    role: string;
    startDate: Date;
    endDate?: Date;
    rating: number;
  }[];

  @Column({ type: 'int', default: 0 })
  mutualConnections: number;

  @Column({ type: 'json', nullable: true })
  endorsements: {
    skill: string;
    endorsedAt: Date;
    message?: string;
  }[];

  @Column({ type: 'json', nullable: true })
  recommendations: {
    content: string;
    createdAt: Date;
    isPublic: boolean;
  }[];

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  requester: User;

  @Column()
  requesterId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  recipient: User;

  @Column()
  recipientId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isActive(): boolean {
    return this.status === ConnectionStatus.ACCEPTED;
  }

  get isPending(): boolean {
    return this.status === ConnectionStatus.PENDING;
  }

  get isBlocked(): boolean {
    return this.status === ConnectionStatus.BLOCKED;
  }

  get connectionStrength(): number {
    let strength = 0;

    // Base strength from type
    switch (this.type) {
      case ConnectionType.COLLEAGUE:
        strength += 30;
        break;
      case ConnectionType.MENTOR:
      case ConnectionType.MENTEE:
        strength += 40;
        break;
      case ConnectionType.CLIENT:
      case ConnectionType.FREELANCER:
        strength += 25;
        break;
      default:
        strength += 10;
    }

    // Add strength from collaboration history
    if (this.collaborationHistory?.length) {
      strength += this.collaborationHistory.length * 10;
    }

    // Add strength from endorsements
    if (this.endorsements?.length) {
      strength += this.endorsements.length * 5;
    }

    // Add strength from mutual connections
    strength += this.mutualConnections * 2;

    return Math.min(strength, 100);
  }
}
