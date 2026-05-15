import { Module } from '@nestjs/common';
import { ParticipantPersistenceModule } from '../persistence/participant-persistence.module';
import { ParticipantQueryService } from './participant-query.service';

// 조회 전용 모듈 (GroupBuying 모듈에서 해당 모듈을 참조)
@Module({
  imports: [
    // 1. DB 접근 권한을 가진 PersistenceModule을 가져옵니다.
    ParticipantPersistenceModule,
  ],
  // 2. 조회 로직이 담긴 전용 서비스를 등록합니다.
  providers: [ParticipantQueryService],
  // 3. 외부(GroupBuying 등)에서 조회 기능을 쓸 수 있게 내보냅니다.
  exports: [ParticipantQueryService],
})
export class ParticipantQueryModule {}
