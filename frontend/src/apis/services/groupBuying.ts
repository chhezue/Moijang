import api from "@/apis/apiClient";
import {
  CreateGroupBuying,
  GroupBuyingItem,
  PaginationMeta,
  PaginationParams,
  SearchParams,
} from "../interfaces";

// 전체 목록 반환 (페이지네이션, 검색어 옵션)
export const getGroupBuying = async (
  params?: SearchParams
): Promise<{ items: GroupBuyingItem[]; meta: PaginationMeta }> => {
  const res = await api.get("/api/group-buying", { params });
  return {
    items: res.data.data,
    meta: res.data.meta,
  };
};

// id로 item 반환 (csr 용)
export const getGroupBuyingById = async (
  id: string
): Promise<GroupBuyingItem> => {
  const res = await api.get(`/api/group-buying/${id}`);
  return res.data;
};

// 생성하기
export const createGroupBuying = async (data: CreateGroupBuying) => {
  const res = await api.post("api/group-buying", data);
  return res.data;
};

// 수정하기
export const updateGroupBuying = async (
  id: string,
  data: Partial<GroupBuyingItem> // Partial 로 부분 업데이트 허용
) => {
  const res = await api.patch(`/api/group-buying/${id}`, data);
  return res.data;
};

// 취소하기(삭제)
export const cancelGroupBuying = async (
  gbId: string,
  cancelReason: string,
  nonDepositors?: string[]
) => {
  try {
    const { data } = await api.patch(`/api/group-buying/cancel/${gbId}`, {
      cancelReason,
      nonDepositors,
    });
    return data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// 공동구매 상태 변경
export const updateGroupBuyingStatus = async (gbId: string, status: string) => {
  try {
    const res = await api.patch(`/api/group-buying/status/${gbId}`, {
      status,
    });
    return res.data;
  } catch (error) {
    console.error("updateGroupBuyingStatus error:", error);
    throw error;
  }
};
