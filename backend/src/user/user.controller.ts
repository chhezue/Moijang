import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { GetUserDto } from './dto/get-user.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '모든 유저 출력' })
  @Get()
  async getUsers(): Promise<GetUserDto[]> {
    return await this.userService.getUsers();
  }

  @ApiOperation({ summary: 'MongoDB ObjectId로 유저 조회' })
  @Get('id/:mongoId')
  async getUserById(@Param('mongoId') mongoId: string): Promise<GetUserDto> {
    return await this.userService.getUserById(mongoId);
  }

  @ApiOperation({ summary: 'loginId로 유저 조회' })
  @Get('login-id/:loginId')
  async getUserByLoginId(@Param('loginId') loginId: string): Promise<GetUserDto> {
    return await this.userService.getUserByLoginId(loginId);
  }

  @ApiOperation({ summary: '대학 이메일로 유저 조회' })
  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string): Promise<GetUserDto> {
    const decoded = decodeURIComponent(email);
    return await this.userService.getUserByEmail(decoded);
  }

  // TODO Add to user update/delete method
}
