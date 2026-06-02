# 02. Payment · Participant 오케스트레이션

> **범위:** 서비스 책임 분리, 호출 흐름, Guard/REST, cancel-orchestrator, 순환 참조  
> **선행:** [01-PG-결제-아키텍처-와-Reservation-의사결정.md](./01-PG-결제-아키텍처-와-Reservation-의사결정.md)  
> **진행 상태:** [03-구현-체크리스트.md](./03-구현-체크리스트.md)  
> **연관:** [docs/circular-dependency/01](../circular-dependency/01-모듈-순환-참조-해소-아키텍처.md)

**구현 현황:** 2026-06-01

---

## 1. 책임 분리

### 1.1 PaymentService

**담당**

- 토스 PG (`confirm`, `cancel`)
- `Payment` 상태 (`INITIATED` → `PAID` / `FAILED` / `REFUNDED`)
- 금액·`orderId`·`paymentKey`·멱등
- join/withdraw **호출 순서** (Payment↔Participant 오케스트레이션)
- 리더 무산 **일괄 환불** (`refundForGroupBuyingCancellation`)

**담당하지 않음**

- Participant 영속 규칙(정원 수식, 모집 완료 전환)의 상세 구현

**근거:** Payment는 타 도메인 **전체 Application Service**에 묶이지 않고, Participant는 **Command/Query 포트**만 사용 ([circular-dependency/01](../circular-dependency/01-모듈-순환-참조-해소-아키텍처.md)).

### 1.2 ParticipantService

**담당**

- `joinGroupBuyingAfterPayment` / `withdrawGroupBuyingAfterRefund`
- confirm 시점 **정원 최종 검증**
- `GroupBuyingRecruitmentService.tryConfirmRecruitmentIfFull`

**담당하지 않음**

- 토스 API, `Payment` 상태

**근거:** join/withdraw는 **PaymentService·오케스트레이터만** 호출 (`participant.controller`에 join/delete 없음).

### 1.3 GroupBuyingCancelOrchestratorService

**담당**

- `deleteGroupBuying` → `refundForGroupBuyingCancellation` **순서** 조합
- 환불 집계 응답 조립

**담당하지 않음**

- 공구 취소 도메인 로직(상태·알림) — `GroupBuyingService`에 유지
- 토스/환불 상세 — `PaymentService`에 유지

**왜 `deleteGroupBuying` 내용을 여기로 옮기지 않았는가 (포트폴리오)**

- 공구 취소(상태·알림)는 GroupBuying 도메인 책임
- 오케스트레이터는 **순서만** 맡기면 역할이 분명해짐
- 다른 진입점(배치·관리자)에서 공구만 취소할 때 `deleteGroupBuying` 재사용 가능

---

## 2. 호출 흐름

### 2.1 결제 성공 (confirm)

```text
PaymentService.confirm
  1. Payment 조회·멱등·금액·소유자 (String 비교)
  2. 공구 RECRUITING 재검증
  3. tossPaymentsClient.confirm
  4. paymentRepository.updateStatus(PAID)
  5. participantService.joinGroupBuyingAfterPayment
       → 정원 / create / tryConfirmRecruitmentIfFull
```

**보상:** 5번 실패 → 토스 cancel + `Payment(FAILED)`.

checkout에서 리더·중복 참여를 선차단하므로 join은 정원·모집 완료에 집중.

### 2.2 개인 환불 (참여 취소)

```text
PaymentService.refund(gbId, cancelReason, userId)
  1. findByPaymentKey
  2. 소유자 String 비교
  3. (멱등) REFUNDED → 문자열 early return
  4. status === PAID
  5. isParticipant
  6. gb.groupBuyingStatus === RECRUITING
  7. toss cancel → REFUNDED
  8. withdrawGroupBuyingAfterRefund
```

**비대칭:** 8번 실패 시 돈은 이미 환불됨 — participant 수동 보정·배치 필요.

### 2.3 리더 공구 무산 (일괄 환불)

```text
GroupBuyingController PATCH /cancel/:gbId
  → GroupBuyingCancelOrchestratorService.cancelGroupBuying
      1. groupBuyingService.deleteGroupBuying (CANCELLED + 알림)
      2. paymentService.refundForGroupBuyingCancellation
           → findPaidRefundTargetsByGbId
           → for: toss cancel → REFUNDED → withdraw (실패 건 failures 누적)
      3. { groupBuying, status, successCount, failCount, failures }
```

**MVP 선택:** 순차 `for` + try/catch. `Promise.all`/bulk DB는 복잡도 대비 이득이 작아 미채택.

---

## 3. Guard · ContextRole · 서비스 검증

### 3.1 `GroupBuyingAccessGuard`

| 검사 | 내용                                             |
| ---- | ------------------------------------------------ |
| 입력 | `req.params.gbId`                                |
| 출력 | `req.contextualRole` = `LEADER` \| `PARTICIPANT` |
| 실패 | 공구와 무관한 유저 → 403                         |

`isLeader` 우선, 아니면 `isParticipant`.

### 3.2 계층별 검증

