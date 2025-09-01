import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateParticipantDto {
  @ApiProperty({ description: '환불 계좌번호' })
  @IsString()
  @IsOptional()
  refundAccount?: string;

  @ApiProperty({ description: '환불 은행' })
  @IsString()
  @IsOptional()
  refundBank?: string;

  @ApiProperty({ description: '구매할 물건 수량' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  count?: number;
}
