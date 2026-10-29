# 사용자 복원 흐름 & Layout 재사용

최초 접속·로그인·새로고침·로그아웃 각각에서 "로그인한 유저가 누구인지"가 어떻게 정해지는지,
그리고 App Router의 Layout 재사용이 이 흐름에 왜 끼어드는지 정리한 문서.

> 관련: `auth.md` (전체 아키텍처), `jwt refresh token.md` (토큰 정책)
> 이 문서는 2026-10-30 기준 **cross-site 배포 환경(Vercel ↔ EC2)에서 실제로 깨져있는 부분**까지 포함해서 적음.

---

## 핵심 구조 한 줄 요약

```
서버(SSR)   : (root)/layout.tsx → getMyInfoServer() → initialUser로 Zustand store 생성
클라이언트(CSR): Zustand store (factory) → useAuthStore()로 하위 컴포넌트가 읽음
```

- **서버는 유저를 한 번 "결정"**해서 넘겨줄 뿐, 그 이후 상태는 전부 클라이언트(Zustand)가 들고 있음.
- Zustand는 **싱글톤이 아니라 팩토리 패턴** — `AuthStoreProvider`가 mount될 때마다 `initialUser`를 주입받아 새 store를 만듦. 즉 store가 다시 만들어지는 시점마다 서버가 넘겨준 값으로 리셋됨.

---

## 1. 최초 접속 (콜드 진입)

주소창 직접 입력, 북마크, 외부 링크 클릭 — 전부 브라우저가 서버에 새 HTML을 요청하는 **하드 네비게이션**임.

```
브라우저 요청 (쿠키 자동 첨부)
  → Next 서버가 (root)/layout.tsx 렌더
      → getMyInfoServer()
          → withServerCookies(): 이번 요청의 Cookie 헤더에서 accessToken/refreshToken 읽음
          → apiServer.get('/api/auth/me', { headers: Cookie 포워딩 })
              → 백엔드 `JwtAuthGuard`가 accessToken 먼저 검증
                  성공 → GetUserDto 반환
                  accessToken 실패 → refreshToken으로 재시도 (자동 재발급, `auth.guard.ts:26-39`)
                      성공 → GetUserDto 반환 (accessToken 쿠키도 새로 갱신됨)
                      둘 다 실패/쿠키 없음 → 401
      → initialUser = 유저 객체 | null
  → <AuthStoreProvider initialUser={...}> 로 Zustand store 최초 생성
  → HTML + hydration
```

accessToken은 5분만 유효하지만, 저렇게 `JwtAuthGuard`가 만료 시 refreshToken(14일)으로 자동 재시도하기 때문에 평소엔 재로그인 없이 세션이 유지됨 — 단, 이 재시도도 결국 "쿠키가 요청에 실려 있어야" 가능한 거라 아래 cross-site 문제의 영향을 똑같이 받음.

이 단계에서 유저 정보가 맞게 세팅되려면 **"브라우저가 보낸 요청에 쿠키가 실제로 들어있어야"** 함. 로컬(둘 다 `localhost`)에서는 항상 되고, 운영(Vercel↔EC2, 다른 도메인)에서는 **아래 "알려진 문제" 참고 — 안 됨.**

---

## 2. 로그인

```
loginForm.tsx (CSR)
  → POST /api/auth/login (브라우저 → 백엔드 직접 XHR, Next 서버 안 거침)
      → 백엔드가 accessToken/refreshToken 쿠키 Set-Cookie
      → 응답 body에 GetUserDto 포함
  → setUser(user)  // Zustand에 즉시 세팅 — 이 시점엔 정상 동작함
  → window.location.href = redirectTo  // 전체 페이지 리로드
      → 브라우저 JS 메모리 전부 날아감 (방금 세팅한 setUser 포함)
      → 이후는 "1. 최초 접속"과 완전히 동일한 흐름으로 처음부터 다시 결정됨
```

**중요:** 로그인 응답의 user 정보(`setUser(user)`)는 리로드와 동시에 버려짐. 로그인 후 화면에 뜨는 유저 정보는 그 값이 아니라, 리로드된 페이지에서 SSR이 **다시 조회한** 결과임. 즉 로그인 자체가 성공해도, 최종적으로 화면에 반영되느냐는 전적으로 "1. 최초 접속"의 쿠키 복원이 성공하느냐에 달려있음.

### 왜 `router.push()`가 아니라 `window.location.href`인가

