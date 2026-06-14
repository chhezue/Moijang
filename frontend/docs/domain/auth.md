# Auth 구조 문서

## 현재 구조 (2026-06-13 기준)

### 전체 흐름

```
layout.tsx (Server Component)
  └─ getMyInfoServer() → 서버에서 user fetch (쿠키 기반)
       └─ <AuthStoreProvider initialUser={user}>
                └─ createAuthStore(initialUser) → store 생성 시점에 user 주입
                └─ AuthStoreContext.Provider로 하위 트리에 제공
                └─ AxiosInterceptorSetup → 401 interceptor 등록
                     └─ <Providers> (UI 설정)
                          └─ 이후 모든 CSR 컴포넌트에서 useAuthStore()로 사용
```

### layout별 역할

```
(protected)/layout.tsx
  └─ getMyInfoServer()
       ├─ 실패 → redirect("/login")
       └─ 성공 → <AuthStoreProvider initialUser={user}>

(home)/layout.tsx
  └─ getMyInfoServer().catch(() => null)
       └─ <AuthStoreProvider initialUser={user ?? null}>
            └─ Header가 store 읽어서 로그인/로그아웃 버튼 결정

(auth)/layout.tsx
  └─ getMyInfoServer().catch(() => null)
       ├─ 성공 → redirect("/")
       └─ 실패 → <AuthStoreProvider initialUser={null}>
```

---

## 핵심 파일

### `src/store/authStore.ts`

```ts
export const createAuthStore = (initialUser: UserDto | null) =>
  createStore<AuthState>()((set) => ({
    user: initialUser, // 생성 시점에 주입 → null인 순간 없음
    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),
  }));

export const AuthStoreContext = createContext<AuthStoreApi | null>(null);

export function useAuthStore<T>(selector: (state: AuthState) => T): T {
  const store = useContext(AuthStoreContext); // context에서 꺼냄
  return useStore(store, selector);
}
```

### `src/providers/AuthStoreProvider.tsx`

- store 생성 + `AuthStoreContext.Provider` 제공
- `AxiosInterceptorSetup` — 401 발생 시 `clearUser()` + `/login` redirect

### `src/providers/Providers.tsx`

- auth 관심사 없음. MUI Theme, Snackbar 등 UI 설정만 담당.

### `src/apis/apiClient.ts`

- axios 인스턴스만 생성. interceptor 없음.
- 401 처리는 `AxiosInterceptorSetup` (React 트리 안)에서 담당.

---

## 쿠키

- `accessToken`, `refreshToken` — `httpOnly: true`, `sameSite: lax`
- 서버사이드 API 호출: `withServerCookies()` 사용 필수 (`headers` 수동 주입)
- 클라이언트 API 호출: axios `withCredentials: true`로 자동 포함

---

## 페이지별 접근 정책

| 페이지                      | 접근          | 비고                        |
| --------------------------- | ------------- | --------------------------- |
| `/`                         | 전체 공개     | user 있으면 헤더에 표시     |
| `/group-buying/detail/[id]` | 전체 공개     | 참여 버튼만 로그인 체크     |
| `/create`                   | 로그인 필수   | SSR redirect                |
| `/my`                       | 로그인 필수   | SSR redirect                |
| `/login`                    | 비로그인 전용 | 로그인 상태면 / 로 redirect |
| `/signup`                   | 비로그인 전용 | 로그인 상태면 / 로 redirect |

---

## SSR / CSR 전략

| 데이터                     | 방식                     |
| -------------------------- | ------------------------ |
| user 정보                  | SSR (layout에서 한 번만) |
| 공구 목록 초기 데이터      | SSR                      |
| 공구 상세 초기 데이터      | SSR                      |
| 마이페이지 목록            | SSR                      |
| 검색 / 필터 / 페이지네이션 | CSR                      |
| 뮤테이션 (참여/취소/생성)  | CSR + router.refresh()   |

---

## 로그인 / 회원가입 흐름

### 로그인

```
POST /api/auth/login { loginId, password }
→ 백엔드가 JWT 쿠키 세팅 (accessToken, refreshToken)
→ 프론트 / 로 redirect
```

### 회원가입 (3단계)

```
Step 1: 대학교 선택 (GET /api/university?keyword=)
Step 2: 학교 이메일 입력
         → 인증코드 발송 (POST /api/verification/send-code)
         → 코드 검증 (POST /api/verification/confirm-code)
Step 3: 아이디 중복확인 (GET /api/auth/exist/:loginId) + 이름 + 비밀번호
→ POST /api/auth/signup
```
