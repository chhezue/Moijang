랑## 🔐 Authentication Architecture

### 구조

- School email 기반 인증 시스템
- SSR 기반 초기 인증 처리
- Zustand 기반 전역 상태 관리

---

### SSR/CSR 인증 전략

- SSR 단계에서 getMyInfoServer()로 사용자 정보 선조회
- Providers를 통해 초기 상태 주입
- Client는 상태 유지 및 갱신만 수행

👉 효과:

- 로그인 상태 깜빡임 제거
- SSR/CSR 상태 불일치 해결

---

### 상태 관리

- Redux → Zustand 전환
- authStore로 사용자 상태 중앙 집중화

---

### API 구조

- /auth/me SSR 1회 초기화로 변경
- 불필요한 중복 호출 제거 (3회 → 1회)
