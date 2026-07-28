음# Frontend 의사결정 & 실수 기록

> 나중에 같은 실수 반복하지 않으려고. 커밋 기록 기반.

---

## 전역 상태 관리

### Redux → Zustand 전환 (`34236be`, 2026-04-25)

**결정**: Redux + `commonSlice` → Zustand `authStore`

**해결한 것**:

- `useAuthSync` 삭제 → 같은 페이지에서 `/api/auth/me` CSR 3번 중복 호출 제거
- Redux `Provider` 보일러플레이트 제거
- SSR layout에서 user fetch → `initialUser` prop으로 내려서 store 초기화

**놓친 것**:

- Redux `commonSlice`도 `user: null` 싱글톤이었음 → **하이드레이션 flash 문제는 그대로였는데 짚지 못함**
- "Provider 불필요, 보일러플레이트 제거"를 장점으로 봤지만, `AuthContextProvider` 개념(별도 auth 컨텍스트 분리)은 올바른 방향이었음 → 개념까지 같이 삭제됨

---

### Redux → Zustand 전환 (`34236be`, 2026-04-25)

**결정**: Redux + `commonSlice` → Zustand `authStore`

**해결한 것**:

- `useAuthSync` 삭제 → 같은 페이지에서 `/api/auth/me` CSR 3번 중복 호출 제거
- Redux `Provider` 보일러플레이트 제거
- SSR layout에서 user fetch → `initialUser` prop으로 내려서 store 초기화

**놓친 것**:

- Redux `commonSlice`도 `user: null` 싱글톤이었음 → **하이드레이션 flash 문제는 그대로였는데 짚지 못함**
- "Provider 불필요, 보일러플레이트 제거"를 장점으로 봤지만, `AuthContextProvider` 개념(별도 auth 컨텍스트 분리)은 올바른 방향이었음 → 개념까지 같이 삭제됨

---

### useEffect → useRef 패치 (`4fb9563`, 2026-06-11) — 임시방편, 이후 대체됨

**결정**: `Providers.tsx`에서 `initialUser` 주입을 `useEffect` → `useRef` + 렌더 중 `setState`로 변경

**이유**: `useEffect`는 첫 렌더 이후 실행 → user = null 상태로 Header가 한 번 렌더 → 깜빡임

**한계**: 풀 페이지 로드 시 React 하이드레이션이 `getSnapshot() → null` 읽고 DOM 교정 후 setState가 뒤따르는 구조 → flash 잔존. 임시방편이었고 팩토리 패턴으로 대체됨.

---

### Zustand 팩토리 패턴 + React Context 마이그레이션 (2026-06-13) ✅

**결정**: 싱글톤 `create()` → `createStore()` 팩토리 + `AuthStoreContext`

**변경 내용**:

- `authStore.ts` — `createAuthStore(initialUser)` 팩토리 + `AuthStoreContext` + `useAuthStore` 훅
- `AuthStoreProvider.tsx` 신규 생성 — store 생성 + context 제공 + 401 interceptor 등록 (`AxiosInterceptorSetup`)
- `Providers.tsx` — auth 관심사 완전 제거 (UI 설정만 담당)
- `apiClient.ts` — 401 블록 제거 (React 트리 밖에서 store 접근 제거)
- 각 layout — `AuthStoreProvider`로 감싸도록 변경

**해결된 것**: store가 `null`인 순간 자체가 없어졌으므로 하이드레이션 flash 원천 차단

---

### `(root)` 공유 layout 도입 (2026-06-14) ✅

**결정**: `app/(root)/layout.tsx` 추가 → `AuthStoreProvider` + `Providers`를 모든 route group이 공유하는 단일 지점에 집약

**변경 내용**:

- `app/(root)/layout.tsx` 신규 생성 — `getMyInfoServer()` + `AuthStoreProvider` + `Providers`
- `(auth)/`, `(home)/`, `(protected)/` 폴더를 `(root)/` 하위로 이동
- `getMyInfoServer`에 React `cache()` 추가 — 동일 요청에서 여러 layout이 호출해도 네트워크 1회
- `(auth)/layout.tsx` — `AuthStoreProvider` 제거, auth check + UI만
- `(home)/layout.tsx` — `AuthStoreProvider`/`getMyInfoServer` 제거, `Header`만
- `(protected)/layout.tsx` — `AuthStoreProvider` 제거, auth check + `ProtectedClient`만
- `LoginForm.tsx` — `window.location.href` → `router.refresh() + router.push()`

**해결된 것(당시)**: `(root)/layout.tsx`가 `/login`과 홈 경로의 공유 segment → `router.refresh()`가 이 segment를 무효화 → 이후 navigation에서 fresh RSC fetch → 로그인 후 헤더에 user 정상 표시

