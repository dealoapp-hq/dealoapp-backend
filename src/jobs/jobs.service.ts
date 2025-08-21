import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, Like } from 'typeorm';
import { Job, JobStatus, JobType, JobCategory } from './entities/job.entity';
import { Proposal, ProposalStatus } from './entities/proposal.entity';
import { Bid, BidStatus, BidType } from './entities/bid.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreateBidDto } from './dto/create-bid.dto';
import { AiService } from '../ai/ai.service';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    @InjectRepository(Bid)
    private bidRepository: Repository<Bid>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private aiService: AiService,
  ) {}

  async create(createJobDto: CreateJobDto, userId: string): Promise<Job> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const job = this.jobRepository.create({
      ...createJobDto,
      clientId: userId,
      client: user,
    });

    return this.jobRepository.save(job);
  }

  async findAll(
    filters: {
      category?: JobCategory;
      type?: JobType;
      status?: JobStatus;
      budgetMin?: number;
      budgetMax?: number;
      skills?: string[];
      location?: string;
      isUrgent?: boolean;
      isFeatured?: boolean;
    },
    page: number = 1,
    limit: number = 20,
  ): Promise<{ jobs: Job[]; total: number; page: number; totalPages: number }> {
    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.client', 'client')
      .where('job.status = :status', { status: JobStatus.OPEN });

    if (filters.category) {
      queryBuilder.andWhere('job.category = :category', {
        category: filters.category,
      });
    }

    if (filters.type) {
      queryBuilder.andWhere('job.type = :type', { type: filters.type });
    }

    if (filters.budgetMin && filters.budgetMax) {
      queryBuilder.andWhere(
        '(job.budgetMin BETWEEN :min AND :max OR job.budgetMax BETWEEN :min AND :max)',
        { min: filters.budgetMin, max: filters.budgetMax },
      );
    }

    if (filters.skills && filters.skills.length > 0) {
      queryBuilder.andWhere('JSON_OVERLAPS(job.skills, :skills)', {
        skills: JSON.stringify(filters.skills),
      });
    }

    if (filters.location) {
      queryBuilder.andWhere('client.location LIKE :location', {
        location: `%${filters.location}%`,
      });
    }

    if (filters.isUrgent) {
      queryBuilder.andWhere('job.isUrgent = :isUrgent', { isUrgent: true });
    }

    if (filters.isFeatured) {
      queryBuilder.andWhere('job.isFeatured = :isFeatured', {
        isFeatured: true,
      });
    }

    // Order by featured, urgent, then by creation date
    queryBuilder.orderBy('job.isFeatured', 'DESC');
    queryBuilder.addOrderBy('job.isUrgent', 'DESC');
    queryBuilder.addOrderBy('job.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const jobs = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Job> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['client', 'assignedFreelancer'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async update(
    id: string,
    updateJobDto: UpdateJobDto,
    userId: string,
  ): Promise<Job> {
    const job = await this.findById(id);

    if (job.clientId !== userId) {
      throw new ForbiddenException('You can only update your own jobs');
    }

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Cannot update job that is not open');
    }

    Object.assign(job, updateJobDto);
    return this.jobRepository.save(job);
  }

  async remove(id: string, userId: string): Promise<void> {
    const job = await this.findById(id);

    if (job.clientId !== userId) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    await this.jobRepository.remove(job);
  }

  async assignFreelancer(
    jobId: string,
    freelancerId: string,
    clientId: string,
  ): Promise<Job> {
    const job = await this.findById(jobId);

    if (job.clientId !== clientId) {
      throw new ForbiddenException(
        'You can only assign freelancers to your own jobs',
      );
    }

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Job is not available for assignment');
    }

    if (job.assignedFreelancerId) {
      throw new BadRequestException('Job is already assigned to a freelancer');
    }

    job.assignedFreelancerId = freelancerId;
    job.status = JobStatus.IN_PROGRESS;
    job.assignedAt = new Date();

    return this.jobRepository.save(job);
  }

  async completeJob(jobId: string, userId: string): Promise<Job> {
    const job = await this.findById(jobId);

    if (job.clientId !== userId && job.assignedFreelancerId !== userId) {
      throw new ForbiddenException(
        'You can only complete jobs you own or are assigned to',
      );
    }

    job.status = JobStatus.COMPLETED;
    job.completedAt = new Date();

    return this.jobRepository.save(job);
  }

  // Advanced AI-powered job matching
  async getRecommendedJobs(userId: string, limit: number = 10): Promise<Job[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'skills',
        'experience',
        'rating',
        'completedJobs',
        'location',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get jobs that match user skills
    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.client', 'client')
      .where('job.status = :status', { status: JobStatus.OPEN });

    if (user.skills && user.skills.length > 0) {
      queryBuilder.andWhere('JSON_OVERLAPS(job.skills, :skills)', {
        skills: JSON.stringify(user.skills),
      });
    }

    const jobs = await queryBuilder
      .orderBy('job.isFeatured', 'DESC')
      .addOrderBy('job.isUrgent', 'DESC')
      .addOrderBy('job.createdAt', 'DESC')
      .take(limit)
      .getMany();

    // Use AI to score and rank jobs
    const scoredJobs = await Promise.all(
      jobs.map(async (job) => {
        const matchAnalysis = await this.aiService.analyzeJobMatch(
          user,
          job.description,
        );
        return {
          ...job,
          aiScore: matchAnalysis.matchPercentage,
          recommendations: matchAnalysis.recommendations,
        };
      }),
    );

    // Sort by AI score
    return jobs;
  }

  // Smart bidding system
  async createBid(
    jobId: string,
    createBidDto: CreateBidDto,
    freelancerId: string,
  ): Promise<Bid> {
    const job = await this.findById(jobId);
    const freelancer = await this.userRepository.findOne({
      where: { id: freelancerId },
    });

    if (!freelancer) {
      throw new NotFoundException('Freelancer not found');
    }

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Job is not open for bidding');
    }

    // Check if freelancer already has a bid on this job
    const existingBid = await this.bidRepository.findOne({
      where: { jobId, freelancerId, status: BidStatus.ACTIVE },
    });

    if (existingBid) {
      throw new BadRequestException(
        'You already have an active bid on this job',
      );
    }

    // Use AI to optimize the bid
    const optimizedBid = await this.aiService.optimizeProposal(
      job.description,
      freelancer,
      createBidDto.proposal,
    );

    const bid = this.bidRepository.create({
      ...createBidDto,
      jobId,
      freelancerId,
      freelancer,
      job,
      proposal: optimizedBid.optimizedCoverLetter,
      aiScore: {
        relevanceScore: 0,
        skillMatchScore: 0,
        experienceScore: 0,
        pricingScore: 0,
        overallScore: 0,
        recommendations: optimizedBid.keyPoints,
      },
    });

    return this.bidRepository.save(bid as any);
  }

  // Get competitive analysis for bidding
  async getBiddingInsights(jobId: string, freelancerId: string): Promise<any> {
    const job = await this.findById(jobId);
    const freelancer = await this.userRepository.findOne({
      where: { id: freelancerId },
    });

    // Get all bids for this job
    const bids = await this.bidRepository.find({
      where: { jobId, status: BidStatus.ACTIVE },
      relations: ['freelancer'],
    });

    // Analyze market trends
    const marketTrends = await this.aiService.analyzeMarketTrends(
      job.category,
      job.skills || [],
    );

    // Get competitor analysis
    const competitorAnalysis = await this.aiService.analyzeCompetitorProfile({
      job,
      bids,
      freelancer,
    });

    return {
      totalBids: bids.length,
      averageBidAmount:
        bids.reduce((sum, bid) => sum + bid.amount, 0) / bids.length,
      marketTrends,
      competitorAnalysis,
      recommendedBidRange: {
        min: Math.min(...bids.map((b) => b.amount)) * 0.9,
        max: Math.max(...bids.map((b) => b.amount)) * 1.1,
      },
    };
  }

  // AI-powered proposal optimization
  async optimizeProposal(
    jobId: string,
    draftProposal: string,
    freelancerId: string,
  ): Promise<any> {
    const job = await this.findById(jobId);
    const freelancer = await this.userRepository.findOne({
      where: { id: freelancerId },
    });

    if (!freelancer) {
      throw new NotFoundException('Freelancer not found');
    }

    return this.aiService.optimizeProposal(
      job.description,
      freelancer,
      draftProposal,
    );
  }

  // Smart job search with AI recommendations
  async searchJobs(
    query: string,
    filters: any,
    userId?: string,
  ): Promise<{ jobs: Job[]; suggestions: string[]; relatedSkills: string[] }> {
    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.client', 'client')
      .where('job.status = :status', { status: JobStatus.OPEN });

    if (query) {
      queryBuilder.andWhere(
        '(job.title LIKE :query OR job.description LIKE :query OR job.skills LIKE :query)',
        { query: `%${query}%` },
      );
    }

    // Apply filters
    if (filters.category) {
      queryBuilder.andWhere('job.category = :category', {
        category: filters.category,
      });
    }

    if (filters.budgetMin && filters.budgetMax) {
      queryBuilder.andWhere(
        '(job.budgetMin BETWEEN :min AND :max OR job.budgetMax BETWEEN :min AND :max)',
        { min: filters.budgetMin, max: filters.budgetMax },
      );
    }

    const jobs = await queryBuilder
      .orderBy('job.isFeatured', 'DESC')
      .addOrderBy('job.createdAt', 'DESC')
      .take(50)
      .getMany();

    // Generate AI-powered suggestions
    const suggestions = await this.generateSearchSuggestions(query, jobs);
    const relatedSkills = await this.extractRelatedSkills(jobs);

    return { jobs, suggestions, relatedSkills };
  }

  async getFeaturedJobs(limit: number = 10): Promise<Job[]> {
    return this.jobRepository.find({
      where: { isFeatured: true, status: JobStatus.OPEN },
      relations: ['client'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getJobsByClient(clientId: string): Promise<Job[]> {
    return this.jobRepository.find({
      where: { clientId },
      relations: ['client', 'assignedFreelancer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getJobsByFreelancer(freelancerId: string): Promise<Job[]> {
    return this.jobRepository.find({
      where: { assignedFreelancerId: freelancerId },
      relations: ['client', 'assignedFreelancer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getJobStats(): Promise<any> {
    const stats = await this.jobRepository
      .createQueryBuilder('job')
      .select([
        'COUNT(*) as totalJobs',
        'COUNT(CASE WHEN job.status = :openStatus THEN 1 END) as openJobs',
        'COUNT(CASE WHEN job.status = :inProgressStatus THEN 1 END) as inProgressJobs',
        'COUNT(CASE WHEN job.status = :completedStatus THEN 1 END) as completedJobs',
        'AVG(job.budgetMin) as avgBudgetMin',
        'AVG(job.budgetMax) as avgBudgetMax',
      ])
      .setParameters({
        openStatus: JobStatus.OPEN,
        inProgressStatus: JobStatus.IN_PROGRESS,
        completedStatus: JobStatus.COMPLETED,
      })
      .getRawOne();

    return stats;
  }

  async cancelJob(id: string, userId: string): Promise<Job> {
    const job = await this.findById(id);

    if (job.clientId !== userId) {
      throw new ForbiddenException('Only the job owner can cancel the job');
    }

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Only open jobs can be cancelled');
    }

    job.status = JobStatus.CANCELLED;
    return this.jobRepository.save(job);
  }

  async delete(id: string, userId: string): Promise<void> {
    const job = await this.findById(id);

    if (job.clientId !== userId) {
      throw new ForbiddenException('Only the job owner can delete the job');
    }

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Only open jobs can be deleted');
    }

    await this.jobRepository.remove(job);
  }

  private async generateSearchSuggestions(
    query: string,
    jobs: Job[],
  ): Promise<string[]> {
    // Extract common terms from job titles and descriptions
    const terms = jobs.flatMap((job) => [
      ...job.title.split(' '),
      ...job.description.split(' ').slice(0, 20), // First 20 words
      ...(job.skills || []),
    ]);

    // Count frequency and return top suggestions
    const termCount = terms.reduce((acc, term) => {
      const cleanTerm = term.toLowerCase().replace(/[^\w]/g, '');
      if (cleanTerm.length > 2) {
        acc[cleanTerm] = (acc[cleanTerm] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(termCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([term]) => term);
  }

  private async extractRelatedSkills(jobs: Job[]): Promise<string[]> {
    const allSkills = jobs.flatMap((job) => job.skills || []);
    const skillCount = allSkills.reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(skillCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 15)
      .map(([skill]) => skill);
  }
}
