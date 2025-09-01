import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '모든 유저 출력' })
  @Get('')
  async getUsers(): Promise<UserDto[]> {
    return await this.userService.getUsers();
  }

  @ApiOperation({ summary: 'uuid와 일치하는 유저 출력' })
  @Get('/:uuid')
  async getUserByUuid(@Param('uuid') uuid: string): Promise<UserDto> {
    return await this.userService.getUserByUuid(uuid);
  }

  @ApiOperation({ summary: '유저 없으면 생성, 있으면 업데이트' })
  @Post()
  async upsertUser(@Body() user: UserDto): Promise<UserDto> {
    return await this.userService.upsertUser(user);
  }
}
