import { redirect } from "next/navigation";
import ProtectedClient from "@/app/(protected)/protectedClient";
import Providers from "@/redux/Provider";
import { getMyInfoServer } from "@/apis/services/auth.server";
import { mapUserDtoToIUser } from "@/apis/utils/mapUserDtoToIUser";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const dto = await getMyInfoServer();
    const user = mapUserDtoToIUser(dto);

    return (
      <Providers initialUser={user}>
        <ProtectedClient>{children}</ProtectedClient>
      </Providers>
    );
  } catch {
    redirect("/login");
  }
}
