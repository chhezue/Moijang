import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UniversityDto {
  @ApiProperty({ description: '대학교 이름' })
  @IsString()
  name: string;

  @ApiProperty({ description: '메일 도메인 (웹메일 인증용)' })
  @IsString()
  domain: string;

  @ApiProperty({ description: '본교/분교 구분' })
  @IsString()
  campusType: string;

  @ApiProperty({ description: '지역' })
  @IsString()
  region: string;
}
