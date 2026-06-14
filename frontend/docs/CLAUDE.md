-- <frontend> --
운영 방법: 새로운 결정을 내릴 때마다 한 줄씩 추가. "이렇게 하기로 했다"가 생길 때 즉시 기록. 처음부터 완성된 문서 만들려고
하지 말고, 의사결정 로그
미완: 도메인 구조, 컴포넌트 규칙 등 아직 패턴 안 잡힌 것들

Providers -> theme, snackbar 같은 UI 설정 담당
UI 라이브러리 -> MUI,
전역 상태도구

- user 정보 -> zustand 팩토리 + react context
  라우팅 : Next.js App Router, route groups (root)/(home)/(auth)/(protected)
- (root)/layout.tsx : getMyInfoServer + AuthStoreProvider + Providers 공유 (1회만 호출)
- (auth)/layout.tsx : 로그인 상태면 / redirect, UI만
- (home)/layout.tsx : Header만
- (protected)/layout.tsx : 미로그인 시 /login?redirect=<path> redirect, ProtectedClient만
  API: axios + withCredentials
  서버데이터: SSR layout에서 fetch (React cache()로 중복 제거), CSR은 store/router.refresh()
