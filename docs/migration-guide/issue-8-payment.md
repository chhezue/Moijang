# Issue #8 프론트엔드 결제 마이그레이션 가이드 (Claude Code 실행용)

이 문서는 `backend/8-refactor-gb` 브랜치의 결제 시스템 변경사항을 기준으로, `frontend`를 바로 수정할 수 있도록 작성된 실행 가이드다.

목표는 **기존 participant 수동 입금 플로우 제거** 후, **payment(PG) 기반 플로우로 전환**하는 것이다.

---

## 1) 백엔드 변경 요약 (프론트 영향만)

### 핵심 변경

- 결제 진입점이 `participant`가 아니라 `payment`로 이동했다.
- 결제 플로우:
  1. `POST /payment/checkout`
  2. (프론트에서 토스 결제창 호출)
  3. `POST /payment/confirm`
  4. 참여 취소 시 `POST /payment/refund/:paymentKey`
- 공구 취소(`PATCH /group-buying/cancel/:gbId`) 시 백엔드에서 결제 일괄 환불을 수행한다.

### 상태값 변경

- 백엔드 `GroupBuyingStatus`에서 `PAYMENT_IN_PROGRESS`, `ORDER_PENDING`이 제거되었다.
- 현재 유효 상태:
  - `RECRUITING`
  - `CONFIRMED`
  - `ORDERED`
  - `SHIPPED`
  - `CANCELLED`
  - `COMPLETED`

### 응답 형태 주의

- `POST /payment/confirm` 응답: `Participant | string`
  - 멱등 재호출 시 `"이미 결제가 완료되었습니다."`
- `POST /payment/refund/:paymentKey` 응답: `Participant | string`
  - 멱등 재호출 시 `"이미 환불이 완료되었습니다."`

---

## 2) 프론트에서 반드시 바꿔야 하는 문제점 (현재 코드 기준)

현재 프론트는 아래와 같은 구식 흐름을 사용 중이다:

- `joinParticipant`, `cancelParticipant`, `confirmPayment` 등 `participant` API 호출
- "입금 완료" 버튼 기반 수동 상태 변경
- `PAYMENT_IN_PROGRESS`, `ORDER_PENDING` 상태 분기 의존
- "송금 요청" UX 중심 모달 (`RequestPaymentModalContent`)

이 구조는 현재 백엔드 #8과 맞지 않는다.

---

## 3) 목표 UX/플로우 정의

### 참여자(팀원) 플로우

1. 모집 중(`RECRUITING`)에서 참여 버튼 클릭
2. 수량 입력 후 `checkout` 호출
3. 토스 결제창 호출 (clientKey/orderId/amount 전달)
4. 결제 성공 콜백에서 `confirm` 호출
5. 성공 시 상세 페이지 리프레시 (participant 생성 반영)

### 참여 취소(환불) 플로우

1. 모집 중(`RECRUITING`)이고 이미 참여한 사용자가 취소 클릭
2. 해당 사용자 결제의 `paymentKey`를 사용해 `refund` 호출
3. 성공 시 상세 리프레시

### 총대 플로우

- `requestPayment`, `confirmPayment`(입금 완료 버튼), `cancelForPayment`(미입금자 기반 취소) UX를 제거/정리한다.
- 총대 공구 취소는 `PATCH /group-buying/cancel/:gbId`만 사용하며,
  환불은 백엔드 오케스트레이터가 처리한다.

---

## 4) 구현 작업 목록 (파일 단위)

아래 순서대로 진행한다.

### A. API 레이어 추가/정리

#### 신규 파일

- `src/apis/services/payment.ts` 생성

필수 함수:

1. `checkout`

- `POST /api/payment/checkout`
- request:
  - `gbId: string`
  - `count: number`
- response (`CheckoutResponseDto`):
  - `orderId: string`
  - `amount: number`
  - `clientKey: string`
  - `orderName: string`
  - `gbId: string`
  - `count: number`

2. `confirmPayment`

- `POST /api/payment/confirm`
- request:
  - `paymentKey: string`
  - `orderId: string`
  - `amount: number`
- response: `Participant | string`

3. `refundPayment`

- `POST /api/payment/refund/:paymentKey`
- body:
  - `cancelReason: string`
- response: `Participant | string`

권장 타입:

