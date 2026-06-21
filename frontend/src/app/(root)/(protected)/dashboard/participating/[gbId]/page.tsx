import { getGroupBuyingByIdServer } from "@/apis/services/groupBuying.server";
import ParticipantDashboard from "@/components/dashboard/participating/ParticipantDashboard";

export default async function ParticipatingDetailPage({ params }: { params: { gbId: string } }) {
  const item = await getGroupBuyingByIdServer(params.gbId);
  return <ParticipantDashboard item={item} />;
}
