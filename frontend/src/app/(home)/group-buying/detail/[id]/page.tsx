import { getGroupBuyingByIdServer } from "@/apis/services/groupBuying.server";
import { getParticipantListServer } from "@/apis/services/participant.server";
import DetailClientPage from "@/app/(home)/group-buying/detail/[id]/components/DetailClientPage";

interface PageProps {
  params: { id: string };
}

export default async function GroupBuyingDetailPage({ params }: PageProps) {
  const item = await getGroupBuyingByIdServer(params.id);
  const participantsResult = await getParticipantListServer(params.id);

  const participants = participantsResult?.items || [];

  return <DetailClientPage item={item} participants={participants} />;
}
