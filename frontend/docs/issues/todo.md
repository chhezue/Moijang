# 남은 작업 목록

## 우선순위 높음

1. **Playwright + AI Agent 하네스 구축** ← 진행 중
   - ✅ `tests/` 별도 workspace 분리 (frontend에서 테스트 의존성 제거)
   - ✅ AI agent loop (RUN_AI_AGENT flag, maxSteps, 비용 로깅)
   - ✅ DB fixture (beforeAll seed, afterAll 원복)
   - ✅ 보안 테스트 5개 통과 (`tests/api/`)
   - ✅ test 1: 참여자 뷰 CONFIRMED 상태 UI 검증
   - ⬜ tests 2-4: detail 대신 `/dashboard/leading/${GB_ID}` 직접 goto
   - ⬜ tests 2-4: 각 테스트 시작 전 setGbStatus 명시적 세팅
   - ⬜ successSelector 수정 (상태 전이 후 나타나는 요소 기준)
   - ⬜ ship-flow: pickupPlace/Time fill 검증
   - ⬜ `tests/integration/`: Toss sandbox 외부 의존성 테스트 — **얇은 스모크 테스트로만** (테스트 카드로 confirm 1~2건, "연동 자체가 살아있나"만 확인). 예외 케이스 전수 검증은 아래 #2에서 mock으로
   - ⬜ 프론트 예외 UI 검증 — `page.route()`로 API 응답 가로채서 400/500/timeout 강제 → 에러 메시지/버튼 비활성화 등 확인 (현재 happy path만 있음, 같은 Playwright 하네스 확장)
   - 상세: `docs/test/group-buying-e2e.md`

2. **백엔드 예외 케이스 테스트 (Jest)** — #1과 별개 트랙 (다른 도구, 다른 워크스페이스: `backend/`, 현재 `*.spec.ts` 0개)
   - ⬜ `PaymentService` 등 핵심 서비스 유닛 테스트 착수 — 정원 초과, 총대 본인 참여, 모집 상태 아닐 때 등 예외 분기 검증
   - ⬜ `TossPaymentsClient`는 이미 `@Injectable()` DI 주입 구조라 테스트에서 mock 대체 용이 (`useValue`로 `confirm`/`cancel` 원하는 응답 강제) — 카드 거절, 타임아웃, 중복 confirm 등 결정론적으로 재현
   - ⬜ `GroupBuyingService` 등 동시성 관련 예외 케이스 (동시 참여로 정원 초과 등)

3. **create 페이지 대시보드 구조에 맞게 재작성** ✅
   - ✅ 컴포넌트 이전 후 빈 리다이렉트 폴더만 정리 — `components/`(Step1~3Content)는 `dashboard/create/components/`로 이동. `CreateButton.tsx` 기본 `redirectPath`도 `/dashboard/create`로 수정 (2026-07-10)
     고
4. **CSR/SSR 구조 정리 + Suspense 사용처 문서화**
   - 현재 Suspense 위치 일관성 확인
   - useSearchParams 사용 컴포넌트 내부 Suspense 패턴 정리

5. **React Query 부분 도입**
   - 참여자 목록 (`invalidateQueries`로 목록만 재fetch)
   -
   - 뮤테이션 후 `router.refresh()` 대체

## 우선순위 중간

6. **보안**
   - ✅ `NEXT_PUBLIC_VAPID_PRIVATE_KEY` 제거 (private key 클라이언트 노출) — 참조 코드 없어 `.env`에서 삭제만으로 해결 (2026-07-10)
   - XSS 점검
   - `src/apis/utils/applySetCookies.ts` — Set-Cookie 헤더 직접 파싱하는 손수 짠 코드 (2026-07-29 추가). 지금 있는 쿠키 형태에서만 동작 확인했지, 범용으로 안전하다고 검증 안 됨. `set-cookie-parser` 라이브러리로 교체하거나, 백엔드가 토큰을 JSON 바디로 내려주도록 바꾸면(단, 백엔드 코드라 손대면 안 됨 규칙과 충돌) 이 파싱 자체가 필요 없어짐 — 우선순위 낮음, 지금 코드가 실제로 깨지는 케이스는 없음

