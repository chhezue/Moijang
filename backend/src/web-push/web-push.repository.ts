import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { Subscription } from './schema/subscription.schema';
import { SubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class WebPushRepository {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionsModel: Model<Subscription>,
  ) {}

  async findOne(
    query: RootFilterQuery<Subscription>,
  ): Promise<Subscription | null> {
    return this.subscriptionsModel.findOne(query).lean();
  }

  async findAll() {
    return this.subscriptionsModel.find();
  }

  async upsert(userId: string, sub: SubscriptionDto): Promise<Subscription> {
    return await this.subscriptionsModel
      .findOneAndUpdate(
        { userId },
        { ...sub.subscription, userId },
        { new: true, upsert: true }, // 있으면 내용 업데이트, 없으면 생성
      )
      .exec();
  }
}
