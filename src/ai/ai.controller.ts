import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI Services')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-course')
  @ApiOperation({ summary: 'Generate course from YouTube video' })
  @ApiResponse({ status: 200, description: 'Course generated successfully' })
  async generateCourseFromYouTube(
    @Body() body: { url: string; topic: string },
  ) {
    return this.aiService.generateCourseFromYouTube(body.url, body.topic);
  }

  @Post('generate-quiz')
  @ApiOperation({ summary: 'Generate quiz from content' })
  @ApiResponse({ status: 200, description: 'Quiz generated successfully' })
  async generateQuizFromContent(
    @Body() body: { content: string; topic: string },
  ) {
    return this.aiService.generateQuizFromContent(body.content, body.topic);
  }

  @Post('learning-path')
  @ApiOperation({ summary: 'Generate personalized learning path' })
  @ApiResponse({
    status: 200,
    description: 'Learning path generated successfully',
  })
  async generateLearningPath(
    @Body() body: { userSkills: string[]; targetRole: string },
  ) {
    return this.aiService.generateLearningPath(
      body.userSkills,
      body.targetRole,
    );
  }

  @Post('job-match')
  @ApiOperation({ summary: 'Analyze job match for user' })
  @ApiResponse({ status: 200, description: 'Job match analyzed successfully' })
  async analyzeJobMatch(
    @Body() body: { userProfile: any; jobDescription: string },
  ) {
    return this.aiService.analyzeJobMatch(
      body.userProfile,
      body.jobDescription,
    );
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get personalized recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Recommendations generated successfully',
  })
  async getPersonalizedRecommendations(
    @Request() req,
    @Query() query: { behavior: string },
  ) {
    const userBehavior = JSON.parse(query.behavior || '{}');
    return this.aiService.generatePersonalizedRecommendations(
      req.user.id,
      userBehavior,
    );
  }

  // New Professional Guidance Endpoints
  @Post('credibility-building')
  @ApiOperation({ summary: 'Get credibility building strategies' })
  @ApiResponse({ status: 200, description: 'Credibility strategies generated' })
  async getCredibilityStrategies(
    @Request() req,
    @Body()
    body: { userProfile: any; industry: string; targetAudience: string },
  ) {
    return this.aiService.generateCredibilityStrategies(
      req.user.id,
      body.userProfile,
      body.industry,
      body.targetAudience,
    );
  }

  @Post('badge-earning')
  @ApiOperation({ summary: 'Get badge earning strategies' })
  @ApiResponse({ status: 200, description: 'Badge strategies generated' })
  async getBadgeStrategies(
    @Request() req,
    @Body()
    body: { currentBadges: string[]; skills: string[]; goals: string[] },
  ) {
    return this.aiService.generateBadgeStrategies(
      req.user.id,
      body.currentBadges,
      body.skills,
      body.goals,
    );
  }

  @Post('reputation-building')
  @ApiOperation({ summary: 'Get reputation building strategies' })
  @ApiResponse({ status: 200, description: 'Reputation strategies generated' })
  async getReputationStrategies(
    @Request() req,
    @Body()
    body: { currentRating: number; completedJobs: number; reviews: any[] },
  ) {
    return this.aiService.generateReputationStrategies(
      req.user.id,
      body.currentRating,
      body.completedJobs,
      body.reviews,
    );
  }

  @Post('engagement-optimization')
  @ApiOperation({ summary: 'Get engagement optimization strategies' })
  @ApiResponse({ status: 200, description: 'Engagement strategies generated' })
  async getEngagementStrategies(
    @Request() req,
    @Body()
    body: {
      profileViews: number;
      responseRate: number;
      avgResponseTime: number;
    },
  ) {
    return this.aiService.generateEngagementStrategies(
      req.user.id,
      body.profileViews,
      body.responseRate,
      body.avgResponseTime,
    );
  }

  @Post('proposal-optimization')
  @ApiOperation({ summary: 'Optimize job proposal' })
  @ApiResponse({ status: 200, description: 'Proposal optimized successfully' })
  async optimizeProposal(
    @Body()
    body: {
      jobDescription: string;
      userProfile: any;
      draftProposal: string;
    },
  ) {
    return this.aiService.optimizeProposal(
      body.jobDescription,
      body.userProfile,
      body.draftProposal,
    );
  }

  @Post('market-trends')
  @ApiOperation({ summary: 'Analyze market trends' })
  @ApiResponse({ status: 200, description: 'Market trends analyzed' })
  async analyzeMarketTrends(
    @Body() body: { industry: string; skills: string[] },
  ) {
    return this.aiService.analyzeMarketTrends(body.industry, body.skills);
  }

  @Post('smart-job-description')
  @ApiOperation({ summary: 'Generate smart job description' })
  @ApiResponse({ status: 200, description: 'Job description generated' })
  async generateSmartJobDescription(
    @Body() body: { clientRequirements: string; industry: string },
  ) {
    return this.aiService.generateSmartJobDescription(
      body.clientRequirements,
      body.industry,
    );
  }

  @Post('competitor-analysis')
  @ApiOperation({ summary: 'Analyze competitor profile' })
  @ApiResponse({ status: 200, description: 'Competitor analysis completed' })
  async analyzeCompetitorProfile(@Body() body: { competitorData: any }) {
    return this.aiService.analyzeCompetitorProfile(body.competitorData);
  }

  @Post('skill-endorsement-request')
  @ApiOperation({ summary: 'Generate skill endorsement request' })
  @ApiResponse({ status: 200, description: 'Endorsement request generated' })
  async generateSkillEndorsementRequest(
    @Body() body: { skill: string; endorserProfile: any },
  ) {
    return this.aiService.generateSkillEndorsementRequest(
      body.skill,
      body.endorserProfile,
    );
  }

  @Post('career-path-guidance')
  @ApiOperation({ summary: 'Get career path guidance' })
  @ApiResponse({ status: 200, description: 'Career guidance generated' })
  async getCareerPathGuidance(
    @Request() req,
    @Body()
    body: { currentRole: string; experience: number; aspirations: string[] },
  ) {
    return this.aiService.generateCareerPathGuidance(
      req.user.id,
      body.currentRole,
      body.experience,
      body.aspirations,
    );
  }

  @Post('networking-strategies')
  @ApiOperation({ summary: 'Get networking strategies' })
  @ApiResponse({ status: 200, description: 'Networking strategies generated' })
  async getNetworkingStrategies(
    @Request() req,
    @Body()
    body: { industry: string; currentConnections: number; goals: string[] },
  ) {
    return this.aiService.generateNetworkingStrategies(
      req.user.id,
      body.industry,
      body.currentConnections,
      body.goals,
    );
  }

  @Post('portfolio-optimization')
  @ApiOperation({ summary: 'Optimize portfolio' })
  @ApiResponse({ status: 200, description: 'Portfolio optimization completed' })
  async optimizePortfolio(
    @Request() req,
    @Body() body: { portfolioData: any; targetJobs: string[] },
  ) {
    return this.aiService.optimizePortfolio(
      req.user.id,
      body.portfolioData,
      body.targetJobs,
    );
  }
}
