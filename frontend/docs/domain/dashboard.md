# 대시보드 (`/dashboard`)

## 라우팅

```
/dashboard              → /dashboard/leading 리다이렉트
/dashboard/leading      → 빈 상태 (공구 선택 안내)
/dashboard/leading/[gbId]       → 총대 관리 화면
/dashboard/participating        → 빈 상태 (공구 선택 안내)
/dashboard/participating/[gbId] → 참여자 확인 화면
```

## 레이아웃 체인 (좌→우 3단 사이드바 구조)

```
(protected)/layout.tsx          ← 인증 확인 + Header
  dashboard/layout.tsx          ← div + DashboardNav (240px 고정)
    leading/layout.tsx          ← div + getMyCreateGroupBuying → GbListPanel (260px)
      leading/page.tsx          ← "use client" 빈 상태
      leading/[gbId]/page.tsx   ← server fetch → LeaderDashboard (client)
    participating/layout.tsx    ← div + getMyParticipant(isOwner 제외) → GbListPanel
      participating/page.tsx    ← "use client" 빈 상태
      participating/[gbId]/page.tsx ← server fetch → ParticipantDashboard (client)
```

## 컴포넌트 위치

```
src/components/dashboard/
  DashboardNav.tsx                       ← 왼쪽 메뉴 사이드바 (240px, sticky top: 68px)
  GbListPanel.tsx                        ← 두 번째 사이드바 (260px, 공구 카드 목록)
  leading/LeaderDashboard.tsx            ← 총대 메인 (참여자목록 + 진행상황 + 공지 + 모달)
  participating/ParticipantDashboard.tsx ← 참여자 메인 (총대정보 + 공지 + 내 참여)
```

## 메뉴 항목

| 메뉴            | 이동 경로                  | 비고                                                       |
| --------------- | -------------------------- | ---------------------------------------------------------- |
| 만들기          | `/create`                  | 기존 페이지로 이동 (대시보드 내 임베드 불가, MUI SSR 이슈) |
| 진행중인거      | `/dashboard/leading`       | 내가 총대인 공구                                           |
| 참여중인거      | `/dashboard/participating` | 내가 참여한 공구 (총대인 것 제외)                          |
| 문의사항        | 비활성화                   | 추후 구현                                                  |
| PG계좌 정산현황 | 비활성화                   | 추후 구현                                                  |

## 데이터 흐름

- `leading/layout.tsx` → `getMyCreateGroupBuying({ page: 1 })` → `GbListPanel`으로 전달
- `participating/layout.tsx` → `getMyParticipant({ page: 1 })` → `isOwner` 필터 후 `GbListPanel`으로 전달
- `leading/[gbId]/page.tsx` → `getGroupBuyingByIdServer` + `getParticipantListServer` 병렬 fetch
- `participating/[gbId]/page.tsx` → `getGroupBuyingByIdServer`만 fetch

## 보류 중인 작업

- 만들기 폼 대시보드 내 임베드 (MUI v7 SSR 이슈 해결 후, 현재는 `/create`로 이동)
- detail 페이지 액션 버튼 정리 (대시보드 이관 후 "참여하기"만 남기기)
- 문의사항, PG계좌 정산현황 구현
