# playwright 테스트

- [script1] 총대 공구 생성
- [script2] 인원 모집 후 수령까지 (endDate 반영 x)
  - npx playwright test e2e/02-progress-flow.spec.ts --ui
  - 모집완료 공구 gbId 필요(지정됨, 돌린 후 상태 되돌리기까지 )
  - confirmed 현재: 자동 / 추후: 알림 후 수동 처리, 그 전에 참여자 취소 가능
