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
   - ⬜ `tests/integration/`: Toss sandbox 외부 의존성 테스트
   - 상세: `docs/test/group-buying-e2e.md`

2. **create 페이지 대시보드 구조에 맞게 재작성** ✅
   - ✅ 컴포넌트 이전 후 빈 리다이렉트 폴더만 정리 — `components/`(Step1~3Content)는 `dashboard/create/components/`로 이동. `CreateButton.tsx` 기본 `redirectPath`도 `/dashboard/create`로 수정 (2026-07-10)
     고
3. **CSR/SSR 구조 정리 + Suspense 사용처 문서화**
   - 현재 Suspense 위치 일관성 확인
   - useSearchParams 사용 컴포넌트 내부 Suspense 패턴 정리

4. **React Query 부분 도입**
   - 참여자 목록 (`invalidateQueries`로 목록만 재fetch)
   -
   - 뮤테이션 후 `router.refresh()` 대체

## 우선순위 중간

5. **보안**
   - ✅ `NEXT_PUBLIC_VAPID_PRIVATE_KEY` 제거 (private key 클라이언트 노출) — 참조 코드 없어 `.env`에서 삭제만으로 해결 (2026-07-10)
   - XSS 점검

6. **디자인 컴포넌트 정리 + 번들 크기 감소**
   - MUI, Mantine, styled-components 혼재 정리
   -
   - ✅ Redux 잔재 제거 — src 전체에서 import 0건 확인, `@reduxjs/toolkit`/`react-redux` 패키지 삭제 (2026-07-10)

7. **성능 측정 및 개선**
   - Web Vitals 측정 (LCP, CLS, FID)
   - 번들 분석
   - `group-buying/detail/[id]/page.tsx` API 순차 await → `Promise.all` 병렬화 (dashboard/leading/[gbId]는 이미 병렬 처리 중, detail만 워터폴 남음)
   - 전 라우트가 `ƒ Dynamic` (정적/ISR 캐싱 0건) — `(root)/layout.tsx`의 `getMyInfoServer()`가 매 요청 쿠키를 읽어서 하위 전체가 강제 dynamic됨. React Query(클라이언트 캐시)와는 별개 레이어, 고치려면 인증 체크 구조 자체를 손봐야 함 — 우선 원인 파악만 해둔 상태

## 우선순위 낮음

8. **코드 정리**
   - 빌드 warning 해소 (unused vars)
   - ✅ `TabMenu` 컴포넌트 dead code 제거 — 프로젝트 어디서도 사용처 없어 파일 삭제 (2026-07-10)
   - API 실패 메시지 통일

9. **공통 컴포넌트 정리**

## 미결

- 토큰 시스템, 컴파운드 패턴 — 맥락 확인 필요
- Sentry 에러 트래킹 도입 여부 (배포 후 판단)
- 백엔드 배포 후 `NEXT_PUBLIC_API_BASE_URL` Vercel 환경변수 업데이트
- 웹 푸시 알림 (VAPID 정리 후)