**⚠️ 이후 롤백됨 (`b7f6318`, 2026-06-21)**: 완전히 무관한 기능 커밋("stepper 삭제, 상품 검색 추가, chip 통일")에 묻혀서 `LoginForm.tsx`가 다시 `router.refresh() + router.push()` → `window.location.href`로 되돌아감. 커밋 메시지에 이유 없음 — 의도적 회귀인지 실수인지 불명. **현재(2026-07-26 기준) 코드는 `window.location.href`를 쓰고 있음.** 아래 "해결된 것" 설명은 `9bc22a4` 시점 기준이고 지금은 다시 하드 네비게이션 방식이 정답으로 굳어진 상태 — `router.refresh()+router.push()`로 되돌리려면 왜 이게 다시 빠졌는지부터 확인 필요.

**핵심 원인이었던 것**: 팩토리 패턴 전환 후 Router Cache 문제가 드러남. 구 싱글톤은 `setUser()`가 전역 store를 바꿔서 캐시된 `initialUser=null`이 와도 덮어썼지만, 팩토리는 mount마다 `initialUser` prop으로 새 store를 만들어서 캐시된 null이 그대로 user=null store를 생성했음

**보충 설명 (2026-07-10) — Router Cache가 정확히 뭔지**:

- App Router의 soft navigation(`<Link>`, `router.push`)은 페이지 이동 시 전체 HTML을 다시 안 받고 **RSC payload**(직렬화된 서버 컴포넌트 트리)만 fetch해서 DOM을 부분 패치함
- 이 RSC payload를 클라이언트가 잠깐 들고 있는 게 Router Cache. Static/ISR 라우트는 이걸 미리 prefetch해서 캐싱해두고(그래서 클릭하는 순간 네트워크 요청 없이 즉시 전환됨), dynamic 라우트는 짧은 유효시간만 두고 매번 새로 받아옴
- 이번 로그인 버그는 이 캐시가 **무효화가 안 돼서** 로그인 이후에도 로그인 전 RSC payload(`user=null`)를 재사용해버린 케이스. 당시엔 `router.refresh()`로 해당 segment 캐시를 강제 무효화해서 해결했었지만, 이후 `b7f6318`에서 다시 `window.location.href`(하드 네비게이션으로 캐시 자체를 날려버리는 방식)로 롤백되어 현재까지 유지 중
- 반대로 "전 라우트가 dynamic이라 캐싱이 아예 없다"는 성능 이슈(→ `7. 성능 측정 및 개선` 참고)는 **같은 메커니즘의 반대쪽 문제** — 캐시가 없어서 매번 네트워크 왕복이 생기는 케이스. 나중에 static/ISR을 도입하게 되면 이번에 겪은 "캐시 무효화 실패로 stale 데이터 노출" 버그가 재발하지 않도록 무효화 전략을 같이 설계해야 함

---

### Server Action + revalidatePath로 최종 전환 (2026-07-29) ✅

**결정**: `window.location.href` 하드 리로드를 제거하고 `loginAction`/`logoutAction`(Server Action)으로 교체.

**변경 내용**:

- `src/app/(root)/(auth)/login/actions.ts` — 로그인: `apiServer` 호출 → 백엔드 `Set-Cookie` 파싱(`applySetCookies`)해서 Next 쿠키로 재설정 → `revalidatePath('/', 'layout')` → `redirect()`
- `src/apis/actions/auth.actions.ts` — 로그아웃: 같은 패턴, `pathname`이 `/dashboard`(protected 전부 여기 하위)로 시작하면 홈으로 리다이렉트, 아니면 제자리 유지
- `AuthStoreProvider.tsx` — `useRef` 가드가 soft navigation 이후 새 `initialUser`를 못 받는 버그 발견 → `useEffect`로 유저 id 비교 후 `setUser`/`clearUser` 동기화 추가

**측정 결과**: 클릭→목적지 도달 시간 하드 리로드 대비 약 3.6배 개선 (~2653ms → ~730ms).

**발견한 버그 2개** (하드 리로드가 가리고 있었던 것들):

1. 로그인 성공해도 헤더가 로그아웃 상태로 남음 — `AuthStoreProvider`의 `useRef` 가드 때문. 하드 리로드는 매번 컴포넌트를 통째로 재마운트시켜서 이 문제가 드러날 기회가 없었음. **이거 `4fb9563`(2026-06-11, `Providers.tsx`의 useEffect→useRef 패치)랑 완전히 같은 종류의 패턴 — "초기값을 useRef로 한 번만 반영하고 이후 prop 변화는 무시"하는 방식이 자리만 옮겨서 재발한 것.**
2. protected 페이지(`/dashboard/*`)에서 로그아웃하면 `router.refresh()`가 그 자리를 유지하려다 `(protected)/layout`의 재인증 체크가 실패해서 `/login`으로 튕김. pathname 분기로 수정.

**redirect loop 재현 조건 재검증**: `router.push()`만 쓰거나 `router.refresh()+push()`를 콜드 진입(`page.goto`)으로 재현 시도 → 둘 다 실패. Next.js 소스(`prefetch-cache-utils.js`) 직접 확인 결과 dynamic staleTime 기본값(30초)은 설치된 `14.2.35`에서도 그대로라 프레임워크 변경 때문은 아님. 실제로는 **"이미 hydrate된 상태에서 `<Link>` 클릭으로 그 protected URL 진입을 먼저 시도해야" Router Cache에 stale 엔트리가 생기는** 조건이 필요 — 이 조건으로 재현 성공(2/2), Server Action 버전은 같은 조건에서 통과(5/5). 상세: `docs/issues/route-group-auth-structure.md`

