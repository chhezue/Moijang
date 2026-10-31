"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyParticipant } from "@/apis/services/groupBuying";
import GbListPanel from "@/components/dashboard/GbListPanel";

export default function ParticipatingLayout({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    queryKey: ["my-participant-group-buying", { page: 1 }],
    queryFn: () => getMyParticipant({ page: 1 }),
  });
  const participatingItems = (data?.items ?? []).filter((item) => !item.isOwner);

  return (
    <div style={{ display: "flex" }}>
      <GbListPanel
        items={participatingItems}
        basePath="/dashboard/participating"
        emptyLabel="참여 중인 공구가 없어요"
      />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
