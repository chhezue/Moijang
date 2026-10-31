import apiServer from "@/apis/apiServer";
import { withServerCookies } from "@/apis/utils/withServerCookies";
import { GroupBuyingItem } from "@/types/groupBuying";

// 공개 데이터 + 개인화 데이터(isOwner/isParticipant)가 아직 한 응답에 섞여있음.
// 공개/개인화 분리는 GH #39에서 처리 — 그 전까지는 이 쿠키 forward가 그대로 남음.
export const getGroupBuyingByIdServer = async (id: string): Promise<GroupBuyingItem> => {
  const res = await apiServer.get(`/api/group-buying/${id}`, {
    headers: withServerCookies(),
  });
  return res.data;
};
