import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PayloadDto {
  @ApiProperty({ description: '알림 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '알림 본문' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ description: '사용자가 알림 클릭 시 이동할 URL' })
  @IsString()
  @IsNotEmpty()
  url: string;
}
