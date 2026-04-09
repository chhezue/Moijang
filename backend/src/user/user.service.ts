import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRepository } from "./user.repository";
import { GetUserDto } from "./dto/get-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { User } from "./schema/user.schema";

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUsers(): Promise<GetUserDto[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => this.mapUserToDto(user));
  }

  async getUserByUuid(id: string): Promise<GetUserDto | null> {
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

  private mapUserToDto(user: User): GetUserDto {
    return {
      loginId: user.loginId,
      displayName: user.displayName,
      universityEmail: user.universityEmail,
      studentNo: user.studentNo,
      isVerified: user.isVerified,
      universityId: user.universityId.toString(),
    };
  }
}
