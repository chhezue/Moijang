import React from "react";
import { getMyParticipant } from "@/apis/services/groupBuying.server";
import GbListPanel from "@/components/dashboard/GbListPanel";

export default async function ParticipatingLayout({ children }: { children: React.ReactNode }) {
  const { items } = await getMyParticipant({ page: 1 });
  const participatingItems = items.filter((item) => !item.isOwner);

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
