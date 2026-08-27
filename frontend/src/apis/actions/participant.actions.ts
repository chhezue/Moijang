"use server";

import { revalidatePath } from "next/cache";
import apiServer from "@/apis/apiServer";
import { withServerCookies } from "@/apis/utils/withServerCookies";
import type { RefundPaymentRequest } from "@/apis/services/payment";

export async function cancelParticipationAction(
  req: RefundPaymentRequest,
): Promise<{ error: true } | { error: false }> {
  const res = await apiServer.post("/api/payment/refund", req, {
    headers: withServerCookies(),
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    return { error: true };
  }

  // /dashboard/participating의 사이드바 목록(getMyParticipant)이 Router Cache에
  // 남아있으면 방금 취소한 공구가 그대로 보이므로, 이동 전에 서버 캐시를 무효화한다.
  revalidatePath("/dashboard/participating");
  return { error: false };
}
