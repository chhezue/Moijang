import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRepository } from "./user.repository";
import { GetUserDto } from "./dto/get-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserWithUniversity } from "./user.types";

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUsers(): Promise<GetUserDto[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => this.mapUserToDto(user));
  }

  async getUserByUuid(id: string): Promise<GetUserDto> {
    const user = await this.userRepository.findOneByUuid(id);
    if (!user) {
      throw new NotFoundException(`사용자 ${id}를 찾을 수 없습니다.`);
    }
    return this.mapUserToDto(user);
  }

  // 유저 생성 (Auth 모듈에서 호출됨)
  async createUser(
    user: CreateUserDto,
    hashPassword: string,
  ): Promise<GetUserDto> {
    const createdUser = await this.userRepository.createOne(user, hashPassword);
    return this.mapUserToDto(createdUser);
  }

  private mapUserToDto(user: UserWithUniversity): GetUserDto {
    return {
      loginId: user.loginId,
      name: user.name,
      universityEmail: user.universityEmail,
      universityId: user.universityId._id.toString(),
      universityName: user.universityId.name,
    };
  }
}
