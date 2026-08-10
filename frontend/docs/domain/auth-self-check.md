# 인증 구조 셀프체크 (학습/면접 준비용)

> `auth.md`는 "지금 구조가 뭔지" 보여주는 레퍼런스 문서. 이건 그걸 이해했는지 확인하는 학습용 — 성격이 달라서 분리함.
> `auth.md`는 오늘(2026-08-05) 로그인 흐름이 Server Action으로 바뀐 걸 아직 반영 안 해서 일부 낡았음, 갱신 필요.

## 기본(baseline)에서 몇 단계를 더 갔나

기본형: _"Server Component가 쿠키로 유저를 한 번 fetch하고, 없으면 `redirect()` 한 줄"_. 많은 앱이 여기서 멈춤.

| 단계 | 기본에 뭘 더했나                                  | 왜                                                       | 강제 vs 선택                                         |
| ---- | ------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------- |
| A    | route group으로 인증 정책 분리                    | 페이지마다 `if(!user)` 흩뿌리지 않고 경계를 구조화       | 선택 (조직적 이점)                                   |
| B    | 클라이언트 전역 store(Zustand)                    | Header 등이 서버 왕복 없이 즉시 반응해야 함              | 선택                                                 |
| C    | 하드 리로드 대신 Server Action + `revalidatePath` | 로그인 후 이동 속도                                      | 선택 — **실익 대비 과했을 가능성 있음, 재검토 대상** |
| D    | `?redirect=` 왕복 (원래 가려던 곳 복귀)           | "로그인했더니 엉뚱한 곳" 방지                            | 선택                                                 |
| E    | redirect 값 open-redirect 검증                    | D를 하는 순간 필수가 됨                                  | D의 전제조건                                         |
| F    | `applySetCookies` 쿠키 브릿지                     | 백엔드가 별도 서버                                       | **강제** (제약)                                      |
| G    | middleware `x-pathname` 릴레이                    | layout이 searchParams/pathname 직접 못 읽는 Next.js 제약 | **강제** (제약)                                      |

## 장점 — 진짜 있는 것만

| 단계 | 장점                                                                 | 비고                                                                         |
| ---- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| A    | 파일 위치만 봐도 보호 여부가 드러남, grep으로 즉시 확인 가능         | 실재함                                                                       |
| B    | 로그아웃 시 여러 컴포넌트가 동시 갱신, 깜빡임 없음                   | 실재함                                                                       |
| C    | 3.6배 체감 속도 (~2653ms→~730ms)                                     | 실재하지만 로그인은 세션당 1회라 hot path 아님 — 이미 재검토 대상으로 결론남 |
| D    | 딥링크로 들어왔다가 로그인 요구받아도 원래 보려던 곳으로 정확히 복귀 | 사용자 체감 가장 큰 이득                                                     |
| E    | D를 안전하게 만듦, 보안 사고 원천 차단                               | D의 전제조건이지 독립적 장점 아님                                            |
| F    | 없음                                                                 | 장점이 아니라 백엔드 분리로 강제된 비용                                      |
| G    | 없음                                                                 | D를 가능하게 하는 인프라일 뿐                                                |

## 정석은 뭐냐 — 층마다 다름

1. **Server Component가 쿠키로 유저 체크 후 redirect** — Next.js App Router 공식 정석.
2. **손으로 쿠키 브릿지 구현(`applySetCookies`)** — 정석 아님. 정석은 NextAuth.js(Auth.js) 같은 라이브러리, 혹은 애초에 Next.js가 백엔드 세션까지 관장하는 BFF 구조. 지금 방식은 이해를 위한 학습으로는 좋지만 신규 프로덕션 표준은 아님.
3. **로그인 후 하드 vs 소프트 네비게이션** — Next.js 공식 문서는 auth 상태 변경엔 오히려 하드 리로드를 권장함. 이 프로젝트는 그 정석에서 벗어나 성능 최적화를 시도한 쪽.

## 어느 규모 회사여야 이 정도까지 하나

- **MVP/사이드 프로젝트(지금 이 프로젝트 규모)**: 과함. NextAuth 쓰거나 하드 리로드로 충분 — 기능 빨리 내는 게 우선.
- **트래픽 있는 성장기 서비스**: route group 구조화, redirect 복귀, open-redirect 방어가 실제로 필요해지는 단계 — 이탈률/보안사고가 매출에 영향 주기 시작.
- **규제 산업(금융권 포함)**: 손수 구현을 오히려 지양 — 검증된 표준(OAuth2 등) 선호, 감사 가능성 중시. 복잡도의 종류 자체가 성능이 아니라 컴플라이언스(세션 정책, 감사로그, MFA) 쪽으로 달라짐.

**결론**: 오늘 한 것들은 학습 목적으로는 훌륭하고, 실무 판단으로는 이 프로젝트 규모엔 오버엔지니어링에 가까움.

