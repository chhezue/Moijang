"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import apiServer from "@/apis/apiServer";
import { applySetCookies } from "@/apis/utils/applySetCookies";
import { withServerCookies } from "@/apis/utils/withServerCookies";

export async function logoutAction(currentPath: string): Promise<void> {
  const res = await apiServer.post(
    "/api/auth/logout",
    {},
    { headers: withServerCookies(), validateStatus: () => true },
  );

  applySetCookies(res.headers["set-cookie"]);
  revalidatePath("/", "layout");

  // protected 라우트는 전부 (protected)/dashboard 하위에 있음 - 그 자리에 머무르면
  // (protected)/layout.tsx의 인증 체크가 다시 실패해서 /login으로 튕기므로 홈으로 보냄
  if (currentPath.startsWith("/dashboard")) {
    redirect("/");
  }
}
