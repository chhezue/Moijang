# 공구 도메인 (GroupBuying)

## 상태 흐름

```
RECRUITING → CONFIRMED → ORDERED → SHIPPED → COMPLETED
                               ↘ CANCELLED (ORDERED 단계에서도 취소 가능)
```

- `CONFIRMED` 자동 전환: `currentCount >= fixedCount` 되는 순간 백엔드가 자동으로 변경 (`tryConfirmRecruitmentIfFull`)
- 총대가 `CONFIRMED → ORDERED`: 상품 주문 후 상태 변경 (상품 URL 새창 오픈)
- 총대가 `ORDERED → SHIPPED`: 픽업 장소/시간 공지와 함께
- 총대가 `SHIPPED → COMPLETED`: 수령 확인 후 완료
- endDate 만료 자동 처리 없음 (백엔드 cron 미구현, 추후 예정)

## 수량 vs 인원 구분

- `currentCount` = `leaderCount` + 참여자들 수량 합 → **수량 기준**
- `fixedCount` = 목표 수량 → **수량 기준**
- "N명" = `participants.length + 1` → **인원 기준** (총대 포함)
- 총대 참여 이력은 `participants` 컬렉션이 아닌 `groupbuyings.leaderCount`에 저장됨

## GroupBuyingItem 타입 (`src/types/groupBuying.ts`)

```ts
interface GroupBuyingItem {
  id;
  title;
  productUrl;
  description;
  fixedCount;
  currentCount; // 수량 기준
  totalPrice;
  estimatedPrice;
  shippingFee;
  startDate;
  endDate;
  groupBuyingStatus; // RECRUITING | CONFIRMED | ORDERED | SHIPPED | COMPLETED | CANCELLED
  category;
  isOwner; // 현재 유저가 총대인지
  isParticipant; // 현재 유저가 참여자인지
  leaderId: { id; name }; // ⚠️ aggregate 결과라 leaderId.id는 런타임 undefined일 수 있음
  leaderCount; // 총대 구매 수량
  participantInfo: { count }; // 내 구매 수량 (참여자일 때만 유효)
  pickupPlace;
  pickupTime; // SHIPPED 이후 공지
  cancelReason;
}
```

## API 엔드포인트

- `GET /api/group-buying/my-create` — 내가 만든 공구 (페이지네이션)
- `GET /api/group-buying/my-participant` — 내가 참여한 공구 (isOwner인 것도 포함됨, 클라에서 필터)
- `GET /api/group-buying/:id` — 공구 상세 (isOwner, isParticipant, participantInfo 포함)
- `GET /api/group-buying/enums` — 상태 코드/레이블 목록
- `PATCH /api/group-buying/:id/status` — 상태 변경 (총대만)
- `GET /api/participant/:gbId` — 참여자 목록 (auth 불필요, 공개)

## ParticipantList 컴포넌트

위치: `src/app/(root)/(home)/group-buying/detail/[id]/components/sidebar/ParticipantList.tsx`

```tsx
<ParticipantList
  participants={participants} // IParticipant[] (일반 참여자만)
  leaderInfo={{ name, count }} // 총대 정보 별도 전달
/>
```

- 총대 항상 첫 번째, 보라색 아바타 + "총대" chip
- `totalPeople = participants.length + 1` (총대 포함 인원 수)

## 보류 중인 버그/작업

- ProgressBar 초과 모집 버그: `currentCount > fixedCount`일 때 6/5개 표시
- `participantInfo` optional 타입 수정 필요
- endDate 만료 처리 (백엔드 cron 없음)
- detail 페이지 액션 버튼 정리 (대시보드 이관 후 "참여하기"만 남기기)
