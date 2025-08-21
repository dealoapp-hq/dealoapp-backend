import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal, ProposalStatus } from '../entities/proposal.entity';
import { Job, JobStatus } from '../entities/job.entity';
import { User } from '../../users/entities/user.entity';
import { AiService } from '../../ai/ai.service';
import { CreateProposalDto } from '../dto/create-proposal.dto';
import { UpdateProposalDto } from '../dto/update-proposal.dto';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private aiService: AiService,
  ) {}

  async create(
    createProposalDto: CreateProposalDto,
    freelancerId: string,
  ): Promise<Proposal> {
    const job = await this.jobRepository.findOne({
      where: { id: createProposalDto.jobId },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== 'open') {
      throw new BadRequestException('Job is not open for proposals');
    }

    const freelancer = await this.userRepository.findOne({
      where: { id: freelancerId },
    });
    if (!freelancer) {
      throw new NotFoundException('Freelancer not found');
    }

    // Check if freelancer already has a proposal for this job
    const existingProposal = await this.proposalRepository.findOne({
      where: { jobId: createProposalDto.jobId, freelancerId },
    });

    if (existingProposal) {
      throw new BadRequestException('You already have a proposal for this job');
    }

    // Generate AI score for the proposal
    const aiScore = await this.aiService.analyzeJobMatch(
      freelancer,
      job.description,
    );

    const proposal = this.proposalRepository.create({
      ...createProposalDto,
      freelancerId,
      aiScore: {
        relevanceScore: aiScore.matchPercentage,
        skillMatchScore: aiScore.matchPercentage * 0.8,
        experienceScore: freelancer.completedJobs * 2,
        overallScore:
          aiScore.matchPercentage * 0.6 + freelancer.completedJobs * 0.4,
        recommendations: aiScore.recommendations,
      },
    });

    const savedProposal = await this.proposalRepository.save(proposal);

    // Update job proposal count
    await this.jobRepository.update(job.id, {
      proposalsCount: job.proposalsCount + 1,
    });

    return savedProposal;
  }

  async findAll(filters: any = {}): Promise<Proposal[]> {
    const queryBuilder = this.proposalRepository
      .createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.job', 'job')
      .leftJoinAndSelect('proposal.freelancer', 'freelancer');

    if (filters.jobId) {
      queryBuilder.andWhere('proposal.jobId = :jobId', {
        jobId: filters.jobId,
      });
    }

    if (filters.freelancerId) {
      queryBuilder.andWhere('proposal.freelancerId = :freelancerId', {
        freelancerId: filters.freelancerId,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('proposal.status = :status', {
        status: filters.status,
      });
    }

    if (filters.isHighlighted) {
      queryBuilder.andWhere('proposal.isHighlighted = :isHighlighted', {
        isHighlighted: true,
      });
    }

    // Sort by AI score and creation date
    queryBuilder
      .orderBy('proposal.aiScore.overallScore', 'DESC')
      .addOrderBy('proposal.createdAt', 'ASC');

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Proposal> {
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ['job', 'freelancer'],
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return proposal;
  }

  async update(
    id: string,
    updateProposalDto: UpdateProposalDto,
    freelancerId: string,
  ): Promise<Proposal> {
    const proposal = await this.findOne(id);

    if (proposal.freelancerId !== freelancerId) {
      throw new ForbiddenException('You can only update your own proposals');
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException('Cannot update non-pending proposal');
    }

    // If proposal content is being updated, regenerate AI score
    if (updateProposalDto.coverLetter || updateProposalDto.proposedAmount) {
      const job = await this.jobRepository.findOne({
        where: { id: proposal.jobId },
      });
      const freelancer = await this.userRepository.findOne({
        where: { id: freelancerId },
      });

      if (job && freelancer) {
        const aiScore = await this.aiService.analyzeJobMatch(
          freelancer,
          job.description,
        );

        (updateProposalDto as any).aiScore = {
          relevanceScore: aiScore.matchPercentage,
          skillMatchScore: aiScore.matchPercentage * 0.8,
          experienceScore: freelancer.completedJobs * 2,
          overallScore:
            aiScore.matchPercentage * 0.6 + freelancer.completedJobs * 0.4,
          recommendations: aiScore.recommendations,
        };
      }
    }

    await this.proposalRepository.update(id, updateProposalDto);
    return this.findOne(id);
  }

  async accept(id: string, clientId: string): Promise<Proposal> {
    const proposal = await this.findOne(id);
    const job = await this.jobRepository.findOne({
      where: { id: proposal.jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.clientId !== clientId) {
      throw new ForbiddenException('Only the job owner can accept proposals');
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException('Proposal is not pending');
    }

    // Update proposal status
    await this.proposalRepository.update(id, {
      status: ProposalStatus.ACCEPTED,
      acceptedAt: new Date(),
    });

    // Update job status and assign freelancer
    await this.jobRepository.update(job.id, {
      status: JobStatus.IN_PROGRESS,
      assignedFreelancerId: proposal.freelancerId,
      assignedAt: new Date(),
    });

    // Reject all other proposals for this job
    await this.proposalRepository.update(
      { jobId: proposal.jobId, status: ProposalStatus.PENDING },
      { status: ProposalStatus.REJECTED, rejectedAt: new Date() },
    );

    return this.findOne(id);
  }

  async reject(
    id: string,
    clientId: string,
    reason?: string,
  ): Promise<Proposal> {
    const proposal = await this.findOne(id);
    const job = await this.jobRepository.findOne({
      where: { id: proposal.jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.clientId !== clientId) {
      throw new ForbiddenException('Only the job owner can reject proposals');
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException('Proposal is not pending');
    }

    await this.proposalRepository.update(id, {
      status: ProposalStatus.REJECTED,
      rejectionReason: reason,
      rejectedAt: new Date(),
    });

    return this.findOne(id);
  }

  async withdraw(id: string, freelancerId: string): Promise<Proposal> {
    const proposal = await this.findOne(id);

    if (proposal.freelancerId !== freelancerId) {
      throw new ForbiddenException('You can only withdraw your own proposals');
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException('Cannot withdraw non-pending proposal');
    }

    await this.proposalRepository.update(id, {
      status: ProposalStatus.WITHDRAWN,
      withdrawnAt: new Date(),
    });

    return this.findOne(id);
  }

  async optimizeProposal(id: string, freelancerId: string): Promise<any> {
    const proposal = await this.findOne(id);

    if (proposal.freelancerId !== freelancerId) {
      throw new ForbiddenException('You can only optimize your own proposals');
    }

    const job = await this.jobRepository.findOne({
      where: { id: proposal.jobId },
    });
    const freelancer = await this.userRepository.findOne({
      where: { id: freelancerId },
    });

    if (!job || !freelancer) {
      throw new NotFoundException('Job or freelancer not found');
    }

    return this.aiService.optimizeProposal(
      job.description,
      freelancer,
      proposal.coverLetter,
    );
  }

  async getProposalInsights(jobId: string): Promise<any> {
    const proposals = await this.proposalRepository.find({
      where: { jobId, status: ProposalStatus.PENDING },
      relations: ['freelancer'],
    });

    if (proposals.length === 0) {
      return {
        totalProposals: 0,
        averageAmount: 0,
        topSkills: [],
        recommendations: [],
      };
    }

    const amounts = proposals.map((p) => p.proposedAmount);
    const skills = proposals.flatMap((p) => p.freelancer.skills || []);

    // Count skill frequency
    const skillCount = skills.reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {});

    const topSkills = Object.entries(skillCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([skill]) => skill);

    return {
      totalProposals: proposals.length,
      averageAmount:
        amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length,
      minAmount: Math.min(...amounts),
      maxAmount: Math.max(...amounts),
      topSkills,
      recommendations: [
        'Consider highlighting your unique value proposition',
        'Include relevant portfolio items',
        'Provide detailed project timeline',
        'Offer competitive pricing',
      ],
    };
  }

  async highlightProposal(id: string, freelancerId: string): Promise<Proposal> {
    const proposal = await this.findOne(id);

    if (proposal.freelancerId !== freelancerId) {
      throw new ForbiddenException('You can only highlight your own proposals');
    }

    // Check if freelancer has enough credits/points to highlight
    const freelancer = await this.userRepository.findOne({
      where: { id: freelancerId },
    });

    if (!freelancer) {
      throw new NotFoundException('Freelancer not found');
    }

    if (!freelancer || freelancer.points < 100) {
      throw new BadRequestException(
        'Insufficient points to highlight proposal',
      );
    }

    await this.proposalRepository.update(id, { isHighlighted: true });

    // Deduct points from freelancer
    await this.userRepository.update(freelancerId, {
      points: freelancer.points - 100,
    });

    return this.findOne(id);
  }
}
