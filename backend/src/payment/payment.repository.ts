import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from './schema/payment.schema';
import { PaymentStatus } from './const/payment.const';

export type CreatePaymentInput = {
  gbId: string;
  userId: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  countSnapshot: number;
  unitPriceSnapshot: number;
};

export type UpdatePaymentStatusInput = {
  status: PaymentStatus;
  paymentKey?: string;
  /** 토스 승인 시각 — 스키마의 `paidAt`에 저장 */
  approvedAt?: string | Date;
};

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,
  ) {}

  async create(doc: CreatePaymentInput): Promise<Payment> {
    return this.paymentModel.create(doc);
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentModel.findOne({ orderId }).exec();
  }

  async findByPaymentKey(paymentKey: string): Promise<Payment | null> {
    return this.paymentModel.findOne({ paymentKey }).exec();
  }

  async updateStatus(orderId: string, updates: UpdatePaymentStatusInput): Promise<void> {
    const $set: Record<string, unknown> = { status: updates.status };
    if (updates.paymentKey !== undefined) {
      $set.paymentKey = updates.paymentKey;
    }
    if (updates.approvedAt !== undefined) {
      $set.paidAt = new Date(updates.approvedAt);
    }
    await this.paymentModel.updateOne({ orderId }, { $set }).exec();
  }

  async updateStatusByPaymentKey(
    paymentKey: string,
    updates: { status: PaymentStatus },
  ): Promise<void> {
    const $set: Record<string, unknown> = { status: updates.status };
    if (updates.status === PaymentStatus.REFUNDED) {
      $set.refundedAt = new Date();
    }
    await this.paymentModel.updateOne({ paymentKey }, { $set }).exec();
  }
}