---

## async 처리

### 모달 비동기 버그 수정 (2026-06-21)

**발견한 실수:**

- `ConfirmModalContent`, `CancelReasonModalContent`, `ShippedModalContent` — async prop 받으면서 isLoading/disabled 없음 → 중복 클릭 시 API 중복 호출
- `ShippedModalContent` — 빈값 검증 없이 제출 가능
- `console.error`도 `console.log`와 함께 배포 전 제거 대상 (2곳 잔존 발견)
- react-hook-form 없는 컴포넌트에서 async 래퍼 함수명 `handleSubmit` 사용 → `handleClick`으로

**깨달은 것:**

- `try-finally` 는 catch에서 early return해도 finally 실행됨 → isLoading 해제 보장
- prop으로 async 함수 받는 컴포넌트는 **내부에서** await + isLoading 처리해야 함. 호출자에 맡기면 중복 클릭 못 막음
- react-hook-form 있으면 `formState.isSubmitting` 활용, 별도 state 불필요

**남은 미해결 문제:**

- `handleShipped`: SHIPPED 상태 변경 + 픽업 정보 저장 두 API 분리돼 있어 부분 실패 시 DB 불일치. try-catch 분리로 메시지만 달리함 (떔빵). 근본 해결은 백엔드 트랜잭션
- `router.refresh()` 전반: 모달 닫힘과 화면 갱신 타이밍 불일치. 근본 해결은 React Query `invalidateQueries`
- `ParticipantDashboard` cancelReason: `LEADER_CANCELLED` 임시 사용 중. 백엔드 `PARTICIPANT_CANCELLED` enum 추가 후 교체 필요

---

## 결제 플로우

### 참여자 직접 생성 방식 → Toss PG 결제 (`#8`, 2026-06-10)

**결정**: 기존 `joinParticipant` 호출 → Toss SDK `requestPayment` redirect 방식으로 교체

**주의사항**:

- Toss 테스트 모드에서 카카오페이 등 간편결제는 실제 결제 연동됨 → 테스트 카드(`4330000000000000`) 사용할 것
- React StrictMode에서 `useEffect` 두 번 실행 → `confirmPayment` 중복 호출 → `useRef` guard 필요
- 결제 성공 redirect URL에 `gbId`를 쿼리파라미터로 포함해야 상세 페이지로 이동 가능

---

## 환경 변수

### `NEXT_PUBLIC_VAPID_PRIVATE_KEY` 오발급 (2026-07-10) — 삭제 완료 ✅

**발견한 것**: frontend `.env`에 `NEXT_PUBLIC_VAPID_PRIVATE_KEY`가 들어있었음. 코드에서 실제 참조하는 곳은 0건 (private key는 백엔드 `web-push.service.ts`가 자체 `VAPID_PRIVATE_KEY`로 따로 사용 중 — 발급할 때 프론트 `.env`에도 잘못 복붙된 것으로 추정).

**일반 규칙 (다음에 또 헷갈리지 않기 위해)**:

- `NEXT_PUBLIC_` 접두사가 붙은 변수는 `next build` 시점에 webpack이 `process.env.NEXT_PUBLIC_X` 코드를 실제 값 **문자열로 그대로 치환**해서 클라이언트 JS 번들에 박아 넣음 (런타임 조회 아님, 컴파일 타임 텍스트 치환)
- `.env`에 있다고 안전한 게 아님 — 브라우저 노출 여부는 오직 변수 **이름의 접두사**로 결정됨. `.env` 자체는 하드코딩 방지 + 환경별 값 주입 용도일 뿐, 비밀 유지를 보장하는 장치가 아님
- 구조 분해 할당(`const { NEXT_PUBLIC_X } = process.env`)이나 동적 접근(`process.env[key]`)은 치환 안 됨 — 반드시 `process.env.NEXT_PUBLIC_X` 형태로 직접 접근해야 인라인됨
- 새 환경변수 만들 때: 접두사 붙이기 전에 "브라우저 devtools에 이 값이 그대로 보여도 되는가"부터 자문할 것

**해결**: `.env`에서 해당 라인 삭제 (코드에 참조가 없어 다른 파일 수정은 불필요했음)

---

## 삭제된 개념들 (왜 없앴는지)

| 파일/훅                          | 삭제 시점 | 이유                                                   |
| -------------------------------- | --------- | ------------------------------------------------------ |
| `useAuthSync.ts`                 | `34236be` | SSR에서 user fetch 후 store 주입으로 CSR 재호출 불필요 |
| `AuthContextProvider.tsx`        | `5fad3be` | 데드 코드 (아무데도 안 쓰임)                           |
| `AuthInitializer.tsx`            | `5fad3be` | useAuthSync 제거 후 불필요                             |
| refresh token 인터셉터           | `dccfbbd` | 데드 코드                                              |
| `RequestPaymentModalContent.tsx` | `#8`      | Toss PG 도입으로 수동 결제 요청 플로우 삭제            |
