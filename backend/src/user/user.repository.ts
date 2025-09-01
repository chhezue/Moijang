import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private usersModel: Model<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersModel.find();
  }

  async findOneByUuid(uuid: string): Promise<User> {
    return this.usersModel.findOne({ id: uuid });
  }

  async upsertOne(user: UserDto): Promise<User> {
    return await this.usersModel
      .findOneAndUpdate(
        { id: user.id },
        { ...user },
        { new: true, upsert: true }, // 있으면 내용 업데이트, 없으면 생성
      )
      .exec();
  }
}
