import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Escrow, EscrowStatus, ReviewStatus } from './entities/escrow.entity';
import {
  Payment,
  PaymentStatus,
  PaymentType,
  PaymentMethod,
  PaymentProcessor,
} from './entities/payment.entity';
import { Job, JobStatus } from '../jobs/entities/job.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(Escrow)
    private readonly escrowRepository: Repository<Escrow>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createEscrow(
    jobId: string,
    clientId: string,
    freelancerId: string,
    amount: number,
    currency: string = 'NGN',
  ): Promise<Escrow> {
    // Validate job exists and is assigned to freelancer
    const job = await this.jobRepository.findOne({
      where: { id: jobId, clientId, assignedFreelancerId: freelancerId },
    });

    if (!job) {
      throw new NotFoundException(
        'Job not found or not assigned to freelancer',
      );
    }

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Job is not available for escrow');
    }

    // Calculate amounts based on 70/30 model
    const platformFeePercentage = 0.3; // 30%
    const freelancerPercentage = 0.7; // 70%

    const platformFee = amount * platformFeePercentage;
    const freelancerAmount = amount * freelancerPercentage;

    const escrow = this.escrowRepository.create({
      jobId,
      clientId,
      freelancerId,
      totalAmount: amount,
      freelancerAmount,
      platformFee,
      currency,
      reference: this.generateEscrowReference(),
      status: EscrowStatus.PENDING,
      metadata: {
        jobTitle: job.title,
        jobDescription: job.description,
        platformFeePercentage,
        freelancerPercentage,
      },
    });

    return this.escrowRepository.save(escrow);
  }

  async fundEscrow(escrowId: string, paymentId: string): Promise<Escrow> {
    const escrow = await this.findById(escrowId);
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (escrow.status !== EscrowStatus.PENDING) {
      throw new BadRequestException('Escrow is not in pending status');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment is not completed');
    }

    if (payment.amount !== escrow.totalAmount) {
      throw new BadRequestException(
        'Payment amount does not match escrow amount',
      );
    }

    // Update escrow status
    escrow.status = EscrowStatus.FUNDED;
    escrow.fundedAt = new Date();

    // Update job status
    await this.jobRepository.update(escrow.jobId, {
      status: JobStatus.IN_PROGRESS,
      assignedAt: new Date(),
    });

    // Add payment to history
    escrow.paymentHistory = [
      ...(escrow.paymentHistory || []),
      {
        id: this.generateId(),
        type: 'escrow_funded',
        amount: escrow.totalAmount,
        description: 'Escrow funded by client',
        processedAt: new Date(),
        transactionId: payment.reference,
      },
    ];

    return this.escrowRepository.save(escrow);
  }

  async startWork(escrowId: string, freelancerId: string): Promise<Escrow> {
    const escrow = await this.findById(escrowId);

    if (escrow.freelancerId !== freelancerId) {
      throw new ForbiddenException(
        'Only the assigned freelancer can start work',
      );
    }

    if (escrow.status !== EscrowStatus.FUNDED) {
      throw new BadRequestException(
        'Escrow must be funded before starting work',
      );
    }

    escrow.status = EscrowStatus.IN_PROGRESS;
    escrow.startedAt = new Date();

    return this.escrowRepository.save(escrow);
  }

  async submitForReview(
    escrowId: string,
    freelancerId: string,
    deliverables: any[],
  ): Promise<Escrow> {
    const escrow = await this.findById(escrowId);

    if (escrow.freelancerId !== freelancerId) {
      throw new ForbiddenException(
        'Only the assigned freelancer can submit for review',
      );
    }

    if (escrow.status !== EscrowStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Work must be in progress to submit for review',
      );
    }

    escrow.status = EscrowStatus.CLIENT_REVIEW;
    escrow.deliverables = [
      ...(escrow.deliverables || []),
      ...deliverables.map((deliverable) => ({
        ...deliverable,
        id: this.generateId(),
        submittedAt: new Date(),
      })),
    ];

    return this.escrowRepository.save(escrow);
  }

  async clientReview(
    escrowId: string,
    clientId: string,
    reviewData: {
      rating: number;
      review: string;
      quality: number;
      communication: number;
      timeliness: number;
      professionalism: number;
      wouldRecommend: boolean;
    },
  ): Promise<Escrow> {
    const escrow = await this.findById(escrowId);

    if (escrow.clientId !== clientId) {
      throw new ForbiddenException('Only the client can review the work');
    }

    if (escrow.status !== EscrowStatus.CLIENT_REVIEW) {
      throw new BadRequestException('Work must be submitted for review');
    }

    escrow.clientReviewStatus = ReviewStatus.APPROVED;
    escrow.clientRating = reviewData.rating;
    escrow.clientReview = reviewData.review;
    escrow.clientReviewedAt = new Date();
    escrow.clientReviewData = {
      quality: reviewData.quality,
      communication: reviewData.communication,
      timeliness: reviewData.timeliness,
      professionalism: reviewData.professionalism,
      overall: reviewData.rating,
      comments: reviewData.review,
      wouldRecommend: reviewData.wouldRecommend,
    };

    // If freelancer has also reviewed, move to completed
    if (escrow.freelancerReviewStatus !== ReviewStatus.PENDING) {
      escrow.status = EscrowStatus.COMPLETED;
      escrow.completedAt = new Date();
    } else {
      escrow.status = EscrowStatus.FREELANCER_REVIEW;
    }

    return this.escrowRepository.save(escrow);
  }

  async freelancerReview(
    escrowId: string,
    freelancerId: string,
    reviewData: {
      rating: number;
      review: string;
      payment: number;
      communication: number;
      clarity: number;
      fairness: number;
      wouldWorkAgain: boolean;
    },
  ): Promise<Escrow> {
    const escrow = await this.findById(escrowId);

    if (escrow.freelancerId !== freelancerId) {
      throw new ForbiddenException('Only the freelancer can review the client');
    }

    if (escrow.status !== EscrowStatus.FREELANCER_REVIEW) {
      throw new BadRequestException('Work must be in freelancer review status');
    }

    escrow.freelancerReviewStatus = ReviewStatus.APPROVED;
    escrow.freelancerRating = reviewData.rating;
    escrow.freelancerReview = reviewData.review;
    escrow.freelancerReviewedAt = new Date();
    escrow.freelancerReviewData = {
      payment: reviewData.payment,
      communication: reviewData.communication,
      clarity: reviewData.clarity,
      fairness: reviewData.fairness,
      overall: reviewData.rating,
      comments: reviewData.review,
      wouldWorkAgain: reviewData.wouldWorkAgain,
    };

    // If client has also reviewed, move to completed
    if (escrow.clientReviewStatus !== ReviewStatus.PENDING) {
      escrow.status = EscrowStatus.COMPLETED;
      escrow.completedAt = new Date();
    }

    return this.escrowRepository.save(escrow);
  }

  async releaseFunds(escrowId: string): Promise<Escrow> {
    const escrow = await this.findById(escrowId);

    if (!escrow.canBeReleased) {
      throw new BadRequestException('Funds cannot be released yet');
    }

    // Create payment for freelancer
    const freelancerPayment = this.paymentRepository.create({
      userId: escrow.freelancerId,
      type: PaymentType.MARKETPLACE_PURCHASE,
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.WALLET,
      processor: PaymentProcessor.INTERNAL,
      amount: escrow.freelancerAmount,
      currency: escrow.currency,
      totalAmount: escrow.freelancerAmount,
      reference: this.generatePaymentReference(),
      metadata: {
        jobId: escrow.jobId,
        description: `Payment for job: ${escrow.metadata.jobTitle}`,
      },
      completedAt: new Date(),
    });

    await this.paymentRepository.save(freelancerPayment);

    // Update escrow
    escrow.status = EscrowStatus.COMPLETED;
    escrow.releasedAt = new Date();

    // Add to payment history
    escrow.paymentHistory = [
      ...(escrow.paymentHistory || []),
      {
        id: this.generateId(),
        type: 'final_payment',
        amount: escrow.freelancerAmount,
        description: 'Final payment released to freelancer',
        processedAt: new Date(),
        transactionId: freelancerPayment.reference,
      },
    ];

    // Update job status
    await this.jobRepository.update(escrow.jobId, {
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
    });

    return this.escrowRepository.save(escrow);
  }

  async disputeEscrow(
    escrowId: string,
    userId: string,
    reason: string,
    evidence: string[] = [],
  ): Promise<Escrow> {
    const escrow = await this.findById(escrowId);

    if (escrow.clientId !== userId && escrow.freelancerId !== userId) {
      throw new ForbiddenException('Only parties involved can dispute');
    }

    if (escrow.status === EscrowStatus.COMPLETED) {
      throw new BadRequestException('Cannot dispute completed escrow');
    }

    escrow.status = EscrowStatus.DISPUTED;
    escrow.isDisputed = true;
    escrow.disputeReason = reason;
    escrow.disputedAt = new Date();
    escrow.disputeData = {
      initiator: escrow.clientId === userId ? 'client' : 'freelancer',
      reason,
      evidence,
      resolution: '',
      resolvedBy: '',
      resolvedAt: null,
    };

    return this.escrowRepository.save(escrow);
  }

  async resolveDispute(
    escrowId: string,
    resolution: string,
    resolvedBy: string,
    action: 'release' | 'refund' | 'partial',
    amounts?: { client: number; freelancer: number },
  ): Promise<Escrow> {
    const escrow = await this.findById(escrowId);

    if (escrow.status !== EscrowStatus.DISPUTED) {
      throw new BadRequestException('Escrow is not in disputed status');
    }

    escrow.disputeData.resolution = resolution;
    escrow.disputeData.resolvedBy = resolvedBy;
    escrow.disputeData.resolvedAt = new Date();

    if (action === 'release') {
      escrow.status = EscrowStatus.COMPLETED;
      escrow.releasedAt = new Date();
    } else if (action === 'refund') {
      escrow.status = EscrowStatus.REFUNDED;
      escrow.refundedAt = new Date();
    } else if (action === 'partial' && amounts) {
      // Handle partial release/refund
      escrow.status = EscrowStatus.COMPLETED;
      escrow.releasedAt = new Date();
    }

    return this.escrowRepository.save(escrow);
  }

  async findById(id: string): Promise<Escrow> {
    const escrow = await this.escrowRepository.findOne({
      where: { id },
      relations: ['job', 'client', 'freelancer'],
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    return escrow;
  }

  async findByJobId(jobId: string): Promise<Escrow> {
    const escrow = await this.escrowRepository.findOne({
      where: { jobId },
      relations: ['job', 'client', 'freelancer'],
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found for this job');
    }

    return escrow;
  }

  async findByUser(
    userId: string,
    role: 'client' | 'freelancer',
  ): Promise<Escrow[]> {
    const whereClause =
      role === 'client' ? { clientId: userId } : { freelancerId: userId };

    return this.escrowRepository.find({
      where: whereClause,
      relations: ['job', 'client', 'freelancer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getEscrowStats(): Promise<any> {
    const stats = await this.escrowRepository
      .createQueryBuilder('escrow')
      .select([
        'COUNT(*) as totalEscrows',
        'COUNT(CASE WHEN escrow.status = :fundedStatus THEN 1 END) as fundedEscrows',
        'COUNT(CASE WHEN escrow.status = :inProgressStatus THEN 1 END) as inProgressEscrows',
        'COUNT(CASE WHEN escrow.status = :completedStatus THEN 1 END) as completedEscrows',
        'COUNT(CASE WHEN escrow.status = :disputedStatus THEN 1 END) as disputedEscrows',
        'SUM(CASE WHEN escrow.status = :completedStatus THEN escrow.totalAmount ELSE 0 END) as totalAmount',
        'SUM(CASE WHEN escrow.status = :completedStatus THEN escrow.platformFee ELSE 0 END) as totalPlatformFees',
      ])
      .setParameters({
        fundedStatus: EscrowStatus.FUNDED,
        inProgressStatus: EscrowStatus.IN_PROGRESS,
        completedStatus: EscrowStatus.COMPLETED,
        disputedStatus: EscrowStatus.DISPUTED,
      })
      .getRawOne();

    return stats;
  }

  private generateEscrowReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ESCROW-${timestamp}-${random}`;
  }

  private generatePaymentReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
