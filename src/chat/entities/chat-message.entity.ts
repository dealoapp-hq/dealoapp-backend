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
import { ChatRoom } from './chat-room.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('chat_messages')
@Index(['chatRoomId'])
@Index(['senderId'])
@Index(['createdAt'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus;

  @Column({ type: 'json', nullable: true })
  metadata: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    fileUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
    dimensions?: { width: number; height: number };
    replyTo?: string;
    editedAt?: Date;
  };

  @Column({ type: 'boolean', default: false })
  isEdited: boolean;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({ type: 'json', nullable: true })
  readBy: {
    userId: string;
    readAt: Date;
  }[];

  @ManyToOne(() => ChatRoom, { onDelete: 'CASCADE' })
  chatRoom: ChatRoom;

  @Column()
  chatRoomId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;

  @Column()
  senderId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isTextMessage(): boolean {
    return this.type === MessageType.TEXT;
  }

  get isMediaMessage(): boolean {
    return [MessageType.IMAGE, MessageType.AUDIO, MessageType.VIDEO].includes(
      this.type,
    );
  }

  get isFileMessage(): boolean {
    return this.type === MessageType.FILE;
  }

  get isSystemMessage(): boolean {
    return this.type === MessageType.SYSTEM;
  }

  get isRead(): boolean {
    return this.status === MessageStatus.READ;
  }

  get isDelivered(): boolean {
    return this.status === MessageStatus.DELIVERED;
  }
}