```ts
export interface CheckoutRequest {
  gbId: string;
  count: number;
}

export interface CheckoutResponse {
  orderId: string;
  amount: number;
  clientKey: string;
  orderName: string;
  gbId: string;
  count: number;
}

export interface ConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface RefundPaymentRequest {
  paymentKey: string;
  cancelReason: string;
}
```

#### 기존 파일 수정

- `src/apis/services/participant.ts`
  - `joinParticipant`, `cancelParticipant`, `confirmPayment` 제거
  - `getParticipantList`, `modifyParticipant`, `getParticipantInfo`는 필요한 범위만 유지

---

### B. 타입 업데이트

#### `src/types/groupBuying.ts`

- 결제 취소에 필요한 `participantInfo` 확장 여부 확인
- 백엔드에서 `paymentKey`를 내려주지 않으면 환불 API 호출이 어려우므로, 아래 중 하나를 선택:

옵션 1 (권장): 백엔드 상세 응답에 `participantInfo.paymentKey` 추가되도록 협의 후 타입 반영

- 예: `participantInfo: { count: number; isPaid: boolean; paymentKey?: string }`

옵션 2: 별도 결제 조회 API를 추가로 붙여 paymentKey 확보 (백엔드 협의 필요)

**중요:** 프론트 단독으로 `refund/:paymentKey`를 호출하려면 paymentKey 소스가 반드시 있어야 한다.

---

### C. 상세 페이지 액션 로직 변경

#### `src/app/(home)/group-buying/detail/[id]/components/DetailClientPage.tsx`

변경사항:

- `@/apis/services/participant`에서 가져오던
  - `cancelParticipant`
  - `confirmPayment`
  - (참여 생성 관련 로직)
    를 제거
- `@/apis/services/payment`의 `checkout`, `confirmPayment`, `refundPayment` 사용
- `handleRequestPayment`, `handleConfirmPayment` 제거 또는 완전 교체
- 참여 모달 submit 시:
  1. `checkout`
  2. 토스 결제창
  3. 성공 콜백에서 `confirmPayment`
  4. snackbar + refresh

참여 취소 시:

- `refundPayment(paymentKey, cancelReason)` 호출

총대 공구 취소 시:

- 기존 `cancelGroupBuying` 사용 유지 가능
- 단, "미입금자 선택 기반 취소" UX는 제거 필요 (백엔드 CancelReason enum과 불일치 가능)

---

### D. 모달/버튼 UX 정리

#### `src/app/(home)/group-buying/detail/[id]/components/sidebar/ActionButtons.tsx`

- `groupBuyingStatus === "PAYMENT_IN_PROGRESS"` 분기 제거
- `groupBuyingStatus === "ORDER_PENDING"` 분기 제거
- 참여자 버튼:
  - 모집 중(`RECRUITING`) + 미참여 → "공동구매 참여하기" (PG 결제 시작)
  - 모집 중 + 참여중 → "수량 및 계좌 수정", "참여 취소(환불)"
- 총대 버튼:
  - `requestPayment`, `order_pending` 기반 CTA 제거
  - 상태 전이는 `CONFIRMED -> ORDERED -> SHIPPED -> COMPLETED` 기준으로 재정렬

#### `src/app/(home)/group-buying/detail/[id]/components/modals/ParticipationModalContent.tsx`

- 현재 `joinParticipant` 직접 호출 제거
- submit 시 `checkout`으로 변경
- 토스 결제창 연동 핸들러 추가 후 `confirm`까지 이어붙인다.

#### `src/app/(home)/group-buying/detail/[id]/components/modals/RequestPaymentModalContent.tsx`

- 수동 송금 요청 UX는 현재 아키텍처와 불일치.
- 삭제 또는 "결제 안내" 용도로 축소 (실제 상태 변경 로직 제거).

#### `src/app/(home)/group-buying/detail/[id]/components/modals/CancelReasonModalContent.tsx`

- `PAYMENT_FAILED` 같은 프론트 전용 사유는 제거 권장
- 백엔드 `CancelReason` enum과 맞춘다:
  - `LEADER_CANCELLED`
  - `RECRUITMENT_FAILED`
  - `PRODUCT_UNAVAILABLE`
  - `SYSTEM_CANCELLED`

#### `src/app/(home)/group-buying/detail/[id]/components/types.ts`

- `confirmPayment`, `requestPayment`, `cancelForPayment`, `order` 등의 의미를 재점검
- 삭제된 상태/플로우에 대응하는 모달 타입 제거

