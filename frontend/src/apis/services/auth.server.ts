import { cache } from "react";
import axios from "axios";
import apiServer from "@/apis/apiServer";
import { withServerCookies } from "@/apis/utils/withServerCookies";
import type { UserDto } from "@/types/auth";

// 401(미인증)은 null로, 그 외(네트워크 오류/5xx 등)는 호출부로 던져서 error.tsx가 처리하게 함
export const getMyInfoServer = cache(async (): Promise<UserDto | null> => {
  try {
    const res = await apiServer.get("/api/auth/me", {
      headers: withServerCookies(),
    });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return null;
    throw error;
  }
});
