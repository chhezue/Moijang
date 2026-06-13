# 02. GroupBuying Query 레이어 설계 — Read 경계 분리

> **범위:** `backend/src/group-buying` 조회(read) 경계  
> **선행:** [01-모듈-순환-참조-해소-아키텍처.md](./01-모듈-순환-참조-해소-아키텍처.md) (모듈 그래프, 통합 체크리스트, join CONFIRMED)  
> **연관:** [03-총대-수량-leaderCount-정책과-구현.md](./03-총대-수량-leaderCount-정책과-구현.md) (`currentCount` = participant 합 + `leaderCount`)

**구현 현황:** 2026-05-19 — 스캐폴딩·핵심 조회 이관·`getEffectiveCurrentCount` 완료. `getCapacitySnapshot`·read model 명칭 정리는 미착수.

---

## 1. 왜 분리하는가

**당시 문제**

- `GroupBuyingRepository`에 조회/쓰기/검증이 섞여 있음.
- `ParticipantService`가 이 저장소에 직접 의존 → 순환 참조의 한 축.

**분리 목표**

- `currentCount` 수식(`participantTotal + leaderCount`) **드리프트 방지** — 목록 aggregate·join 정원·CONFIRMED가 같은 기준 사용.
- Payment 확장 시 **Query 포트**로만 공구·정원 조회.
- write는 `GroupBuyingService` + `GroupBuyingRepository`, 모집 완료만 `GroupBuyingRecruitmentService` ([01번 문서 §5](./01-모듈-순환-참조-해소-아키텍처.md#5-join-후-confirmed--의사결정-2026-05-19)).

**현재:** Participant는 `GroupBuyingQueryService`만 사용. `GroupBuyingRepository` 직접 조회는 제거됨.

---

## 2. 설계 원칙

1. **조회와 변경 분리** — Query는 read. status 변경·알림은 Service/Command.
2. **수식 단일화** — `getEffectiveCurrentCount(gbId)` = `ParticipantQueryService.getParticipantCount` + `GroupBuying.leaderCount`.
3. **의존 방향** — `GroupBuyingQueryModule` → `ParticipantQueryModule`. 역방향 import 금지.
4. **점진적 마이그레이션** — API 응답 형태 유지, Controller만 Query로 이관.

모듈 의존 그래프·`ParticipantModule`이 `GroupBuyingModule`을 import하는 이유: [01번 문서 §2-2·§2-4](./01-모듈-순환-참조-해소-아키텍처.md#22-타겟-의존-구조-단일-기준).

### 고민 지점 (포트폴리오용) — Query가 Participant Query를 import하는 것

- `GroupBuyingQueryService`가 `ParticipantQueryService.getParticipantCount`를 호출 → **GB Query → Participant Query** 단방향.
- 순환은 없지만 **도메인 간 Query 결합**은 존재한다.
- **대안:** `getCapacitySnapshot`에서 GB+participant를 한 aggregate로 조회; 또는 이벤트/캐시로 participant 합을 GB에 역정규화.
- **당시 결정:** YAGNI — Query 간 호출 유지. Payment·동시성 요구가 커지면 snapshot/역정규화 재검토.

---

## 3. 폴더·모듈 구조 (현재)

```text
backend/src/group-buying/
  query/
    group-buying-query.module.ts   # GB Mongoose + ParticipantQueryModule import
    group-buying-query.service.ts
  command/
    group-buying-command.module.ts
    group-buying-recruitment.service.ts   # tryConfirmRecruitmentIfFull (write 1종)
  group-buying.module.ts           # write + Guard + WebPush
  group-buying.service.ts
  group-buying.repository.ts       # persistence / updateStatus 등
```

### `GroupBuyingQueryModule`

| 항목        | 내용                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------- |
| **imports** | `MongooseModule(GroupBuying)`, `CommonModule`, `ParticipantQueryModule`                  |
| **exports** | `GroupBuyingQueryService`, `GroupBuyingRepository`, `ParticipantQueryModule` (re-export) |

---

## 4. Query 메서드 (우선순위 vs 구현)

| 메서드                           | 우선순위 | 상태 | 비고                                                                                                        |
| -------------------------------- | -------- | ---- | ----------------------------------------------------------------------------------------------------------- |
| `getEffectiveCurrentCount(gbId)` | 필수     | ✅   | join 정원, update `leaderCount` 검증, CONFIRMED 판정                                                        |
| `participantCountLookupStages()` | 필수     | ✅   | 목록·상세 aggregate — `$sum participant + $ifNull leaderCount`                                              |
| `getGroupBuyingById`             | 필수     | ✅   | 상세 + `currentCount` 필드 (read model 명칭 미분리)                                                         |
| `getAllGroupBuyings` 등 목록     | 권장     | ✅   | 검색·페이지네이션                                                                                           |
| `isLeader`                       | 권장     | ✅   | join 시 총대 차단                                                                                           |
| `getCapacitySnapshot(gbId)`      | 권장     | ⬜   | `{ fixedCount, effectiveCurrentCount, remaining, status, joinable }` — join은 현재 count+gbId 조합으로 대체 |
| `getGroupBuyingDetailReadModel`  | 선택     | 🔶   | `getGroupBuyingById`와 동일 역할, DTO·이름 분리만 미착수                                                    |
| `isRecruitingAndJoinable`        | 선택     | ⬜   | Service/Controller에 유지 가능                                                                              |

### aggregate 수식 (3안, 단일 기준)

```javascript
currentCount: {
  $add: [
    { $sum: '$participantData.count' },
    { $ifNull: ['$leaderCount', 0] },
  ],
},
```

목록·상세·`getEffectiveCurrentCount`·CONFIRMED가 위 수식과 **동치**여야 한다. 불일치 시 모집 완료 시점·UI 진행률이 어긋난다 — [03번 문서 §2.1](./03-총대-수량-leaderCount-정책과-구현.md#21-데이터-모델수식-전-파일-통일).

---

## 5. 기존 코드와의 경계

| 파일                                      | Query 이관 후 역할                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| `group-buying.controller.ts`              | 목록/상세 → `GroupBuyingQueryService`                                     |
| `group-buying.service.ts`                 | create/update/delete/status, WebPush                                      |
| `group-buying.repository.ts`              | persistence, `updateStatus`, soft delete                                  |
| `participant.service.ts`                  | join/withdraw — read `GroupBuyingQueryService`, write recruitment command |
| `group-buying.repository.getCurrentCount` | **삭제** — Query `getEffectiveCurrentCount`로 대체                        |

---

## 6. Query 레이어 전용 리스크

| 리스크                             | 대응                                          | 현재                                                         |
| ---------------------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| 과도한 추상화 (Port/DI everywhere) | 필요 시만 Port 도입                           | ✅ Port 미도입                                               |
| aggregate 파이프라인 중복          | `participantCountLookupStages()` 단일 private | ✅                                                           |
| Query에 write 유입                 | CONFIRMED는 `GroupBuyingRecruitmentService`   | ✅                                                           |
| GB Query ↔ Participant Query 결합  | snapshot 또는 역정규화는 필요 시              | 🔶 호출 1곳 유지                                             |
| read 후 write race (join 정원)     | DB 원자 연산·unique index — PG 전후 공통      | ⬜ [03-구현-체크리스트.md](../payment/03-구현-체크리스트.md) |

작업 체크리스트(Phase 3): [01번 문서 §4 Phase 3](./01-모듈-순환-참조-해소-아키텍처.md#phase-3-groupbuying-query-레이어).

---

## 7. 요약

- Query 레이어로 **read 경계**를 만들었고, 순환 참조 완화 목표는 달성했다.
- **수식 단일화**가 이 레이어의 핵심 가치 — leaderCount 3안·CONFIRMED·Payment 정원이 모두 `getEffectiveCurrentCount` 계열을 쓴다.
- 남은 선택 과제: `getCapacitySnapshot`, read model DTO 명칭, Access 모듈 분리, Payment용 Query Port.

---

_마지막 업데이트: 2026-05-19_
