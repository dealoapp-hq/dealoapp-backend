import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
  },
  namespace: '/notifications',
})
@UseGuards(WsJwtGuard)
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<
    string,
    { socketId: string; userId: string }
  >();

  constructor(private readonly notificationsService: NotificationsService) {}

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
      });

      // Join user's notification room
      await client.join(`notifications:${user.id}`);

      console.log(
        `User ${user.id} connected to notifications with socket ${client.id}`,
      );
    } catch (error) {
      console.error('Notification connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
    console.log(`User disconnected from notifications: ${client.id}`);
  }

  @SubscribeMessage('mark:read')
  async handleMarkAsRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userData = this.connectedUsers.get(client.id);
      if (!userData) {
        return { error: 'User not authenticated' };
      }

      const { notificationId } = data;
      await this.notificationsService.markAsRead(
        notificationId,
        userData.userId,
      );

      return { success: true };
    } catch (error) {
      console.error('Mark as read error:', error);
      return { error: 'Failed to mark notification as read' };
    }
  }

  @SubscribeMessage('mark:all:read')
  async handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    try {
      const userData = this.connectedUsers.get(client.id);
      if (!userData) {
        return { error: 'User not authenticated' };
      }

      await this.notificationsService.markAllAsRead(userData.userId);

      return { success: true };
    } catch (error) {
      console.error('Mark all as read error:', error);
      return { error: 'Failed to mark all notifications as read' };
    }
  }

  @SubscribeMessage('archive:notification')
  async handleArchiveNotification(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userData = this.connectedUsers.get(client.id);
      if (!userData) {
        return { error: 'User not authenticated' };
      }

      const { notificationId } = data;
      await this.notificationsService.archiveNotification(
        notificationId,
        userData.userId,
      );

      return { success: true };
    } catch (error) {
      console.error('Archive notification error:', error);
      return { error: 'Failed to archive notification' };
    }
  }

  @SubscribeMessage('get:unread:count')
  async handleGetUnreadCount(@ConnectedSocket() client: Socket) {
    try {
      const userData = this.connectedUsers.get(client.id);
      if (!userData) {
        return { error: 'User not authenticated' };
      }

      const count = await this.notificationsService.getUnreadCount(
        userData.userId,
      );

      return { success: true, count };
    } catch (error) {
      console.error('Get unread count error:', error);
      return { error: 'Failed to get unread count' };
    }
  }

  // Method to send notification to specific user
  async sendNotificationToUser(userId: string, notification: any) {
    this.server
      .to(`notifications:${userId}`)
      .emit('new:notification', notification);
  }

  // Method to send notification to multiple users
  async sendNotificationToUsers(userIds: string[], notification: any) {
    for (const userId of userIds) {
      this.server
        .to(`notifications:${userId}`)
        .emit('new:notification', notification);
    }
  }

  // Method to send notification to all connected users
  async sendNotificationToAll(notification: any) {
    this.server.emit('new:notification', notification);
  }

  // Method to update notification count for user
  async updateNotificationCount(userId: string, count: number) {
    this.server
      .to(`notifications:${userId}`)
      .emit('notification:count:update', { count });
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


