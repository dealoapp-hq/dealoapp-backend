import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { TypingDto } from './dto/typing.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
  },
  namespace: '/chat',
})
@UseGuards(WsJwtGuard)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<
    string,
    { socketId: string; userId: string; user: any }
  >();

  constructor(private readonly chatService: ChatService) {}

  afterInit(server: Server) {
    console.log('Chat WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const user = client.handshake.auth.user;
      if (!user) {
        client.disconnect();
        return;
      }

      this.connectedUsers.set(client.id, {
        socketId: client.id,
        userId: user.id,
        user,
      });

      // Join user's personal room
      await client.join(`user:${user.id}`);

      // Join user's chat rooms
      const userRooms = await this.chatService.getUserChatRooms(user.id);
      for (const room of userRooms) {
        await client.join(`room:${room.id}`);
      }

      // Emit user online status
      this.server.emit('user:online', { userId: user.id, socketId: client.id });

      console.log(`User ${user.id} connected with socket ${client.id}`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userData = this.connectedUsers.get(client.id);
    if (userData) {
      this.connectedUsers.delete(client.id);
      this.server.emit('user:offline', { userId: userData.userId });
      console.log(`User ${userData.userId} disconnected`);
    }
  }

  @SubscribeMessage('join:room')
  async handleJoinRoom(
    @MessageBody() joinRoomDto: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userData = this.connectedUsers.get(client.id);
      if (!userData) {
        return { error: 'User not authenticated' };
      }

      const { roomId } = joinRoomDto;

      // Check if user is a participant of the room
      const isParticipant = await this.chatService.isUserInRoom(
        userData.userId,
        roomId,
      );
      if (!isParticipant) {
        return { error: 'Not authorized to join this room' };
      }

      await client.join(`room:${roomId}`);

      // Emit room joined event
      client.emit('room:joined', { roomId });

      // Notify other participants
      client.to(`room:${roomId}`).emit('user:joined:room', {
        roomId,
        userId: userData.userId,
        user: userData.user,
      });

      return { success: true, roomId };
    } catch (error) {
      console.error('Join room error:', error);
      return { error: 'Failed to join room' };
    }
  }

  @SubscribeMessage('leave:room')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userData = this.connectedUsers.get(client.id);
      if (!userData) {
        return { error: 'User not authenticated' };
      }

      const { roomId } = data;

      await client.leave(`room:${roomId}`);

      // Emit room left event
      client.emit('room:left', { roomId });

      // Notify other participants
      client.to(`room:${roomId}`).emit('user:left:room', {
        roomId,
        userId: userData.userId,
      });

      return { success: true, roomId };
    } catch (error) {
      console.error('Leave room error:', error);
      return { error: 'Failed to leave room' };
    }
  }

  @SubscribeMessage('send:message')
  async handleSendMessage(
    @MessageBody() sendMessageDto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userData = this.connectedUsers.get(client.id);
      if (!userData) {
        return { error: 'User not authenticated' };
      }

      const { roomId, content, type = 'text', metadata } = sendMessageDto;

      // Check if user is a participant of the room
      const isParticipant = await this.chatService.isUserInRoom(
        userData.userId,
        roomId,
      );
      if (!isParticipant) {
        return { error: 'Not authorized to send message to this room' };
      }

      // Create and save message
      const message = await this.chatService.createMessage({
        chatRoomId: roomId,
        senderId: userData.userId,
        content,
        type: type as any,
        metadata,
      });

      // Emit message to room
      this.server.to(`room:${roomId}`).emit('new:message', {
        message,
        roomId,
      });

      // Update room's last message
      await this.chatService.updateRoomLastMessage(roomId, message.id);

      return { success: true, message };
    } catch (error) {
      console.error('Send message error:', error);
      return { error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @MessageBody() typingDto: TypingDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userData = this.connectedUsers.get(client.id);
      if (!userData) {
        return { error: 'User not authenticated' };
      }

      const { roomId } = typingDto;

      // Check if user is a participant of the room
      const isParticipant = await this.chatService.isUserInRoom(
        userData.userId,
        roomId,
      );
      if (!isParticipant) {
        return { error: 'Not authorized' };
      }

      // Emit typing start to room (excluding sender)
      client.to(`room:${roomId}`).emit('user:typing:start', {
        roomId,
        userId: userData.userId,
        user: userData.user,
      });

      return { success: true };
    } catch (error) {
      console.error('Typing start error:', error);
      return { error: 'Failed to send typing indicator' };
    }
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @MessageBody() typingDto: TypingDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userData = this.connectedUsers.get(client.id);
      if (!userData) {
        return { error: 'User not authenticated' };
      }

      const { roomId } = typingDto;

      // Check if user is a participant of the room
      const isParticipant = await this.chatService.isUserInRoom(
        userData.userId,
        roomId,
      );
      if (!isParticipant) {
        return { error: 'Not authorized' };
      }

      // Emit typing stop to room (excluding sender)
      client.to(`room:${roomId}`).emit('user:typing:stop', {
        roomId,
        userId: userData.userId,
      });

      return { success: true };
    } catch (error) {
      console.error('Typing stop error:', error);
      return { error: 'Failed to send typing indicator' };
    }
  }

  @SubscribeMessage('read:messages')
  async handleReadMessages(
    @MessageBody() data: { roomId: string; messageIds: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userData = this.connectedUsers.get(client.id);
      if (!userData) {
        return { error: 'User not authenticated' };
      }

      const { roomId, messageIds } = data;

      // Mark messages as read
      await this.chatService.markMessagesAsRead(messageIds, userData.userId);

      // Emit messages read to room
      this.server.to(`room:${roomId}`).emit('messages:read', {
        roomId,
        userId: userData.userId,
        messageIds,
      });

      return { success: true };
    } catch (error) {
      console.error('Read messages error:', error);
      return { error: 'Failed to mark messages as read' };
    }
  }

  // Helper method to get connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  // Helper method to check if user is online
  isUserOnline(userId: string): boolean {
    return Array.from(this.connectedUsers.values()).some(
      (user) => user.userId === userId,
    );
  }
}
