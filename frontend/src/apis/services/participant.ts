import api from "@/apis/apiClient";
import { IParticipant } from "../interfaces";

// 특정 공구의 참여자 목록 조회
export const getParticipantList = async (
  gbId: string
): Promise<{ items: IParticipant[] }> => {
  const res = await api.get(`/api/participant/${gbId}`);

  // 백엔드에서 배열을 직접 반환하므로 res.data를 사용
  const participants = Array.isArray(res.data) ? res.data : [];
  return { items: participants };
};

export const joinParticipant = async ({
  gbId,
  refundAccount,
  refundBank,
  count,
}: {
  gbId: string;
  refundAccount: string;
  refundBank: string;
  count: number;
}) => {
  try {
    const { data } = await api.post(`/api/participant`, {
      gbId,
      refundBank,
      refundAccount,
      count,
    });
    return data;
  } catch (e) {
    throw e;
  }
};

export const modifyParticipant = async ({
  gbId,
  refundAccount,
  refundBank,
  count,
}: {
  gbId: string;
  refundAccount: string;
  refundBank: string;
  count: number;
}) => {
  try {
    const { data } = await api.patch(`/api/participant/${gbId}`, {
      refundBank,
      refundAccount,
      count,
    });
    return data;
  } catch (e) {
    throw e;
  }
};

export const getParticipantInfo = async ({
  gbId,
  id,
}: {
  gbId: string;
  id: string;
}) => {
  try {
    const { data } = await api.get(`/api/participant/${gbId}/${id}`);
    return data;
  } catch (e) {
    throw e;
  }
};

export const cancelParticipant = async (gbId: number | string) => {
  try {
    const res = await api.delete(`/api/participant/${gbId}`);
    return res.data; // 백엔드에서 내려주는 응답 데이터
  } catch (error: any) {
    // 에러 응답이 있으면 그대로 던져줌
    throw error.response?.data || error;
  }
};

export const confirmPayment = async (gbId: string) => {
  const res = await api.patch(`/api/participant/payment/${gbId}`);
  return res.data;
};
