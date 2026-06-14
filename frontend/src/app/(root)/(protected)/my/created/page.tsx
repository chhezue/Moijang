import { getMyCreateGroupBuying } from "@/apis/services/groupBuying.server";
import { MyCreateClient } from "./MyCreateClient";

export default async function MyCreateGroupBuyingPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = Number(searchParams.page || 1);

  const { items, meta } = await getMyCreateGroupBuying({
    page: currentPage,
  });

  return <MyCreateClient items={items} meta={meta} />;
}
