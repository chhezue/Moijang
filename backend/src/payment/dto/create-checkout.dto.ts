import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({ description: '참여하려는 공동구매 ID' })
  @IsNotEmpty()
  @IsMongoId()
  gbId: string;

  @ApiProperty({ description: '참여 수량' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  count: number;
}
