# 03. 총대 수량(leaderCount) 정책 결정과 3안 구현

> **선행:** [01-모듈-순환-참조-해소-아키텍처.md](./01-모듈-순환-참조-해소-아키텍처.md)  
> **수식·Query:** [02-공구-Query-레이어-설계.md](./02-공구-Query-레이어-설계.md) (`getEffectiveCurrentCount`, aggregate)  
> **join CONFIRMED 의사결정:** [01번 문서 §5](./01-모듈-순환-참조-해소-아키텍처.md#5-join-후-confirmed--의사결정-2026-05-19)

**Part 1** — 1·2·3안 정책 비교 및 영향 범위 (고민·트레이드오프)  
**Part 2** — **채택한 3안** 구현 체크리스트 (코드 기준 2026-05-19)

---

# Part 1. 정책 및 영향 범위

## 1. 한 줄 요약

| 질문                     | 답                                                                                |
| ------------------------ | --------------------------------------------------------------------------------- |
| 당시 무엇이 어긋났나?    | 조회 전용 `ParticipantQueryService`에 쓰기(`createLeader`, `updateLeader`)가 섞임 |
| Guard·`leaderId` 변경량? | **거의 없음**                                                                     |
| 손대는 축?               | **`leaderCount` 저장 위치** + **`currentCount` / 모집 완료 수식**                 |
| **현재 채택**            | **3안** — GB에 `leaderCount`, participant에 총대 행 없음                          |

---

## 2. 배경

순환 참조 완화를 위해 participant를 **Query(읽기)** / **Service·Command(쓰기)** 로 나누려 했으나, 공구 생성·수정 시 총대 수량 반영을 Query의 `createLeader`/`updateLeader`로 처리해 **CQRS 원칙과 충돌**했다.

이 문서는 “쓰기를 어디에 둘지(1안)”와 “총대 수량을 어디에 저장할지(2·3안)”를 정리한다.  
모듈 순환·CONFIRMED write 위치는 [01번 문서](./01-모듈-순환-참조-해소-아키텍처.md)가 담당한다.

---

## 3. 용어

| 용어               | 의미                                                   |
| ------------------ | ------------------------------------------------------ |
| **총대(리더)**     | 공구 개설자 — `group_buyings.leaderId`                 |
| **총대 구매 수량** | 총대가 산 수량 — **3안:** `group_buyings.leaderCount`  |
| **일반 참여자**    | join API로 등록 — `participants`                       |
| **`fixedCount`**   | 목표 총 수량 (총대+참여자 합)                          |
| **`currentCount`** | API 계산값 — **3안:** `participantTotal + leaderCount` |

---

## 4. 구조 (Before → After 3안)

### Before

```text
group_buyings.leaderId     → 총대 누구
participants (1행)         → createLeader()로 총대 수량
participants (N행)         → 일반 참여자
currentCount               → participants.count 합 (총대 행 포함)
```

### After (3안, 채택)

```text
group_buyings.leaderId     → 총대 누구 (변경 없음)
group_buyings.leaderCount  → 총대 구매 수량
participants               → 일반 참여자만
currentCount (API)         → participant 합 + leaderCount
```

---

## 5. 해결 방법 3가지 (고민 기록)

|                     | **1안 (구조)**            | **2안 (단순)**                 | **3안 (채택)**      |
| ------------------- | ------------------------- | ------------------------------ | ------------------- |
| participant 총대 행 | 있음                      | 없음                           | 없음                |
| `leaderCount` 저장  | participant 행            | 없음/미사용                    | **GB 필드**         |
| `currentCount`      | participant 합(총대 포함) | participant 합만               | 합 + GB.leaderCount |
| 수정 규모           | 중 (Command 분리)         | 작음                           | 중~큼               |
| 화면 진행률         | 기존과 유사               | 총대 미포함으로 달라질 수 있음 | **기존과 유사**     |

- **1안:** Query는 read만, Leader 생성/수정은 Command — 순환 정리와 방향 일치, participant 총대 행 유지.
- **2안:** 총대 participant 행 제거 — 변경 최소, `fixedCount` 의미 재정의 필요.
- **3안:** GB `leaderCount` + 수식 통일 — 총대 행 없이 진행률 의미 유지. **채택.**

### 고민: 2안 vs 3안을 어떻게 골랐나?

- dev 속도만 보면 2안이 유리하지만, 프론트 `currentCount`·진행률이 **총대 포함 합**을 전제로 작성되어 있음.
- 3안은 스키마·aggregate 수정 비용이 있으나, **API 숫자 의미를 유지**할 수 있음.
- join CONFIRMED도 `(participantTotal + leaderCount) >= fixedCount` 한 수식으로 맞춤 — 구현은 [01번 문서 §5](./01-모듈-순환-참조-해소-아키텍처.md#5-join-후-confirmed--의사결정-2026-05-19).

---

## 6. 2안 vs 3안 (백엔드 차이)

| 항목           | 2안                            | 3안                                            |
| -------------- | ------------------------------ | ---------------------------------------------- |
| GB 스키마      | `leaderCount` 불필요           | **`leaderCount` 추가**                         |
| `currentCount` | participant 합만               | participant 합 + `leaderCount`                 |
| 모집 완료      | `participant 합 >= fixedCount` | `(participant 합 + leaderCount) >= fixedCount` |
| aggregate 4곳  | 의미만 변경 가능               | **수식 수정 필요**                             |

---

## 7. 영향 범위 (파일별)

### 거의 변경 없음 — ✅

`group-buying-access.guard.ts`, `isLeader`, `isParticipant`, withdraw 시 `LEADER` 차단.

### 2·3안 공통 — ✅

| 파일                      | 내용                                                                       |
| ------------------------- | -------------------------------------------------------------------------- |
| `group-buying.service.ts` | `createLeader`/`updateLeader` 삭제, update 시 `leaderCount` 검증·CONFIRMED |
| `participant.service.ts`  | `createLeader`/`updateLeader` 삭제, join 정원·CONFIRMED                    |

### 3안 전용 — ✅ (코드 기준)

| 파일                            | 내용                                                  |
| ------------------------------- | ----------------------------------------------------- |
| `schema/group-buying.schema.ts` | `leaderCount` (`default`/`min` 강화는 선택)           |
| `group-buying-query.service.ts` | `participantCountLookupStages()`                      |
| join 정원                       | `getEffectiveCurrentCount` — `getCurrentCount` 삭제됨 |

### 부수 (권장)

- 총대 join 차단 — ✅ `isLeader` → 400
- 프론트 E2E — ⬜

---

# Part 2. 3안 구현 체크리스트

> **코드 검사:** 2026-05-19

### 구현 진행 현황

| Phase                   | 상태 | 비고                                   |
| ----------------------- | ---- | -------------------------------------- |
| 0 마이그레이션          | ⬜   | 레거시 DB만 해당                       |
| 1 GB 스키마             | ✅   | `leaderCount` (default/min 미적용)     |
| 2 participant 쓰기 제거 | ✅   |                                        |
| 3 create/update         | ✅   |                                        |
| 4 aggregate             | ✅   | Query `participantCountLookupStages()` |
| 5 join·CONFIRMED        | ✅   | `GroupBuyingRecruitmentService`        |
| 6 총대 join 차단        | ✅   |                                        |
| 7 모듈·Guard            | ✅   |                                        |
| 8 프론트                | ⬜   |                                        |

통합 Phase 번호: [01번 문서 §4](./01-모듈-순환-참조-해소-아키텍처.md#4-통합-작업-체크리스트).

---

## 2.1 데이터 모델·수식 (전 파일 통일)

```text
currentCount = participantTotal + leaderCount

CONFIRMED: effectiveCurrentCount >= fixedCount

join 정원 (참여 전): currentCount + quantityChange > fixedCount → 400
```

aggregate: `$ifNull: ['$leaderCount', 0]` — [02번 문서 §4](./02-공구-Query-레이어-설계.md#4-query-메서드-우선순위-vs-구현).

---

## 2.2 작업 순서 개요

```text
[Phase 0] DB 마이그레이션 (레거시만)
[Phase 1~4] ✅
[Phase 5] join CONFIRMED ✅
[Phase 6~7] ✅
[Phase 8] 프론트 검증 ⬜
```

---

## 2.3 Phase 0 — 기존 데이터 마이그레이션

⬜ dev/스테이징에 `createLeader`로 쌓인 participant 행이 있을 때만 실행.

```javascript
// 의사 코드
for each group_buying gb:
  leaderParticipant = participants.findOne({ gbId: gb._id, userId: gb.leaderId })
  if leaderParticipant:
    gb.leaderCount = leaderParticipant.count
    gb.save()
    participants.deleteOne({ _id: leaderParticipant._id })
  else if gb.leaderCount is missing:
    gb.leaderCount = 1
```

검증: 마이그레이션 전후 `participantTotal + leaderCount` 합이 기존 `currentCount`와 일치하는지 샘플 공구로 확인.

---

## 2.4 Phase 1 — GB 스키마

- [x] `leaderCount` 프로퍼티
- [ ] `@Prop({ required: true, min: 1, default: 1 })` 등 강화 (선택)
- [ ] 기존 문서 일괄 `leaderCount` 백필

---

## 2.5 Phase 2 — participant 쓰기 제거

- [x] `createLeader`, `updateLeader` 삭제
- [x] `backend/src` 내 호출 0건
- [x] `ParticipantQueryService` read만

---

## 2.6 Phase 3 — group-buying 생성·수정

- [x] `createGroupBuying` — DTO `leaderCount` → GB 저장
- [x] `updateGroupBuying` — `updateLeader` 제거
- [x] `leaderCount` 검증: `participantTotal + updateDto.leaderCount <= fixedCount` (`!== undefined`)
- [x] update 후 `tryConfirmRecruitmentIfFull`

---

## 2.7 Phase 4 — aggregate `currentCount`

- [x] `GroupBuyingQueryService.participantCountLookupStages()` — 목록·상세
- [ ] 상세/목록 API 수동 검증 (E2E)

---

## 2.8 Phase 5 — join 정원 & CONFIRMED

### join 정원 — ✅

```typescript
const currentCount = await this.groupBuyingQueryService.getEffectiveCurrentCount(gbId);
if (currentCount + createDto.count > gb.fixedCount) {
  throw new BadRequestException('공구 정원을 초과했습니다. 수량을 다시 설정해주세요.');
}
```

(구 `GroupBuyingRepository.getCurrentCount`는 삭제됨.)

### join 후 CONFIRMED — ✅

`GroupBuyingRecruitmentService.tryConfirmRecruitmentIfFull(gbId)`  
옵션 비교·채택 이유: [01번 문서 §5](./01-모듈-순환-참조-해소-아키텍처.md#5-join-후-confirmed--의사결정-2026-05-19) (본 문서에 중복 서술하지 않음).

### 당시 막혔던 이유 (짧은 맥락)

- `ParticipantService` → `GroupBuyingRepository` 의존을 끊은 뒤 `updateStatus` 한 줄을 participant에 두기 꺼려짐.
- 순환은 `ParticipantModule` → `GroupBuyingModule` 단방향이므로 Repository 직접 주입도 **순환은 아님**이나, CONFIRMED 규칙·전이를 공구 쪽 한곳에 모으는 편이 유지보수에 유리 → B'안 채택.

---

## 2.9 Phase 6 — 총대 join 차단

- [x] `groupBuyingQueryService.isLeader` → 400  
      (`자신이 주최한 공구에는 참여할 수 없습니다.`)

---

## 2.10 Phase 7 — 모듈·Guard

- [x] `ParticipantModule` → `GroupBuyingModule`
- [x] `GroupBuyingAccessGuard` → Query만 사용
- [x] `npm run build` 성공
- [x] `GroupBuyingModule` → `ParticipantModule` 역참조 없음

모듈 import 고민(`GroupBuyingModule` vs `GroupBuyingQueryModule`만): [01번 문서 §2-4](./01-모듈-순환-참조-해소-아키텍처.md#24-고민-지점-포트폴리오용--모듈-의존-형태).

---

## 2.11 Phase 8 — 프론트엔드

- [x] `leaderCount` 타입·생성 폼
- [ ] 상세/목록 API `leaderCount`, `currentCount` 수치 검증
- [ ] 수정 폼 E2E
- [ ] 진행률 UI 육안 확인

---

## 2.12 수동 테스트

| #   | 시나리오                              | 기대                                    | 검증 |
| --- | ------------------------------------- | --------------------------------------- | ---- |
| 1   | `fixedCount=10`, `leaderCount=3` 생성 | GB.leaderCount=3, 총대 participant 없음 | ⬜   |
| 2   | 상세                                  | `currentCount=3`, `leaderCount=3`       | ⬜   |
| 4   | participant 6 + leader 3, join 2      | 400                                     | ⬜   |
| 5   | participant 7 + leader 3 = 10         | **CONFIRMED**                           | ⬜   |
| 6   | 총대 join                             | 400                                     | ⬜   |
| 7   | leaderCount 3→5, participant 5        | currentCount=10, CONFIRMED 가능         | ⬜   |

---

## 2.13 자주 하는 실수

| 실수                                           | 증상                        | 해결                            |
| ---------------------------------------------- | --------------------------- | ------------------------------- |
| aggregate만 수정, CONFIRMED는 participant 합만 | 모집 완료 시점 어긋남       | `getEffectiveCurrentCount` 통일 |
| join CONFIRMED 미구현                          | 정원 찼는데 RECRUITING 유지 | `GroupBuyingRecruitmentService` |
| `if (updateDto.leaderCount)`                   | 0 무시                      | `!== undefined` (✅)            |
| 마이그레이션 없이 기존 DB                      | currentCount 급감           | Phase 0                         |

---

## 2.14 완료 기준 (Definition of Done)

### 백엔드

- [x] `group_buyings.leaderCount` 스키마
- [x] `createLeader` / `updateLeader` 0건
- [x] aggregate `currentCount = participant합 + leaderCount`
- [x] update·join CONFIRMED (`leaderCount` 반영)
- [x] 총대 join 차단
- [x] Guard `isParticipant`
- [x] `npm run build` 성공

### 프론트

- [ ] 상세/목록 수치 E2E
- [ ] 생성·수정 폼 E2E

---

## 부록 — 수정 파일 우선순위 (2026-05-19)

| P   | 파일                                          | 상태              |
| --- | --------------------------------------------- | ----------------- |
| P0  | `participant.service.ts`                      | join CONFIRMED ✅ |
| P0  | `command/group-buying-recruitment.service.ts` | ✅                |
| P1  | DB 마이그레이션                               | ⬜                |
| P2  | 프론트 E2E                                    | ⬜                |

---

_마지막 업데이트: 2026-05-19_
