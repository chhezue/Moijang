// apis/utils/withServerCookies.ts
import { cookies } from "next/headers";

export function withServerCookies() {
  const jar = cookies();
  const a = jar.get("accessToken")?.value;
  const r = jar.get("refreshToken")?.value;

  if (!a && !r) return {};

  return {
    Cookie: [a && `accessToken=${a}`, r && `refreshToken=${r}`]
      .filter(Boolean)
      .join("; "),
  };
}
