import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Participant, ParticipantSchema } from '../schema/participant.schema';
import { ParticipantRepository } from './participant.repository';

// DB와 직접 연결되는 최하위 모듈 (리포지토리만 제공, QueryModule과 MainModule이 참조)
@Module({
  imports: [
    // 1. Participant 스키마만 여기서 딱 한 번 등록합니다.
    MongooseModule.forFeature([{ name: Participant.name, schema: ParticipantSchema }]),
  ],
  // 2. 실제 DB에 접근하는 리포지토리를 등록합니다.
  providers: [ParticipantRepository],
  // 3. 다른 모듈(Query, Main)에서 이 리포지토리를 쓸 수 있게 내보냅니다.
  exports: [ParticipantRepository],
})
export class ParticipantPersistenceModule {}
