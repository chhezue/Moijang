import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentRepository } from './payment.repository';
import { TossPaymentsClient } from './toss/toss-payments.client';
import { Payment, PaymentSchema } from './schema/payment.schema';
import { GroupBuyingQueryModule } from '../group-buying/query/group-buying-query.module';
import { ParticipantModule } from '../participant/participant.module';
import { ParticipantQueryModule } from '../participant/query/participant-query.module';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    GroupBuyingQueryModule, // 공구 정보를 얻어올 때 필요
    ParticipantModule, // 참여자 생성/삭제 시 필요
    ParticipantQueryModule, // 참여자 조회 시 필요
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository, TossPaymentsClient],
  exports: [PaymentService],
})
export class PaymentModule {}
