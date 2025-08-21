import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Connection,
  ConnectionStatus,
  ConnectionType,
} from './entities/connection.entity';
import { User } from '../users/entities/user.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class NetworkingService {
  constructor(
    @InjectRepository(Connection)
    private connectionRepository: Repository<Connection>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private aiService: AiService,
  ) {}

  async sendConnectionRequest(
    recipientId: string,
    requesterId: string,
    message?: string,
    type?: ConnectionType,
  ): Promise<Connection> {
    if (recipientId === requesterId) {
      throw new BadRequestException('Cannot connect with yourself');
    }

    const recipient = await this.userRepository.findOne({
      where: { id: recipientId },
    });
    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    // Check if connection already exists
    const existingConnection = await this.connectionRepository.findOne({
      where: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId },
      ],
    });

    if (existingConnection) {
      throw new BadRequestException('Connection request already exists');
    }

    const connection = this.connectionRepository.create({
      requesterId,
      recipientId,
      message,
      type,
      status: ConnectionStatus.PENDING,
    });

    return this.connectionRepository.save(connection);
  }

  async acceptConnectionRequest(
    connectionId: string,
    userId: string,
  ): Promise<Connection> {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId },
      relations: ['requester', 'recipient'],
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    if (connection.recipientId !== userId) {
      throw new ForbiddenException(
        'You can only accept connection requests sent to you',
      );
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestException('Connection request is not pending');
    }

    connection.status = ConnectionStatus.ACCEPTED;
    connection.acceptedAt = new Date();

    // Update mutual connections count for both users
    await this.updateMutualConnections(
      connection.requesterId,
      connection.recipientId,
    );

    return this.connectionRepository.save(connection);
  }

  async rejectConnectionRequest(
    connectionId: string,
    userId: string,
    reason?: string,
  ): Promise<Connection> {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    if (connection.recipientId !== userId) {
      throw new ForbiddenException(
        'You can only reject connection requests sent to you',
      );
    }

    connection.status = ConnectionStatus.REJECTED;
    connection.rejectedAt = new Date();

    return this.connectionRepository.save(connection);
  }

  async getConnections(
    userId: string,
    status?: ConnectionStatus,
  ): Promise<Connection[]> {
    const queryBuilder = this.connectionRepository
      .createQueryBuilder('connection')
      .leftJoinAndSelect('connection.requester', 'requester')
      .leftJoinAndSelect('connection.recipient', 'recipient')
      .where(
        '(connection.requesterId = :userId OR connection.recipientId = :userId)',
        { userId },
      );

    if (status) {
      queryBuilder.andWhere('connection.status = :status', { status });
    }

    return queryBuilder.getMany();
  }

  async getConnectionSuggestions(
    userId: string,
    limit: number = 10,
  ): Promise<User[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'skills', 'location'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get users with similar skills or location
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.id != :userId', { userId })
      .andWhere('user.status = :status', { status: 'active' });

    if (user.skills?.length) {
      queryBuilder.andWhere('JSON_OVERLAPS(user.skills, :skills)', {
        skills: JSON.stringify(user.skills),
      });
    }

    if (user.location) {
      queryBuilder.andWhere('user.location LIKE :location', {
        location: `%${user.location}%`,
      });
    }

    // Exclude users already connected
    const existingConnections = await this.connectionRepository.find({
      where: [{ requesterId: userId }, { recipientId: userId }],
      select: ['requesterId', 'recipientId'],
    });

    const connectedUserIds = existingConnections.map((c) =>
      c.requesterId === userId ? c.recipientId : c.requesterId,
    );

    if (connectedUserIds.length > 0) {
      queryBuilder.andWhere('user.id NOT IN (:...connectedUserIds)', {
        connectedUserIds,
      });
    }

    return queryBuilder.limit(limit).getMany();
  }

  async endorseSkill(
    endorserId: string,
    recipientId: string,
    skill: string,
    message?: string,
  ): Promise<void> {
    const recipient = await this.userRepository.findOne({
      where: { id: recipientId },
    });
    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    // Check if they are connected
    const connection = await this.connectionRepository.findOne({
      where: [
        {
          requesterId: endorserId,
          recipientId,
          status: ConnectionStatus.ACCEPTED,
        },
        {
          requesterId: recipientId,
          recipientId: endorserId,
          status: ConnectionStatus.ACCEPTED,
        },
      ],
    });

    if (!connection) {
      throw new BadRequestException(
        'You can only endorse skills of your connections',
      );
    }

    // Check if skill exists in recipient's skills
    if (!recipient.skills?.includes(skill)) {
      throw new BadRequestException('Skill not found in recipient profile');
    }

    // Add endorsement to recipient's verified skills
    const verifiedSkills = recipient.verifiedSkills || [];
    const existingSkillIndex = verifiedSkills.findIndex(
      (s) => s.skill === skill,
    );

    if (existingSkillIndex >= 0) {
      verifiedSkills[existingSkillIndex].endorsements += 1;
    } else {
      verifiedSkills.push({
        skill,
        verifiedBy: endorserId,
        verifiedAt: new Date(),
        endorsements: 1,
      });
    }

    await this.userRepository.update(recipientId, { verifiedSkills });
  }

  async writeRecommendation(
    authorId: string,
    recipientId: string,
    content: string,
    isPublic: boolean = true,
  ): Promise<void> {
    const recipient = await this.userRepository.findOne({
      where: { id: recipientId },
    });
    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    // Check if they are connected
    const connection = await this.connectionRepository.findOne({
      where: [
        {
          requesterId: authorId,
          recipientId,
          status: ConnectionStatus.ACCEPTED,
        },
        {
          requesterId: recipientId,
          recipientId: authorId,
          status: ConnectionStatus.ACCEPTED,
        },
      ],
    });

    if (!connection) {
      throw new BadRequestException(
        'You can only write recommendations for your connections',
      );
    }

    // Add recommendation to connection
    const recommendations = connection.recommendations || [];
    recommendations.push({
      content,
      createdAt: new Date(),
      isPublic,
    });

    await this.connectionRepository.update(connection.id, { recommendations });
  }

  async getNetworkInsights(userId: string): Promise<any> {
    const connections = await this.getConnections(
      userId,
      ConnectionStatus.ACCEPTED,
    );
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalConnections = connections.length;
    const connectionTypes = connections.reduce((acc, conn) => {
      const type = conn.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const topSkills = connections
      .flatMap((conn) => {
        const otherUser =
          conn.requesterId === userId ? conn.recipient : conn.requester;
        return otherUser.skills || [];
      })
      .reduce((acc, skill) => {
        acc[skill] = (acc[skill] || 0) + 1;
        return acc;
      }, {});

    const topSkillsList = Object.entries(topSkills)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([skill]) => skill);

    return {
      totalConnections,
      connectionTypes,
      topSkills: topSkillsList,
      networkStrength: this.calculateNetworkStrength(connections),
      recommendations: [
        'Connect with industry leaders in your field',
        'Endorse skills of your connections',
        'Write recommendations for colleagues',
        'Engage with your network regularly',
      ],
    };
  }

  private async updateMutualConnections(
    userId1: string,
    userId2: string,
  ): Promise<void> {
    // This is a simplified version - in a real implementation, you'd need to
    // calculate mutual connections between two users
    // For now, we'll just increment a counter
    const connection1 = await this.connectionRepository.findOne({
      where: { requesterId: userId1, recipientId: userId2 },
    });
    const connection2 = await this.connectionRepository.findOne({
      where: { requesterId: userId2, recipientId: userId1 },
    });

    if (connection1) {
      connection1.mutualConnections += 1;
      await this.connectionRepository.save(connection1);
    }
    if (connection2) {
      connection2.mutualConnections += 1;
      await this.connectionRepository.save(connection2);
    }
  }

  private calculateNetworkStrength(connections: Connection[]): number {
    if (connections.length === 0) return 0;

    const totalStrength = connections.reduce((sum, conn) => {
      return sum + conn.connectionStrength;
    }, 0);

    return Math.round(totalStrength / connections.length);
  }
}
