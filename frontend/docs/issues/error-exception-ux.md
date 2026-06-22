# 에러/예외 UX 처리

## 목표

API 실패, 빈 상태, 렌더링 에러 발생 시 흰 화면 대신 의미 있는 UI를 제공한다.

---

## 1. ErrorBoundary

### 현재 상태

React 렌더링 중 에러가 터지면 흰 화면. 사용자는 무슨 일인지 알 수 없음.

### 할 일

- `app/error.tsx` (라우트 레벨 ErrorBoundary) 추가
- `app/global-error.tsx` (루트 레벨) 추가
- 필요 시 컴포넌트 단위 `<ErrorBoundary>` 래핑 (대시보드 패널 등)

### 노출 UI 기준

- 에러 메시지: "문제가 발생했습니다. 잠시 후 다시 시도해주세요."
- 새로고침 버튼 제공
- 개발 환경에서만 에러 상세 노출 (`process.env.NODE_ENV === 'development'`)

---

## 2. API 실패 메시지 통일

### 현재 상태

`showSnackbar` 호출 문구가 파일마다 다르고 일관성 없음.

| 파일                              | 현재 문구                                                      |
| --------------------------------- | -------------------------------------------------------------- |
| `LeaderDashboard.tsx`             | "공동구매 취소가 실패했습니다.", "상태 변경에 실패하였습니다." |
| `EditGroupBuyingModalContent.tsx` | "수정 실패"                                                    |
| `EditPriceModalContent.tsx`       | "가격 수정 실패"                                               |
| `ParticipationModalContent.tsx`   | "결제 시작에 실패했습니다."                                    |

### 할 일

- 성공/실패 문구 기준 정의
  - 성공: `"[동작]이 완료되었습니다."` 형식
  - 실패: `"[동작]에 실패했습니다. 다시 시도해주세요."` 형식
- API 에러 응답에 `message`가 있으면 그것 우선 사용
- 전역 axios interceptor에서 공통 에러 처리 고려

---

## 3. 빈 상태 UI (Empty State)

### 현재 상태

데이터가 없을 때 목록이 그냥 비어있음. 사용자가 로딩 중인지 데이터가 없는 건지 구분 불가.

### 대상 화면

| 화면                           | 빈 상태 조건       |
| ------------------------------ | ------------------ |
| `GbListPanel`                  | 공동구매 목록 0개  |
| `ParticipantList`              | 참여자 0명         |
| 대시보드 leading/participating | 해당 공동구매 없음 |

### 할 일

- 빈 상태 공통 컴포넌트 `EmptyState` 만들기
  - props: `icon`, `message`, `subMessage?`, `action?`
- 로딩 중 / 데이터 없음 / 에러 세 가지 상태 명확히 구분

---

---

## 4. loading.tsx / not-found.tsx 누락

### 현재 상태

App Router에서 `loading.tsx`와 `not-found.tsx`가 없음.

- `loading.tsx` 없음 → RSC fetch 중 아무것도 안 보임 (흰 화면)
- `not-found.tsx` 없음 → 없는 경로 접근 시 Next.js 기본 404 페이지

### 할 일

| 파일            | 위치                                | 내용                                       |
| --------------- | ----------------------------------- | ------------------------------------------ |
| `loading.tsx`   | `app/(root)/(home)/`                | 공구 목록/상세 skeleton                    |
| `loading.tsx`   | `app/(root)/(protected)/dashboard/` | 대시보드 skeleton                          |
| `not-found.tsx` | `app/`                              | "페이지를 찾을 수 없습니다" + 홈 이동 버튼 |

---

## 5. 대시보드 권한 체크 — 다른 사람 gbId 접근

### 현재 상태

`/dashboard/leading/[gbId]` 페이지에 소유권 체크 없음.

```tsx
// app/(root)/(protected)/dashboard/leading/[gbId]/page.tsx
const [item, { items: participants }] = await Promise.all([
  getGroupBuyingByIdServer(params.gbId), // 공개 API — 누구나 조회 가능
  getParticipantListServer(params.gbId),
]);
return <LeaderDashboard item={item} participants={participants} />;
```

**케이스 1 — 존재하지 않는 gbId**: `getGroupBuyingByIdServer` → 백엔드 404 throw → RSC 에러 → `error.tsx` 없으면 흰 화면

**케이스 2 — 남의 gbId**: 데이터 정상 조회됨 → `LeaderDashboard` 렌더 → 총대 관리 버튼(취소, 배송 처리 등)이 그대로 노출됨. 버튼 클릭 시 백엔드에서 막히겠지만 UI 자체가 보이면 안 됨.

### 결정: 프론트 체크 없음, 백엔드 의존

- leading/participating 양쪽 일관성을 위해 프론트 소유권 체크 제거
- participating은 "참여자인지" 확인이 더 복잡해 비대칭이 생김
- 백엔드가 API 요청 단위로 이미 막고 있어 프론트 체크는 UX 중복
- 잘못된 gbId 접근 시 백엔드 에러 → `error.tsx` 처리

---

## 관련 파일

- `src/components/dashboard/GbListPanel.tsx`
- `src/components/dashboard/leading/LeaderDashboard.tsx`
- `src/app/(root)/(protected)/dashboard/leading/[gbId]/page.tsx`
- `src/app/(root)/(home)/group-buying/detail/[id]/components/sidebar/ParticipantList.tsx`
- `src/app/(root)/(home)/group-buying/detail/[id]/components/modals/*.tsx`
