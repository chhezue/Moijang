import { useQuery } from "@tanstack/react-query";
import { getGroupBuyingById } from "@/apis/services/groupBuying";

export type GroupBuyingViewer =
  | { status: "pending" }
  | { status: "error" }
  | { status: "ready"; isOwner: boolean; isParticipant: boolean };

// 공개 상세페이지는 SSR(쿠키 없이 공개 데이터만)을 유지하고, isOwner/isParticipant만
// 이 훅으로 CSR 재조회함 — 백엔드가 이미 올바르게 계산해주는 걸 프론트에서 복제하지 않기 위함.
// pending/error 상태를 ready와 분리해서, 로딩/에러 중에 isOwner=false로 오판하지 않게 함.
export function useGroupBuyingViewer(gbId: string): GroupBuyingViewer {
  const { data, isPending, isError } = useQuery({
    queryKey: ["group-buying-viewer", gbId],
    queryFn: () => getGroupBuyingById(gbId),
  });

  if (isPending) return { status: "pending" };
  if (isError) return { status: "error" };

  return {
    status: "ready",
    isOwner: Boolean(data?.isOwner),
    isParticipant: Boolean(data?.isParticipant),
  };
}
