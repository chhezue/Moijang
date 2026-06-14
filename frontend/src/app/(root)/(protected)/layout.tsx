import { redirect } from "next/navigation";
import { headers } from "next/headers";
import ProtectedClient from "@/app/(root)/(protected)/protectedClient";
import { getMyInfoServer } from "@/apis/services/auth.server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  try {
    await getMyInfoServer();
    return <ProtectedClient>{children}</ProtectedClient>;
  } catch {
    const pathname = headers().get("x-pathname") ?? "/";
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }
}