## 전체 구조 (파일 기준)

```
middleware.ts
  └─ 모든 요청에 x-pathname(pathname+search) 헤더 삽입

(root)/layout.tsx
  └─ getMyInfoServer() 1회 (react cache로 요청 내 dedup)
       └─ AuthStoreProvider(initialUser) → Zustand store 생성
            ├─ (auth)/layout.tsx    — user 있으면 resolveRedirectTarget(?redirect=)로 이동
            ├─ (home)/layout.tsx    — Header만, 인증 무관
            └─ (protected)/layout.tsx — user 없으면 /login?redirect=<x-pathname>

로그인: loginForm(client) → loginAction(Server Action)
  → 백엔드 /api/auth/login → applySetCookies(Set-Cookie 재설정)
  → revalidatePath('/','layout') → redirect(resolveRedirectTarget(redirectTo))

로그아웃: UserMenu → logoutAction(Server Action)
  → 백엔드 /api/auth/logout → applySetCookies → revalidatePath
  → /dashboard였으면 redirect("/"), 아니면 router.refresh()

resolveRedirectTarget() — middleware/protected layout/loginForm/loginAction/auth layout
  5곳이 전부 이 함수 하나만 참조 (2026-08-05 통합)
```

## 셀프체크 질문 19개

### A. Route group / 레이아웃

1. `(protected)/layout.tsx`는 `try/catch`로, `(auth)/layout.tsx`는 `.catch(() => null)`로 인증을 체크한다. 이 둘이 왜 다른 방식이어야 하는가?
2. `(home)/layout.tsx`는 인증 체크를 안 하는데, `(root)/layout.tsx`가 내려주는 `initialUser`를 왜 필요로 하는가?

### B. Middleware / x-pathname

3. Server Component는 왜 `usePathname()`을 못 쓰는가?
4. middleware가 `x-pathname`을 못 심는 상황이 생기면 어떤 부작용이 생기는가?

### C. 서버 인증 상태

5. `getMyInfoServer()`가 `react`의 `cache()`로 감싸져 있지 않다면, `(root)`와 `(protected)` layout이 각각 호출할 때 몇 번 네트워크 요청이 나가는가?
6. `withServerCookies()`가 왜 서버사이드 API 호출에만 필요하고 클라이언트(axios) 호출엔 필요 없는가?

### D. 클라이언트 인증 상태 (Zustand)

7. Zustand를 싱글톤이 아니라 팩토리 패턴으로 만든 이유는? SSR에서 싱글톤이면 정확히 어떤 사고가 나는가?
8. `AuthStoreProvider`의 sync `useEffect`가 객체 전체가 아니라 `id`만 비교하는 이유는?

### E. Server Action (로그인/로그아웃)

9. `loginAction`은 브라우저에서 직접 호출 가능한가? 가능하다면 그게 왜 보안상 의미가 있는가?
10. `revalidatePath('/', 'layout')`과 `revalidatePath('/')`의 차이는?
11. `logoutAction`이 `/dashboard`면 `redirect`, 아니면 `router.refresh()`로 분기한다. 이 분기가 없으면 어떤 문제가 생기는가?

### F. 쿠키 브릿지 (applySetCookies)

12. 백엔드가 쿠키 대신 JSON 바디로 토큰을 준다면 `applySetCookies` 전체가 왜 필요 없어지는가?
13. `Max-Age`와 `Expires`가 동시에 온다면 어느 쪽이 우선해야 하는가?

### G. redirect 목적지 통합

14. `resolveRedirectTarget()`을 `loginForm`(클라이언트)에만 두고 `loginAction`(서버)엔 안 넣으면 어떤 공격이 가능해지는가?
15. 통합 전엔 5곳 중 정확히 어느 한 곳만 이 검증이 빠져 있었는가, 왜 하필 그곳이었는가?

### H. Router Cache / redirect loop

16. `page.goto()`로 protected URL에 직접 진입하면 왜 redirect loop이 재현 안 되는가?
17. `router.refresh()` 다음 줄에 `router.push()`를 쓰면 왜 레이스가 생기는가?

### I. 트레이드오프 판단

18. middleware를 도입했으면 GitHub #29 ①②(redirectTo 미검증, `?redirect=` 무시)가 안 생겼을까?
19. `window.location.href`로 되돌린다면 `resolveRedirectTarget()`, `applySetCookies`, `x-pathname` search 확장 중 뭐가 남고 뭐가 필요 없어지는가?

## 참고

- `auth.md` — 현재 구조 레퍼런스 (일부 낡음, 로그인 흐름 갱신 필요)
- `../issues/route-group-auth-structure.md` — 본질적/우발적 복잡도 분석, 의사결정 로그
- `../issues/redirect-loop.md` — redirect loop 조사 전체
- `../issues/todo.md` — GitHub #29 진행 상태
