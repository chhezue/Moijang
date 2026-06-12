import React from "react";
import Header from "@/layouts/header/Header";
import Providers from "@/providers/Providers";
import { getMyInfoServer } from "@/apis/services/auth.server";
export default async function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getMyInfoServer().catch(() => null);

  return (
    <Providers initialUser={user}>
      <Header />
      {children}
    </Providers>
  );
}
