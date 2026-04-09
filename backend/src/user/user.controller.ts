import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { UserService } from "./user.service";
import { GetUserDto } from "./dto/get-user.dto";
import { ApiOperation } from "@nestjs/swagger";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: "모든 유저 출력" })
  @Get()
  async getUsers(): Promise<GetUserDto[]> {
    return await this.userService.getUsers();
  }

  @ApiOperation({ summary: "id로 유저 조회" })
  @Get("/:id")
  async getUserByUuid(@Param("id") id: string): Promise<GetUserDto> {
    return await this.userService.getUserByUuid(id);
  }

  // TODO Add to user update/delete method
}
