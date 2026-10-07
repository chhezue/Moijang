import { redirect } from "next/navigation";
import { headers } from "next/headers";
import ProtectedClient from "@/app/(root)/(protected)/protectedClient";
import { getMyInfoServer } from "@/apis/services/auth.server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getMyInfoServer();
  if (!user) {
    const pathname = headers().get("x-pathname") ?? "/";
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }
  return <ProtectedClient>{children}</ProtectedClient>;
}
