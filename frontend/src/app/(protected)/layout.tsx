import { redirect } from "next/navigation";
import ProtectedClient from "@/app/(protected)/protectedClient";
import Providers from "@/providers/Providers";
import { AuthStoreProvider } from "@/providers/AuthStoreProvider";
import { getMyInfoServer } from "@/apis/services/auth.server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  try {
    const user = await getMyInfoServer();

    return (
      <AuthStoreProvider initialUser={user}>
        <Providers>
          <ProtectedClient>{children}</ProtectedClient>
        </Providers>
      </AuthStoreProvider>
    );
  } catch {
    redirect("/login");
  }
}
