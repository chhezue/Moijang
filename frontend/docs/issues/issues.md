# Frontend 이슈 및 설계 정리(4/11)

---

## 1. Route Group 분리 기준과 layout 책임

### 구조

```
app/
├── (auth)/       로그인/회원가입 — 비로그인 전용, 로그인 상태면 / redirect
├── (home)/       공개 페이지 — 비로그인도 접근 가능, 로그인 상태면 헤더에 유저 메뉴
└── (protected)/  인증 필수 — 비로그인이면 /login redirect
```

### layout별 책임

- `(auth)/layout.tsx` — Providers 래핑, Suspense (useSearchParams 때문)
- `(home)/layout.tsx` — SSR /api/auth/me 시도 (실패해도 OK) → Zustand 초기화 → Header
- `(protected)/layout.tsx` — SSR /api/auth/me (실패 시 /login redirect) → Zustand 초기화

### 현재 문제

- `(home)/layout.tsx`가 `"use client"`라 SSR에서 user 못 가져옴 → Header 깜빡임 발생
- Zustand 교체 작업 때 Server Component으로 전환 예정

---

## 2. SSR vs CSR API 호출 분리 (`*.server.ts` 패턴)

### 이유

`withServerCookies`가 `next/headers`를 사용하는데, `next/headers`는 CSR 번들에 포함될 수 없음.
같은 파일에 있으면 Client Component가 import할 때 에러 발생 → 서버 전용 파일로 분리 필수.

### 패턴

```
auth.ts               CSR용 (login, register, logout 등)
auth.server.ts        SSR용 (getMyInfoServer — next/headers 사용)

groupBuying.ts        CSR용
groupBuying.server.ts SSR용 (withServerCookies 사용)
```

### withServerCookies가 하는 일

```
브라우저 → Next.js 서버 (쿠키 있음)
         → 백엔드 API (쿠키 없음) ← 여기다 수동으로 붙여주는 것
```

브라우저가 없는 SSR 환경에서 백엔드 인증 API 호출 시 쿠키를 수동으로 헤더에 붙여서 전달.

### 미들웨어 도입 후

- 인증 목적 SSR API 호출(`getMyInfoServer`) 자체가 사라짐
- `auth.server.ts` 삭제 예정
- `withServerCookies`는 마이페이지 등 인증 필요한 데이터 패치용으로는 유지

---

## 3. 인증 흐름 — 프론트/백엔드 역할 분리

### 백엔드가 하는 것

- 로그인 검증 → JWT 쿠키 발급 (accessToken 5분, refreshToken 14일, HS256)
- 보호된 API 요청 시 JwtAuthGuard가 JWT 검증
- accessToken 만료 시 refreshToken으로 자동 갱신

### 프론트가 하는 것

```
미들웨어        쿠키 존재 여부만 확인 → 없으면 /login redirect (JWT 내용 검증 안 함)
Axios 인터셉터  401 응답 시 refresh 시도 → 성공하면 원래 요청 재시도, 실패하면 /login
Zustand         로그인한 user 정보 메모리 보관 → CSR 컴포넌트가 store에서 읽음
```

### 핵심

- 프론트는 JWT 내용을 검증하지 않음 (httpOnly 쿠키라 JS 접근도 불가)
- 브라우저가 요청마다 쿠키 자동 첨부 → 백엔드가 검증
- 미들웨어는 보안보다 UX(깜빡임 제거, 불필요한 렌더 방지)가 주목적

### /api/auth/me 역할 변화

```
현재: "인증 확인" + "사용자 정보 가져오기" 혼용
목표: "사용자 정보 가져오기" 전용 (인증 확인은 미들웨어가 담당)
```

---

## 4. 미들웨어 도입 전후 auth API 호출 흐름

### 현재 (문제)

```
protected 페이지 접근
  → SSR layout /api/auth/me  (1번)
  → CSR AuthInitializer /api/auth/me  (2번)
= 매 페이지 로드마다 2번 호출
```

### 목표 (미들웨어 + Zustand)

```
페이지 접근
  → 미들웨어: 쿠키 존재 여부 확인 (네트워크 없음)
  → SSR layout /api/auth/me → Zustand 초기화  (1번)
  → CSR: Zustand만 읽음 (0번)
= 1번으로 감소, CSR 재호출 없음
```

### 미들웨어가 JWT secret 없이도 동작하는 이유

- 쿠키 존재 여부만 확인 → secret 불필요
- 실제 JWT 검증은 백엔드 JwtAuthGuard가 담당
- 401 오면 Axios 인터셉터가 처리

---

## 5. Zustand가 Redux보다 Next.js App Router에 적합한 이유

### 핵심 문제: SSR initialUser 주입

SSR layout에서 받은 user를 클라이언트 스토어에 넣어야 함.

**Redux의 문제**

- store가 싱글톤 → 요청마다 새 store 생성 필요 → useRef로 관리해야 함
- `next-redux-wrapper` 같은 추가 라이브러리 필요
- App Router에서 복잡

```tsx
// Redux: 복잡
function Providers({ initialUser, children }) {
  const storeRef = useRef(configureStore({ preloadedState: { common: { user: initialUser } } }));
  return <Provider store={storeRef.current}>{children}</Provider>;
}
```

**Zustand의 장점**

- Provider 불필요, 모듈 import만으로 접근
- 외부에서 직접 setState 가능

```tsx
// Zustand: 간단
function AuthInitializer({ initialUser, children }) {
  const initialized = useRef(false);
  if (!initialized.current) {
    useAuthStore.setState({ user: initialUser });
    initialized.current = true;
  }
  return children;
}
```

### 이 프로젝트에서 Redux 오버헤드

- 관리하는 전역 상태가 `user` 하나 (isDarkMode는 미사용 데드 코드)
- slice, reducer, action, Provider, RootState 타입 전체를 `user` 하나를 위해 유지

---

## 6. Zustand store 생명주기와 user 정보 fetch 시점

### Zustand store 유지 기간

- 메모리 기반 → 새로고침/탭 닫기 시 초기화
- CSR 페이지 이동 시는 유지

### user 정보 fetch 시점

```
(home)/(protected) 페이지 SSR  → /api/auth/me → Zustand 초기화
새로고침                        → SSR 다시 실행 → /api/auth/me → Zustand 재초기화
CSR 페이지 이동                 → Zustand에서만 읽음 (fetch 없음)
로그인 직후                     → redirect된 페이지의 SSR layout이 자연스럽게 fetch
```

### 데이터 종류별 관리 방식

| 데이터                 | 저장 위치 | 재호출 시점                  |
| ---------------------- | --------- | ---------------------------- |
| user 정보              | Zustand   | 새로고침 시 SSR이 재초기화   |
| 마이페이지 목록        | SSR props | 뮤테이션 후 router.refresh() |
| 공구 상세              | SSR props | 뮤테이션 후 router.refresh() |
| 검색/필터/페이지네이션 | CSR       | 사용자 인터랙션 시           |

# 그래서

일단 리덕스를 zustand로 교체한후 auth/me 의 역할은 ssr 에서 사용자 정보 받아오게만하고, 인증 여부는 middleware로 방어 할거야. 그래서 서버 렌더링해서 사용자  
정보필요하면 auth/me, csr에서 필요하면 zustand로 쓰게 할거야. 다크모드는 지금 안쓰니까 없앨거고..
