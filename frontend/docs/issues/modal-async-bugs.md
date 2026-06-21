# 모달 비동기 처리 버그

## 발견된 문제

---

## 1. ConfirmModalContent — 중복 클릭 (높음)

### 현재 상태

```tsx
<Button variant="contained" color="error" size="small" onClick={onConfirm}>
  {confirmLabel}
</Button>
```

`onConfirm`이 async 함수인데 버튼에 로딩/비활성 처리가 없음.
빠르게 두 번 클릭하면 API 두 번 호출됨.

### 영향 범위

`ConfirmModalContent`를 사용하는 모든 모달:

- 공동구매 참여 취소
- 공동구매 취소 (모집 데중)
- 주문 진행
- 수령 확인 및 완료

### 해결책

```tsx
interface ConfirmModalContentProps {
  message: ReactNode;
  onConfirm: () => Promise<void> | void;
  confirmLabel?: string;
}

const ConfirmModalContent = ({
  message,
  onConfirm,
  confirmLabel = '확인',
}: ConfirmModalContentProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ...
    <Button
      variant="contained"
      color="error"
      size="small"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? <CircularProgress size={16} /> : confirmLabel}
    </Button>
  );
};
```

---

## 2. CancelReasonModalContent — 중복 클릭 (높음)

### 현재 상태

```tsx
const handleConfirm = () => {
  if (!selectedReason || !isAgreed) return;
  onConfirm(selectedReason); // async인데 await 없음
};

<Button onClick={handleConfirm}>취소 진행하기</Button>;
```

`onConfirm`이 실행 중인지 알 수 없어 중복 제출 가능.

### 해결책

`isLoading` state 추가 후 `onConfirm` await 처리, 버튼 disabled.

---

## 3. ShippedModalContent — 중복 클릭 + 빈값 제출 (중간)

### 현재 상태

```tsx
<Button onClick={() => onSubmit({ pickupPlace, pickupTime })} variant="contained">
  완료
</Button>
```

- 로딩 상태 없어서 중복 클릭 가능
- `pickupPlace`, `pickupTime` 빈값 검증 없음 → 빈 채로 API 호출됨

### 해결책

```tsx
const isValid = pickupPlace.trim() && pickupTime.trim();

<Button
  onClick={() => onSubmit({ pickupPlace, pickupTime })}
  disabled={!isValid || isLoading}
  variant="contained"
>
  {isLoading ? <CircularProgress size={16} /> : '완료'}
</Button>;
```

---

## 4. handleShipped — 부분 실패 케이스 (중간)

### 현재 상태

```tsx
const handleShipped = async ({ pickupPlace, pickupTime }) => {
  try {
    await updateGroupBuyingStatus(item.id, 'SHIPPED'); // 1번
    await updateGroupBuying(item.id, { pickupPlace, pickupTime }); // 2번
    showSnackbar('배송 완료 처리되었습니다.', 'success');
  } catch {
    showSnackbar('배송 정보 저장에 실패했습니다.', 'error');
  }
};
```

1번 API 성공 → 상태가 SHIPPED로 변경됨 → 2번 API 실패 → 에러 snackbar 뜨지만 상태는 이미 SHIPPED.
에러 메시지와 실제 상태가 불일치.

### 해결책 (단기)

에러 catch 시 메시지를 상태에 맞게 분리:

```tsx
try {
  await updateGroupBuyingStatus(item.id, 'SHIPPED');
} catch {
  showSnackbar('배송 상태 변경에 실패했습니다.', 'error');
  return;
}
try {
  await updateGroupBuying(item.id, { pickupPlace, pickupTime });
  showSnackbar('배송 완료 처리되었습니다.', 'success');
} catch {
  // 상태는 SHIPPED로 변경됐음을 사용자에게 알림
  showSnackbar(
    '배송 완료 처리됐으나 픽업 정보 저장에 실패했습니다. 수정 버튼으로 다시 입력해주세요.',
    'warning',
  );
}
```

---

## 5. handleProceedOrder — 팝업 차단기 — 완료

### 수정 전

```tsx
await updateGroupBuyingStatus(item.id, 'ORDERED');
window.open(item.productUrl, '_blank'); // async 콜백 안에서 팝업 차단 가능
```

### 수정 후

`window.open` 제거. 상태만 ORDERED로 변경하고 공지사항에서 URL 확인하도록 유도.

---

## 6. create/page.tsx — 완료 버튼 중복 클릭 (중간)

### 현재 상태

```tsx
<Button
  variant="contained"
  onClick={handleNext}
  disabled={activeStep === steps.length - 1 && !agree}
>
  {activeStep === steps.length - 1 ? '완료' : '다음'}
</Button>
```

최종 단계에서 `agree`가 true이면 버튼이 활성화되고, `handleNext` → `handleSubmit(onSubmit)()` 호출.
`isSubmitting` 체크가 없어서 API 응답 대기 중에도 버튼이 눌림 → 공구 중복 생성 가능.

