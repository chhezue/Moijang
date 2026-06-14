# Auth 구조 충돌 이슈 (SSR cache + Client state)

근데 middleware, react-query 없어도 ㄱㅊ?
일단 브라우저 캐시부분은,, 흠.. 리팩토링할때 ㄱㄱ

## 목표 구조

```
[Middleware]  →  접근 제어 (토큰 존재 여부)
[Server layout] → initialUser 옵션으로 내려줌
[Client Zustand] → user 상태의 유일한 소스
[UI Header] → store만 바라봄
```

---

## 잘못된 부분 3가지

### 1. `useEffect(fn, [])` — deps 누락

```tsx
// Providers.tsx
useEffect(() => {
  if (initialUser) setUser(initialUser);
}, []); // initialUser 빠짐
```

- `router.refresh()` 후 서버가 새 `initialUser`를 내려보내도 re-render만 되고 effect는 재실행 안 됨
- store와 서버 데이터가 분리됨 → "push + refresh 같이 쓰기" 충돌 원인

### 2. Hydration flicker — SSR html이 null 기준으로 렌더됨

- `useEffect`는 서버에서 실행 안 됨
- 서버 render → `user: null` 기준으로 Header가 "로그인" 버튼 HTML 생성
- hydration 후 effect 실행 → store 업데이트 → 재렌더
- 결과: 로그인 상태인데 잠깐 "로그인" 버튼이 보이는 flicker

### 3. `getMyInfoServer()` 캐시

- axios 기반 `apiServer`도 Next.js fetch 캐싱 영향을 받을 수 있음
- 로그아웃 후 stale 응답 반환 → `initialUser`에 이미 만료된 유저 데이터 들어올 수 있음

---

## 올바른 해결 방향

Zustand SSR 공식 패턴: `createStore` + React context

현재 `create()` 싱글턴은 서버에서 요청 간 상태 공유 위험 있음.
단기적으로는 `useEffect` deps에 `initialUser` 추가 + null 케이스도 처리:

```tsx
useEffect(() => {
  if (initialUser) setUser(initialUser);
  else clearUser();
}, [initialUser]);
```

단, hydration flicker는 이걸로도 해결 안 됨. 근본 해결은 store를 싱글턴이 아닌 per-request 인스턴스로 관리해야 함.

---

## 현재 코드 위치

- `src/providers/Providers.tsx` — useEffect 문제
- `src/store/authStore.ts` — 싱글턴 store
- `src/app/(home)/layout.tsx` — SSR initialUser 패스
- `src/app/(protected)/layout.tsx` — SSR redirect 처리
- `src/layouts/header/Header.tsx` — store 구독

## updates

현재 상태 (리팩토링 거의 완료)

완료된 것들 ✅

┌────────────────────────┬────────────────────────────────────────────────────────────────────────────────────┐  
│ 레이어 │ 현재 코드 │  
├────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ (protected)/layout.tsx │ SSR getMyInfoServer() → <Providers initialUser={user}> → 실패 시 │
│ │ redirect("/login") │
├────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤  
│ (home)/layout.tsx │ SSR getMyInfoServer() → <Providers initialUser={user || null}> │
├────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤  
│ (auth)/layout.tsx │ SSR에서 user 있으면 redirect("/") │
├────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤  
│ Providers.tsx │ initialUser 받아서 Zustand에 주입 │
├────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤  
│ AuthInitializer │ useAuthSync 제거, store만 읽어서 redirect │
└────────────────────────┴────────────────────────────────────────────────────────────────────────────────────┘

## remain

Providers.tsx의 초기화 방식이 useEffect라서 hydration gap이 있습니다:

// 현재 - useEffect는 마운트 후 실행 → 첫 렌더링에서 user === null 순간 존재
useEffect(() => {
if (initialUser) setUser(initialUser);
}, []);

서버: user 있음 → HTML 렌더
브라우저: 마운트 → useEffect → setUser ← 이 사이에 user === null 순간

Header에서 로그인 버튼이 깜빡이는 증상이 있으면 이 때문입니다. 수정하려면:

// Providers.tsx - useEffect 대신 렌더 타임에 초기화
const initialized = useRef(false);
if (!initialized.current && initialUser) {
useAuthStore.setState({ user: initialUser }); // 렌더 중 즉시 반영
initialized.current = true;
} 2. create() 싱글턴의 서버 요청 간 공유 위험 — 이 프로젝트에선 해당 없음

Zustand 공식 문서가 경고하는 시나리오:

Node.js 서버 (단일 프로세스)  
요청 A (유저 김씨) → store.setUser(김씨)
요청 B (유저 이씨) → store 읽음 → 김씨 정보가 보임 ← 진짜 위험

이건 서버에서 Zustand store를 실행할 때 발생합니다.

현재 이 프로젝트 구조:

// authStore.ts
"use client" 아니지만, useAuthStore를 쓰는 모든 컴포넌트는 "use client"  
→ store는 브라우저에서만 실행됨  
→ 서버는 getMyInfoServer()로 직접 API 호출, store 안 씀

브라우저는 사용자마다 독립된 JS 런타임이라 싱글턴이어도 공유 위험이 없습니다. createStore + context 패턴이 필요한 상황이 아닙니다.
