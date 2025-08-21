import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  metadata?: any;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor() {}

  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any,
  ): Promise<void> {
    // TODO: Implement notification sending logic
    this.logger.log(`Sending notification to user ${userId}: ${title}`);
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    // TODO: Implement getting user notifications
    return [];
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    // TODO: Implement marking notification as read
    this.logger.log(
      `Marking notification ${notificationId} as read for user ${userId}`,
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    // TODO: Implement marking all notifications as read
    this.logger.log(`Marking all notifications for user ${userId} as read`);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    // TODO: Implement notification deletion
    this.logger.log(`Deleting notification ${notificationId}`);
  }

  async archiveNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    // TODO: Implement notification archiving
    this.logger.log(
      `Archiving notification ${notificationId} for user ${userId}`,
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    // TODO: Implement getting unread count
    this.logger.log(`Getting unread count for user ${userId}`);
    return 0;
  }
}
