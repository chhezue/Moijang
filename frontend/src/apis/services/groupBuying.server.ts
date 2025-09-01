import apiServer from "@/apis/apiServer";
import { withServerCookies } from "@/apis/utils/withServerCookies";
import {
  GroupBuyingItem,
  PaginationMeta,
  PaginationParams,
} from "@/apis/interfaces";

export const getMyCreateGroupBuying = async (
  params?: PaginationParams
): Promise<{
  items: GroupBuyingItem[];
  meta: PaginationMeta;
}> => {
  const cookieHeader = withServerCookies(); // 여기서 쿠키 추출

  const res = await apiServer.get(`/api/group-buying/my-create`, {
    params,
    headers: cookieHeader,
  });

  return {
    items: res.data.data,
    meta: res.data.meta,
  };
};

export const getMyParticipant = async (
  params?: PaginationParams
): Promise<{ items: GroupBuyingItem[]; meta: PaginationMeta }> => {
  const res = await apiServer.get(`/api/group-buying/my-participant`, {
    params,
    headers: withServerCookies(), // SSR에서 쿠키 자동 포함
  });

  return {
    items: res.data.data,
    meta: res.data.meta,
  };
};

export const getGroupBuyingByIdServer = async (
  id: string
): Promise<GroupBuyingItem> => {
  const res = await apiServer.get(`/api/group-buying/${id}`, {
    headers: withServerCookies(),
  });
  return res.data;
};
