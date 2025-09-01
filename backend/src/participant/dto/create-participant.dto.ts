import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParticipantDto {
  @ApiProperty({ description: '참여하고 있는 공구 ID' })
  @IsString()
  @IsNotEmpty()
  gbId: string;

  @ApiProperty({ description: '환불 계좌번호' })
  @IsString()
  @IsOptional()
  refundAccount: string;

  @ApiProperty({ description: '환불 은행' })
  @IsString()
  @IsOptional()
  refundBank: string;

  @ApiProperty({ description: '구매할 물건 수량' })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  count: number;
}
