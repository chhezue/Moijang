import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { GroupBuyingService } from '../src/group-buying/group-buying.service';
import { CreateGroupBuyingDto } from '../src/group-buying/dto/create-group-buying.dto';
import {
  CancelReason,
  ProductCategory,
  GroupBuyingStatus,
} from '../src/group-buying/const/group-buying.const';

/**
 * 더미 공구 데이터 생성 스크립트
 */
class GroupBuyingDataGenerator {
  // 간단한 상품명 템플릿
  private readonly productNames = [
    '무선 이어폰',
    '스마트 워치',
    '커피 원두',
    '가구 세트',
    '장난감',
    '운동화',
    '가방',
    '화장품',
    '반려동물 용품',
    '식물',
    '책',
    '티켓',
  ];

  // 카테고리별 간단한 설명
  private readonly categoryDescriptions = {
    [ProductCategory.DIGITAL_DEVICE]: '최신 기술의 디지털 기기입니다.',
    [ProductCategory.HOME_APPLIANCE]: '편리한 생활가전입니다.',
    [ProductCategory.FURNITURE_INTERIOR]: '아름다운 인테리어 아이템입니다.',
    [ProductCategory.CHILDREN]: '아이들을 위한 안전한 제품입니다.',
    [ProductCategory.FOOD]: '신선하고 맛있는 식품입니다.',
    [ProductCategory.CHILDREN_BOOK]: '아이들의 성장에 도움이 되는 책입니다.',
    [ProductCategory.SPORTS_LEISURE]:
      '활동적인 라이프스타일을 위한 제품입니다.',
    [ProductCategory.WOMEN_ACCESSORIES]: '세련된 여성 액세서리입니다.',
    [ProductCategory.WOMEN_CLOTHING]: '트렌디한 여성 의류입니다.',
    [ProductCategory.MEN_FASHION]: '모던한 남성 패션입니다.',
    [ProductCategory.GAME_HOBBY]: '취미 생활을 즐겁게 하는 제품입니다.',
    [ProductCategory.BEAUTY]: '자연스러운 아름다움을 위한 제품입니다.',
    [ProductCategory.PET_SUPPLIES]: '반려동물을 위한 좋은 제품입니다.',
    [ProductCategory.BOOK_TICKET_MUSIC]:
      '문화 생활을 풍성하게 하는 제품입니다.',
    [ProductCategory.PLANT]: '공간에 생기를 더하는 식물입니다.',
    [ProductCategory.ETC]: '실용적인 생활용품입니다.',
  };

  // 은행 목록
  private readonly banks = [
    'KB국민은행',
    '신한은행',
    '하나은행',
    '우리은행',
    'NH농협은행',
  ];

  // 리더 ID 목록
  private readonly leaderIds = [
    '0d6646bf-dbaf-442e-a717-dd8bbbb9ff59', // 손예슬
    '3750ca73-734a-446a-9ab1-d4fbb319b251', // 손채연
    '2df897a7-a3fb-42b4-a59a-3cf49a63200c', // 조용빈
  ];

  /**
   * 간단한 상품명 생성
   */
  private generateProductTitle(category: ProductCategory): string {
    const baseName =
      this.productNames[Math.floor(Math.random() * this.productNames.length)];
    const variations = ['', '프리미엄', '스페셜'];
    const variation = variations[Math.floor(Math.random() * variations.length)];

    // 카테고리별 접두사 추가
    const categoryPrefix = this.getCategoryPrefix(category);
    const finalName = variation ? `${variation} ${baseName}` : baseName;

    return categoryPrefix ? `${categoryPrefix} ${finalName}` : finalName;
  }

  /**
   * 카테고리별 접두사 반환
   */
  private getCategoryPrefix(category: ProductCategory): string {
    const prefixes = {
      [ProductCategory.DIGITAL_DEVICE]: '스마트',
      [ProductCategory.HOME_APPLIANCE]: '홈',
      [ProductCategory.FURNITURE_INTERIOR]: '인테리어',
      [ProductCategory.FOOD]: '프리미엄',
      [ProductCategory.CHILDREN]: '키즈',
      [ProductCategory.BEAUTY]: '뷰티',
      [ProductCategory.PET_SUPPLIES]: '펫',
      [ProductCategory.BOOK_TICKET_MUSIC]: '문화',
      [ProductCategory.SPORTS_LEISURE]: '스포츠',
      [ProductCategory.GAME_HOBBY]: '취미',
      [ProductCategory.CHILDREN_BOOK]: '교육',
      [ProductCategory.WOMEN_ACCESSORIES]: '여성',
      [ProductCategory.WOMEN_CLOTHING]: '여성',
      [ProductCategory.MEN_FASHION]: '남성',
      [ProductCategory.PLANT]: '자연',
      [ProductCategory.ETC]: '실용',
    };

    return prefixes[category] || '';
  }

