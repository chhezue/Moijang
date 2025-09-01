import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUsers(): Promise<UserDto[]> {
    return await this.userRepository.findAll();
  }

  async getUserByUuid(uuid: string): Promise<UserDto> {
    return await this.userRepository.findOneByUuid(uuid);
  }

  async upsertUser(user: UserDto): Promise<UserDto> {
    return await this.userRepository.upsertOne(user);
  }
}
