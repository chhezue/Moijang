"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import apiServer from "@/apis/apiServer";
import { applySetCookies } from "@/apis/utils/applySetCookies";
import type { LoginRequest } from "@/types/auth";

export async function loginAction(
  data: LoginRequest,
  redirectTo: string,
): Promise<{ error: true } | never> {
  const res = await apiServer.post("/api/auth/login", data, {
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    return { error: true };
  }

  applySetCookies(res.headers["set-cookie"]);
  revalidatePath("/", "layout");
  redirect(redirectTo);
}
