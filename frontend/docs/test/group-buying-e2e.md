# E2E 테스트 (Playwright + AI Agent)

## 테스트 방향성

| 레이어                | 역할                                                       | 담당               |
| --------------------- | ---------------------------------------------------------- | ------------------ |
| **E2E (Playwright)**  | 프론트에서 한 행동이 백엔드까지 전달되고 화면에 반영되는지 | 프론트팀           |
| **백엔드 API 정합성** | 잘못된 값/상태/권한에서 DB와 정책이 깨지지 않는지          | 백엔드팀 (Postman) |

E2E는 브라우저로 실제 UI를 조작하며 프론트-백-DB 전체 스택이 연결되어 동작하는지 확인한다.
백엔드 정책 검증(401, 404, 중복 등)은 백엔드팀 몫이다.

---

## 구조

```
tests/
  e2e/
    specs/
      leader-status-flow.spec.ts      # CI 실행 (AI 없음, 정적)
      leader-status-flow.ai.spec.ts   # AI 코드 생성기 (UI 변경 시 재실행)
    harness/
      agent-harness.ts    # AI agent loop + Playwright 코드 생성
      fixtures.ts         # 브라우저 로그인 컨텍스트
      seed.ts             # DB 직접 시딩 (상태 세팅)
      cleanup.ts          # beforeAll/afterAll 원복
    scenarios/
      order-flow.ts       # CONFIRMED → ORDERED 시나리오 정의
      ship-flow.ts        # ORDERED → SHIPPED 시나리오 정의
      complete-flow.ts    # SHIPPED → COMPLETED 시나리오 정의
  playwright.config.ts
```

---

## AI Agent 역할

UI가 처음 만들어지거나 구조가 바뀌었을 때 **1회만** 실행한다.

1. AI가 실제 브라우저로 UI를 탐색하며 selector를 직접 발견
2. 발견한 selector를 Playwright 코드로 기록
3. `leader-status-flow.spec.ts` 자동 갱신
4. 이후 CI는 정적 파일만 실행 — AI 토큰 없음

```bash
RUN_AI_AGENT=true npx playwright test e2e/specs/leader-status-flow.ai.spec.ts
```

UI가 바뀌어서 테스트가 깨지면 위 명령어 한 번 돌리고 커밋하면 된다.

---

## data-testid 계약

AI selector 탐색의 안정성을 위해 주요 버튼/입력에 `data-testid`를 박는다.
텍스트나 스타일이 바뀌어도 selector가 유지된다.

| testid               | 위치                        | 상태         |
| -------------------- | --------------------------- | ------------ |
| `btn-order`          | 공구 상품 주문하기 버튼     | CONFIRMED    |
| `btn-shipped`        | 배송 완료 및 공지 버튼      | ORDERED      |
| `btn-complete`       | 수령 확인 및 공구 완료 버튼 | SHIPPED      |
| `btn-modal-confirm`  | 확인 모달 확인 버튼         | 공통         |
| `btn-shipped-submit` | 배송 정보 입력 완료 버튼    | ORDERED 모달 |
| `btn-dashboard`      | 진행사항/대시보드 버튼      | 사이드바     |

---

## 현재 커버리지

| 항목                      | 상태 |
| ------------------------- | ---- |
| 총대: CONFIRMED → ORDERED | ✅   |
| 총대: ORDERED → SHIPPED   | ✅   |
| 총대: SHIPPED → COMPLETED | ✅   |

---

## 추후 추가 예정

### DB seed로 가능 (Toss 불필요)

| 항목                      | 방법                         |
| ------------------------- | ---------------------------- |
| 참여자: 수령 확인         | seed로 SHIPPED + 참여자 주입 |
| 총대: 공구 취소 (모집 중) | seed로 RECRUITING 상태       |
| 참여자: 참여 취소         | seed로 참여자 주입 후 취소   |

### Toss sandbox 키 필요 (백엔드팀 보유)

| 항목                                 | 비고                  |
| ------------------------------------ | --------------------- |
| 참여자: 참여하기 + 결제              | 실제 결제 플로우 검증 |
| 총대: 공구 취소 (주문 후, 환불 포함) | 환불 처리 검증        |

Toss sandbox 키(`test_sk_...`)가 생기면 백엔드 코드 수정 없이 테스트 가능.

---

## 실행

Claude가 Bash로 직접 실행한다. 팀원이 터미널에서 직접 실행할 필요 없다.

- `maxFailures: 1` — 첫 실패 시 즉시 중단
- `headless: false` — 브라우저가 열리며 동작 확인 가능
- 실패 시 터미널 출력에서 에러 바로 확인
