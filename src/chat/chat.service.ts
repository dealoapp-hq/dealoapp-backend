import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom, ChatRoomType } from './entities/chat-room.entity';
import {
  ChatMessage,
  MessageType,
  MessageStatus,
} from './entities/chat-message.entity';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async createChatRoom(
    createChatRoomDto: CreateChatRoomDto,
    creatorId: string,
  ): Promise<ChatRoom> {
    const chatRoom = this.chatRoomRepository.create({
      ...createChatRoomDto,
      participants: [{ id: creatorId }],
    });

    return this.chatRoomRepository.save(chatRoom);
  }

  async createDirectChat(userId1: string, userId2: string): Promise<ChatRoom> {
    // Check if direct chat already exists
    const existingRoom = await this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin('room.participants', 'participant1')
      .innerJoin('room.participants', 'participant2')
      .where('room.type = :type', { type: ChatRoomType.DIRECT })
      .andWhere('participant1.id = :userId1', { userId1 })
      .andWhere('participant2.id = :userId2', { userId2 })
      .getOne();

    if (existingRoom) {
      return existingRoom;
    }

    // Create new direct chat
    const chatRoom = this.chatRoomRepository.create({
      name: `Direct Chat`,
      type: ChatRoomType.DIRECT,
      participants: [{ id: userId1 }, { id: userId2 }],
      isActive: true,
    });

    return this.chatRoomRepository.save(chatRoom);
  }

  async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    return this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin('room.participants', 'participant')
      .leftJoinAndSelect('room.participants', 'allParticipants')
      .leftJoinAndSelect('room.messages', 'messages')
      .where('participant.id = :userId', { userId })
      .andWhere('room.isActive = :isActive', { isActive: true })
      .orderBy('room.lastMessageAt', 'DESC')
      .addOrderBy('room.createdAt', 'DESC')
      .getMany();
  }

  async getChatRoomById(roomId: string, userId: string): Promise<ChatRoom> {
    const chatRoom = await this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin('room.participants', 'participant')
      .leftJoinAndSelect('room.participants', 'allParticipants')
      .leftJoinAndSelect('room.messages', 'messages')
      .leftJoinAndSelect('messages.sender', 'sender')
      .where('room.id = :roomId', { roomId })
      .andWhere('participant.id = :userId', { userId })
      .orderBy('messages.createdAt', 'ASC')
      .getOne();

    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    return chatRoom;
  }

  async isUserInRoom(userId: string, roomId: string): Promise<boolean> {
    const count = await this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin('room.participants', 'participant')
      .where('room.id = :roomId', { roomId })
      .andWhere('participant.id = :userId', { userId })
      .getCount();

    return count > 0;
  }

  async createMessage(data: {
    chatRoomId: string;
    senderId: string;
    content: string;
    type?: MessageType;
    metadata?: any;
  }): Promise<ChatMessage> {
    const message = this.chatMessageRepository.create({
      ...data,
      type: data.type || MessageType.TEXT,
      status: MessageStatus.SENT,
      readBy: [],
    });

    return this.chatMessageRepository.save(message);
  }

  async getRoomMessages(
    roomId: string,
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<ChatMessage[]> {
    // Check if user is in the room
    const isParticipant = await this.isUserInRoom(userId, roomId);
    if (!isParticipant) {
      throw new ForbiddenException('Not authorized to access this room');
    }

    return this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.chatRoomId = :roomId', { roomId })
      .andWhere('message.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('message.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();
  }

  async markMessagesAsRead(
    messageIds: string[],
    userId: string,
  ): Promise<void> {
    const messages = await this.chatMessageRepository.findByIds(messageIds);

    for (const message of messages) {
      // Check if user is in the room
      const isParticipant = await this.isUserInRoom(userId, message.chatRoomId);
      if (!isParticipant) continue;

      // Update read status
      const readBy = message.readBy || [];
      const alreadyRead = readBy.find((reader) => reader.userId === userId);

      if (!alreadyRead) {
        readBy.push({
          userId,
          readAt: new Date(),
        });

        message.readBy = readBy;
        message.status = MessageStatus.READ;

        await this.chatMessageRepository.save(message);
      }
    }
  }

  async updateRoomLastMessage(
    roomId: string,
    messageId: string,
  ): Promise<void> {
    await this.chatRoomRepository.update(roomId, {
      lastMessageAt: new Date(),
      messageCount: () => 'messageCount + 1',
    });
  }

  async addParticipantToRoom(
    roomId: string,
    userId: string,
    addedBy: string,
  ): Promise<ChatRoom> {
    const chatRoom = await this.getChatRoomById(roomId, addedBy);

    if (chatRoom.type === ChatRoomType.DIRECT) {
      throw new BadRequestException('Cannot add participants to direct chat');
    }

    // Check if user is already in the room
    const isAlreadyParticipant = await this.isUserInRoom(userId, roomId);
    if (isAlreadyParticipant) {
      throw new BadRequestException('User is already a participant');
    }

    // Add user to room
    chatRoom.participants.push({ id: userId } as any);
    return this.chatRoomRepository.save(chatRoom);
  }

  async removeParticipantFromRoom(
    roomId: string,
    userId: string,
    removedBy: string,
  ): Promise<ChatRoom> {
    const chatRoom = await this.getChatRoomById(roomId, removedBy);

    if (chatRoom.type === ChatRoomType.DIRECT) {
      throw new BadRequestException(
        'Cannot remove participants from direct chat',
      );
    }

    // Remove user from room
    chatRoom.participants = chatRoom.participants.filter(
      (p) => p.id !== userId,
    );
    return this.chatRoomRepository.save(chatRoom);
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Can only delete your own messages');
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await this.chatMessageRepository.save(message);
  }

  async editMessage(
    messageId: string,
    content: string,
    userId: string,
  ): Promise<ChatMessage> {
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Can only edit your own messages');
    }

    if (message.isDeleted) {
      throw new BadRequestException('Cannot edit deleted message');
    }

    message.content = content;
    message.isEdited = true;
    message.metadata = {
      ...message.metadata,
      editedAt: new Date(),
    };

    return this.chatMessageRepository.save(message);
  }

  async getUnreadMessageCount(
    userId: string,
  ): Promise<{ roomId: string; count: number }[]> {
    const rooms = await this.getUserChatRooms(userId);
    const unreadCounts: { roomId: string; count: number }[] = [];

    for (const room of rooms) {
      const count = await this.chatMessageRepository
        .createQueryBuilder('message')
        .where('message.chatRoomId = :roomId', { roomId: room.id })
        .andWhere('message.senderId != :userId', { userId })
        .andWhere('message.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere(
          'message.readBy IS NULL OR JSON_SEARCH(message.readBy, "one", :userId, NULL, "$[*].userId") IS NULL',
          { userId },
        )
        .getCount();

      if (count > 0) {
        unreadCounts.push({ roomId: room.id, count });
      }
    }

    return unreadCounts;
  }
}
