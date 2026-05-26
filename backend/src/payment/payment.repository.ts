import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from './schema/payment.schema';
import { PaymentStatus } from './const/payment.const';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,
  ) {}

  async create(doc: any): Promise<Payment> {
    return this.paymentModel.create(doc);
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentModel.findOne({ orderId }).exec();
  }

  async findByPaymentKey(paymentKey: string): Promise<Payment | null> {
    return this.paymentModel.findOne({ paymentKey }).exec();
  }

  async updateStatus(
    orderId: string,
    updates: {
      status: PaymentStatus;
      paymentKey?: string;
      approvedAt?: string | Date | null;
    },
  ): Promise<void> {
    const $set: Record<string, unknown> = { status: updates.status };
    if (updates.paymentKey !== undefined) {
      $set.paymentKey = updates.paymentKey;
    }
    if (updates.approvedAt) {
      $set.paidAt = new Date(updates.approvedAt);
    }
    await this.paymentModel.updateOne({ orderId }, { $set }).exec();
  }

  async updateStatusByPaymentKey(paymentKey: string, status: PaymentStatus): Promise<void> {
    const $set: Record<string, unknown> = { status };
    if (status === PaymentStatus.REFUNDED) {
      $set.refundedAt = new Date();
    }
    await this.paymentModel.updateOne({ paymentKey }, { $set }).exec();
  }
}