7. **디자인 컴포넌트 정리 + 번들 크기 감소**
   - MUI, Mantine, styled-components 혼재 정리
   -
   - ✅ Redux 잔재 제거 — src 전체에서 import 0건 확인, `@reduxjs/toolkit`/`react-redux` 패키지 삭제 (2026-07-10)

8. **성능 측정 및 개선**
   - Web Vitals 측정 (LCP, CLS, FID)
   - 번들 분석
   - `group-buying/detail/[id]/page.tsx` API 순차 await → `Promise.all` 병렬화 (dashboard/leading/[gbId]는 이미 병렬 처리 중, detail만 워터폴 남음)
   - 전 라우트가 `ƒ Dynamic` (정적/ISR 캐싱 0건) — `(root)/layout.tsx`의 `getMyInfoServer()`가 매 요청 쿠키를 읽어서 하위 전체가 강제 dynamic됨. React Query(클라이언트 캐시)와는 별개 레이어, 고치려면 인증 체크 구조 자체를 손봐야 함 — 우선 원인 파악만 해둔 상태

## 우선순위 낮음

9. **코드 정리**
   - 빌드 warning 해소 (unused vars)
   - ✅ `TabMenu` 컴포넌트 dead code 제거 — 프로젝트 어디서도 사용처 없어 파일 삭제 (2026-07-10)
   - API 실패 메시지 통일

10. **공통 컴포넌트 정리**

## 캐시 정합성 딥다이브 후보 (포폴용, 2026-07-29 논의)

오늘 Router Cache(로그인/로그아웃) 이슈를 판 게 "캐시 무효화" 문제의 한 인스턴스였을 뿐 —
분산 시스템 캐시 정합성(Redis 클러스터, replica lag, cache stampede 등)까지 이해했다고
하면 오버클레임. 다음에 파볼 만한 것들, 프론트/백엔드 갈림:

**프론트에 남는 경우 (추천 — 오늘 거랑 자연스럽게 이어짐)**

1. **멀티탭 동기화** — 탭 A에서 로그아웃해도 탭 B는 모름(각자 독립 JS 메모리). `BroadcastChannel`/`storage` 이벤트로 auth 상태 탭 간 동기화. 여러 독립 실행 컨텍스트가 하나의 진짜 상태에 정합성을 맞추는 문제라 미니어처 분산 시스템 문제에 가까움. 지금 전혀 안 돼 있음 — 재현부터 해볼 것.
2. **React Query 낙관적 업데이트 + 롤백** (5번과 연결) — 뮤테이션 실패 시 UI 되돌리기까지 구현하면 정합성 문제로 깊어짐.
3. **Next.js Data Cache + `revalidateTag`** — 지금 axios라서 Data Cache 자체가 적용 안 됨. 일부러 `fetch()` + ISR로 바꿔서 캐시 만들고, 공구 상태 변경 시 `revalidateTag`로 무효화하는 것까지 구현.

**백엔드로 가는 경우 (본인이 백엔드 공부 중이라 고려 가능, 진짜 "분산" 문제 만나는 길)**

4. 백엔드에 Redis 캐시 레이어 도입(예: 공구 상세 조회 캐싱) → 상태 변경 시 무효화 로직 직접 구현 → 여러 프로세스가 같은 Redis 공유하는 상황에서 stale read 재현/수정 → cache stampede 방어까지 가면 "분산 캐시" 얘기를 할 자격이 생김. 이건 오늘 거랑 이어지는 작업이 아니라 별도 신규 인프라 도입.

## 미결

- 토큰 시스템, 컴파운드 패턴 — 맥락 확인 필요
- Sentry 에러 트래킹 도입 여부 (배포 후 판단)
- 백엔드 배포 후 `NEXT_PUBLIC_API_BASE_URL` Vercel 환경변수 업데이트
- 웹 푸시 알림 (VAPID 정리 후)
