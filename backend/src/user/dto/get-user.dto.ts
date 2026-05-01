import { IsEmail, IsMongoId, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetUserDto {
  @ApiProperty({ description: '유저의 MongoID' })
  @IsString()
  id: string;

  @ApiProperty({ description: '로그인 아이디' })
  @IsString()
  loginId: string;

  @ApiProperty({ description: '실명' })
  @IsString()
  name: string;

  @ApiProperty({ description: '소속 대학교 ID' })
  @IsMongoId()
  universityId: string;

  @ApiProperty({ description: '대학교 이름' })
  @IsString()
  universityName: string;

  @ApiProperty({ description: '사용자 이메일 (전체)' })
  @IsEmail()
  universityEmail: string;

  @ApiProperty({ description: '은행' })
  @IsString()
  bankName: string;

  @ApiProperty({ description: '계좌' })
  @IsString()
  bankAccount: string;
}
