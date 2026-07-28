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

### 해결책 (2026-07-29 기준, 최종 적용)

```ts
// src/app/(root)/(auth)/login/actions.ts (Server Action)
const res = await apiServer.post('/api/auth/login', data, { validateStatus: () => true });
applySetCookies(res.headers['set-cookie']); // Set-Cookie 파싱 후 cookies().set()으로 재설정
revalidatePath('/', 'layout'); // (root) 공유 segment 무효화
redirect(redirectTo); // 소프트 네비게이션
```

`window.location.href`(하드 리로드)를 걷어내고 Server Action + `revalidatePath`로 교체. 서버 액션 안에서 캐시 무효화와 리다이렉트가 같은 함수 실행 안에서 순차 진행되므로, `router.refresh()`+`router.push()` 조합에서 있었던 "무효화 완료 전에 다음 라인이 실행되는" 레이스 자체가 구조적으로 발생 불가.

**측정 결과**: 클릭→목적지 도달 시간이 하드 리로드 대비 약 3.6배 개선 (~2653ms → ~730ms, 각 4~5회 측정 중앙값).

### 이전에 "미적용"으로 남겨뒀던 대안들 — 이제 1번 적용, 2번은 여전히 기각

1. **Server Action + `revalidatePath`**: ✅ 적용 완료 (위 참고)
2. **Middleware auth**: 여전히 기각. redirect loop과는 애초에 무관한 대안이었음(아래 "재현 조건 검증" 참고) — middleware는 로그인 _전_ 접근 제어 문제고, redirect loop은 로그인 _후_ 캐시 무효화 문제라 서로 다른 축.

---

## `router.refresh()`를 동기로 쓸 수 없는 이유

`router.refresh()`는 Promise를 반환하지 않아 `await` 불가. 바로 아래 `router.push()`를 쓰면 refresh 완료 전에 push가 실행되어 stale 캐시를 그대로 사용함 → `initialUser=null` → 다시 `/login` 리다이렉트.

백엔드로 치면 트랜잭션이어야 할 동작(캐시 무효화 + 페이지 이동)이 따로따로 실행되는 것.

`window.location.href`는 JS 메모리 자체를 종료하고 브라우저가 새 요청을 보내기 때문에 Router Cache가 통째로 사라짐 → 타이밍 문제 없음.

### 정석 대안 → 2026-07-29 적용 완료

1. **Server Action으로 로그인**: ✅ 적용. `revalidatePath('/')` 서버에서 직접 캐시 무효화 → `redirect()`로 소프트 네비게이션. 백엔드가 별도 서버라 Set-Cookie를 수동으로 파싱해서 재설정하는 헬퍼(`applySetCookies`)를 추가해서 해결.
2. **`window.location.href`**: 더 이상 안 씀. 위 대안으로 대체.

---

## 재현 조건 검증 (2026-07-29)

이 문서 초안에서 "확인함"이라고 적어뒀던 redirect loop을, 실제로는 지금 코드(`(root)` 통합 이후) 기준으로 재현 안 되는 걸 뒤늦게 발견해서 다시 검증함.

### 1차 시도: 실패 — `page.goto()`로 protected URL 직접 진입 후 로그인

`router.push()`만 쓰는 버전으로 되돌려서 테스트했는데 재현 안 됨. Next.js 소스(`node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js`)를 직접 열어 확인한 결과, dynamic 세그먼트 기본 staleTime은 지금 설치된 `14.2.35`에서도 30초로 그대로임 — 프레임워크가 캐시 자체를 없앤 게 아님.

**진짜 이유**: Router Cache(`prefetchCache`)는 클라이언트 사이드 소프트 네비게이션이 그 URL로 실제 시도됐을 때만 엔트리가 생김. `page.goto()`는 브라우저 하드 네비게이션이라 JS가 로드되기도 전에 서버가 307을 보내버려서, 애초에 그 URL에 대한 캐시 엔트리 자체가 안 생김.

### 2차 시도: 성공 — `<Link>` 클릭(소프트 네비)으로 재현

```
1. 공개 페이지(hydrate된 상태)에서 protected URL로 가는 <Link> 클릭 (소프트 네비, prefetch 캐시 엔트리 생성됨)
2. (protected)/layout이 서버에서 redirect() → /login?redirect=X
3. 로그인 성공
4. 순수 router.push(X) → 2번에서 생긴 stale 캐시 엔트리를 재사용 → 다시 /login으로 튕김 (재현됨, 2/2)
5. 같은 조건에서 Server Action 버전 → 정상 도달 (5/5, 회귀 없음 확인)
```

즉 redirect loop의 정확한 트리거 조건은 **"이미 hydrate된 상태에서 소프트 네비게이션으로 그 protected URL 진입을 한 번 시도한 이력이 있어야 함"** — 콜드 진입(북마크, 주소창 직접 입력, 하드 리프레시)으로는 재현 안 됨. 재현 테스트는 `tests/e2e/specs/redirect-loop-link-repro.spec.ts`에 남겨뒀으나, 실행하려면 protected URL로 가는 `<Link>`가 필요해서 임시로 공개 페이지에 심었다가 제거함 — 정식 회귀 테스트로 유지하려면 격리된 테스트 전용 fixture 페이지가 별도로 필요함 (미정).

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

|                | 현재                                              | 미들웨어 도입                            |
| -------------- | ------------------------------------------------- | ---------------------------------------- |
| 인증 체크 위치 | `(protected)/layout` (RSC)                        | middleware + `(protected)/layout` 둘 다  |
| 로그인 후 이동 | Server Action + `revalidatePath` (2026-07-29부터) | `router.push()` 가능                     |
| 만료 토큰 처리 | `getMyInfoServer()` catch                         | middleware는 못 잡음, layout 여전히 필요 |
| 코드 복잡도    | 단순                                              | 두 곳에서 관리                           |

**현재 구조에서 미들웨어 도입 실익 없음.** 토큰 만료 처리 때문에 `(protected)/layout`은 어차피 남겨야 하고, 이미 Server Action으로 로그인 후 이동 문제를 해결했기 때문에 미들웨어 도입의 남은 이점(하드 네비 제거)도 더 이상 유효하지 않음. 미들웨어가 유효한 케이스는 JWT를 프론트에서 직접 검증할 수 있을 때 (예: NextAuth).