`router.push()`로 이동하면 Next App Router는 **공통 Layout을 재사용**함 — 바뀌는 segment(`page.tsx`)만 다시 렌더하고, `(root)/layout.tsx`처럼 상위 레이아웃은 이미 렌더됐던 결과(Router Cache)를 그대로 씀. 로그인 전에 그 보호된 URL을 소프트 네비게이션으로 한 번이라도 먼저 시도한 적이 있으면, 캐시에 "미인증(`null`)" 상태가 박혀있고, 로그인 후 `router.push()`는 그 캐시를 재사용해서 다시 `/login`으로 튕기는 **redirect loop**가 생김.

캐시를 무효화하려면 `router.refresh()`를 같이 불러야 하는데, 이게 Promise를 반환하지 않아 `await`가 안 됨 → `router.push()`가 무효화 완료 전에 먼저 실행되는 레이스 컨디션 발생.

`window.location.href`는 Next의 캐시 메커니즘 자체를 무시하고 브라우저 레벨에서 완전히 새 요청을 쏘는 거라 이 레이스가 원천적으로 안 생김. **대신 매번 서버에 새로 쿠키 복원을 요청하게 되므로, 그 복원이 실패하는 환경(cross-site)에서는 이 방식도 소용없음.**

### 네비게이션 방식별 상태 변화 비교

"캐시 재사용 문제"와 "쿠키 문제"를 분리해서 보려면, 네비게이션 방식마다 정확히 뭐가 바뀌고 뭐가 안 바뀌는지 봐야 함.

|                                                        | `router.push()` 단독                          | `router.refresh()` 단독                   | `push()+refresh()` 조합                                                          | `window.location.href`             |
| ------------------------------------------------------ | --------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Zustand store 인스턴스                                 | 그대로 유지 (리마운트 없음)                   | 그대로 유지                               | 그대로 유지                                                                      | **파괴되고 새로 생성**             |
| 브라우저 네트워크 요청                                 | Router Cache에 있으면 **요청 자체가 안 나감** | 캐시 무시하고 **항상** RSC payload 재요청 | push가 캐시를 먼저 쓰거나, refresh 응답을 기다리지 못해 순서 보장 안 됨 (레이스) | 일반 `document` 요청               |
| 쿠키 전송                                              | 요청이 안 나가면 전송할 것도 없음             | 전송됨 (same-origin fetch라 자동 포함)    | 레이스 결과에 따라 다름                                                          | 전송됨 (타겟 도메인 쿠키 정책대로) |
| 레이아웃 Server Component 재실행                       | **안 됨**                                     | **됨**                                    | 보장 안 됨                                                                       | **됨** (무조건)                    |
| `AuthStoreProvider`에 새 `initialUser` prop이 내려오나 | 안 내려옴 (캐시된 옛 값)                      | **내려옴**                                | 보장 안 됨                                                                       | 내려옴                             |
| 그 새 prop이 실제로 store에 반영되나                   | -                                             | **안 됨** (아래 참고)                     | -                                                                                | **됨**                             |

마지막 줄이 함정: `AuthStoreProvider`는 이렇게 생겼음.

```tsx
const storeRef = useRef<AuthStoreApi>();
if (!storeRef.current) {
  storeRef.current = createAuthStore(initialUser ?? null); // 딱 한 번만 시딩
}
```

`router.refresh()`는 레이아웃을 다시 실행시켜서 새 `initialUser`를 만들어내는 데까지는 성공하지만, `AuthStoreProvider` 컴포넌트 인스턴스 자체는 리마운트되지 않아서(화면에 계속 붙어있던 같은 컴포넌트) `storeRef.current`가 이미 차 있음 → `if` 블록을 스킵 → 새로 받은 `initialUser`는 그냥 버려지고 store는 예전 값을 계속 들고 있음.

즉 **쿠키 문제·캐시 재사용 문제를 둘 다 고쳐도, `refresh()`만으로는 화면의 유저 정보가 안 바뀌는 완전히 별개의 세 번째 버그**가 있음. `window.location.href`가 셋 중 유일하게 이걸 포함한 모든 문제를 한 번에 우회하는 이유는, Zustand store 인스턴스를 포함한 JS 힙 전체를 날리고 `AuthStoreProvider`를 처음부터 다시 마운트시켜서 `storeRef.current`가 항상 빈 상태로 시작하기 때문임.

---

## 3. 새로고침 / 소프트 네비게이션 재방문

