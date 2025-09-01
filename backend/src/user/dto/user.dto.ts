import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ description: 'UUID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: '이름' })
  @IsString()
  displayName: string;

  @ApiProperty({ description: '직급' })
  @IsString()
  jobTitle: string;

  @ApiProperty({ description: '이메일' })
  @IsString()
  mail: string;

  @ApiProperty({ description: '부서' })
  @IsString()
  department: string;

  @ApiProperty({ description: 'userPrincipalName' })
  @IsString()
  userPrincipalName: string;
}
