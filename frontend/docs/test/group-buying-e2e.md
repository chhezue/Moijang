# E2E 테스트 (Playwright)

위치: `frontend/e2e/`

## 스크립트

| 파일                          | 내용                                             |
| ----------------------------- | ------------------------------------------------ |
| `01-create-flow.spec.ts`      | 공구 생성 3단계 + 총대/비회원/미참여자 UI 확인   |
| `02-progress-flow.spec.ts`    | (총대) CONFIRMED → ORDERED → SHIPPED → COMPLETED |
| `03-participant-view.spec.ts` | (참여자) 각 상태별 UI (MongoDB 직접 시딩)        |
| `helpers/db.ts`               | MongoDB 직접 조작 헬퍼                           |

## 실행 방법

```bash
npx playwright test e2e/01-create-flow.spec.ts --ui
npx playwright test e2e/02-progress-flow.spec.ts --ui
npx playwright test e2e/03-participant-view.spec.ts --ui
npx playwright show-report
```

## 환경 변수 (`frontend/.env`, gitignored)

```
MONGO_URI=mongodb://...        # MongoDB 직접 접속 (DB 시딩용)
CONFIRMED_GB_ID=<objectId>     # 모집 완료된 공구 ID (script2, 3에서 사용)
```

- `playwright.config.ts` → `dotenv.config({ path: ".env" })` 로드
- `CONFIRMED_GB_ID` 공구는 테스트 후 `afterAll`에서 `resetGbToConfirmed()`로 자동 리셋

## script2 주의사항

- 모집 완료 상태(`CONFIRMED`)인 공구 gbId 필요 → `.env`에 지정
- `CONFIRMED` 현재: 수량 충족 시 자동 전환 / 추후: 알림 후 수동 처리 예정, 그 전까지 참여자 취소 가능
- endDate 반영 없음 (백엔드 cron 미구현)

## Playwright 주의사항

- strict mode: `getByText`가 여러 요소 매칭 시 `.first()` 필수
- "모집 완료", "주문 진행 중" → p + div 둘 다 매칭됨 → `.first()`
- "배송 완료", "공구 완료" → `{ exact: true }.first()`
- `window.open` popup: `page.once("popup", (popup) => popup.close())`로 처리
