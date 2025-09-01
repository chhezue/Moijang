import { IsEnum } from 'class-validator';
import { GroupBuyingStatus } from '../const/group-buying.const';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({
    description: '변경할 상태',
    enum: GroupBuyingStatus,
  })
  @IsEnum(GroupBuyingStatus)
  status: GroupBuyingStatus;
}
