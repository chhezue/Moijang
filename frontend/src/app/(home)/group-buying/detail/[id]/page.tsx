import { getGroupBuyingByIdServer } from "@/apis/services/groupBuying.server";
import { getParticipantListServer } from "@/apis/services/participant.server";
import DetailClientPage from "@/app/(home)/group-buying/detail/[id]/components/DetailClientPage";

interface PageProps {
  params: { id: string };
}

export default async function GroupBuyingDetailPage({ params }: PageProps) {
  const item = await getGroupBuyingByIdServer(params.id);
  const participantsResult = await getParticipantListServer(params.id);

  // console.log("📦 item:", item);
  // console.log("📦 participants result:", participantsResult);
  // console.log("📦 participants items:", participantsResult.items);

  // 참여자 데이터가 없는 경우 빈 배열로 기본값 설정
  const participants = participantsResult?.items || [];

  return <DetailClientPage item={item} participants={participants} />;
}
