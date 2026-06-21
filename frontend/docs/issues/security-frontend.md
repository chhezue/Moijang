# 프론트엔드 보안 점검

## 점검 항목

---

## 1. Open Redirect (높음)

### 현재 상태

```tsx
// loginForm.tsx
window.location.href = redirectTo; // redirectTo는 URL 파라미터에서 옴
```

`?redirect=/dashboard/leading` 같은 경로를 로그인 후 이동에 사용 중.
검증 없이 외부 URL도 통과하면 `?redirect=https://evil.com` 으로 로그인 후 피싱 사이트로 이동 가능.

### 해결책

```ts
const isSafeRedirect = (url: string) => {
  // 내부 경로만 허용 (슬래시로 시작, 외부 도메인 차단)
  return url.startsWith('/') && !url.startsWith('//');
};

const safePath = isSafeRedirect(redirectTo) ? redirectTo : '/';
window.location.href = safePath;
```

---

## 2. XSS (높음)

### 체크 대상

- `dangerouslySetInnerHTML` 사용 여부 전수 조사
- 사용자 입력값을 그대로 렌더링하는 곳 (공동구매 제목, 설명, 취소 사유 등)

### 현재 상황

- 공동구매 설명(`description`)이 TextField에 입력되고 그대로 `<Typography>` 로 렌더링됨
- 서버에서 HTML을 내려주는 케이스가 있다면 `DOMPurify` sanitize 필요

### 해결책

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

```tsx
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />;
```

`dangerouslySetInnerHTML` 쓰지 않는 곳은 React가 기본적으로 이스케이프 처리하므로 XSS 안전.

---

## 3. 토큰 저장 위치 (중간)

### 체크 대상

- access token / refresh token이 어디에 저장되는지 확인
- `localStorage` → XSS로 탈취 가능
- `httpOnly cookie` → JS 접근 불가, 상대적으로 안전

### 확인 방법

```bash
# 브라우저 DevTools → Application → Cookies / Local Storage 확인
# 또는 코드에서 token 저장 위치 grep
grep -r "localStorage" src/
grep -r "token" src/apis/
```

---

## 4. 의존성 취약점 (중간)

### 확인 방법

```bash
npm audit
```

### 기준

- `critical` / `high` severity: 즉시 수정
- `moderate`: 배포 전 검토
- `low`: 배포 후 처리 가능

---

## 5. Next.js 보안 헤더 (낮음)

### 현재 상태

`next.config.ts`에 보안 헤더 미설정.

### 추가할 헤더 (next.config.ts)

```ts
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];
```

CSP(Content Security Policy)는 MUI inline style 허용 설정이 복잡해서 별도 검토.

---

## 우선순위

| 항목           | 위험도 | 작업량                |
| -------------- | ------ | --------------------- |
| Open Redirect  | 높음   | 낮음 (한 줄 수정)     |
| XSS 조사       | 높음   | 중간 (전수 조사 필요) |
| 토큰 저장 위치 | 중간   | 낮음 (확인 후 판단)   |
| npm audit      | 중간   | 낮음                  |
| 보안 헤더      | 낮음   | 낮음                  |

---

## 관련 파일

- `src/app/(root)/(auth)/login/components/loginForm.tsx` — Open Redirect
- `next.config.ts` — 보안 헤더
- `src/apis/apiClient.ts` — 토큰 저장/전송 방식
