import { redirect } from "next/navigation";
import { headers } from "next/headers";
import ProtectedClient from "@/app/(protected)/protectedClient";
import Providers from "@/redux/Provider";
import { getMyInfoServer } from "@/apis/services/auth.server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const user = await getMyInfoServer();
    console.log("✅ 로그인 사용자:", user);

    return (
      <Providers>
        <ProtectedClient>{children}</ProtectedClient>
      </Providers>
    );
  } catch {
    const headersList = headers();
    const pathname = headersList.get("x-invoke-path") || "/";
    redirect(`/login?redirect=${pathname}`);
  }
}
