import { useQuery } from "@tanstack/react-query";
import { AUTH_QUERY_KEY, getMyInfo } from "@/apis/services/auth";

export function useMe() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getMyInfo,
  });
}
