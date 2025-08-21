import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChatMessage } from './chat-message.entity';

export enum ChatRoomType {
  DIRECT = 'direct',
  GROUP = 'group',
  PROJECT = 'project',
}

@Entity('chat_rooms')
@Index(['type'])
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ChatRoomType, default: ChatRoomType.DIRECT })
  type: ChatRoomType;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: {
    projectId?: string;
    jobId?: string;
    courseId?: string;
    lastActivity?: Date;
  };

  @ManyToMany(() => User)
  @JoinTable({
    name: 'chat_room_participants',
    joinColumn: { name: 'chatRoomId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  participants: User[];

  @OneToMany(() => ChatMessage, (message) => message.chatRoom)
  messages: ChatMessage[];

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date;

  @Column({ type: 'int', default: 0 })
  messageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isDirectChat(): boolean {
    return this.type === ChatRoomType.DIRECT;
  }

  get isGroupChat(): boolean {
    return this.type === ChatRoomType.GROUP;
  }

  get isProjectChat(): boolean {
    return this.type === ChatRoomType.PROJECT;
  }
}


