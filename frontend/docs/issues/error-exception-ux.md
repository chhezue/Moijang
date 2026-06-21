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

## 관련 파일

- `src/components/dashboard/GbListPanel.tsx`
- `src/components/dashboard/leading/LeaderDashboard.tsx`
- `src/app/(root)/(home)/group-buying/detail/[id]/components/sidebar/ParticipantList.tsx`
- `src/app/(root)/(home)/group-buying/detail/[id]/components/modals/*.tsx`
