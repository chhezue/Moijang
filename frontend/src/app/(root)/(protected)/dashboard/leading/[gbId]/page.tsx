import { getGroupBuyingByIdServer } from "@/apis/services/groupBuying.server";
import { getParticipantListServer } from "@/apis/services/participant.server";
import LeaderDashboard from "@/components/dashboard/leading/LeaderDashboard";

export default async function LeadingDetailPage({ params }: { params: { gbId: string } }) {
  const [item, { items: participants }] = await Promise.all([
    getGroupBuyingByIdServer(params.gbId),
    getParticipantListServer(params.gbId),
  ]);

  return <LeaderDashboard item={item} participants={participants} />;
}
