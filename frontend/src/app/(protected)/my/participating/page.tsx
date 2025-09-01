import { getMyParticipant } from "@/apis/services/groupBuying.server";
import { MyParticipantClient } from "@/app/(protected)/my/participating/MyParticipantClient";

export default async function MyParticipantPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = Number(searchParams.page || 1);

  const { items, meta } = await getMyParticipant({ page: currentPage });

  return <MyParticipantClient items={items} meta={meta} />;
}
