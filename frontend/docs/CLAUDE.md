-- <frontend> --
운영 방법: 새로운 결정을 내릴 때마다 한 줄씩 추가. "이렇게 하기로 했다"가 생길 때 즉시 기록.

---

## 기술 스택

- **프레임워크**: Next.js 14.2.5 (App Router)
- **UI**: MUI v7 (`@mui/material ^7.1.2`, `@mui/icons-material ^7.3.1`)
- **스타일**: Emotion (MUI 기본), styled-components (일부 레거시 컴포넌트)
- **상태관리**: Zustand (팩토리 패턴, singleton 아님)
- **폼**: react-hook-form + zod
- **HTTP**: axios + withCredentials
- **기타**: Mantine (일부), Redux (일부) — 정리 예정

---

## 라우팅 구조 (App Router route groups)

```
src/app/
  (root)/
    layout.tsx          ← getMyInfoServer() + AuthStoreProvider + Providers (전역 1회)
    (auth)/
      layout.tsx        ← 로그인 상태면 / redirect
      login/
      signup/
    (home)/
      layout.tsx        ← Header만 렌더
      group-buying/
        list/all/       ← 공구 목록
        detail/[id]/    ← 공구 상세
      payment/success/ fail/
    (protected)/
      layout.tsx        ← 미로그인 시 /login?redirect=<path> redirect → ProtectedClient 렌더
      protectedClient.tsx ← "use client", Header + children 렌더
      create/           ← 공구 생성 폼 (3단계)
      my/
        layout.tsx      ← "use client", TabMenu (참여중/만든거)
        created/
        participating/
      dashboard/        ← 대시보드
        layout.tsx
        leading/        ← 총대 대시보드
        participating/  ← 참여자 대시보드
```

### 레이아웃 동작 방식

- `(home)`, `(auth)`, `(protected)`, `(root)` 는 URL에 영향 없음 (route group)
- `(root)/layout.tsx`가 유저 정보 한 번만 fetch → AuthStoreProvider로 주입
- Header.tsx는 독립적 — `useAuthStore`로 유저 상태만 읽음, 페이지에 의존 없음
- Header는 두 곳에서 렌더됨: `(home)/layout.tsx` + `protectedClient.tsx`

---

## 대시보드 (`/dashboard`)

→ 상세 내용: `docs/domain/dashboard.md`

---

## 공구 도메인 (GroupBuying)

→ 상세 내용: `docs/domain/Groupbuying.md`

---

## API 패턴

### 서버사이드 (SSR)

```ts
// *.server.ts 파일, withServerCookies() 필수
import { withServerCookies } from '@/apis/utils/withServerCookies';
const res = await apiServer.get('/api/...', { headers: withServerCookies() });
```

### 클라이언트사이드

```ts
import api from '@/apis/apiClient'; // withCredentials: true 자동
const res = await api.get('/api/...');
```

---

## 인증

- Access Token: 5분, Refresh Token: 14일, 쿠키 기반 (`httpOnly`)
- 로그인 후 리다이렉트: `window.location.href` 필수 — `router.push` 사용 금지 (router cache 문제)
- Zustand 팩토리 패턴 유지 (singleton으로 되돌리지 말 것)

---

## 참고 문서

- 공구 도메인: `docs/domain/Groupbuying.md`
- 대시보드: `docs/domain/dashboard.md`
- MUI v7 SSR 버그: `docs/issues/mui-v7-ssr-bug.md`
- E2E 테스트: `docs/test/group-buying-e2e.md`

---

## 비동기 핸들러 규칙

버튼에 async API 호출이 연결될 때 반드시 아래 패턴 사용:

```tsx
const [isLoading, setIsLoading] = useState(false);

const handleClick = async () => {
  setIsLoading(true);
  try {
    await someApi();
  } finally {
    setIsLoading(false);
  }
};

<Button onClick={handleClick} disabled={isLoading}>
  {isLoading ? <CircularProgress size={16} color="inherit" /> : '확인'}
</Button>;
```

- `finally`로 isLoading 해제 — catch에서 return해도 반드시 해제됨
- react-hook-form 사용 시 `formState.isSubmitting` 활용 (별도 state 불필요)
- `onConfirm` 같은 prop으로 async 함수 받을 때도 내부에서 await + isLoading 처리
- `console.log` / `console.error` 프로덕션 코드에 남기지 말 것

---

## 절대 건들지 말 것

- **백엔드 코드** (`/backend/` 하위 모든 파일)
