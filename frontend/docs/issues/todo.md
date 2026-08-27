# 남은 작업 목록

## 우선순위 높음

1. **Playwright + AI Agent 하네스 구축** ← 진행 중
   - ✅ `tests/` 별도 workspace 분리 (frontend에서 테스트 의존성 제거)
   - ✅ AI agent loop (RUN_AI_AGENT flag, maxSteps, 비용 로깅)
   - ✅ DB fixture (beforeAll seed, afterAll 원복)
   - ✅ 보안 테스트 5개 통과 (`tests/api/`)
   - ✅ test 1: 참여자 뷰 CONFIRMED 상태 UI 검증
   - ✅ tests 2-4: detail 대신 `/dashboard/leading/${GB_ID}` 직접 goto (2026-08-10 확인 — 문서가 낡아있었을 뿐 코드는 이미 반영돼 있었음, 실제 실행으로 재검증함)
   - ✅ tests 2-4: 각 테스트 시작 전 setGbStatus 명시적 세팅 (2026-08-10 확인, 동일)
   - ✅ successSelector 수정 (2026-08-10 확인 — `data-testid` 기반으로 이미 안정적, 4/4 통과)
   - ✅ ship-flow: pickupPlace/Time fill 검증 (2026-08-10 확인 — test 3에 이미 포함, 통과)
   - ⬜ `tests/integration/`: Toss sandbox 외부 의존성 테스트 — **얇은 스모크 테스트로만** (테스트 카드로 confirm 1~2건, "연동 자체가 살아있나"만 확인). 예외 케이스 전수 검증은 mock으로 별도
   - ⬜ 프론트 예외 UI 검증 — `page.route()`로 API 응답 가로채서 400/500/timeout 강제 → 에러 메시지/버튼 비활성화 등 확인 (현재 happy path만 있음, 같은 Playwright 하네스 확장)
   - ⬜ 대시보드 크로스유저 접근 테스트 — 로그인한 유저 A가 URL로 유저 B의 `/dashboard/leading/[gbId]` 진입 시도 시 제대로 막히는지 (2026-08-26 논의)
   - 상세: `docs/test/group-buying-e2e.md`

2. **대학(캠퍼스) 스코프 필터링 누락** ⚠️ 신규, 우선순위 최상 (2026-08-26 발견)
   - README 핵심 가치: "같은 학교·같은 캠퍼스에서 물건을 함께 모아 산다", 가입은 학교 이메일 인증으로 막혀있음
   - **근데 `GroupBuying` 스키마에 `universityId` 필드가 아예 없고, `group-buying` 모듈 전체에 university로 필터링하는 쿼리가 0건** — 확인 완료
   - 실제로는 전국 모든 대학 유저가 같은 목록을 보고 서로 다른 학교 공구에 참여 가능한 상태 — 가입 단계만 막혀있고 컨텐츠 단계는 전혀 안 막힘
   - 필요 작업: `GroupBuying`에 `universityId` 추가(생성 시 `leaderId`의 대학으로 채움) + 목록 조회 쿼리에 필터 추가 — 백엔드 스키마/쿼리 변경 필요
   - 관련 파일: `backend/src/group-buying/schema/group-buying.schema.ts`, `backend/src/group-buying/**`

3. **create 페이지 대시보드 구조에 맞게 재작성** ✅
   - ✅ 컴포넌트 이전 후 빈 리다이렉트 폴더만 정리 — `components/`(Step1~3Content)는 `dashboard/create/components/`로 이동. `CreateButton.tsx` 기본 `redirectPath`도 `/dashboard/create`로 수정 (2026-07-10)

4. **CSR/SSR 구조 정리 + Suspense 사용처 문서화**
   - 현재 Suspense 위치 일관성 확인
   - useSearchParams 사용 컴포넌트 내부 Suspense 패턴 정리

