import { Injectable, NotFoundException } from '@nestjs/common';

// 이 서비스의 관심사는 "이 사용자가 물건을 살 자격(자리)이 여전히 있는가?"에 있습니다.
@Injectable()
export class ReservationService {}
