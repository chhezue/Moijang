# React Query 도입 검토

## 현재 뮤테이션 후 갱신 방식

```
버튼 클릭 → API 호출 → router.refresh() → 서버 재실행 → 새 props 내려옴
```

`router.refresh()`가 하는 일:

- 페이지 전체 새로고침이 아닌 서버 컴포넌트만 재실행
- `page.tsx`가 서버에서 다시 데이터 fetch
- 새 데이터를 `DetailClientPage`에 props로 내려줌
- URL, 스크롤 위치 유지

---

## 상태 저장 위치

```
Zustand      → user 정보만 저장 (전역 상태 동기화)
공구 상세     → SSR props (router.refresh()로 갱신)
참여자 목록   → SSR props (router.refresh()로 갱신)
검색/필터     → 컴포넌트 로컬 상태
```

공구 관련 데이터는 Zustand와 무관하고, 서버에서 props로 내려오는 구조.

---

## user 전역 상태 동기화

user는 서버 데이터지만 React Query가 아닌 Zustand로 관리. 이유:

```
SSR layout에서 /api/auth/me 1회 fetch
→ Providers({ initialUser }) 로 전달
→ Zustand에 즉시 저장 (렌더 타임 초기화)
→ 이후 모든 CSR 컴포넌트는 Zustand에서만 읽음 (재호출 없음)
```

user는 페이지 이동마다 바뀌는 데이터가 아니라 세션 단위로 고정되기 때문에
React Query의 캐시/재fetch 전략이 필요 없고, Zustand로 충분함.

F5 새로고침 시에는 SSR이 다시 실행되어 Zustand가 재초기화됨.

---

## 새로고침(F5) vs router.refresh()

|                     | F5 새로고침       | router.refresh() |
| ------------------- | ----------------- | ---------------- |
| 서버 데이터 재fetch | O                 | O                |
| Zustand user        | SSR이 다시 초기화 | 유지             |
| 스크롤 위치         | 맨 위로           | 유지             |
| 전체 JS 재로드      | O                 | X                |

---

## 현재 문제

`router.refresh()`는 전체 서버 컴포넌트 트리를 재실행하기 때문에,
참여자 목록 하나만 바뀌어도 페이지 전체를 다시 그림 → 미세한 깜빡임 발생.

---

## React Query 도입 시 개선

`invalidateQueries`는 해당 쿼리만 재fetch → 나머지 UI는 그대로 유지.

### 도입 위치

| 데이터                        | 현재                          | React Query 필요?  |
| ----------------------------- | ----------------------------- | ------------------ |
| user 정보                     | SSR + Zustand                 | 불필요             |
| 공구 목록 (필터/검색)         | SSR + searchParams            | 불필요             |
| 공구 상세 초기 데이터         | SSR props                     | 불필요             |
| 참여자 목록                   | SSR props                     | **핵심 도입 위치** |
| 뮤테이션 (참여/취소/상태변경) | 직접 fetch + router.refresh() | **핵심 도입 위치** |

### detail 페이지 적용 예시

```ts
// SSR initialData 패턴
const { data: participants } = useQuery({
  queryKey: ['participants', item.id],
  queryFn: () => getParticipantList(item.id),
  initialData: participants, // SSR에서 받은 초기값 그대로 사용
});

const cancelMutation = useMutation({
  mutationFn: () => cancelParticipant(item.id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['participants', item.id] });
    // 참여자 목록만 재fetch, 페이지 나머지는 그대로
    setActiveModal(null);
    showSnackbar('참여가 취소되었습니다.', 'success');
  },
});

// cancelMutation.isPending → 버튼 disabled 자동 처리
```

### 흐름 비교

```
현재
뮤테이션 성공 → router.refresh() → 페이지 전체 재렌더

React Query 도입 후
뮤테이션 성공 → invalidateQueries(['participants', id]) → 참여자 목록만 재fetch
```

---

## 결론

지금 규모에서 router.refresh()가 틀린 건 아니지만,
참여자 목록처럼 자주 바뀌는 데이터에 한해 React Query를 부분 도입하면
UX 개선(깜빡임 제거)과 isPending을 통한 더블클릭 방어를 동시에 얻을 수 있음.