  /**
   * 간단한 설명 생성
   */
  private generateDescription(
    category: ProductCategory,
    minCount: number,
    fixedCount: number,
  ): string {
    const baseDesc =
      this.categoryDescriptions[category] || '고품질의 상품입니다.';
    return `${baseDesc} 최소 ${minCount}개부터 주문 가능하며, 총 ${fixedCount}개 한정 판매합니다.`;
  }

  /**
   * 가격 범위를 카테고리별로 설정
   */
  private getPriceRange(category: ProductCategory): {
    min: number;
    max: number;
  } {
    const priceRanges = {
      [ProductCategory.DIGITAL_DEVICE]: { min: 50000, max: 300000 },
      [ProductCategory.HOME_APPLIANCE]: { min: 30000, max: 200000 },
      [ProductCategory.FURNITURE_INTERIOR]: { min: 20000, max: 150000 },
      [ProductCategory.FOOD]: { min: 5000, max: 30000 },
      [ProductCategory.CHILDREN]: { min: 10000, max: 80000 },
      [ProductCategory.BEAUTY]: { min: 15000, max: 60000 },
      [ProductCategory.PET_SUPPLIES]: { min: 8000, max: 50000 },
      [ProductCategory.BOOK_TICKET_MUSIC]: { min: 10000, max: 40000 },
      [ProductCategory.SPORTS_LEISURE]: { min: 20000, max: 120000 },
      [ProductCategory.GAME_HOBBY]: { min: 15000, max: 100000 },
      [ProductCategory.CHILDREN_BOOK]: { min: 8000, max: 40000 },
      [ProductCategory.WOMEN_ACCESSORIES]: { min: 10000, max: 100000 },
      [ProductCategory.WOMEN_CLOTHING]: { min: 15000, max: 150000 },
      [ProductCategory.MEN_FASHION]: { min: 15000, max: 200000 },
      [ProductCategory.PLANT]: { min: 5000, max: 50000 },
      [ProductCategory.ETC]: { min: 5000, max: 100000 },
    };

    return priceRanges[category] || { min: 10000, max: 80000 };
  }

  /**
   * 날짜 범위 생성
   */
  private generateDateRange(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const startOffset = Math.floor(Math.random() * 30) - 15; // -15 ~ +15일
    const startDate = new Date(
      now.getTime() + startOffset * 24 * 60 * 60 * 1000,
    );
    const duration = Math.floor(Math.random() * 20) + 5; // 5~25일
    const endDate = new Date(
      startDate.getTime() + duration * 24 * 60 * 60 * 1000,
    );
    return { startDate, endDate };
  }

