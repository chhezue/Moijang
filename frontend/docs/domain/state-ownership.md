# 상태 소유권 정리 — 도메인별 + 교차 이슈

> 각 도메인 문서에 흩어진 "상태를 어디서 갖고, 언제 갱신하는지"를 한 곳에서 보기 위한 인덱스. 상세는 각 링크된 문서 참고, 여긴 요약만.

## 도메인별 상태 소유권 지도

| 도메인                | 상태                         | 소유권 / 저장 위치                                              | 신선도 전략                                                                                                            | 상세                                                                                                               |
| --------------------- | ---------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **유저/인증**         | 로그인 세션 (user)           | Zustand (factory) — SSR에서 1회 fetch 후 store 생성 시점에 주입 | 이벤트 기반 — 로그인/로그아웃 Server Action이 명시적으로 갱신, 폴링·자동 refetch 없음                                  | [`auth.md`](./auth.md), [`route-group-auth-structure.md`](../issues/route-group-auth-structure.md)                 |
| **공구(GroupBuying)** | 상세 / 참여자 목록           | SSR props                                                       | `router.refresh()`로 서버 컴포넌트 트리 전체 재실행 (임시 — 참여자 목록만 바뀌어도 페이지 전체 재렌더돼서 깜빡임 있음) | [`Groupbuying.md`](./Groupbuying.md), [`groupbuying-getList-react-query.md`](./groupbuying-getList-react-query.md) |
| **대시보드**          | 내가 만든/참여한 공구 리스트 | `leading/participating` layout에서 SSR fetch                    | 페이지 이동 시 재fetch (layout 재실행 시점에 갱신)                                                                     | [`dashboard.md`](./dashboard.md)                                                                                   |

## Zustand와 React Query를 같이 쓰는 이유 (도구 역할 분리)

같은 "서버 상태"처럼 보여도 성격이 달라서 도구를 나눔:

|                | Zustand                                              | React Query                                            |
| -------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| 어떤 상태      | 클라이언트가 사실상 소유한 것처럼 다루는 상태 (user) | 서버가 진짜 소유하고 자주 바뀌는 상태 (참여자 목록 등) |
| 갱신 트리거    | 명시적 이벤트 (로그인/로그아웃)                      | staleTime, `invalidateQueries`, 백그라운드 refetch     |
| 지금 도입 상태 | ✅ 적용 중                                           | 참여자 목록·뮤테이션에 부분 도입 검토 중 (미착수)      |

user를 React Query로 옮기지 않는 이유: 세션 단위로 고정되고 페이지 이동마다 바뀌지 않는 데이터라 캐시/재fetch 전략 자체가 불필요함 (`auth.md` 참고).

## 도메인 하나로 안 끝나는 교차 이슈

### 인가 — 대학별 가드 (미착수)

유저 도메인의 속성(대학 소속)이 공구/대시보드 도메인의 접근 가능 여부를 결정. 지금 `(protected)/layout.tsx`는 로그인 여부만 보고 대학 소속은 안 봄 — route group 레벨이 아니라 리소스를 반환하는 지점(API 응답/Server Action)에서 별도 체크가 필요할 가능성이 높음. 아직 설계 전.

### 멀티탭 동기화 (다음 작업 후보)

같은 유저 세션(Zustand)이 탭마다 독립 JS 메모리라, 탭 A에서 로그아웃해도 탭 B는 모름. `BroadcastChannel`/`storage` 이벤트로 동기화 필요 — 여러 독립 실행 컨텍스트를 하나의 진짜 상태에 맞추는 문제라 미니어처 분산 상태 동기화 문제. 스코프는 [`todo.md`](../issues/todo.md)의 "캐시 정합성 딥다이브 후보"에 이미 잡혀 있음. 지금 전혀 안 돼 있음.

### 결제(Toss) 연동 시 시간축 리스크 (미착수, 예측)

access token 만료(5분)와 결제 소요 시간이 겹칠 가능성 — 결제 중 토큰이 만료되면 `/payment/success` 복귀 시 로그아웃된 것처럼 보일 수 있음. 아직 코드 없음, 검증 필요.

## 실측으로 검증된 사례 (같은 클래스의 과거 사례)

- **Zustand singleton → factory**: Playwright로 두 브라우저 컨텍스트에 각각 다른 유저를 로그인시켜서 상태가 섞이는 걸 실제 재현한 뒤 factory 패턴으로 전환. [`test/auth-user-state.md`](../test/auth-user-state.md)
- **redirect loop**: 소프트 네비게이션 조건을 하드/소프트 네비게이션 대조로 좁혀서 정확한 트리거 특정. [`issues/redirect-loop.md`](../issues/redirect-loop.md)

두 사례 다 "상태가 여러 실행 컨텍스트(요청 간 / 탭 간)에서 정합성이 깨지는" 같은 클래스의 문제 — 멀티탭 동기화도 이 계보의 다음 사례로 보면 됨.

## 테스트/검증 도구 — Playwright + AI agent

- **2단계 전략**: 정적 `*.spec.ts`(CI에서 AI 없이 실행) + `*.ai.spec.ts`(UI 구조가 바뀌면 AI가 스크린샷+DOM 요소를 보고 셀렉터를 다시 탐색해 정적 코드를 재생성, 평소엔 실행 안 함)
- **안전장치**: `forbiddenSelectors`(금지 화면 감지 시 즉시 실패), `validateAction`(허용된 액션만), 태그 단독 셀렉터 금지 — AI가 잘못된 액션으로 테스트 데이터를 오염시키는 것 방지
- **비용 추적**: 매 스텝 토큰 사용량과 예상 비용을 로깅
- **실행 방식**: 직접 실행하지 않고 Claude Code가 Bash로 실행 후 결과 확인 (`tests/README.md`)
- 상세: [`tests/README.md`](../../../tests/README.md), 구현: `tests/e2e/harness/agent-harness.ts`

## 관련 문서

| 문서                                        | 내용                                                   |
| ------------------------------------------- | ------------------------------------------------------ |
| `domain/auth.md`                            | 인증 구조 전체 흐름, layout별 역할, 쿠키, SSR/CSR 전략 |
| `domain/Groupbuying.md`                     | 공구 상태 흐름, 타입, API 엔드포인트                   |
| `domain/groupbuying-getList-react-query.md` | React Query 도입 검토, 현재 갱신 방식의 한계           |
| `domain/dashboard.md`                       | 대시보드 라우팅/레이아웃 체인                          |
| `issues/route-group-auth-structure.md`      | route group 인증 구조, redirect loop 조사 배경         |
| `issues/redirect-loop.md`                   | redirect loop 현상/원인/해결/효과 정리                 |
| `issues/todo.md`                            | 캐시 정합성 딥다이브 후보 (멀티탭 동기화 등)           |
| `test/auth-user-state.md`                   | singleton→factory 전환 배경, A/B 유저 상태 섞임 재현   |
| `tests/README.md`                           | AI agent 기반 Playwright 테스트 자동화 구조            |