| 액션                                 | 레이아웃 재실행?                             | Zustand 유저 정보 갱신?                                                                                                                                |
| ------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F5 새로고침, 주소창 재입력           | 됨 (하드 네비게이션)                         | 됨 — "1. 최초 접속"과 동일 (`AuthStoreProvider` 자체가 새로 마운트됨)                                                                                  |
| `<Link>` 클릭, `router.push()`       | **안 됨** (Router Cache 재사용)              | **안 됨** — 이전 렌더 결과 그대로                                                                                                                      |
| `router.push()` + `router.refresh()` | 타이밍 맞으면 됨 (await 불가라 보장은 안 됨) | **그래도 안 됨** — 레이아웃이 재실행돼서 새 `initialUser`를 만들어내도, 위에서 짚은 `useRef` 1회 시딩 때문에 `AuthStoreProvider`가 그 새 prop을 무시함 |

즉 App Router에서 "같은 레이아웃 아래로 이동"하는 건 기본적으로 유저 정보를 다시 확인하지 않는 동작이고, 설령 캐시 문제를 `refresh()`로 억지로 우회해도 `AuthStoreProvider`의 `useRef` 시딩 구조 때문에 결과가 store에 반영이 안 됨. 그래서 로그인 흐름은 `window.location.href`로 통일해서 이 두 문제를 한꺼번에 피해가고 있음 (로그아웃은 경로가 다름 — 아래 "4. 로그아웃" 참고).

---

## 4. 로그아웃

**로그아웃은 로그인과 경로가 다름 — 리로드(`href`)를 안 씀.** 두 가지 트리거가 있고 둘 다 결과적으로 `clearUser()` + `router.refresh()` 조합임.

### 4-1. 유저가 직접 로그아웃 버튼 클릭 (`UserMenu.tsx:55-65`)

```tsx
const handleLogout = async () => {
  try {
    await logout(); // POST /api/auth/logout → 백엔드가 쿠키 clearCookie
    clearUser(); // Zustand 명시적으로 비움 — 즉시 반영됨 (useRef 가드랑 무관, 정상 액션 호출)
    router.refresh(); // 현재 페이지의 Server Component들 재실행
  } catch {
    clearUser(); // 백엔드 호출 실패해도 클라이언트 상태는 일단 정리
  }
  handleClose();
};
```

- `clearUser()`는 Zustand의 `set({ user: null })`를 직접 호출하는 **명시적 액션**이라 `useRef` 1회 시딩 문제가 끼어들 틈이 없음 — Header는 즉시 로그아웃 상태로 바뀜. 이 흐름만 놓고 보면 버그 없음.
- `router.refresh()`는 유저 상태 동기화 목적이 아니라, **지금 보고 있는 페이지의 SSR 데이터를 다시 가져오기 위함**임. 예를 들어 보호된 페이지(`/dashboard` 등)에서 로그아웃하면, 이 refresh가 `(protected)/layout.tsx`를 다시 실행시켜서 `getMyInfoServer()`가 (쿠키가 실제로 지워졌으니) `null`을 반환 → `redirect('/login')`이 걸림. 이건 "방금 지운 쿠키"를 바로 재확인하는 거라 캐시 재사용 문제도 없이 정상 동작함 (cross-site 환경이 아니라는 전제하에).
- 로그아웃 후에도 페이지는 안 날아가므로, 로그인 때와 달리 Router Cache/`useRef` 문제를 애초에 피해갈 필요가 없음 — `clearUser()`가 쓰기 경로를 전담하기 때문.

### 4-2. 세션이 서버에서 이미 무효화된 경우 (`AuthStoreProvider.tsx`의 401 인터셉터)

```tsx
if (error.response?.data?.code === 'SESSION_INVALID') {
  clearUser();
  window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
}
```

- 이건 유저가 로그아웃 버튼을 누른 게 아니라, **API 호출 중 토큰이 둘 다 무효하다고 백엔드가 판정**했을 때(`JwtAuthGuard`가 accessToken도 refreshToken도 둘 다 실패 처리한 경우) 전역 axios 인터셉터가 감지해서 강제로 로그아웃시키는 경로임.
- 여기는 `router.refresh()`가 아니라 **`window.location.href`를 씀** — 로그인 때와 같은 이유로, 지금 보고 있던 페이지 트리 전체가 "로그인된 상태"로 짜여 있었을 수 있어서 안전하게 완전히 새로 그리기 위함으로 보임.

