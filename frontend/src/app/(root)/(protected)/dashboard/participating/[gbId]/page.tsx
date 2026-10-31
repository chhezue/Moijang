"use client";

import { useQuery } from "@tanstack/react-query";
import { getGroupBuyingById } from "@/apis/services/groupBuying";
import ParticipantDashboard from "@/components/dashboard/participating/ParticipantDashboard";
import { Box, CircularProgress } from "@mui/material";

export default function ParticipatingDetailPage({ params }: { params: { gbId: string } }) {
  const { data: item, isPending } = useQuery({
    queryKey: ["group-buying", params.gbId],
    queryFn: () => getGroupBuyingById(params.gbId),
  });

  if (isPending || !item) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return <ParticipantDashboard item={item} />;
}
