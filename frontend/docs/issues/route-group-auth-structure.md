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

---

## 본질적 복잡도 vs 우발적 복잡도 (2026-08-05)

하드 리다이렉트(`window.location.href`)를 Server Action으로 바꾸는 과정에서 코드가 눈에 띄게 복잡해졌음. 이게 방향이 잘못된 신호인지 판단하기 위해, Fred Brooks의 essential/accidental complexity 구분을 적용해서 분류함 — 문제 자체가 요구하는 복잡도(본질적)와 구현 방식 때문에 생긴, 다르게 짰으면 없었을 복잡도(우발적)를 나눔.

### 분류표

| 구성요소                                                                                               | 분류       | 이유                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `applySetCookies` (쿠키 브릿지)                                                                        | 본질적     | 백엔드가 분리 서버라 Set-Cookie를 Next.js 서버가 대신 받아 재설정해야 함 — 어떤 구현을 택해도 피할 수 없음                                                          |
| `AuthStoreProvider`의 sync `useEffect`                                                                 | 본질적     | 서버가 내려준 `initialUser`와 클라이언트 전역 store(Zustand)를 동시에 쓰는 이상, `revalidatePath` 이후 둘을 맞추는 지점이 필요함                                    |
| `x-pathname` middleware 릴레이                                                                         | 본질적     | 서버 컴포넌트(layout)는 클라이언트 컴포넌트의 `usePathname()`처럼 현재 경로를 직접 못 읽음 — Next.js 커뮤니티에서도 통용되는 우회                                   |
| redirect 목적지 계산이 5곳(middleware/`(protected)`/`loginForm`/`loginAction`/`(auth)`layout)에 흩어짐 | **우발적** | 공유 함수 하나로 뽑아서 5곳이 그것만 참조하게 했으면 안 생겼을 문제. 실제로 `(auth)/layout`만 `?redirect=`를 놓친 게 이 우발적 복잡도의 직접적 결과 (GitHub #29 ①②) |

### 인사이트

새 패턴이 필요로 하는 복잡도(본질적)와 그 패턴을 도입하며 실수로 만든 복잡도(우발적)를 구분하지 않으면, 본질적 복잡도를 감당한다는 명분으로 우발적 복잡도까지 정당화하게 됨. 우발적 복잡도는 대부분 **"같은 값을 여러 곳에서 각자 계산"**하는 패턴에서 나옴 — single source of truth 부재가 원인. 다음 리팩터부터는 착수 전에 "이 값을 참조하는 지점이 몇 곳이냐"를 먼저 세는 걸 규칙으로 삼음.

### 수정 비용 (우발적 복잡도만 대상 — 본질적인 건 "제거"가 아니라 구현 방식 재검토 대상)

- 신규: `resolveRedirectTarget()` 공유 함수 1개 (~15줄, open-redirect 검증 포함)
- 수정: `loginForm.tsx`, `login/actions.ts`, `(auth)/layout.tsx` 3곳이 이 함수를 호출하도록 (~5줄씩)
- 테스트: 기존 `auth-consistency-measurement.spec.ts` 회귀 확인 + `(auth)/layout`이 `?redirect=`를 반영하는지 확인하는 케이스 신규 1개
- 리스크: 낮음 — 변경 범위가 auth 흐름 안에 갇혀 있고 공구/대시보드 도메인은 안 건드림
- 참고로 본질적 복잡도 쪽은 "없앨 방법"이 아니라 구현 방식만 재검토 가능 — 예: `applySetCookies` 손파싱 → `set-cookie-parser` 라이브러리 교체(`docs/issues/todo.md` 6번, 우선순위 낮음으로 이미 기록됨)

### 사전 스코핑이었으면 어땠을지

지금 순서는 리팩터 도중 하나씩 발견(②는 오늘 리팩터 전부터 있던 버그, ①은 리팩터가 새로 만든 구멍)한 것 — 착수 전 스코핑 단계 자체가 없었음. 만약 Server Action 전환 착수 전에 `redirectTo`/`redirect=` 참조 지점을 먼저 grep으로 다 뽑았다면, 위 분류표가 구현 전에 나왔을 것이고 `(auth)/layout`의 누락도 코드 작성 시점에 바로 잡혔을 가능성이 높음. 다음 리팩터부터는 착수 전에 영향 범위표를 먼저 만드는 걸 프로세스로 남김.
