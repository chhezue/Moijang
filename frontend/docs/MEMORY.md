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

**해결된 것**: `(root)/layout.tsx`가 `/login`과 홈 경로의 공유 segment → `router.refresh()`가 이 segment를 무효화 → 이후 navigation에서 fresh RSC fetch → 로그인 후 헤더에 user 정상 표시

**핵심 원인이었던 것**: 팩토리 패턴 전환 후 Router Cache 문제가 드러남. 구 싱글톤은 `setUser()`가 전역 store를 바꿔서 캐시된 `initialUser=null`이 와도 덮어썼지만, 팩토리는 mount마다 `initialUser` prop으로 새 store를 만들어서 캐시된 null이 그대로 user=null store를 생성했음

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

## 삭제된 개념들 (왜 없앴는지)

| 파일/훅                          | 삭제 시점 | 이유                                                   |
| -------------------------------- | --------- | ------------------------------------------------------ |
| `useAuthSync.ts`                 | `34236be` | SSR에서 user fetch 후 store 주입으로 CSR 재호출 불필요 |
| `AuthContextProvider.tsx`        | `5fad3be` | 데드 코드 (아무데도 안 쓰임)                           |
| `AuthInitializer.tsx`            | `5fad3be` | useAuthSync 제거 후 불필요                             |
| refresh token 인터셉터           | `dccfbbd` | 데드 코드                                              |
| `RequestPaymentModalContent.tsx` | `#8`      | Toss PG 도입으로 수동 결제 요청 플로우 삭제            |
