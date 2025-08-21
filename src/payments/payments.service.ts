import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentStatus,
  PaymentType,
  PaymentMethod,
} from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async create(
    createPaymentDto: CreatePaymentDto,
    userId: string,
  ): Promise<Payment> {
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      userId,
      reference: this.generateReference(),
      totalAmount:
        createPaymentDto.amount +
        (createPaymentDto.fee || 0) +
        (createPaymentDto.tax || 0),
    });

    return this.paymentRepository.save(payment);
  }

  async findAll(filters?: any): Promise<Payment[]> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user');

    if (filters?.status) {
      queryBuilder.andWhere('payment.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.type) {
      queryBuilder.andWhere('payment.type = :type', { type: filters.type });
    }

    if (filters?.userId) {
      queryBuilder.andWhere('payment.userId = :userId', {
        userId: filters.userId,
      });
    }

    if (filters?.method) {
      queryBuilder.andWhere('payment.method = :method', {
        method: filters.method,
      });
    }

    return queryBuilder.orderBy('payment.createdAt', 'DESC').getMany();
  }

  async findById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByReference(reference: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { reference },
      relations: ['user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    metadata?: any,
  ): Promise<Payment> {
    const payment = await this.findById(id);

    payment.status = status;

    if (status === PaymentStatus.COMPLETED) {
      payment.completedAt = new Date();
    } else if (status === PaymentStatus.FAILED) {
      payment.failedAt = new Date();
      if (metadata?.reason) {
        payment.failureReason = metadata.reason;
      }
    } else if (status === PaymentStatus.PROCESSING) {
      payment.processedAt = new Date();
    }

    if (metadata?.gatewayData) {
      payment.gatewayData = { ...payment.gatewayData, ...metadata.gatewayData };
    }

    return this.paymentRepository.save(payment);
  }

  async processPayment(paymentId: string): Promise<Payment> {
    const payment = await this.findById(paymentId);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not in pending status');
    }

    // Simulate payment processing
    // In a real implementation, this would integrate with payment gateways
    try {
      // Update to processing
      payment.status = PaymentStatus.PROCESSING;
      payment.processedAt = new Date();
      await this.paymentRepository.save(payment);

      // Simulate successful payment
      payment.status = PaymentStatus.COMPLETED;
      payment.completedAt = new Date();

      return this.paymentRepository.save(payment);
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.failedAt = new Date();
      payment.failureReason = error.message;

      await this.paymentRepository.save(payment);
      throw error;
    }
  }

  async refundPayment(paymentId: string, reason?: string): Promise<Payment> {
    const payment = await this.findById(paymentId);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    payment.status = PaymentStatus.REFUNDED;
    payment.failureReason = reason || 'Refunded by user request';

    return this.paymentRepository.save(payment);
  }

  async getPaymentStats(): Promise<any> {
    const stats = await this.paymentRepository
      .createQueryBuilder('payment')
      .select([
        'COUNT(*) as totalPayments',
        'COUNT(CASE WHEN payment.status = :completedStatus THEN 1 END) as completedPayments',
        'COUNT(CASE WHEN payment.status = :pendingStatus THEN 1 END) as pendingPayments',
        'COUNT(CASE WHEN payment.status = :failedStatus THEN 1 END) as failedPayments',
        'SUM(CASE WHEN payment.status = :completedStatus THEN payment.amount ELSE 0 END) as totalAmount',
        'SUM(CASE WHEN payment.status = :completedStatus THEN payment.fee ELSE 0 END) as totalFees',
      ])
      .setParameters({
        completedStatus: PaymentStatus.COMPLETED,
        pendingStatus: PaymentStatus.PENDING,
        failedStatus: PaymentStatus.FAILED,
      })
      .getRawOne();

    return stats;
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPaymentsByType(type: PaymentType): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { type },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  private generateReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DEALO-${timestamp}-${random}`;
  }
}


