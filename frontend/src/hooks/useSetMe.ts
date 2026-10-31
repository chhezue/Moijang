import { useQueryClient } from "@tanstack/react-query";
import { AUTH_QUERY_KEY } from "@/apis/services/auth";
import type { UserDto } from "@/types/auth";

// 로그인/로그아웃/세션무효화 — 이 세 곳에서만 ['me'] 캐시를 직접 건드림.
// cancelQueries를 먼저 호출해서, 진행 중이던 stale /me 응답이 뒤늦게 와서
// 방금 세팅한 값을 덮어쓰는 레이스를 막음.
export function useSetMe() {
  const queryClient = useQueryClient();

  return async (user: UserDto | null) => {
    await queryClient.cancelQueries({ queryKey: AUTH_QUERY_KEY });
    queryClient.setQueryData(AUTH_QUERY_KEY, user);
  };
}
