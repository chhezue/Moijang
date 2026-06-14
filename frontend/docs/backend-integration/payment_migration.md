# Claude Code 지시문 (frontend 반영용)

아래는 `frontend/` 저장소에서 바로 실행할 작업 지시다.  
너는 **프론트 코드 수정 에이전트**이고, 목표는 `backend/15-solve-circular-dependency-problem` 기준 API 계약에 맞게 프론트를 마이그레이션하는 것이다.

## 작업 목표

- 빌드/런타임 에러 없이 동작하게 수정
- 제거된 API/필드/상태를 모두 프론트에서 제거
- 타입/스키마/API 호출/화면 분기까지 일관되게 정리

## 반드시 지켜야 할 사실

1. 총대는 `Participant`로 생성되지 않는다.
   - 총대 수량은 `GroupBuying.leaderCount`로 관리한다.
   - `GET /api/participant/:gbId`는 일반 참여자만 반환한다.
2. 백엔드 ValidationPipe가 strict다.
   - DTO에 없는 필드를 보내면 400 발생한다.
3. 아래 상태/사유는 이미 백엔드에서 제거되었다.
   - `PAYMENT_IN_PROGRESS`
   - `ORDER_PENDING`지
   - `PAYMENT_FAILED`

## 현재 유효한 백엔드 계약 (핵심만)

### GroupBuyingStatus

- `RECRUITING` (모집 중)
- `CONFIRMED` (모집 완료)
- `ORDERED` (주문 진행 중)
- `SHIPPED` (배송 완료)
- `CANCELLED` (공구 취소)
- `COMPLETED` (공구 완료)

### CancelReason

- `LEADER_CANCELLED` (총대 개인 사유 취소)
- `RECRUITMENT_FAILED` (모집 실패 취소)
- `PRODUCT_UNAVAILABLE` (상품 품절/가격 변동 취소)
- `SYSTEM_CANCELLED` (시스템 취소)

### Participant API

- 유지:
  - `GET /api/participant/:gbId`
  - `GET /api/participant/:gbId/:id`
  - `POST /api/participant`
  - `DELETE /api/participant/:gbId`
- 삭제:
  - `PATCH /api/participant/:gbId`
  - `PATCH /api/participant/payment/:gbId`

### DTO 변경

- `CreateGroupBuyingDto`, `UpdateGroupBuyingDto`에서 제거:
  - `account` (총대 입금 계좌번호)
  - `bank` (총대 입금 은행명)
- `CreateParticipantDto`에서 제거:
  - `refundAccount` (참여자 환불 계좌번호)
  - `refundBank` (참여자 환불 은행명)
- `POST /api/participant` body:
  - `gbId`
  - `count`

### 응답에서 제거/미사용 필드 (프론트 제거 대상)

- `GroupBuying`:
  - `account`, `bank`, `nonDepositors`
- `Participant`:
  - `refundAccount`, `refundBank`, `isPaid`

## 수정 범위

다음 파일들을 우선 수정해라.

- `src/apis/services/participant.ts`
- `src/apis/services/groupBuying.ts`
- `src/types/groupBuying.ts`
- `src/schemas/groupBuying.ts`
- `src/app/(protected)/create/page.tsx`
- `src/app/(protected)/create/components/Step3Content.tsx`
- `src/app/(home)/group-buying/detail/[id]/components/modals/EditGroupBuyingModalContent.tsx`
- `src/app/(home)/group-buying/detail/[id]/components/modals/ParticipationModalContent.tsx`
- `src/app/(home)/group-buying/detail/[id]/components/DetailClientPage.tsx`
- `src/app/(home)/group-buying/detail/[id]/components/sidebar/ActionButtons.tsx`
- `src/app/(home)/group-buying/detail/[id]/components/sidebar/NoticeBoard.tsx`
- `src/app/(home)/group-buying/detail/[id]/components/sidebar/ParticipantList.tsx`
- `src/app/(home)/group-buying/detail/[id]/components/modals/CancelReasonModalContent.tsx`
- `src/app/(home)/group-buying/detail/[id]/components/CancelledBanner.tsx`
- `src/hooks/useGroupBuyingStatus.ts`

## 구현 지시

### 1) API 레이어 정리

- `joinParticipant` 요청 바디를 `{ gbId, count }`로 변경
- `modifyParticipant`, `confirmPayment` 함수 제거
- `cancelGroupBuying`에서 `nonDepositors` 전송 제거

### 2) 타입 정리

- `IParticipant`에서 `refundAccount`, `refundBank`, `isPaid` 제거
- `GroupBuyingItem`에서 `account`, `bank`, `nonDepositors` 제거
- `participantInfo`는 `count` 중심으로 정리

### 3) 폼/스키마 정리

- 생성/수정 스키마에서 `account`, `bank` 제거
- 생성 Step3의 계좌 입력 흐름 제거 또는 새 요구사항이 없으면 단순 확인 단계로 변경
- 생성/수정 payload에서 제거 필드가 절대 전송되지 않게 수정

### 4) 상세 화면 분기 정리

- `PAYMENT_IN_PROGRESS`, `ORDER_PENDING`, `PAYMENT_FAILED` 분기 삭제
- 입금 완료/송금 요청 관련 UI 및 모달 제거
- 취소 배너에서 `nonDepositors` 렌더링 제거
- 취소 사유 선택지에서 `PAYMENT_FAILED` 제거

### 5) 총대 비-Participant 정책 반영

- participants 배열은 일반 참여자만이라는 전제로 처리
- 총대 표시가 필요하면 `leaderId`/`leaderCount` 기반으로 처리
- participants 길이를 총 인원으로 오해하지 않도록 관련 문구 점검

## 완료 기준 (DoD)

아래를 모두 만족해야 한다.

- 타입 에러 없음
- 제거된 API를 호출하는 코드 없음
- 제거된 필드를 요청 body에 담는 코드 없음
- 제거된 상태값/취소사유를 분기하는 코드 없음
- 상세 페이지에서 런타임 에러 없음

## 검증 명령

가능하면 다음을 실행하고 결과를 보고해라.

1. 타입체크
2. 린트
3. 빌드

실패 시:

- 어떤 파일의 어떤 이유로 실패했는지 요약
- 수정 후 재실행 결과까지 포함

## 최종 보고 형식

최종 답변은 아래 순서로 작성해라.

1. 수정한 파일 목록
2. 핵심 변경 요약 (API / 타입 / UI / 상태 분기)
3. 검증 결과 (typecheck/lint/build)
4. 남은 리스크 또는 기획 확인 필요 항목
