import React from "react";
import Header from "@/layouts/header/Header";
import Providers from "@/redux/Provider";
import { getMyInfoServer } from "@/apis/services/auth.server";
import { mapUserDtoToIUser } from "@/apis/utils/mapUserDtoToIUser";

export default async function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getMyInfoServer()
    .then(mapUserDtoToIUser)
    .catch(() => null);

  return (
    <Providers initialUser={user}>
      <Header />
      {children}
    </Providers>
  );
}