---

### E. 상태 안내 문구/스텝 정리

#### `src/app/(home)/group-buying/detail/[id]/components/sidebar/NoticeBoard.tsx`

- `PAYMENT_IN_PROGRESS`, `ORDER_PENDING` 관련 문구/분기 제거
- `RECRUITING`, `CONFIRMED`, `ORDERED`, `SHIPPED`, `COMPLETED`, `CANCELLED`만 사용
- "입금 완료 버튼" 안내 문구를 "결제 완료" 흐름으로 교체

#### `src/hooks/useGroupBuyingStatus.ts`

- 서버 enum 순서 기반 UI 색상 매핑이 깨지지 않도록 재검토
- 제거된 상태 전제의 주석/색상 의미 업데이트

---

## 5) 토스 결제 연동 구현 메모 (프론트)

프로젝트에 아직 토스 SDK 사용 코드가 없으므로 아래를 구현한다:

1. 토스 SDK 로드 방식 결정
   - npm 패키지 또는 script 로드 방식 중 기존 코드 스타일에 맞춰 선택
2. `checkout` 응답의 `clientKey`, `orderId`, `amount`, `orderName`으로 결제창 호출
3. 성공 콜백에서 `paymentKey`, `orderId`, `amount`를 확보해 `confirm` 호출
4. 실패/취소 시 사용자 메시지 처리
5. `confirm` 응답이 문자열이면 멱등 케이스로 간주하고 성공 처리(토스트 문구만 분기)

---

## 6) 백엔드-프론트 계약 체크리스트 (필수 확인)

아래 항목이 충족돼야 프론트 구현이 막히지 않는다:

1. 공구 상세 응답에서 사용자별 결제 취소에 필요한 `paymentKey` 접근 가능 여부
2. `confirm`/`refund`의 문자열 멱등 응답을 프론트에서 성공으로 처리할지 정책 확정
3. 공구 취소 응답의 `refundStatus`(`allSuccess | partialSuccess | failed`)를 UI에 노출할지 결정

---

## 7) Claude Code 실행 지시 (그대로 사용)

아래 체크리스트를 순서대로 수행하라.

1. `src/apis/services/payment.ts`를 생성하고 `checkout`, `confirmPayment`, `refundPayment`를 구현한다.
2. `src/apis/services/participant.ts`에서 결제/취소 관련 구식 API 함수를 제거한다.
3. 상세 페이지(`DetailClientPage.tsx`)에서 participant 기반 결제 흐름을 payment 기반 흐름으로 교체한다.
4. `ActionButtons.tsx`, `NoticeBoard.tsx`, 모달 타입 파일에서 제거된 상태(`PAYMENT_IN_PROGRESS`, `ORDER_PENDING`) 분기를 모두 제거한다.
5. `ParticipationModalContent.tsx`를 결제 시작(checkout) + 결제 완료(confirm) 흐름으로 교체한다.
6. 총대의 수동 송금 요청/입금확인 UX(`RequestPaymentModalContent` 포함)를 제거하거나 백엔드와 일치하는 최소 기능으로 축소한다.
7. 타입 오류 및 사용되지 않는 import를 정리하고 빌드가 통과하도록 수정한다.

---

## 8) 완료 조건 (Definition of Done)

아래를 모두 만족하면 완료다.

- `PAYMENT_IN_PROGRESS`, `ORDER_PENDING` 문자열이 프론트 코드에 남아있지 않다.
- 참여자가 실제로 `checkout -> (토스) -> confirm` 경로를 타도록 연결되어 있다.
- 참여 취소가 `POST /payment/refund/:paymentKey`를 사용한다.
- 총대 공구 취소 후 `refundStatus`를 처리할 수 있는 상태다(최소 로그/토스트라도 반영).
- `npm run lint` / `npm run build` 기준 치명 에러가 없다.

---

## 9) 리스크 / 후속 작업

- 현재 백엔드 응답에서 `paymentKey` 노출 경로가 명확하지 않으면 환불 UX 구현이 막힐 수 있다.
- `confirm` 멱등 시 문자열 반환은 프론트에서 성공 플로우로 흡수해야 UX가 안정적이다.
- `refundStatus = partialSuccess`의 운영 처리(관리자 재시도)는 별도 정책이 필요하다.
