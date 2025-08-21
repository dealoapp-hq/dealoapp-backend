import {
  Controller,
  Get,
  Post,
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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentStatus } from './entities/payment.entity';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user' })
  @ApiQuery({
    name: 'method',
    required: false,
    description: 'Filter by payment method',
  })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async findAll(@Query() filters: any) {
    return this.paymentsService.findAll(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({
    status: 200,
    description: 'Payment statistics retrieved successfully',
  })
  async getPaymentStats() {
    return this.paymentsService.getPaymentStats();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get payments by user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User payments retrieved successfully',
  })
  async getPaymentsByUser(@Param('userId') userId: string) {
    return this.paymentsService.getPaymentsByUser(userId);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get payments by type' })
  @ApiParam({ name: 'type', description: 'Payment type' })
  @ApiResponse({
    status: 200,
    description: 'Payments by type retrieved successfully',
  })
  async getPaymentsByType(@Param('type') type: string) {
    return this.paymentsService.getPaymentsByType(type as any);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findById(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  @Get('reference/:reference')
  @ApiOperation({ summary: 'Get payment by reference' })
  @ApiParam({ name: 'reference', description: 'Payment reference' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findByReference(@Param('reference') reference: string) {
    return this.paymentsService.findByReference(reference);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async create(@Request() req, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto, req.user.id);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Process payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  async processPayment(@Param('id') id: string) {
    return this.paymentsService.processPayment(id);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update payment status' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: PaymentStatus; metadata?: any },
  ) {
    return this.paymentsService.updateStatus(id, body.status, body.metadata);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment refunded successfully' })
  async refundPayment(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.paymentsService.refundPayment(id, body.reason);
  }
}