| 계층                     | 예시                                       |
| ------------------------ | ------------------------------------------ |
| `JwtAuthGuard`           | 로그인                                     |
| `GroupBuyingAccessGuard` | 공구 접근 + LEADER/PARTICIPANT             |
| **컨트롤러**             | 엔드포인트별 역할 (cancel → LEADER만)      |
| **PaymentService**       | 결제 소유자, PAID/REFUNDED, RECRUITING, PG |
| **ParticipantService**   | 정원, 모집 완료                            |

### 3.3 `POST /payment/refund`에 Guard를 쓰지 않는 이유

URL에 `gbId`가 없고, Guard에 `PaymentRepository`를 넣으면 **group-buying → payment** 의존이 생긴다.

**서비스 검증:** `payment.userId`, `isParticipant`, `gb.groupBuyingStatus === RECRUITING`

---

## 4. REST API

### 4.1 원칙

| 원칙                                         | 근거                                                 |
| -------------------------------------------- | ---------------------------------------------------- |
| PG·결제 상태 변경은 **Payment** 경로         | 리소스가 `Payment`, 토스 키가 `paymentKey`           |
| 공구 취소 UX는 **GroupBuying** URL           | 도메인 행위이므로 `PATCH /group-buying/cancel/:gbId` |
| 토스/환불 구현은 **PaymentService**          | 오케스트레이션 일원화                                |
| `GroupBuyingService`에 refund 로직 넣지 않음 | 순환 참조 ([§5](#5-순환-참조))                       |

### 4.2 현재 엔드포인트

| API                                             | 용도                       |
| ----------------------------------------------- | -------------------------- |
| `POST /payment/checkout`                        | 결제 시작                  |
| `POST /payment/confirm`                         | 결제 확정 + 참여 생성      |
| `POST /payment/refund` (`gbId`, `cancelReason`) | 참여자 개인 취소           |
| `PATCH /group-buying/cancel/:gbId`              | 리더 공구 무산 + 일괄 환불 |

**정리 여지:** `POST /payments/:paymentKey/cancel` 등 REST 네이밍 — 의미는 동일.

### 4.3 리더 무산 — 고민했던 대안

| 패턴                              | 설명                                      | 채택        |
| --------------------------------- | ----------------------------------------- | ----------- |
| A. 도메인 이벤트                  | `GroupBuyingCancelled` → Payment listener | MVP 복잡도↑ |
| **B. Application 오케스트레이터** | `cancel-orchestrator`에서 조합            | **채택**    |
| C. GroupBuyingService 직접 inject | `deleteGroupBuying` 끝에서 Payment 호출   | 순환 위험   |

---

## 5. 순환 참조

모듈 그래프 전체: [01 §4.1](./01-PG-결제-아키텍처-와-Reservation-의사결정.md#41-모듈-의존-단방향)

### 5.1 위험했던 연결 (회피함)

```text
GroupBuyingModule → PaymentModule → ParticipantModule → GroupBuyingModule
```

**발생 조건:** `GroupBuyingService`가 `PaymentService` 직접 inject + `ParticipantModule`이 `GroupBuyingModule` 전체 import.

### 5.2 현재 회피 수단

- `ParticipantModule` → `GroupBuyingQueryModule` / `GroupBuyingCommandModule` (전체 GB 모듈 X)
- 리더 무산 → `cancel-orchestrator` (GB + Payment import, 역방향 없음)
- `GroupBuyingController`는 `@Global()` 오케스트레이터 주입 — **import 그래프에 GB→Payment 화살표 없음**

---

## 6. 멱등 응답 (MVP)

| 시점                     | 응답                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| confirm 성공             | `Participant`                                                                             |
| confirm `PAID` 재호출    | `'이미 결제가 완료되었습니다.'` (participant 미조회 — [03 §2.2](./03-구현-체크리스트.md)) |
| refund 성공              | `Participant` (삭제된 행)                                                                 |
| refund `REFUNDED` 재호출 | `'이미 환불이 완료되었습니다.'`                                                           |
| 리더 무산                | `{ groupBuying, status, successCount, failCount, failures }`                              |

**MVP:** webhook 미사용. 결제 정본은 프론트 `confirm`.

---

## 7. 정책 결정 필요 (미정)

| 질문                      | 선택지               | 추적                                                                                      |
| ------------------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| PAID인데 participant 없음 | 404 vs 재생성 vs 409 | [03 §2.2](./03-구현-체크리스트.md)                                                        |
| 환불 후 CONFIRMED 역전    | 유지 vs RECRUITING   | [03 §3.3](./03-구현-체크리스트.md)                                                        |
| 중복 INITIATED            | 무제한 vs TTL vs 1건 | [01 §2.7](./01-PG-결제-아키텍처-와-Reservation-의사결정.md#27-실무-확장-순서-필요할-때만) |

---

## 8. 변경 이력

| 날짜       | 내용                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| 2026-06-01 | 02번 문서로 통합 (구 service-orchestration-guide + 파일 역할 중복 제거) |
| 2026-05-26 | 초안 — 오케스트레이션·Guard·REST                                        |
