# Route Group 구조 — Auth 상태 공유 & Login Redirect Loop

## 현재 구조 (적용 완료)

```
app/layout.tsx            ← html/body만
(root)/layout.tsx         ← getMyInfoServer() + AuthStoreProvider (전역 1회)
  (auth)/layout.tsx       ← 로그인 상태면 / redirect
  (home)/layout.tsx       ← Header만
  (protected)/layout.tsx  ← 미로그인 시 /login?redirect=<path> redirect
```

`(root)/layout.tsx`가 모든 route group의 공유 segment. `getMyInfoServer()` 호출을 1번으로 집중.

---

## Login Redirect Loop 문제

### 증상

비로그인 상태에서 protected 페이지 접근 → `/login?redirect=<path>` 리다이렉트 → 로그인 성공 → 원래 페이지로 이동했는데 → **다시 `/login`으로 튕김**

### 원인

Zustand **팩토리 패턴**은 `AuthStoreProvider`가 mount될 때 `initialUser` prop으로 새 store 인스턴스를 생성한다.

```
router.refresh()  →  (root)/layout 캐시 무효화 시작 (비동기, await 불가)
router.push()     →  즉시 실행 → 캐시가 아직 살아있음 → initialUser=null
                      → 새 store가 user=null로 생성
                      → (protected)/layout이 미인증 판단 → /login 리다이렉트
```

`router.refresh()`는 Promise를 반환하지 않아 완료를 기다릴 수 없음. "캐시 무효화 + 페이지 이동"이 원자적으로 이루어져야 하는데 따로따로 실행됨.

> **싱글톤이면 이 문제가 없는 이유**: 전역 store가 하나라 `setUser()`가 즉시 반영됨. 캐시된 RSC가 `initialUser=null`을 내려줘도 store에는 이미 user가 있어서 문제없음.  
> **팩토리 패턴으로 바꾼 이유**: 싱글톤은 SSR에서 여러 요청이 같은 store를 공유해 유저 데이터 오염 위험. 팩토리는 요청마다 독립 인스턴스.

### 해결책 (현재 적용)

```ts
// loginForm.tsx
window.location.href = redirectTo; // hard navigation → JS 메모리 초기화 → Router Cache 전부 삭제
```

`window.location.href`는 JS 프로세스를 종료하고 브라우저가 새 요청을 보내기 때문에 Router Cache가 통째로 사라짐. 타이밍 문제 없음.

`router.push()`, `<a>` 태그, `location.replace()` 등 hard navigation은 모두 캐시를 날림.  
`router.push()`만 Next.js 내부에서 처리하는 soft navigation이라 캐시가 살아있음.

### 정석 대안 (미적용)

1. **Server Action + `revalidatePath`**: 서버에서 직접 캐시 무효화 → `router.push()` 가능. 백엔드가 별도 서버인 구조에서 도입 복잡도 높음.
2. **Middleware auth**: 매 요청마다 쿠키만 보고 판단 → RSC 캐시 무관. 단, 토큰 만료 검증 불가라 `(protected)/layout`의 catch redirect도 유지해야 함 → 두 곳 관리. 현재 구조에서 실익 없음.

---

## `router.refresh()`를 동기로 쓸 수 없는 이유

`router.refresh()`는 Promise를 반환하지 않아 `await` 불가. 바로 아래 `router.push()`를 쓰면 refresh 완료 전에 push가 실행되어 stale 캐시를 그대로 사용함 → `initialUser=null` → 다시 `/login` 리다이렉트.

백엔드로 치면 트랜잭션이어야 할 동작(캐시 무효화 + 페이지 이동)이 따로따로 실행되는 것.

`window.location.href`는 JS 메모리 자체를 종료하고 브라우저가 새 요청을 보내기 때문에 Router Cache가 통째로 사라짐 → 타이밍 문제 없음.

### 정석 대안

1. **Server Action으로 로그인**: `revalidatePath('/')` 서버에서 직접 캐시 무효화 → `router.push()` 가능. 단, 백엔드가 별도 서버에서 쿠키를 세팅하는 구조면 Server Action에서 백엔드 API를 한번 더 거쳐야 해서 도입 복잡도 높음.
2. **`window.location.href`**: Next.js 공식 문서도 auth 상태 변경 시 hard navigation을 권장. hack이 아닌 이 아키텍처의 정답.

---

## Middleware 도입 트레이드오프

### Middleware 동작 방식

모든 요청이 RSC 렌더링 전에 Edge Runtime에서 실행됨.

```
브라우저 요청 → middleware.ts (쿠키 확인) → (root)/layout → (protected)/layout → page
```

### 장점

- RSC 렌더링 전에 미인증 요청 차단 → 불필요한 서버 렌더링 없음
- 미들웨어가 쿠키만 보고 통과시키므로 `router.push()` 사용 가능 → `window.location.href` 제거 가능
- redirect 로직을 한 곳으로 집중

### 단점

- **Edge Runtime 제약**: `axios` 등 Node.js 라이브러리 사용 불가, 쿠키 파싱 정도만 가능
- **토큰 만료 검증 불가**: 쿠키 존재 여부만 체크 가능, 만료된 토큰도 통과시킴
- 결국 `(protected)/layout`의 `getMyInfoServer()` catch redirect 로직이 여전히 필요 → 두 곳에서 관리

### 결론

|                | 현재                        | 미들웨어 도입                            |
| -------------- | --------------------------- | ---------------------------------------- |
| 인증 체크 위치 | `(protected)/layout` (RSC)  | middleware + `(protected)/layout` 둘 다  |
| 로그인 후 이동 | `window.location.href` 필수 | `router.push()` 가능                     |
| 만료 토큰 처리 | `getMyInfoServer()` catch   | middleware는 못 잡음, layout 여전히 필요 |
| 코드 복잡도    | 단순                        | 두 곳에서 관리                           |

**현재 구조에서 미들웨어 도입 실익 없음.** 토큰 만료 처리 때문에 `(protected)/layout`은 어차피 남겨야 하고, `window.location.href` 제거 목적 대비 복잡도가 높음. 미들웨어가 유효한 케이스는 JWT를 프론트에서 직접 검증할 수 있을 때 (예: NextAuth).
