# Frontend 설계 정리 (4/16)

---

## 1. 상태 관리 설계 — 서버 상태 / 클라이언트 상태 혼재 문제

### 현재 코드 (`commonSlice.ts`)

```ts
interface ICommonState {
  isDarkMode: boolean; // 클라이언트 상태 (UI)
  user: IUser | null; // 서버 상태 (API 응답)
}
```

`user`는 서버에서 오는 데이터인데 Redux(클라이언트 상태 도구)로 관리.

**문제점:**

- 서버 상태는 staleness(신선도)가 있음. Redux는 이걸 모름 — 언제 다시 fetch할지 직접 짜야 함
- `useAuthSync`가 여러 레이아웃에서 중복 호출되는 이유가 이것
- 결과적으로 `/api/auth/me` 3중 호출 문제 발생

**설계 원칙:**

> "서버에서 오는 데이터(user, 공구 목록)는 서버 상태. 탭 선택, 모달 open 여부, isDarkMode는 클라이언트 상태.
> 이 둘을 같은 store에 넣으면 staleness 관리가 불가능해진다."

---

## 2. 비동기 흐름 설계 — loading / error / empty 일관성

### 현재 문제 (`DetailClientPage.tsx`)

SSR로 `participants`를 받으면서 loading state를 없앴는데, 뮤테이션 이후 refetch 중 상태가 없음.
`router.refresh()`로 전체 페이지를 재로드하는 방식이라, 뮤테이션 → 응답 오는 사이 버튼이 그냥 active 상태로 남아 있음.

**핸들러 패턴은 일관적이지만 `isPending`이 없음:**

```ts
try {
  await cancelParticipant(item.id);
  showSnackbar('...', 'success');
  router.refresh();
} catch (err) {
  showSnackbar('...', 'error');
}
// 각 핸들러마다 isSubmitting 같은 로딩 상태가 없음 → 더블 클릭 방어 안 됨
```

---

## 3. 컴포넌트 인터페이스 설계 — 확장성 고려 여부

### 잘 된 케이스 — `ShippedModalContent`

```ts
// create / edit 둘 다 처리
interface Props {
  initialPlace?: string; // 수정 시만 사용
  initialTime?: string; // 수정 시만 사용
  onSubmit: (data) => void;
}
```

```tsx
// 생성
<ShippedModalContent onSubmit={handleShipped} />

// 수정
<ShippedModalContent
  initialPlace={item.pickupPlace}
  initialTime={item.pickupTime}
  onSubmit={handleEditShipped}
/>
```

### 보완 필요 케이스 — `ConfirmModalContent`

`confirmLabel?` 정도만 있고, `onCancel` 핸들러가 없어서
"취소 버튼 눌렀을 때 다른 모달로 이동" 같은 요구사항이 생기면 컴포넌트를 뜯어야 함.

---

## 4. router.refresh()의 문제

**문제는 맞지만, 현재 구조에서는 어쩔 수 없는 선택이기도 함.**

현재 데이터 흐름:

```
SSR → data → Client Component에 props로 전달
뮤테이션 → router.refresh() → SSR 재실행 → 새 props
```

**실제 문제:**

1. **UX**: 전체 서버 렌더링 재요청 → 화면 깜빡임, 느림
2. **뮤테이션 진행 중 상태 없음**: 핸들러 어디에도 `isPending` 없음 → 더블클릭 방어 안 됨
3. **에러 시 UI 복구 없음**: 낙관적 업데이트 rollback 불가

단, SSR이 primary data source인 구조에서 `router.refresh()` 자체가 틀린 건 아님.
문제는 뮤테이션 중 상태 관리가 없다는 것.

---

## 5. 비동기/에러 핸들링 통합 — `useMutationAction` 패턴

현재 핸들러 8개가 동일한 try/catch 구조를 반복. React Query 도입 전에도 이 패턴으로 통합 가능.

```ts
// hooks/useMutationAction.ts
export function useMutationAction<T>(
  fn: (arg: T) => Promise<void>,
  options: {
    successMessage: string;
    errorMessage: string;
    onSuccess?: () => void;
  },
) {
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const execute = async (arg: T) => {
    setIsPending(true);
    try {
      await fn(arg);
      showSnackbar(options.successMessage, 'success');
      options.onSuccess?.();
      router.refresh();
    } catch (err: any) {
      showSnackbar(err?.response?.data?.message ?? options.errorMessage, 'error');
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
}
```

**사용:**

```ts
const { execute: cancelParticipation, isPending } = useMutationAction(
  () => cancelParticipant(item.id),
  {
    successMessage: '참여가 취소되었습니다.',
    errorMessage: '참여 취소에 실패했습니다.',
    onSuccess: () => setActiveModal(null),
  },
);
// isPending → 버튼 disabled에 연결
```

---

## 6. React Query 도입 위치 — 변경된 부분만 업데이트

### 핵심 개념

`router.refresh()`는 전체 서버 컴포넌트 트리를 재실행.
React Query의 `invalidateQueries`는 해당 쿼리 데이터만 클라이언트에서 재fetch → 나머지 UI는 그대로.

### 데이터 분류

| 데이터                        | 현재 방식                     | React Query 필요?                   |
| ----------------------------- | ----------------------------- | ----------------------------------- |
| user 정보                     | SSR + Zustand                 | 불필요 — Zustand로 충분             |
| 공구 목록 (필터/검색)         | SSR + searchParams            | 불필요 — URL param → 서버 re-render |
| 공구 상세 초기 데이터         | SSR props                     | 불필요                              |
| 참여자 목록 (detail 페이지)   | SSR props                     | **핵심 도입 위치**                  |
| 뮤테이션 (참여/취소/상태변경) | 직접 fetch + router.refresh() | **핵심 도입 위치**                  |

### detail 페이지 적용 예시

```ts
// SSR initialData 패턴: SSR이 초기값 제공 → React Query가 캐시로 받음
const { data: participants } = useQuery({
  queryKey: ['participants', item.id],
  queryFn: () => getParticipantList(item.id),
  initialData: participants, // SSR에서 받은 초기값 그대로 사용
});

const cancelMutation = useMutation({
  mutationFn: () => cancelParticipant(item.id),
  onSuccess: () => {
    queryClient.invalidateQueries(['participants', item.id]);
    // 참여자 목록만 재fetch → 전체 페이지 refresh 불필요
    setActiveModal(null);
    showSnackbar('참여가 취소되었습니다.', 'success');
  },
  onError: (err) => showSnackbar('참여 취소에 실패했습니다.', 'error'),
});

// cancelMutation.isPending → 버튼 disabled 자동 처리
```

**흐름 정리:**

```
SSR → participants 초기값 → React Query 캐시
뮤테이션 성공 → invalidateQueries(['participants', id])
             → 참여자 목록만 재fetch
             → 페이지 나머지(공구 정보, Stepper 등)는 그대로
```

---

## 7. 작업 순서

```
1. Redux → Zustand (isDarkMode 제거, user만)
2. middleware로 인증 방어 (protected/layout.tsx 단순화)
3. SSR layout → Zustand 초기화, AuthInitializer/useAuthSync 제거
4. useMutationAction hook으로 핸들러 8개 통합 (React Query 없이도 가능)
5. React Query 도입 → detail 페이지 participants 쿼리화 + router.refresh() 제거
```

4번까지는 React Query 없이 가능. 5번은 UX 개선이 필요할 때 추가.
