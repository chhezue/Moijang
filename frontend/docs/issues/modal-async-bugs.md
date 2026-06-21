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
- 공동구매 취소 (모집 중)
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

<Button onClick={handleConfirm} ...>취소 진행하기</Button>
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

## 5. handleProceedOrder — 팝업 차단기 (낮음)

### 현재 상태

```tsx
await updateGroupBuyingStatus(item.id, 'ORDERED');
window.open(item.productUrl, '_blank'); // async 콜백 안에서 호출
```

`window.open`이 직접 유저 클릭 응답이 아닌 async 콜백 안에 있어 Chrome 팝업 차단기에 걸릴 수 있음.

### 해결책

상태 변경 전에 `window.open` 먼저 호출하거나, 팝업 대신 링크로 안내:

```tsx
// 옵션 1: 상태 변경 성공 후 링크 버튼 노출
// 옵션 2: 모달 메시지에 상품 URL 링크 포함
```

---

## 관련 파일

- `src/app/(root)/(home)/group-buying/detail/[id]/components/modals/ConfirmModalContent.tsx`
- `src/app/(root)/(home)/group-buying/detail/[id]/components/modals/CancelReasonModalContent.tsx`
- `src/app/(root)/(home)/group-buying/detail/[id]/components/modals/ShippedModalContent.tsx`
- `src/components/dashboard/leading/LeaderDashboard.tsx`
