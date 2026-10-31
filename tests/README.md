# Moijang 테스트

## 테스트 레이어

| 레이어                | 역할                                                       | 담당               |
| --------------------- | ---------------------------------------------------------- | ------------------ |
| **E2E (이 폴더)**     | 프론트에서 한 행동이 백엔드까지 전달되고 화면에 반영되는지 | 프론트팀           |
| **백엔드 API 정합성** | 잘못된 값/상태/권한에서 DB와 정책이 깨지지 않는지          | 백엔드팀 (Postman) |

## 구조

```
tests/
  e2e/
    specs/
      leader-status-flow.spec.ts      # CI 실행 파일 (AI 없음, 정적)
      leader-status-flow.ai.spec.ts   # AI 코드 생성기 (UI 변경 시 재실행)
    harness/    # DB seed, fixture, AI agent
    scenarios/  # AI 생성기 시나리오 정의
```

## 환경변수

`tests/.env`에서 자동으로 로드됩니다. 팀원은 이 파일을 직접 채워야 합니다.

```env
MONGO_URI=mongodb://...
CONFIRMED_GB_ID=                  # leader_test 계정으로 만든 공구 ID
TEST_LEADER_ID=leader_test
TEST_LEADER_PW=...
TEST_PARTICIPANT1_ID=participant1
TEST_PARTICIPANT1_PW=...
TEST_PARTICIPANT2_ID=participant2
TEST_PARTICIPANT2_PW=...
ANTHROPIC_API_KEY=sk-ant-...      # AI 재생성 시에만 필요
```

## 테스트 실행 방법

**직접 실행하지 않습니다.** Claude에게 요청하면 Claude가 Bash로 실행하고 결과를 확인합니다.

- 테스트 실패 시 `maxFailures: 1`로 즉시 멈춥니다.
- `headless: false`로 브라우저가 열리며 동작을 눈으로 확인할 수 있습니다.
- 실패 시 터미널 출력에서 에러를 바로 확인합니다.

```bash
npx playwright test e2e/specs/leader-status-flow.spec.ts
```

## UI 변경 시 (selector 재생성)

버튼 텍스트나 UI 구조가 바뀌어서 테스트가 깨진 경우, AI가 UI를 직접 탐색해 Playwright 코드를 다시 생성합니다.

```bash
RUN_AI_AGENT=true npx playwright test e2e/specs/leader-status-flow.ai.spec.ts
```

실행 완료 후 `leader-status-flow.spec.ts`가 자동 갱신됩니다. 갱신된 파일을 커밋하면 됩니다.

## 현재 커버리지

| 항목                      | 상태 |
| ------------------------- | ---- |
| 총대: CONFIRMED → ORDERED | ✅   |
| 총대: ORDERED → SHIPPED   | ✅   |
| 총대: SHIPPED → COMPLETED | ✅   |

## 추후 추가 예정

| 항목                                 | 비고                                 |
| ------------------------------------ | ------------------------------------ |
| 참여자: 참여하기 + 결제              | Toss sandbox 키 필요 (백엔드팀 보유) |
| 참여자: 수령 확인                    | DB seed로 가능                       |
| 총대: 공구 취소 (모집 중)            | DB seed로 가능                       |
| 총대: 공구 취소 (주문 후, 환불 포함) | Toss sandbox 키 필요                 |
| 참여자: 참여 취소                    | DB seed로 가능                       |
