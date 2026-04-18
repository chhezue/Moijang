import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./schema/user.schema";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserWithUniversity } from "./types/user.types";

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private usersModel: Model<User>,
  ) {}

  async findAll(): Promise<UserWithUniversity[]> {
    return (await this.usersModel
      .find()
      .populate({ path: "universityId", select: "name" })
      .exec()) as unknown as UserWithUniversity[];
  }

  async findOneById(uuid: string): Promise<UserWithUniversity | null> {
    return (await this.usersModel
      .findById(uuid)
      .populate({ path: "universityId", select: "name" })
      .exec()) as unknown as UserWithUniversity | null;
  }

  async findOneByLoginId(loginId: string): Promise<UserWithUniversity | null> {
    return (await this.usersModel
      .findOne({ loginId })
      .populate({ path: "universityId", select: "name" })
      .exec()) as unknown as UserWithUniversity | null;
  }

  async findOneByUniversityEmail(
    universityEmail: string,
  ): Promise<UserWithUniversity | null> {
    return (await this.usersModel
      .findOne({ universityEmail })
      .populate({ path: "universityId", select: "name" })
      .exec()) as unknown as UserWithUniversity | null;
  }

  async createOne(
    user: CreateUserDto,
    hashPassword: string,
  ): Promise<UserWithUniversity> {
    const createdUser = await this.usersModel.create({
      ...user,
      password: hashPassword,
    });

    // 생성된 유저에 대해서도 대학교 이름과 함께 반환
    return (await createdUser.populate({
      path: "universityId",
      select: "name",
    })) as unknown as UserWithUniversity;
  }
}
