# MUI v7 + Next.js 14 서버 컴포넌트 SSR 버그

## 증상

```
TypeError: (0, a.unstable_createUseMediaQuery) is not a function
```

빌드의 "collecting page data" 단계에서 발생 → 해당 페이지 빌드 실패

## 원인

MUI v7 컴포넌트(`Box` 등)를 서버 컴포넌트에서 직접 임포트하면 모듈 초기화 시점에
`unstable_createUseMediaQuery`를 호출하려 하는데, Node.js 환경에서는 이 함수가 없음.

기존 `(home)/layout.tsx`, `my/layout.tsx`는 `"use client"`라 해당 없음.
대시보드처럼 MUI를 서버 레이아웃에서 쓰면 바로 터짐.

## 규칙

- 서버 컴포넌트 `layout.tsx` / `page.tsx`에서 MUI 임포트 **금지**
- 서버 레이아웃 래퍼는 `<div style={...}>` 사용
- MUI 컴포넌트는 반드시 `"use client"` 파일 내부에서만 사용
- 빈 상태 page.tsx라도 MUI 쓰면 `"use client"` 필수
- 클라이언트 컴포넌트를 re-export하는 page.tsx도 `"use client"` 필수 (re-export만으론 부족)

## 해결한 사례 (대시보드)

```tsx
// ❌ 터짐
import { Box } from '@mui/material';
export default async function Layout({ children }) {
  return <Box sx={{ display: 'flex' }}>{children}</Box>;
}

// ✅ OK
export default async function Layout({ children }) {
  return <div style={{ display: 'flex' }}>{children}</div>;
}
```
