import api from "@/apis/apiClient";
import { IParticipant } from "@/types/groupBuying";

// 특정 공구의 참여자 목록 조회
export const getParticipantList = async (gbId: string): Promise<{ items: IParticipant[] }> => {
  const res = await api.get(`/api/participant/${gbId}`);

  // 백엔드에서 배열을 직접 반환하므로 res.data를 사용
  const participants = Array.isArray(res.data) ? res.data : [];
  return { items: participants };
};

export const getParticipantInfo = async ({ gbId, id }: { gbId: string; id: string }) => {
  const { data } = await api.get(`/api/participant/${gbId}/${id}`);
  return data;
};
