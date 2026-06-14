import { AuthStoreProvider } from "@/providers/AuthStoreProvider";
import Providers from "@/providers/Providers";
import { getMyInfoServer } from "@/apis/services/auth.server";

export default async function RootGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getMyInfoServer().catch(() => null);

  return (
    <AuthStoreProvider initialUser={user}>
      <Providers>{children}</Providers>
    </AuthStoreProvider>
  );
}
