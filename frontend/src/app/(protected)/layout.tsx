import { redirect } from "next/navigation";
import ProtectedClient from "@/app/(protected)/protectedClient";
import Providers from "@/redux/Provider";
import apiServer from "@/apis/apiServer";
import { withServerCookies } from "@/apis/utils/withServerCookies";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // SSR에서 쿠키 포함해서 요청
    const res = await apiServer.get("/api/auth/me", {
      headers: withServerCookies(),
    });

    const user = res.data; // 유저 정보 응답
    console.log("✅ 로그인 사용자:", user);

    return (
      <Providers>
        <ProtectedClient>{children}</ProtectedClient>
      </Providers>
    );
  } catch (err: any) {
    console.error("❌ 인증 실패:", err.response?.data || err.message);
    redirect("/login");
  }
}
