import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { GetUserDto } from './dto/get-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserWithUniversity } from './types/user.types';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUsers(): Promise<GetUserDto[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => this.mapUserToDto(user));
  }

  async getUserById(id: string): Promise<GetUserDto> {
    const user = await this.userRepository.findOneById(id);
    if (!user) {
      throw new NotFoundException(`사용자 ${id}를 찾을 수 없습니다.`);
    }
    return this.mapUserToDto(user);
  }

  async getUserByLoginId(loginId: string): Promise<GetUserDto> {
    const user = await this.userRepository.findOneByLoginId(loginId);
    if (!user) {
      throw new NotFoundException(`loginId가 ${loginId}인 사용자를 찾을 수 없습니다.`);
    }
    return this.mapUserToDto(user);
  }

  // 로그인 시, 비밀번호 매치 확인을 위해 password 포함하여 반환 (Auth 모듈에서 호출됨)
  async getUserByLoginIdWithPassword(loginId: string): Promise<UserWithUniversity | null> {
    return await this.userRepository.findOneByLoginIdWithPassword(loginId);
  }

  // 회원가입 시 아이디 중복 확인 (Auth 모듈에서 호출됨)
  async existsByLoginId(loginId: string): Promise<boolean> {
    const user = await this.userRepository.findOneByLoginId(loginId);
    return !!user;
  }

  async getUserByEmail(email: string): Promise<GetUserDto> {
    const normalized = email.trim().toLowerCase();
    const user = await this.userRepository.findOneByUniversityEmail(normalized);
    if (!user) {
      throw new NotFoundException(`해당 대학 이메일로 가입한 사용자를 찾을 수 없습니다.`);
    }
    return this.mapUserToDto(user);
  }

  // 이메일로 코드 전송 전 아이디 중복 확인 (Verification 모듈에서 호출됨)
  async existsByEmail(normalizedEmail: string): Promise<boolean> {
    const user = await this.userRepository.findOneByUniversityEmail(normalizedEmail);
    return !!user;
  }

  // 유저 생성 (Auth 모듈에서 호출됨)
  async createUser(user: CreateUserDto, hashPassword: string): Promise<GetUserDto> {
    const createdUser = await this.userRepository.createOne(user, hashPassword);
    return this.mapUserToDto(createdUser);
  }

  private mapUserToDto(user: UserWithUniversity): GetUserDto {
    return {
      id: user._id.toString(),
      loginId: user.loginId,
      name: user.name,
      universityEmail: user.universityEmail,
      universityId: user.universityId._id.toString(),
      universityName: user.universityId.name,
      bankName: user.bankName,
      bankAccount: user.bankAccount,
    };
  }
}
