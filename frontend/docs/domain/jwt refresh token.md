현재

```aiignore
SSR → getMyInfo
CSR → Zustand
Backend → auto refresh
```

나중..

```aiignore
Middleware (edge)
→ SSR (complete auth resolution)
→ React Query (server state)
→ Zustand (UI state)

API Layer:
→ interceptor refresh
→ retry logic
→ error classification

Auth:
→ access token
→ refresh token
→ rotation strategy
```

“프론트도 인증 흐름을 명확히 관리 + SSR/CSR 완전 동기화 + 실패 케이스까지 설계”

SSR 요청
→ accessToken 검증
→ 필요하면 refresh
→ 최종 user 확정
→ HTML 렌더링
→ CSR hydration도 동일 상태 주입

401 발생
→ 프론트가 refresh API 직접 호출
→ 성공하면 원래 요청 재시도
→ 실패하면 logout

✔ React Query (server state)
/me
API data
캐싱
✔ Zustand (client state)
UI 상태
auth flag (isLoggedIn)
modal, theme

✔ Edge middleware / gateway
브라우저 요청
→ edge layer에서 인증 처리
→ SSR은 이미 인증된 요청만 받음

또는

✔ 쿠키 forward strict 처리
SSR → API → cookie forward 직접 처리
axios adapter 커스텀

| 상태                  | 처리                 |
| --------------------- | -------------------- |
| 401 (token expired)   | silent refresh       |
| 401 (invalid refresh) | logout               |
| 403 (권한 없음)       | access denied 페이지 |
| 500                   | retry / fallback     |

| 단계                 | 목적                   |
| -------------------- | ---------------------- |
| refresh interceptor  | 클라이언트 인증 안정성 |
| React Query          | 서버 상태 관리 최적화  |
| middleware edge auth | SSR/보안/접근 제어     |

refresh interceptor
accessToken 자주 만료됨
API 많음
로그인 유지 중요
인증 기반 서비스
API 호출 많음

React Query
서버 데이터 많음
/list /detail API 반복 호출
캐싱 필요
게시판 / 대시보드 / 리스트 많음

middleware / edge auth
SSR 페이지 많음
권한 페이지 있음
SEO 중요
protected route 많음
SSR 인증 중요

5. 추천 적용 순서 (현실 기준)
   1단계 (무조건 먼저)

👉 auth 구조 안정화 (지금처럼 SSR + store)

2단계 (필요할 때)

👉 refresh interceptor

3단계 (서비스 커질 때)

👉 React Query

4단계 (마지막)

👉 middleware edge auth