### 해결책

react-hook-form의 `formState.isSubmitting` 활용:

```tsx
const {
  trigger,
  handleSubmit,
  getValues,
  formState: { isSubmitting },
} = methods;

<Button
  variant="contained"
  onClick={handleNext}
  disabled={(activeStep === steps.length - 1 && !agree) || isSubmitting}
>
  {isSubmitting ? (
    <CircularProgress size={20} color="inherit" />
  ) : activeStep === steps.length - 1 ? (
    '완료'
  ) : (
    '다음'
  )}
</Button>;
```

---

## 7. create/page.tsx — setTimeout 라우팅 (낮음)

### 현재 상태

```tsx
showSnackbar('공구 신청이 완료되었습니다.', 'success');
setTimeout(() => {
  router.push(`group-buying/detail/${gbId}`);
}, 1000);
```

snackbar를 보여주려고 1초 대기 후 이동. 이 사이 유저가 뒤로가기 또는 다른 링크 클릭하면 setTimeout이 남아있다가 의도치 않은 이동 발생.

### 해결책

snackbar의 `autoHideDuration`이 있으므로 setTimeout 없이 바로 이동해도 됨:

```tsx
showSnackbar('공구 신청이 완료되었습니다.', 'success');
router.push(`/group-buying/detail/${gbId}`); // 앞의 / 빠진 것도 수정
```

---

## 8. ParticipantDashboard.tsx — 잘못된 cancelReason (중간)

### 현재 상태

```tsx
await refundPayment({ gbId: item.id, cancelReason: 'LEADER_CANCELLED' });
```

참여자가 자신의 참여를 취소하는 상황인데 `"LEADER_CANCELLED"` 사유 사용 중.

### 현재 백엔드 enum (`CancelReason`)

```ts
LEADER_CANCELLED; // 총대 개인 사유
RECRUITMENT_FAILED; // 모집 인원 미달
PAYMENT_FAILED; // 미입금자 발생
PRODUCT_UNAVAILABLE; // 상품 품절 또는 가격 변동
SYSTEM_CANCELLED; // 시스템 자동 취소
```

참여자 자발 취소 케이스가 enum에 없음 → `LEADER_CANCELLED`로 임시 처리 중.

### 해결책

백엔드에 `PARTICIPANT_CANCELLED` enum 추가 요청 후 교체. 프론트 코드는 준비되어 있음.

---

## 9. 잔존 console.error (배포 전 제거) — 완료

### 수정 전

```tsx
// create/page.tsx
console.error(error);

// UserMenu.tsx
console.error('로그아웃 실패:', error);
```

### 수정 후

- `create/page.tsx`: `console.error` 제거, catch 블록을 `catch {` 로 변경
- `UserMenu.tsx`: `console.error` 제거, catch에서도 `clearUser()` 호출하도록 수정 (API 실패해도 클라이언트 상태 초기화)

---

## 10. SignupClient.tsx — handleCheckLoginId 로딩 처리 없음 (낮음)

### 현재 상태

```tsx
const handleCheckLoginId = async () => {
  try {
    const available = await checkLoginId(loginId);
    setLoginIdAvailable(available);
  } catch {
    showSnackbar('중복 확인에 실패했습니다. 다시 시도해주세요.', 'error', 3000);
  }
};
```

중복확인 버튼에 loading/disabled 처리 없어 API 호출 중 여러 번 클릭 가능.
다른 Step의 `handleSendCode`, `handleConfirmCode`는 `loading` state 처리가 되어 있음.

### 해결책

`loading` state를 공유하거나 별도 `idCheckLoading` state 추가:

```tsx
const [idCheckLoading, setIdCheckLoading] = useState(false);

const handleCheckLoginId = async () => {
  setIdCheckLoading(true);
  try {
    const available = await checkLoginId(loginId);
    setLoginIdAvailable(available);
  } catch {
    showSnackbar('중복 확인에 실패했습니다. 다시 시도해주세요.', 'error', 3000);
  } finally {
    setIdCheckLoading(false);
  }
};
```

---

## 관련 파일

- `src/app/(root)/(home)/group-buying/detail/[id]/components/modals/ConfirmModalContent.tsx`
- `src/app/(root)/(home)/group-buying/detail/[id]/components/modals/CancelReasonModalContent.tsx`
- `src/app/(root)/(home)/group-buying/detail/[id]/components/modals/ShippedModalContent.tsx`
- `src/components/dashboard/leading/LeaderDashboard.tsx`
- `src/components/dashboard/participating/ParticipantDashboard.tsx`
- `src/app/(root)/(protected)/create/page.tsx`
- `src/components/UserMenu.tsx`
- `src/app/(root)/(auth)/signup/components/SignupClient.tsx`
