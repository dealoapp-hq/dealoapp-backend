import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { Payment } from './entities/payment.entity';
import { Escrow } from './entities/escrow.entity';
import { Job } from '../jobs/entities/job.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Escrow, Job, User])],
  controllers: [PaymentsController, EscrowController],
  providers: [PaymentsService, EscrowService],
  exports: [PaymentsService, EscrowService],
})
export class PaymentsModule {}
