import { AuthStoreProvider } from "@/providers/AuthStoreProvider";
import Providers from "@/providers/Providers";

export default function RootGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthStoreProvider>{children}</AuthStoreProvider>
    </Providers>
  );
}
