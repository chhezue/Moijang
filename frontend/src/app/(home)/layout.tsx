import React from "react";
import Header from "@/layouts/header/Header";
import Providers from "@/providers/Providers";
import { AuthStoreProvider } from "@/providers/AuthStoreProvider";
import { getMyInfoServer } from "@/apis/services/auth.server";

export default async function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getMyInfoServer().catch(() => null);

  return (
    <AuthStoreProvider initialUser={user}>
      <Providers>
        <Header />
        {children}
      </Providers>
    </AuthStoreProvider>
  );
}
