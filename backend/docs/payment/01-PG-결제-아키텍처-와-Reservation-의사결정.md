# 01. PG 결제 아키텍처 — Reservation 의사결정 · 현재 구현

> **범위:** PG(토스) 결제 전반의 **아키텍처·의사결정·구현 스냅샷**  
> **선행:** [docs/circular-dependency/01](../circular-dependency/01-모듈-순환-참조-해소-아키텍처.md) (모듈 순환 참조 원칙)  
> **다음:** [02-Payment-Participant-오케스트레이션.md](./02-Payment-Participant-오케스트레이션.md) (호출 흐름·Guard·오케스트레이터)  
> **진행 상태:** [03-구현-체크리스트.md](./03-구현-체크리스트.md)

**구현 현황 스냅샷:** 2026-06-01 (코드 기준)

---

## 1. 현재 구현 요약

### 1.1 Payment 레이어

| 구성                                              | 내용                                                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `PaymentModule`                                   | `GroupBuyingQueryModule`, `ParticipantModule`, `ParticipantQueryModule`                                        |
| `PaymentController`                               | `POST /payment/checkout`, `confirm`, `refund/:paymentKey`                                                      |
| `PaymentService.checkout`                         | `RECRUITING`·정원·리더·중복 참여 선검증 → `Payment(INITIATED)`                                                 |
| `PaymentService.confirm`                          | 멱등·금액·소유자(`String` 비교)·`RECRUITING` 재검증 → 토스 confirm → `PAID` → join / 실패 시 cancel + `FAILED` |
| `PaymentService.refund`                           | 개인 참여 취소 — 토스 cancel → `REFUNDED` → withdraw                                                           |
| `PaymentService.refundForGroupBuyingCancellation` | 리더 무산 일괄 환불 — `PAID + paymentKey` 순차 처리, 부분 실패 허용                                            |

### 1.2 Application 레이어 (공구 취소)

| 구성                   | 내용                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `cancel-orchestrator/` | `GroupBuyingCancelOrchestratorService` — `deleteGroupBuying` + 일괄 환불 조합      |
| 진입 API               | `PATCH /group-buying/cancel/:gbId` (Controller는 GroupBuying, 구현은 orchestrator) |

### 1.3 의도적으로 제거·미사용

