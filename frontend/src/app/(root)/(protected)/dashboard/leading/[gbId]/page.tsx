"use client";

import { useQuery } from "@tanstack/react-query";
import { getGroupBuyingById } from "@/apis/services/groupBuying";
import { getParticipantList } from "@/apis/services/participant";
import LeaderDashboard from "@/components/dashboard/leading/LeaderDashboard";
import { Box, CircularProgress } from "@mui/material";

export default function LeadingDetailPage({ params }: { params: { gbId: string } }) {
  const { data: item, isPending: isItemPending } = useQuery({
    queryKey: ["group-buying", params.gbId],
    queryFn: () => getGroupBuyingById(params.gbId),
  });
  const { data: participantsResult, isPending: isParticipantsPending } = useQuery({
    queryKey: ["participants", params.gbId],
    queryFn: () => getParticipantList(params.gbId),
  });

  if (isItemPending || isParticipantsPending || !item) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return <LeaderDashboard item={item} participants={participantsResult?.items ?? []} />;
}