  /**
   * 상태 생성
   */
  private generateStatus(startDate: Date, endDate: Date): GroupBuyingStatus {
    const now = new Date();

    if (endDate < now) {
      // 종료된 공구는 완료 또는 취소 상태
      const endStates = [
        GroupBuyingStatus.COMPLETED,
        GroupBuyingStatus.CANCELLED,
      ];
      return endStates[Math.floor(Math.random() * endStates.length)];
    } else if (startDate > now) {
      // 아직 시작하지 않은 공구는 모집 중
      return GroupBuyingStatus.RECRUITING;
    } else {
      // 진행 중인 공구는 모집 중 또는 모집 완료 상태
      // 단, endDate가 가까운 경우는 모집 완료 상태로 설정
      const daysUntilEnd = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilEnd <= 3) {
        // 종료 3일 전부터는 모집 완료 상태로 설정
        return GroupBuyingStatus.CONFIRMED;
      } else {
        // 충분한 기간이 남은 경우 모집 중 상태
        const activeStates = [
          GroupBuyingStatus.RECRUITING, // 90% 확률로 모집 중
          GroupBuyingStatus.RECRUITING,
          GroupBuyingStatus.RECRUITING,
          GroupBuyingStatus.RECRUITING,
          GroupBuyingStatus.RECRUITING,
          GroupBuyingStatus.RECRUITING,
          GroupBuyingStatus.RECRUITING,
          GroupBuyingStatus.RECRUITING,
          GroupBuyingStatus.RECRUITING,
          GroupBuyingStatus.CONFIRMED, // 10% 확률로 모집 완료
        ];
        return activeStates[Math.floor(Math.random() * activeStates.length)];
      }
    }
  }

  private generateCancelReason(): CancelReason {
    const reasons = [
      CancelReason.LEADER_CANCELLED,
      CancelReason.RECRUITMENT_FAILED,
      CancelReason.PRODUCT_UNAVAILABLE,
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  /**
   * 단일 더미 데이터 생성
   */
  private generateSingleData(index: number): CreateGroupBuyingDto & {
    groupBuyingStatus?: GroupBuyingStatus;
    cancelReason?: CancelReason;
    leaderId: string;
  } {
    const categories = Object.values(ProductCategory);
    const category = categories[Math.floor(Math.random() * categories.length)];

    const { startDate, endDate } = this.generateDateRange();

    const minCount = Math.floor(Math.random() * 3) + 1; // 1~3개
    const fixedCount = Math.floor(Math.random() * 50) + minCount + 5; // minCount+5 ~ minCount+54개

    const priceRange = this.getPriceRange(category);
    const unitPrice =
      Math.floor(Math.random() * (priceRange.max - priceRange.min)) +
      priceRange.min;
    const totalPrice = fixedCount * unitPrice;

    const shippingOptions = [0, 2500, 3000, 5000];
    const shippingFee =
      shippingOptions[Math.floor(Math.random() * shippingOptions.length)];

    const title = this.generateProductTitle(category);
    const description = this.generateDescription(
      category,
      minCount,
      fixedCount,
    );

    const leaderId =
      this.leaderIds[Math.floor(Math.random() * this.leaderIds.length)];
    console.log(leaderId);
    const bank = this.banks[Math.floor(Math.random() * this.banks.length)];

    const groupBuyingStatus = this.generateStatus(startDate, endDate);
    const cancelReason =
      groupBuyingStatus === GroupBuyingStatus.CANCELLED
        ? this.generateCancelReason()
        : undefined;

    return {
      title,
      productUrl: `https://example.com/product/${index + 1}`,
      description,
      fixedCount,
      totalPrice,
      shippingFee,
      account: `${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 900) + 100}-${String(index).padStart(6, '0')}`,
      bank,
      endDate,
      category,
      groupBuyingStatus,
      cancelReason,
      leaderId,
      leaderCount: 1,
    };
  }

  /**
   * 더미 데이터 생성 및 저장
   */
  async generateDummyData(count: number = 15): Promise<void> {
    console.log(`🎯 ${count}개의 공구 더미 데이터를 생성합니다...`);

    const app = await NestFactory.createApplicationContext(AppModule);
    const groupBuyingService = app.get(GroupBuyingService);

    try {
      for (let i = 0; i < count; i++) {
        const dummyData = this.generateSingleData(i);
        const { groupBuyingStatus, cancelReason, leaderId, ...createDto } =
          dummyData;

        try {
          const groupBuying = await groupBuyingService.createGroupBuying(
            leaderId,
            createDto,
          );

          if (groupBuyingStatus !== GroupBuyingStatus.RECRUITING) {
            try {
              // 상태 업데이트를 위한 DTO 생성
              const updateStatusDto = {
                status: groupBuyingStatus,
              };

              // 상태 업데이트
              await groupBuyingService.updateStatus(
                (groupBuying as any)._id.toString(),
                updateStatusDto,
              );

              // 취소된 경우 취소 사유 업데이트
              if (
                groupBuyingStatus === GroupBuyingStatus.CANCELLED &&
                cancelReason
              ) {
                await (
                  groupBuyingService as any
                ).groupBuyingRepository.updateCancelReason(
                  (groupBuying as any)._id.toString(),
                  cancelReason,
                );
              }
            } catch (statusError) {
              console.warn(
                `⚠️  ${i + 1}번째 공구 상태 업데이트 실패 (${groupBuyingStatus}):`,
                statusError.message,
              );
              // 상태 업데이트 실패해도 공구 생성은 성공으로 처리
            }
          }

          if ((i + 1) % 5 === 0) {
            console.log(`✅ ${i + 1}/${count} 생성 완료`);
          }
        } catch (error) {
          console.error(`❌ ${i + 1}번째 공구 생성 실패:`, error.message);
        }
      }

      console.log(`🎉 총 ${count}개의 더미 데이터 생성이 완료되었습니다!`);

      const summary = await this.printSummary(groupBuyingService);
      console.log('\n📊 생성된 데이터 요약:');
      console.log(summary);
    } catch {
      console.error('❌ 더미 데이터 생성 중 오류 발생');
    } finally {
      await app.close();
    }
  }

  /**
   * 생성된 데이터 요약 출력
   */
  private async printSummary(
    groupBuyingService: GroupBuyingService,
  ): Promise<string> {
    try {
      const allData = await (
        groupBuyingService as any
      ).groupBuyingRepository.findAll();
      const categoryCount: Record<string, number> = {};
      const statusCount: Record<string, number> = {};

      allData.forEach((item: any) => {
        const cat = item.productCategory || item.category || 'UNKNOWN';
        const st = item.groupBuyingStatus || 'UNKNOWN';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        statusCount[st] = (statusCount[st] || 0) + 1;
      });

      let summary = `전체 공구 수: ${allData.length}개\n\n`;
      summary += '📦 카테고리별 분포:\n';
      Object.entries(categoryCount).forEach(([category, count]) => {
        summary += `  - ${category}: ${count}개\n`;
      });

      summary += '\n📈 상태별 분포:\n';
      Object.entries(statusCount).forEach(([status, count]) => {
        summary += `  - ${status}: ${count}개\n`;
      });

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
  const count = args[0] ? parseInt(args[0]) : 15;

  if (isNaN(count) || count <= 0) {
    console.error('❌ 올바른 개수를 입력해주세요. 예: npm run make-dummy 15');
    process.exit(1);
  }

  const generator = new GroupBuyingDataGenerator();
  await generator.generateDummyData(count);
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}