- **Reservation** — 결제 전 선점 없음 ([§2](#2-reservation-제거-의사결정))
- **`DELETE /participant/:gbId`** — PG 우회 취소 경로 없음, 환불은 Payment 단일 경로
- **토스 webhook** — MVP는 프론트 `confirm`이 정본

### 1.4 미완 (상세는 [03](./03-구현-체크리스트.md))

- confirm `PAID` 멱등 — participant 유실 시 정책 미정
- 일괄 환불 `partialSuccess` 재시도 API/배치
- 환불 후 `CONFIRMED → RECRUITING` 역전 정책
- `Payment.orderId` unique 인덱스

---

## 2. Reservation 제거 의사결정

**Reservation을 빼도 됩니다.** 다만 “결제를 하나의 DB 트랜잭션으로 묶으면 된다”는 말은 **PG(토스) 구조상 절반만 맞습니다.**

### 2.1 토스 결제는 한 번에 끝나지 않음

```text
checkout (서버) → 결제창/앱카드 (사용자, 수십 초~수 분) → confirm (서버)
```

가운데 구간 때문에 예전에 Reservation(5분 선점)을 검토했지만, **정합성의 유일한 방법은 아닙니다.**  
“5분 선점”은 UX용 버퍼이고, **진짜로 한 덩어리로 묶을 수 있는 구간은 `confirm` 안뿐**입니다.

```text
토스 승인 → 정원 확인 → Participant 생성 → Payment PAID
(실패 시 환불 보상)
```

초기 Reservation 중심 설계는 [04-초기-PG-설계-아카이브.md](./04-초기-PG-설계-아카이브.md)에 보존.

### 2.2 Reservation이 하던 일

> **“돈 내기 전에, 이 사람이 결제하는 동안 자리를 잠깐 막아둔다.”**

Reservation이 없으면:

- **checkout 시점**: 정원 여유로 보일 수 있음
- **결제 진행 중**: 다른 사람도 동시에 결제 가능
- **confirm 시점**: 정원이 이미 찼을 수 있음 → **결제 성공 후 참여 실패 → 자동 환불**

시스템 정합성은 **confirm + 환불 보상**으로 맞출 수 있고, 경쟁이 심할 때만 “결제했는데 자리 없음” 빈도가 늘어난다.

### 2.3 모이장에서 Reservation을 뺀 이유

- 동시 결제 경쟁이 극단적이지 않음 (캠퍼스 공구, 소규모)
- 마지막 1~2자리 선착순 경쟁이 드묾
- confirm에서 정원 초과 시 **자동 환불** 수용
- 코드·운영 단순함 우선

### 2.4 현재 채택 구조

```text
checkout
  - Payment(INITIATED)만 생성
  - 안내용 정원·리더·중복 참여 검증 — 선점 없음

confirm  ← 사실상 "한 덩어리"
  1. 토스 승인
  2. 정원 확인 + Participant 생성
  3. Payment PAID
  실패 시: 토스 취소 + FAILED
```

`Reservation`, TTL, Cron, `reservedCount`는 **도입하지 않음**.

### 2.5 Reservation 재도입 검토 시점

- 마감 직전 선착순·마지막 N자리 경쟁
- “결제까지 갔는데 품절”을 최대한 줄이고 싶을 때
- 결제창 이탈·재시도 시 **같은 자리 유지** UX가 중요할 때

### 2.6 비교 요약

|               | Reservation 있음   | Reservation 없음 (현재) |
| ------------- | ------------------ | ----------------------- |
| 복잡도        | 높음               | 낮음                    |
| 동시성        | checkout에서 선점  | confirm에서만 확정      |
| UX            | 결제 중 자리 보호  | 결제 후 품절 가능       |
| 정합성        | 설계만 잘하면 좋음 | confirm + 환불로 충분   |
| 모이장 적합도 | 경쟁 심할 때       | **보통 충분**           |

### 2.7 실무 확장 순서 (필요할 때만)

1. **1단계 (현재)**: Reservation 제거, confirm에서 Participant + 정원 처리
2. **2단계**: `GroupBuying.remainingCount` 원자 `$inc`만 추가 (Reservation 없이)
3. **3단계**: 경쟁이 커지면 Reservation 재도입

---

## 3. 목표 플로우

1. `POST /payment/checkout` — `Payment(INITIATED)` + `orderId`
2. 프론트 토스 결제창
3. `POST /payment/confirm` — `PAID` → `Participant` (정원 **최종** 검증) / 실패 시 cancel + `FAILED`
4. `PATCH /group-buying/cancel/:gbId` (리더) — `CANCELLED` + PAID 건 순차 환불 → `{ groupBuying, status, successCount, failCount, failures }`
5. `POST /payment/refund/:paymentKey` (참여자) — `REFUNDED` + withdraw

**핵심 원칙**

- `Participant`는 **confirm 성공 후**에만 생성
- 결제 전 정원 선점은 **하지 않음**
- `orderId` 기준 멱등 처리

호출 순서·Guard·오케스트레이터 상세: [02번 문서](./02-Payment-Participant-오케스트레이션.md)

---

## 4. 모듈·파일 맵

### 4.1 모듈 의존 (단방향)

```text
GroupBuyingCancelOrchestratorModule (@Global)
  → GroupBuyingModule
  → PaymentModule

PaymentModule
  → ParticipantModule
  → GroupBuyingQueryModule

ParticipantModule
  → GroupBuyingQueryModule
  → GroupBuyingCommandModule
  (GroupBuyingModule 전체 import 없음)

GroupBuyingModule ↛ PaymentModule
```

순환 참조 회피·패턴 선택 근거: [02 §5](./02-Payment-Participant-오케스트레이션.md#5-순환-참조)

### 4.2 `src/payment`

| 파일                           | 책임                                                  |
| ------------------------------ | ----------------------------------------------------- |
| `payment.controller.ts`        | checkout / confirm / refund                           |
| `payment.service.ts`           | PG 오케스트레이션, `refundForGroupBuyingCancellation` |
| `payment.repository.ts`        | CRUD·상태, `findPaidRefundTargetsByGbId`              |
| `schema/payment.schema.ts`     | `orderId`, `amount`, 스냅샷 필드                      |
| `toss/toss-payments.client.ts` | 토스 confirm/cancel                                   |
| `const/payment.const.ts`       | `PaymentStatus`                                       |

### 4.3 `src/cancel-orchestrator`

| 파일                                          | 책임                             |
| --------------------------------------------- | -------------------------------- |
| `group-buying-cancel-orchestrator.module.ts`  | GB + Payment import, `@Global()` |
| `group-buying-cancel-orchestrator.service.ts` | 취소 + 일괄 환불 순서 조합       |

### 4.4 연관 모듈

| 파일                                  | 책임                   |
| ------------------------------------- | ---------------------- |
| `participant.service.ts`              | join / withdraw        |
| `participant-query.service.ts`        | 참여 여부 조회         |
| `group-buying-query.service.ts`       | 모집 상태·정원         |
| `group-buying-recruitment.service.ts` | 정원 충족 시 CONFIRMED |

**삭제됨:** `reservation.service.ts`, `schema/reservation.schema.ts`

---

## 5. 설계에서 유지한 선택 (포트폴리오 요약)

| 선택                                 | 근거                                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Reservation 미사용                   | [§2](#2-reservation-제거-의사결정)                                                                    |
| confirm 보상 트랜잭션                | 토스 승인 후 join 실패 → cancel + `FAILED`                                                            |
| 개인 환불 단일 경로                  | `PaymentService.refund`                                                                               |
| 리더 무산 Application 오케스트레이터 | GB↔Payment 직접 의존 회피 ([02 §4.4](./02-Payment-Participant-오케스트레이션.md#44-리더-무산-구현됨)) |
| MVP webhook 미도입                   | 프론트 `confirm`이 정본                                                                               |

남은 리스크·체크리스트: [03번 문서](./03-구현-체크리스트.md)

---

## 6. 동시성·정합성 (요약)

- `Participant` unique: `{ gbId, userId }`
- checkout 정원 검증은 **참고용**, confirm에서 **최종** 검증
- 모집 완료: `getEffectiveCurrentCount` = participant + leader (**INITIATED Payment 미포함**)
- confirm 실패 → 토스 환불 경로 동작 확인 ([03 §6](./03-구현-체크리스트.md#6-시나리오-테스트-체크리스트))

---

## 7. 변경 이력

| 날짜       | 내용                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| 2026-06-01 | circular-dependency 스타일로 문서 재구성, Reservation·스냅샷·모듈 맵 통합 |
| 2026-05-27 | README 초안 — Reservation 의사결정, 목표 플로우                           |
