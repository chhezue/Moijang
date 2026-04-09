import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./schema/user.schema";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private usersModel: Model<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersModel.find();
  }

  async findOneByUuid(uuid: string): Promise<User | null> {
    return this.usersModel.findById(uuid);
  }

  async createOne(user: CreateUserDto, hashPassword: string): Promise<User> {
    return this.usersModel.create({
      ...user,
      password: hashPassword,
    });
  }
}