---

## Protected 페이지

`(protected)/layout.tsx`가 `/dashboard`, `/create`, `/my` 등 로그인 필수 라우트 전체를 감싸는 게이트 역할을 함.

```tsx
// (protected)/layout.tsx
export default async function ProtectedLayout({ children }) {
  const user = await getMyInfoServer();
  if (!user) {
    const pathname = headers().get('x-pathname') ?? '/';
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }
  return <ProtectedClient>{children}</ProtectedClient>;
}
```

- **미인증 판단도 전부 SSR 쿠키 복원에 의존함** — `getMyInfoServer()`가 `null`을 반환하면 그 즉시 `/login`으로 redirect. "1. 최초 접속"에서 설명한 쿠키 복원 메커니즘을 그대로 재사용함.
- redirect할 때 원래 가려던 경로를 `?redirect=`로 붙여서, 로그인 폼이 성공 후 `window.location.href = redirectTo`로 원래 페이지로 돌려보냄 (`loginForm.tsx`).
- `ProtectedClient`는 "use client" 컴포넌트로 Header + children만 렌더 — 여기서 추가 인증 체크는 안 함, 위 레이아웃 통과를 전제로 함.
- **보호 라우트 하위의 소프트 네비게이션**(예: `/dashboard/leading` → `/dashboard/participating`)은 같은 `(protected)/layout.tsx`를 재사용하므로 `getMyInfoServer()`가 다시 실행되지 않음 — 즉 이미 그 레이아웃을 통과한 세션 안에서는 재검증이 일어나지 않고, 다음 하드 네비게이션/새로고침 때만 다시 체크됨.
- **cross-site 환경에서 지금 실제로 생기는 증상**: 로그인에 성공해도 `getMyInfoServer()`가 쿠키를 못 읽어 `null` → 보호 라우트에 들어가려 하면 무조건 `/login`으로 튕김. 로그인 자체는 되는데 보호된 페이지엔 영구적으로 못 들어가는 상태가 됨 (아래 "알려진 문제" 참고).

---

## SSR이 지금 처리하고 있는 요청 전체 목록

`*.server.ts` 파일들이 `withServerCookies()`로 쿠키를 수동 forward해서 백엔드를 호출하는 지점을 **페이지/레이아웃 파일 기준**으로 모으면 아래 8곳.

| #   | 파일                                      | 호출 함수                                                   | 쿠키 forward | 인증/개인화 의존                                                      |
| --- | ----------------------------------------- | ----------------------------------------------------------- | ------------ | --------------------------------------------------------------------- |
| 1   | `(root)/layout.tsx` (전역 1회)            | `getMyInfoServer()`                                         | O            | **로그인 유저 식별** — cross-site에서 항상 `null`                     |
| 2   | `(auth)/layout.tsx`                       | `getMyInfoServer()`                                         | O            | 이미 로그인된 유저를 `/`로 돌려보내는 용도 — 지금은 항상 통과시켜버림 |
| 3   | `(protected)/layout.tsx`                  | `getMyInfoServer()`                                         | O            | 미인증 시 `/login` redirect — 지금은 로그인해도 항상 튕김             |
| 4   | `dashboard/leading/layout.tsx`            | `getMyCreateGroupBuying()`                                  | O            | "내가 만든 공구" 목록 — 개인화                                        |
| 5   | `dashboard/participating/layout.tsx`      | `getMyParticipant()`                                        | O            | "내가 참여 중인 공구" 목록 — 개인화                                   |
| 6   | `dashboard/leading/[gbId]/page.tsx`       | `getGroupBuyingByIdServer()` + `getParticipantListServer()` | 전자만 O     | 공구 상세 개인화(`isOwner`) + 참여자 목록(후자는 공개)                |
| 7   | `dashboard/participating/[gbId]/page.tsx` | `getGroupBuyingByIdServer()`                                | O            | 공구 상세 개인화                                                      |
| 8   | `group-buying/detail/[id]/page.tsx`       | `getGroupBuyingByIdServer()` + `getParticipantListServer()` | 전자만 O     | 공개 상세 + 로그인 시 개인화 필드 (후자는 공개)                       |

