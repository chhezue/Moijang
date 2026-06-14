# 테스트 계획

## Zustand / Auth Store

### ESLint

- Server Component 파일에서 `useAuthStore` import 금지 규칙 추가
  - `no-restricted-imports` 로 `store/authStore` import를 `"use client"` 없는 파일에서 차단

### Vitest

- `useAuthStore.setState`가 렌더 중 호출되지 않는지 확인
  - `Providers`가 마운트될 때 `initialUser`가 store에 올바르게 주입되는지
  - 리렌더 시 store가 초기값으로 덮어씌워지지 않는지 (initialized 가드 동작)
  - `initialUser = null`일 때 store의 user가 null인지

### Playwright

- 로그인한 유저 A로 페이지 접근 시 Header에 유저 A 정보가 표시되는지
- 로그아웃 후 store가 초기화되고 Header에서 유저 정보가 사라지는지
- 동시 요청 시나리오: 두 브라우저 컨텍스트로 각각 다른 유저 로그인 후 서로의 정보가 노출되지 않는지

Playwright에서 A/B 상태 섞임이 재현됨
SSR 중 Header가 Zustand user를 읽어서 HTML에 반영함
서버 컴포넌트/서버 함수에서 useAuthStore import가 생김
auth 상태가 여러 곳에서 복잡하게 바뀜
면접/포폴에서 “공식 패턴으로 개선했다”고 말하고 싶음
