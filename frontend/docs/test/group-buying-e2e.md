# playwright 테스트

- [script1] 총대 공구 생성
- [script2] (총대)인원 모집 후 수령까지 (endDate 반영 x)
  - 실행 방법
    - npx playwright test e2e/02-progress-flow.spec.ts --ui
    - npx playwright show-report
  - 모집완료 공구 gbId 필요(지정됨)
  - confirmed 현재: 자동 / 추후: 알림 후 수동 처리, 그 전에 참여자 취소 가능
- [script3] (참여자)인원 모집 후 수령까지
  - 실행 방법
    - npx playwright test e2e/03-participant-view.spec.ts
      --ui