5. **캐시/상태 정합성 전략** (2026-08-26 정리 — 레이어별로 다른 문제, 섞어 쓰지 말 것)
   - **Router Cache(클라이언트) 문제 → Server Action + `revalidatePath`**
     - 로그인/로그아웃: ✅ 완료 (`2026-07-29`, 3.6배 개선 측정함)
     - ✅ `ParticipantDashboard.tsx`의 `handleCancelParticipation` — [이슈 #30](https://github.com/chhezue/Moijang/issues/30), 커밋 `39dd3f8` (`frontend/fix/30-participant-cancel-stale-cache`)
       - Playwright로 재현: mock 응답 + DB 직접 삭제로 격리 → `router.push` 직후 stale, `reload` 후 정상 → Router Cache 단독 문제 확인 (`apiServer`가 axios라 Data Cache는 애초에 미적용, React Query도 미사용)
       - `cancelParticipationAction`(Server Action) 신설, 성공 시 `revalidatePath("/dashboard/participating")` 호출 후 이동하도록 전환
       - 실제 Toss 성공 경로까지의 e2e 검증은 보류(테스트 계정에 실결제 없음) — 무효화 위치는 코드 리뷰로 확인 완료

   - **Data Cache/ISR(서버, 공개 콘텐츠) 문제 → 상태별 무효화 전략**
     - 지금 전 라우트가 `ƒ Dynamic`이라 공구 목록/상세도 캐싱 0건 (`(root)/layout.tsx`의 `getMyInfoServer()`가 원인, #8과 연결)
     - **시간 기반 TTL 하나로 퉁치면 안 됨** — 상태별 변동성이 다름: `RECRUITING`(참여/취소로 계속 바뀜, 이벤트 기반 무효화 주력) > `CONFIRMED`/`ORDERED`/`SHIPPED`(총대 업데이트 시에만) > `COMPLETED`/`CANCELLED`(종결, `revalidate: false`로 사실상 영구 캐시 가능)
     - 참여/취소/상태변경 API(`PATCH /api/participant`, `PATCH /api/group-buying/status/:gbId` 등) 성공 시 `revalidateTag`/`revalidatePath` 호출 지점 추가가 핵심 — 시간 기반 revalidate는 이걸 빼먹었을 때의 보험용 fallback만
     - 적용 후 부하테스트로 처리량 개선 측정할 것 (블로그/포폴 소재)

   - **React Query(클라이언트, 인증된 사용자의 개인화 데이터) — 위 둘과 다른 레이어**
     - 참여자 목록 등 로그인한 유저 개인 데이터의 뮤테이션 후 갱신(`invalidateQueries`)용 — Router Cache/Data Cache로 못 푸는 문제
     - 아직 미착수, 뮤테이션 후 `router.refresh()` 의존 중인 곳들이 대상

## 우선순위 중간

6. **보안**
   - ✅ `NEXT_PUBLIC_VAPID_PRIVATE_KEY` 제거 (private key 클라이언트 노출) — 참조 코드 없어 `.env`에서 삭제만으로 해결 (2026-07-10)
   - ✅ XSS 점검

7. **디자인 컴포넌트 정리 + 번들 크기 감소**
   - MUI, Mantine, styled-components 혼재 정리
   - ✅ Redux 잔재 제거 — src 전체에서 import 0건 확인, `@reduxjs/toolkit`/`react-redux` 패키지 삭제 (2026-07-10)

8. **성능 측정 및 개선**
   - Web Vitals 측정 (LCP, CLS, FID)
   - 번들 분석
   - `group-buying/detail/[id]/page.tsx` API 순차 await → `Promise.all` 병렬화 (dashboard/leading/[gbId]는 이미 병렬 처리 중, detail만 워터폴 남음) (2026-08-26 코드로 재확인)
   - 전 라우트가 `ƒ Dynamic` (정적/ISR 캐싱 0건) — 원인 및 도입 전략은 #5로 통합 정리함

## 우선순위 낮음

9. **코드 정리**
   - 빌드 warning 해소 (unused vars)
   - ✅ `TabMenu` 컴포넌트 dead code 제거 — 프로젝트 어디서도 사용처 없어 파일 삭제 (2026-07-10)
   - API 실패 메시지 통일

10. **공통 컴포넌트 정리**

## 미결

- 토큰 시스템, 컴파운드 패턴 — 맥락 확인 필요
- Sentry 에러 트래킹 도입 여부 (배포 후 판단)
- 백엔드 배포 후 `NEXT_PUBLIC_API_BASE_URL` Vercel 환경변수 업데이트
- 웹 푸시 알림 (VAPID 정리 후)