정리하면: 8개 파일에서 호출하는 함수 중 **쿠키를 실제로 forward하는 건 `getMyInfoServer`/`getMyCreateGroupBuying`/`getMyParticipant`/`getGroupBuyingByIdServer` 4종류**고, 완전히 쿠키와 무관한 건 **`getParticipantListServer` 하나뿐**(6번, 8번 파일에서 다른 함수와 같이 쓰이지만 자기 자신은 쿠키 영향 안 받음). 그래서 cross-site 쿠키 문제가 터지면 참여자 목록 조회를 제외한 SSR 인증/개인화 기능 전체가 같이 영향받음.

---

## 알려진 문제: cross-site 배포에서 SSR 복원이 항상 실패함

**환경**: 프론트 `https://moijang.vercel.app`, 백엔드 `https://<EC2 IP>.sslip.io` — 서로 다른 도메인.

1. 로그인 시 `POST /api/auth/login`은 브라우저 → 백엔드로 가는 **cross-origin XHR**임
2. 백엔드의 `Set-Cookie`는 **응답한 도메인(백엔드)의 쿠키 저장소**에 들어감 — 브라우저가 쿠키를 호출자(프론트) 도메인에 저장해주는 게 아님
3. 이후 `window.location.href`로 프론트 도메인(`moijang.vercel.app`)에 새 요청을 보내면, 브라우저는 **백엔드 도메인의 쿠키를 당연히 안 붙임** (다른 사이트니까)
4. Next 서버(`getMyInfoServer` → `withServerCookies()`)가 이번 요청의 `Cookie` 헤더를 읽어도 **항상 비어있음**
5. `/api/auth/me` 호출이 쿠키 없이 나가서 백엔드가 401 반환 → `initialUser = null`
6. 로그인에 성공했고 쿠키도 (백엔드 도메인 기준으로는) 정상 존재하는데도, 화면은 항상 로그아웃 상태로 보임

**확인 방법**: DevTools → Application → Cookies에서 `moijang.vercel.app`이 아니라 EC2 도메인(sslip.io) 쪽에 `accessToken`/`refreshToken`이 들어있는 걸 볼 수 있음.

**로컬에서 재현 안 되는 이유**: 로컬은 프론트(`localhost:3000`)/백엔드(`localhost:3001`)가 포트만 다르고 호스트명이 둘 다 `localhost`라서 같은 사이트로 취급되어 쿠키가 공유됨.

**이게 "레이아웃 재사용 문제"와 다른 점**: `window.location.href`는 2번 문제(Router Cache 재사용)는 확실히 해결함 — 레이아웃을 강제로 다시 실행시키는 데는 성공함. 근데 다시 실행된 그 레이아웃의 SSR 쿠키 조회 자체가 cross-site라서 실패하는 거라, 레이아웃 재사용 문제를 고치는 것과는 별개로 안 풀림.

**아직 미해결.** 관련 논의: `frontend/docs/issues/`(auth 리팩토링 이슈 트래킹 쪽), 백엔드 `auth.service.ts`의 `getAuthCookieOptions()` (NODE_ENV 기준으로 `sameSite`/`secure` 결정 — 이건 백엔드 코드라 수정 권한 별도 확인 필요).

---

## 목표 아키텍처 — 인증 상태 생명주기 (마이그레이션 완료 후)

지금까지는 "왜 깨졌는지"였고, 이 섹션은 GH 이슈 #36~#39(TanStack `/me` 전환)가 끝난 뒤 **최종적으로 이래야 한다**는 목표 상태임. 관련: `[[project-auth-refactor-plan]]`.

**핵심 규칙 한 줄**: 읽기는 `useMe()`(TanStack `['me']` 쿼리) 하나로만, 쓰기는 로그인·로그아웃·세션무효화 **딱 세 곳**에서만.

