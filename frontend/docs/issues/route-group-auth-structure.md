# Route Group 구조 개선 — Auth 상태 공유 문제

## 문제

로그인 후 `router.push()`로 페이지 이동 시 헤더에 로그인 버튼이 그대로 남음.

### 원인

Next.js Router Cache는 route segment 단위로 RSC payload를 저장한다.  
현재 구조에서 `(auth)/layout`과 `(home)/layout`은 공유하는 segment가 없어서,  
`/login`에서 `router.refresh()`를 호출해도 `/group-buying/list/all`의 캐시는 무효화되지 않는다.

```
/login 의 segment 트리:        /group-buying/list/all 의 segment 트리:
  app/layout                     app/layout
  (auth)/layout       ↕ 공유 없음  (home)/layout  ← getMyInfoServer() 여기
  login/page                     ...
```

`(home)/layout.tsx`에만 `getMyInfoServer()` + `AuthStoreProvider`가 있고,  
이 segment는 `(auth)` 라우트의 refresh 범위 밖이라 캐시가 그대로 남아 `initialUser=null`로 렌더링된다.

### 임시 해결책 (현재 적용)

```ts
// LoginForm.tsx
window.location.href = redirectTo; // 전체 페이지 리로드 → Router Cache 전체 무효화
```

`window.location.href`는 JS 메모리의 Router Cache를 날려버려서 항상 서버에서 새로 fetch한다.  
`router.refresh() + router.push()` 조합으로는 안 됨 — refresh는 현재 URL segment만 무효화하고 목적지 URL은 건드리지 않는다.

---

## 올바른 구조

### 핵심 원칙

- `getMyInfoServer()` + `AuthStoreProvider`는 **모든 페이지가 공유하는 단 하나의 layout**에 있어야 한다.
- 인증 redirect 체크는 **middleware**가 담당한다.

### 제안 구조

```
app/
  layout.tsx              ← html/body만 (최소)
  (root)/
    layout.tsx            ← getMyInfoServer() + AuthStoreProvider (전체 공유)
    (auth)/
      layout.tsx          ← UI만 (middleware가 redirect 처리)
      login/
      signup/
    (home)/
      layout.tsx          ← Header만
      group-buying/
      payment/
    (protected)/
      layout.tsx          ← UI만 (middleware가 redirect 처리)
      my/
      create/
  middleware.ts           ← 쿠키 확인 → protected 미인증 시 /login?redirect=<path>
                                       → auth 인증 시 /로 redirect
```

### 현재 vs 개선 후

|                               | 현재                                 | 개선 후                            |
| ----------------------------- | ------------------------------------ | ---------------------------------- |
| `getMyInfoServer()` 호출 횟수 | 라우트 그룹마다 따로 (최대 3번)      | `(root)/layout.tsx` 1번            |
| 인증 redirect                 | 각 layout 서버 컴포넌트              | middleware                         |
| 로그인 후 이동                | `window.location.href` (full reload) | `router.refresh() + router.push()` |
| 공유 segment                  | `app/layout.tsx`만 (auth 정보 없음)  | `(root)/layout.tsx` (전체 공유)    |

### 개선 후 로그인 흐름

```
await login()                     ← 쿠키 저장 완료 (타이밍 문제 아님)
router.refresh()                  ← (root)/layout.tsx 공유 캐시 무효화
router.push(redirectTo)           ← 신선한 캐시 + 쿠키로 RSC fetch → user 있음 ✓
```

---

## 참고

- Router Cache는 URL별이 아닌 route segment 단위로 저장됨
- 공유 segment가 있으면 하나의 캐시 항목을 여러 URL이 참조
- `router.refresh()`는 현재 URL의 segment 트리 전체를 무효화 (다른 URL은 미포함)
- 쿠키는 `await login()` resolve 시점에 이미 저장 완료 — 타이밍 이슈 아님

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
