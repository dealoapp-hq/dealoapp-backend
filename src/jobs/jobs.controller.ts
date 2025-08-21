import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all jobs' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'Filter by client',
  })
  @ApiQuery({
    name: 'assignedFreelancerId',
    required: false,
    description: 'Filter by assigned freelancer',
  })
  @ApiQuery({
    name: 'budgetMin',
    required: false,
    description: 'Minimum budget',
  })
  @ApiQuery({
    name: 'budgetMax',
    required: false,
    description: 'Maximum budget',
  })
  @ApiQuery({
    name: 'isUrgent',
    required: false,
    description: 'Filter urgent jobs',
  })
  @ApiQuery({
    name: 'isFeatured',
    required: false,
    description: 'Filter featured jobs',
  })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async findAll(@Query() filters: any) {
    return this.jobsService.findAll(filters);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured jobs' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of results',
  })
  @ApiResponse({
    status: 200,
    description: 'Featured jobs retrieved successfully',
  })
  async getFeaturedJobs(@Query('limit') limit: number = 10) {
    return this.jobsService.getFeaturedJobs(limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search jobs' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'budgetMin',
    required: false,
    description: 'Minimum budget',
  })
  @ApiQuery({
    name: 'budgetMax',
    required: false,
    description: 'Maximum budget',
  })
  @ApiQuery({
    name: 'skills',
    required: false,
    description: 'Filter by skills',
  })
  @ApiResponse({ status: 200, description: 'Jobs found successfully' })
  async searchJobs(@Query('q') query: string, @Query() filters: any) {
    return this.jobsService.searchJobs(query, filters);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get jobs by client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({
    status: 200,
    description: 'Client jobs retrieved successfully',
  })
  async getJobsByClient(@Param('clientId') clientId: string) {
    return this.jobsService.getJobsByClient(clientId);
  }

  @Get('freelancer/:freelancerId')
  @ApiOperation({ summary: 'Get jobs by freelancer' })
  @ApiParam({ name: 'freelancerId', description: 'Freelancer ID' })
  @ApiResponse({
    status: 200,
    description: 'Freelancer jobs retrieved successfully',
  })
  async getJobsByFreelancer(@Param('freelancerId') freelancerId: string) {
    return this.jobsService.getJobsByFreelancer(freelancerId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get job statistics' })
  @ApiResponse({
    status: 200,
    description: 'Job statistics retrieved successfully',
  })
  async getJobStats() {
    return this.jobsService.getJobStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async findById(@Param('id') id: string) {
    return this.jobsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new job' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  async create(@Request() req, @Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(createJobDto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job updated successfully' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, updateJobDto, req.user.id);
  }

  @Post(':id/assign/:freelancerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign freelancer to job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiParam({ name: 'freelancerId', description: 'Freelancer ID' })
  @ApiResponse({ status: 200, description: 'Freelancer assigned successfully' })
  async assignFreelancer(
    @Param('id') id: string,
    @Param('freelancerId') freelancerId: string,
    @Request() req,
  ) {
    return this.jobsService.assignFreelancer(id, freelancerId, req.user.id);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job completed successfully' })
  async completeJob(@Param('id') id: string, @Request() req) {
    return this.jobsService.completeJob(id, req.user.id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job cancelled successfully' })
  async cancelJob(@Param('id') id: string, @Request() req) {
    return this.jobsService.cancelJob(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job deleted successfully' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.jobsService.delete(id, req.user.id);
  }
}