| 이벤트                | 트리거                       | 쓰기 동작                                                                                                                           | 네비게이션                                                                                                                 |
| --------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 최초 마운트/재방문    | 컴포넌트 마운트              | `useQuery(AUTH_QUERY_KEY, getMyInfo)` 자동 fetch                                                                                    | AuthGate가 3단계 구분: **로딩**(스켈레톤) / **오류**(401 아님, 에러 UI) / **확인된 미인증**(`null`, 보호라우트면 redirect) |
| 로그인 성공           | `POST /auth/login` 응답      | 공통 함수 경유: `cancelQueries(AUTH_QUERY_KEY)` → **`setQueryData(AUTH_QUERY_KEY, user)`** — 서버 재조회 없이 응답값 바로 캐시 반영 | `router.push()` (더 이상 `href` 불필요 — Router Cache 재사용/`useRef` 시딩 문제 자체가 없는 구조라서)                      |
| 로그아웃              | 유저 버튼 클릭               | **백엔드 로그아웃(쿠키 정리) 완료 확인 후** 공통 함수 경유: `cancelQueries` → `setQueryData(AUTH_QUERY_KEY, null)`                  | `router.push('/login')`                                                                                                    |
| 세션 무효화(401)      | axios 인터셉터 감지          | **상태 정리만**: 공통 함수 경유 `setQueryData(AUTH_QUERY_KEY, null)`                                                                | **인터셉터는 안 함** — AuthGate가 `null`을 보고 알아서 redirect (관심사 분리, GH #37에 이미 명시된 원칙)                   |
| accessToken 만료      | 백엔드 `JwtAuthGuard`가 처리 | 없음 — 프론트 개입 불필요                                                                                                           | 없음 (API 호출만 그대로 성공)                                                                                              |
| refreshToken까지 만료 | 위와 동일 가드               | 결국 401 → "세션 무효화" 경로로 자연 흡수                                                                                           | 위와 동일                                                                                                                  |

**지켜야 할 불변식 (깨지면 오늘 분석한 문제가 재발함):**

1. `['me']` 바깥에 유저 정보를 들고 다니는 두 번째 상태 저장소를 만들지 않는다 — Zustand `user` 슬라이스 부활 금지 (GH #38에서 제거 대상)
2. `setQueryData(['me'], ...)`를 컴포넌트 코드에 직접 흩어 쓰지 않는다 — **공통 함수(또는 `useMutation`의 `onSuccess`) 하나로 감싸서** 로그인/로그아웃/세션무효화 세 곳이 전부 그 함수를 통해서만 캐시를 건드리게 함. 쿼리키(`AUTH_QUERY_KEY = ["me"] as const`)도 그 모듈 하나에서만 정의. 직접 호출이 여러 군데 흩어지면 "누가 언제 썼는지" 추적 불가능해짐 (지금 겪은 소스 오브 트루스 분산 문제의 재발 조건)
3. **그 공통 함수 안에서 `queryClient.cancelQueries(AUTH_QUERY_KEY)`를 먼저 호출하고 `setQueryData`를 쓴다** — 로그인/로그아웃 도중 이전에 날아간 `/auth/me` 요청이 뒤늦게 응답하면, 방금 막 세팅한 새 값을 그 stale 응답이 덮어쓸 수 있음 (TanStack Query 공식 문서가 명시하는 레이스 컨디션). `cancelQueries`로 진행 중이던 쿼리를 먼저 취소해야 이게 안 생김
4. "상태를 정리하는 것"과 "그래서 어디로 보낼지 결정하는 것"은 분리한다 — 인터셉터가 리다이렉트까지 결정하면 AuthGate랑 역할이 겹쳐서 또 다른 레이스가 생길 수 있음
5. AuthGate는 `['me']`의 세 가지 상태를 명확히 구분한다 — **로딩 중**(`isPending`, 아직 모름 → 스켈레톤), **네트워크/서버 오류**(401이 아닌 에러 → 로그인 여부와 무관한 장애이니 로그아웃으로 오판하면 안 됨 → 에러 UI), **확인된 미인증**(`data === null`, 401 → 그제서야 `/login` redirect). 이 구분은 이미 `getMyInfoServer()`(`auth.server.ts:14-17`)가 SSR 쪽에서 하고 있던 걸 Client에도 똑같이 적용하는 것
6. 명시적 로그아웃은 순서를 지킨다: **백엔드 로그아웃(쿠키 정리) 완료 → 캐시 정리(`setQueryData(null)`) → `/login`으로 이동.** 백엔드 확인 전에 클라이언트 상태부터 지우면, 서버는 아직 세션이 살아있는데 클라이언트만 로그아웃으로 보이는 불일치 구간이 생김
7. SSR은 로그인 여부로 내용이 달라지는 데이터를 절대 안 가져온다 — 공구 상세의 공개 필드처럼 "누가 봐도 같은 데이터"만 SSR 유지 (GH #39)

**범위 밖으로 명시적으로 미뤄두는 것**: 다른 탭에서 로그아웃했을 때 이 탭도 즉시 반영되는 멀티탭 동기화(`BroadcastChannel` 등)는 GH #40(추후 최적화)으로 남겨둠 — 지금 고치는 버그들과는 별개 사안.

### 실행 순서 (오늘 분석 반영, 4개 묶음)

이슈를 잘게 쪼개서 산만해지지 않도록, 관련 있는 작업끼리 4개 묶음으로 정리함. GH 이슈 번호(#36~#39)는 그대로 쓰되 어느 묶음에 속하는지만 명확히 함.

**묶음 1 — 사전 검증 (코드 변경 없음, 하드 게이트)**

- 테스트 시나리오 작성: 지금 실패하는 시나리오(redirect loop, 유저 정보 미표시)와 지금 통과해야 하는 시나리오(로컬 로그인/로그아웃, 공개 상세페이지)를 문서화·가능하면 자동화
- Chrome 확인: 운영 도메인 기준 `/auth/me` 직접 호출이 실제로 되는지 (CORS/Set-Cookie 속성 실측)
- **완료 기준**: 적어둔 시나리오가 지금 코드에서 예상대로 실패/통과함 + Chrome에서 기본 전제 성립 확인됨. 이 묶음 끝나기 전엔 묶음 2 시작 안 함

**묶음 2 — 인증 transport 전환 (GH #36 + #37, 이어서 진행)**

- #36 TanStack `/me` 인프라 추가 → 바로 이어서 #37 transport 전환 + 소비자/쓰기 경로 동시 migration (공통 함수화 `AUTH_QUERY_KEY`/`cancelQueries` 포함)
- #36만 따로 떼서 끝낼 이유가 없음 — #37 없이는 그 자체로 쓰이는 데가 없는 준비 작업이라 한 묶음으로 이어서 처리
- **완료 기준**: 묶음 1에서 적은 redirect loop/유저정보 미표시 시나리오가 더 이상 재현 안 됨 + 로컬 회귀 없음

**묶음 3 — 정리 및 분리 (GH #38 + #39)**

- #38 Zustand `user` 역할 제거, #39 `getGroupBuyingByIdServer` 공개/개인화 분리
- 둘 다 "transport 전환이 끝나고 안정된 다음에 하는 저위험 정리 작업"이라 같은 묶음으로 처리
- **완료 기준**: #38은 외부 동작 변화 없음(순수 내부 정리), #39는 공개 상세페이지가 비로그인에서도 여전히 SSR로 빠르게 뜸

**묶음 4 — 최종 회귀 + 브라우저 호환성**

- 묶음 1 시나리오 전체 재실행 + 이번엔 Safari도 같이 확인
- **Safari가 깨지면 그때 가서**(묶음 2·3을 다시 할 필요 없이) 백엔드 쿠키 `domain` 속성 추가 여부(GH #37의 "백엔드 안 건드림" 제약 재검토) + 도메인 정렬을 별도 트랙으로 진행 — 도메인 fix는 전송 계층 추가 작업이라 이미 짠 CSR 코드랑 안 부딪힘

Safari 체크를 앞단이 아니라 묶음 4(뒷단)에 둔 이유: third-party 쿠키 차단은 Safari ITP의 공개된 기본 정책이라 "해봐야 아는" 미지수가 아니고, 묶음 2·3 작업은 Safari 결과와 무관하게 그 자체로 가치가 있어서 미리 막을 이유가 약함.

---

## 마이그레이션 완료 기준 (Definition of Done)

SSR 인증 의존 제거 + React Query 전환이 끝났다고 판단할 수 있는 체크리스트. 각 항목은 이 문서 위쪽에서 확인한 구체적인 지점에 대응함.

| 검증 항목        | 개선 후 확인할 결과                                                                                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 인증 사용자 조회 | `(root)`/`(auth)`/`(protected)` 3개 레이아웃에서 `getMyInfoServer()` 호출 전부 제거 — SSR이 더 이상 "누가 로그인했는지" 판단에 관여 안 함                                                                                                                           |
| 쿠키 전달        | `groupBuying.server.ts`의 `getMyCreateGroupBuying()`/`getMyParticipant()`/`getGroupBuyingByIdServer()`에서 `withServerCookies()` 호출 제거 — 개인화 데이터도 Client에서 직접 조회                                                                                   |
| 페이지 이동      | **로그인**과 **세션 무효화(401) 자동 로그아웃** 두 경로에서 `window.location.href` 제거, `router.push()`로 대체 (명시적 로그아웃 버튼은 원래 `href`를 안 썼으므로 이 항목 대상 아님 — "4. 로그아웃" 참고)                                                           |
| 상태 갱신        | Header, `(protected)` AuthGuard, `UserMenu` 등 유저 정보를 읽는 모든 컴포넌트가 동일한 `useMe()`(또는 동등한) Query 하나만 구독 — Zustand `initialUser` prop 시딩 방식 제거                                                                                         |
| 기능 변경 확인   | (프로필 수정 기능은 현재 이 앱에 없음 — 대신) 세션 만료(401) 발생 시 Header/대시보드가 **페이지 리로드 없이** 자동으로 로그아웃 상태로 전환되는지 확인. 지금은 `window.location.href`로 강제 리로드하니 당연히 되는 거고, 전환 후에도 리로드 없이 반영되는지가 핵심 |
| 회귀 테스트      | "왜 `router.push()`가 아니라 `window.location.href`인가" 절의 redirect loop 재현 조건(소프트 네비게이션으로 보호 라우트 먼저 진입 → 로그인 → 이동) 다시 돌려서 안 걸리는지 확인                                                                                     |

---

## 이 문서 내용의 근거 수준

이 문서의 주장들은 확신의 근거가 서로 다름. 나중에 재검증할 때 뭘 다시 확인해야 하는지 구분해두는 게 나을 것 같아서 정리함.

### 실제로 돌려보고 확인함 (이 문서 작성 시점)

- 운영 백엔드 도메인(`https://3-37-239-36.sslip.io`) — 배포된 프론트 JS 번들(`root-layout.js`, `login-page.js`)에서 `baseURL:"..."` 문자열을 직접 grep해서 찾음
- CORS 응답 헤더 — `curl -i -X OPTIONS/POST`로 운영 백엔드에 직접 요청 보내서 `Access-Control-Allow-Origin`/`-Credentials`가 실제로 저렇게 내려오는 걸 확인함

### 과거 세션에서 실측·확정된 내용 (메모리에 기록된 걸 인용, 이번에 재실행 안 함)

- redirect loop 재현 조건("소프트 네비게이션으로 먼저 진입해야 재현됨", "콜드 진입으론 재현 안 됨") — Playwright로 실제 재현하고 Next.js 14.2.35 소스(`prefetch-cache-utils.js`)에서 `staleTime` 기본값(30초)까지 직접 확인했다고 기록돼 있음 (`feedback-router-cache` 메모)

### 코드를 읽고 내린 결정론적 추론 (실행해서 관찰한 적은 없음, 그러나 프레임워크 동작이 보장돼 있어 불확실성 없음)

- `AuthStoreProvider`의 `useRef` 1회 시딩 때문에 `router.refresh()`로 새 `initialUser`를 받아도 store에 반영이 안 된다는 것 — React의 `useRef` + 조건부 할당 패턴은 결정적 동작이라, 코드를 읽는 것만으로 결과가 확정됨. 다만 "눈으로 직접 보고 싶다"면 재현 실험은 이 문서 위쪽 "Protected 페이지"/대화 이력에 적어둔 절차대로 해볼 수 있음 (아직 안 해봄).
- Router Cache가 `router.push()` 단독 사용 시 레이아웃을 재사용한다는 것 — Next App Router의 공식 문서화된 동작, 이 레포 코드에 특이사항 없음

### 표준 웹 플랫폼 스펙 (이 프로젝트만의 특수 동작이 아니라 브라우저 공통 동작)

- cross-origin 응답의 `Set-Cookie`가 호출자 도메인이 아니라 응답자 도메인에 저장된다는 것
- `SameSite=Lax`가 cross-site `fetch`/XHR에는 쿠키를 안 실어준다는 것

### 아직 확인 안 됨 (사용자 확인 또는 테스트 계정 필요)

- 운영 로그인 응답의 실제 `Set-Cookie` 헤더에 `SameSite=None; Secure`가 정확히 찍히는지 — 테스트 계정이 없어서 로그인 성공 응답을 직접 못 봄. 코드(`auth.service.ts`의 `getAuthCookieOptions`)와 배포 경로(`docker-compose.prod.yml`의 `NODE_ENV=production` 하드코딩)로 미루어 "그럴 것"이라고 추론한 상태.
- 실제 브라우저에서 `accessToken`/`refreshToken` 쿠키가 `moijang.vercel.app`이 아니라 `sslip.io` 밑에 저장되는지 — DevTools로 직접 확인해달라고 요청했지만 아직 그 결과를 전달받은 적 없음. 쿠키 스펙상 당연히 그래야 하지만, 이 레포/배포에 한정된 **실측 확인은 안 된 상태**.
