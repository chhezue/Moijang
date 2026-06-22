import { Suspense } from "react";
import { getGroupBuyingByIdServer } from "@/apis/services/groupBuying.server";
import { getParticipantListServer } from "@/apis/services/participant.server";
import DetailClientPage from "@/app/(root)/(home)/group-buying/detail/[id]/components/DetailClientPage";
import { notFound } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default async function GroupBuyingDetailPage({ params }: PageProps) {
  try {
    const item = await getGroupBuyingByIdServer(params.id);
    const participantsResult = await getParticipantListServer(params.id);
    return (
      <Suspense>
        <DetailClientPage item={item} participants={participantsResult?.items || []} />
      </Suspense>
    );
  } catch {
    notFound();
  }
}
