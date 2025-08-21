import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EscrowService } from './escrow.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEscrowDto } from './dto/create-escrow.dto';
import { ClientReviewDto } from './dto/client-review.dto';
import { FreelancerReviewDto } from './dto/freelancer-review.dto';

@ApiTags('Escrow Management')
@Controller('escrow')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create escrow for a job' })
  @ApiResponse({ status: 201, description: 'Escrow created successfully' })
  async createEscrow(@Request() req, @Body() createEscrowDto: CreateEscrowDto) {
    return this.escrowService.createEscrow(
      createEscrowDto.jobId,
      req.user.id,
      createEscrowDto.freelancerId,
      createEscrowDto.amount,
      createEscrowDto.currency || 'NGN',
    );
  }

  @Post(':id/fund')
  @ApiOperation({ summary: 'Fund escrow with payment' })
  @ApiResponse({ status: 200, description: 'Escrow funded successfully' })
  @ApiParam({ name: 'id', description: 'Escrow ID' })
  async fundEscrow(
    @Param('id') escrowId: string,
    @Body() body: { paymentId: string },
  ) {
    return this.escrowService.fundEscrow(escrowId, body.paymentId);
  }

  @Post(':id/start-work')
  @ApiOperation({ summary: 'Start work on escrow' })
  @ApiResponse({ status: 200, description: 'Work started successfully' })
  @ApiParam({ name: 'id', description: 'Escrow ID' })
  async startWork(@Param('id') escrowId: string, @Request() req) {
    return this.escrowService.startWork(escrowId, req.user.id);
  }

  @Post(':id/submit-review')
  @ApiOperation({ summary: 'Submit work for client review' })
  @ApiResponse({ status: 200, description: 'Work submitted for review' })
  @ApiParam({ name: 'id', description: 'Escrow ID' })
  async submitForReview(
    @Param('id') escrowId: string,
    @Request() req,
    @Body() body: { deliverables: any[] },
  ) {
    return this.escrowService.submitForReview(
      escrowId,
      req.user.id,
      body.deliverables,
    );
  }

  @Post(':id/client-review')
  @ApiOperation({ summary: 'Client review of completed work' })
  @ApiResponse({ status: 200, description: 'Client review submitted' })
  @ApiParam({ name: 'id', description: 'Escrow ID' })
  async clientReview(
    @Param('id') escrowId: string,
    @Request() req,
    @Body() clientReviewDto: ClientReviewDto,
  ) {
    return this.escrowService.clientReview(
      escrowId,
      req.user.id,
      clientReviewDto,
    );
  }

  @Post(':id/freelancer-review')
  @ApiOperation({ summary: 'Freelancer review of client' })
  @ApiResponse({ status: 200, description: 'Freelancer review submitted' })
  @ApiParam({ name: 'id', description: 'Escrow ID' })
  async freelancerReview(
    @Param('id') escrowId: string,
    @Request() req,
    @Body() freelancerReviewDto: FreelancerReviewDto,
  ) {
    return this.escrowService.freelancerReview(
      escrowId,
      req.user.id,
      freelancerReviewDto,
    );
  }

  @Post(':id/release-funds')
  @ApiOperation({ summary: 'Release funds to freelancer' })
  @ApiResponse({ status: 200, description: 'Funds released successfully' })
  @ApiParam({ name: 'id', description: 'Escrow ID' })
  async releaseFunds(@Param('id') escrowId: string) {
    return this.escrowService.releaseFunds(escrowId);
  }

  @Post(':id/dispute')
  @ApiOperation({ summary: 'Dispute escrow' })
  @ApiResponse({ status: 200, description: 'Dispute created successfully' })
  @ApiParam({ name: 'id', description: 'Escrow ID' })
  async disputeEscrow(
    @Param('id') escrowId: string,
    @Request() req,
    @Body() body: { reason: string; evidence?: string[] },
  ) {
    return this.escrowService.disputeEscrow(
      escrowId,
      req.user.id,
      body.reason,
      body.evidence || [],
    );
  }

  @Put(':id/resolve-dispute')
  @ApiOperation({ summary: 'Resolve escrow dispute' })
  @ApiResponse({ status: 200, description: 'Dispute resolved successfully' })
  @ApiParam({ name: 'id', description: 'Escrow ID' })
  async resolveDispute(
    @Param('id') escrowId: string,
    @Body()
    body: {
      resolution: string;
      resolvedBy: string;
      action: 'release' | 'refund' | 'partial';
      amounts?: { client: number; freelancer: number };
    },
  ) {
    return this.escrowService.resolveDispute(
      escrowId,
      body.resolution,
      body.resolvedBy,
      body.action,
      body.amounts,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get escrow details' })
  @ApiResponse({ status: 200, description: 'Escrow details retrieved' })
  @ApiParam({ name: 'id', description: 'Escrow ID' })
  async getEscrow(@Param('id') escrowId: string) {
    return this.escrowService.findById(escrowId);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get escrow by job ID' })
  @ApiResponse({ status: 200, description: 'Escrow retrieved' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  async getEscrowByJob(@Param('jobId') jobId: string) {
    return this.escrowService.findByJobId(jobId);
  }

  @Get('user/:role')
  @ApiOperation({ summary: 'Get user escrows' })
  @ApiResponse({ status: 200, description: 'User escrows retrieved' })
  @ApiParam({ name: 'role', description: 'User role (client or freelancer)' })
  async getUserEscrows(
    @Param('role') role: 'client' | 'freelancer',
    @Request() req,
  ) {
    return this.escrowService.findByUser(req.user.id, role);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get escrow statistics' })
  @ApiResponse({ status: 200, description: 'Escrow statistics retrieved' })
  async getEscrowStats() {
    return this.escrowService.getEscrowStats();
  }
}
