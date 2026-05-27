import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentRepository } from './payment.repository';
import { ReservationService } from './reservation.service';
import { TossPaymentsClient } from './toss/toss-payments.client';
import { Payment, PaymentSchema } from './schema/payment.schema';
import { Reservation, ReservationSchema } from './schema/reservation.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository, ReservationService, TossPaymentsClient],
  exports: [PaymentService],
})
export class PaymentModule {}
