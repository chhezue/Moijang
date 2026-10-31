import apiServer from "@/apis/apiServer";
import { GroupBuyingItem } from "@/types/groupBuying";

// 공개 데이터만 가져옴 — isOwner/isParticipant는 개인화 데이터라 여기서 신경 안 씀
// (Client에서 useGroupBuyingViewer()로 따로 조회함, GH #39)
export const getGroupBuyingByIdServer = async (id: string): Promise<GroupBuyingItem> => {
  const res = await apiServer.get(`/api/group-buying/${id}`);
  return res.data;
};
