import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ParticipantService } from '../src/participant/participant.service';
import { GroupBuyingService } from '../src/group-buying/group-buying.service';
import { CreateParticipantDto } from '../src/participant/dto/create-participant.dto';
import { GroupBuyingStatus } from '../src/group-buying/const/group-buying.const';

/**
 * 더미 참여자 데이터 생성 스크립트
 */
class ParticipantDataGenerator {
  // 참여자 ID 목록 (make-group-buying.ts와 동일)
  private readonly userIds = [
    '0d6646bf-dbaf-442e-a717-dd8bbbb9ff59', // 손예슬
    '3750ca73-734a-446a-9ab1-d4fbb319b251', // 손채연
    '2df897a7-a3fb-42b4-a59a-3cf49a63200c', // 조용빈
  ];

  // 은행 목록
  private readonly banks = [
    'KB국민은행',
    '신한은행',
    '하나은행',
    '우리은행',
    'NH농협은행',
    '카카오뱅크',
    '토스뱅크',
  ];

  /**
   * 참여 가능한 공구 목록 조회 (RECRUITING 상태만)
   */
  private async getAvailableGroupBuyings(
    groupBuyingService: GroupBuyingService,
  ): Promise<any[]> {
    try {
      // 모집 중인 공구만 조회 (참여자 생성 후 상태 변경 예정)
      const availableGroupBuyings = await (
        groupBuyingService as any
      ).groupBuyingRepository.groupBuyingModel
        .find({
          groupBuyingStatus: GroupBuyingStatus.RECRUITING,
        })
        .exec();

      console.log(`📋 참여 가능한 공구: ${availableGroupBuyings.length}개`);
      return availableGroupBuyings;
    } catch (error) {
      console.error('❌ 공구 목록 조회 실패:', error.message);
      return [];
    }
  }

  /**
   * 랜덤 참여 수량 생성 (1~5개)
   */
  private generateRandomCount(): number {
    return Math.floor(Math.random() * 5) + 1;
  }

  /**
   * 단일 참여자 데이터 생성
   */
  private generateParticipantData(
    userId: string,
    groupBuying: any,
  ): CreateParticipantDto {
    const count = this.generateRandomCount();
    const bank = this.banks[Math.floor(Math.random() * this.banks.length)];
    const account = `${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900000) + 100000}`;

    return {
      gbId: groupBuying._id.toString(),
      refundAccount: account,
      refundBank: bank,
      count,
    };
  }

  /**
   * 특정 사용자의 참여 내역 확인
   */
  private async getUserParticipations(
    participantService: ParticipantService,
    userId: string,
  ): Promise<string[]> {
    try {
      // 사용자의 모든 참여한 공구 ID 조회
      const participatedGbIds =
        await participantService.getParticipatedGroupBuyingIds(userId);
      return participatedGbIds;
    } catch (error) {
      console.error(`❌ 사용자 ${userId} 참여 내역 조회 실패:`, error.message);
      return [];
    }
  }

  /**
   * 사용자별 참여자 데이터 생성
   */
  private async generateUserParticipations(
    userId: string,
    availableGroupBuyings: any[],
    participantService: ParticipantService,
    targetCount: number = 10,
  ): Promise<CreateParticipantDto[]> {
    // 이미 참여한 공구 목록 조회
    const existingParticipations = await this.getUserParticipations(
      participantService,
      userId,
    );

    console.log(
      `🔍 사용자 ${userId}: 이미 참여한 공구 ${existingParticipations.length}개`,
    );

    // 참여하지 않은 공구 필터링
    const nonParticipatedGroupBuyings = availableGroupBuyings.filter(
      (gb: any) => {
        const gbId = gb._id.toString();
        const isNotParticipated = !existingParticipations.includes(gbId);
        const isNotOwned = gb.leaderId !== userId;

        if (!isNotParticipated) {
          console.log(`  - ${gbId}: 이미 참여함`);
        }
        if (!isNotOwned) {
          console.log(`  - ${gbId}: 본인이 생성한 공구`);
        }

        return isNotParticipated && isNotOwned;
      },
    );

    console.log(
      `🎯 사용자 ${userId}: 참여 가능한 공구 ${nonParticipatedGroupBuyings.length}개`,
    );

    if (nonParticipatedGroupBuyings.length === 0) {
      console.log(`⚠️  사용자 ${userId}: 참여 가능한 공구가 없습니다.`);
      return [];
    }

    // 랜덤하게 공구 선택하여 참여 데이터 생성
    const selectedGroupBuyings = this.shuffleArray(
      nonParticipatedGroupBuyings,
    ).slice(0, Math.min(targetCount, nonParticipatedGroupBuyings.length));

    return selectedGroupBuyings.map((gb) =>
      this.generateParticipantData(userId, gb),
    );
  }

  /**
   * 배열 셔플 함수
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 참여자 생성 후 공구 상태 업데이트
   */
  private async updateGroupBuyingStatus(
    groupBuyingService: GroupBuyingService,
    gbId: string,
    currentCount: number,
    fixedCount: number,
  ): Promise<void> {
    try {
      // 참여자 수가 목표 인원의 100% 이상이면 모집 완료로 변경
      if (currentCount >= fixedCount) {
        const updateStatusDto = {
          status: GroupBuyingStatus.CONFIRMED,
        };
        await groupBuyingService.updateStatus(gbId, updateStatusDto);
        console.log(
          `✅ 공구 ${gbId}: 모집 완료 상태로 변경 (${currentCount}/${fixedCount})`,
        );
      }
    } catch (error) {
      console.warn(`⚠️  공구 ${gbId} 상태 업데이트 실패:`, error.message);
    }
  }

  /**
   * 더미 참여자 데이터 생성 및 저장
   */
  async generateDummyParticipants(
    participantsPerUser: number = 5,
  ): Promise<void> {
    console.log(
      `🎯 각 사용자별로 ${participantsPerUser}개의 참여자 더미 데이터를 생성합니다...`,
    );

    const app = await NestFactory.createApplicationContext(AppModule);
    const participantService = app.get(ParticipantService);
    const groupBuyingService = app.get(GroupBuyingService);

    try {
      // 참여 가능한 공구 목록 조회
      const availableGroupBuyings =
        await this.getAvailableGroupBuyings(groupBuyingService);

      if (availableGroupBuyings.length === 0) {
        console.log(
          '❌ 참여 가능한 공구가 없습니다. 먼저 공구를 생성해주세요.',
        );
        return;
      }

      let totalCreated = 0;
      let totalFailed = 0;

      // 각 사용자별로 참여자 데이터 생성
      for (const userId of this.userIds) {
        console.log(`\n👤 사용자 ${userId} 참여 데이터 생성 중...`);

        const participantDataList = await this.generateUserParticipations(
          userId,
          availableGroupBuyings,
          participantService,
          participantsPerUser,
        );

        if (participantDataList.length === 0) {
          console.log(`⚠️  사용자 ${userId}: 생성할 참여 데이터가 없습니다.`);
          continue;
        }

        let userCreated = 0;
        let userFailed = 0;

        // 참여자 데이터 생성
        for (const participantData of participantDataList) {
          try {
            await participantService.joinGroupBuying(participantData, userId);
            userCreated++;
            totalCreated++;

            // 참여자 생성 후 공구 상태 확인 및 업데이트
            const gb = availableGroupBuyings.find(
              (gb: any) => gb._id.toString() === participantData.gbId,
            );
            if (gb) {
              // 현재 참여자 수 계산
              const currentParticipants = await (
                participantService as any
              ).participantRepository.find({ gbId: participantData.gbId });
              const currentCount = currentParticipants.reduce(
                (sum: number, p: any) => sum + p.count,
                0,
              );

              await this.updateGroupBuyingStatus(
                groupBuyingService,
                participantData.gbId,
                currentCount,
                gb.fixedCount,
              );
            }
          } catch (error) {
            console.error(
              `❌ 참여 실패 (User: ${userId}, GB: ${participantData.gbId}):`,
              error.message,
            );
            userFailed++;
            totalFailed++;
          }
        }

        console.log(
          `✅ 사용자 ${userId}: ${userCreated}개 생성 성공, ${userFailed}개 실패`,
        );
      }

      console.log(`\n🎉 참여자 데이터 생성 완료!`);
      console.log(`📊 총 생성: ${totalCreated}개, 실패: ${totalFailed}개`);

      // 생성된 데이터 요약 출력
      const summary = await this.printSummary(participantService);
      console.log('\n📈 생성된 참여자 데이터 요약:');
      console.log(summary);
    } catch (error) {
      console.error('❌ 더미 참여자 데이터 생성 중 오류 발생:', error);
    } finally {
      await app.close();
    }
  }

  /**
   * 생성된 참여자 데이터 요약 출력
   */
  private async printSummary(
    participantService: ParticipantService,
  ): Promise<string> {
    try {
      const userParticipationCounts: Record<string, number> = {};

      // 각 사용자별 참여 현황 조회
      for (const userId of this.userIds) {
        try {
          const participatedGbIds =
            await participantService.getParticipatedGroupBuyingIds(userId);
          userParticipationCounts[userId] = participatedGbIds.length;
        } catch {
          userParticipationCounts[userId] = 0;
        }
      }

      let summary = '사용자별 참여 현황:\n';
      Object.entries(userParticipationCounts).forEach(([userId, count]) => {
        summary += `  - ${userId}: ${count}개 공구 참여\n`;
      });

      const totalParticipations = Object.values(userParticipationCounts).reduce(
        (sum, count) => sum + count,
        0,
      );
      summary += `\n총 참여 내역: ${totalParticipations}개`;

      return summary;
    } catch {
      return '요약 정보를 가져올 수 없습니다.';
    }
  }
}

/**
 * 스크립트 실행 함수
 */
async function main() {
  const args = process.argv.slice(2);
  const participantsPerUser = args[0] ? parseInt(args[0]) : 10;

  if (isNaN(participantsPerUser) || participantsPerUser <= 0) {
    console.error(
      '❌ 올바른 개수를 입력해주세요. 예: npm run make-participants 5',
    );
    process.exit(1);
  }

  const generator = new ParticipantDataGenerator();
  await generator.generateDummyParticipants(participantsPerUser);
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}
