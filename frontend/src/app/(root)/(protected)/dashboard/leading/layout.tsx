import React from "react";
import { getMyCreateGroupBuying } from "@/apis/services/groupBuying.server";
import GbListPanel from "@/components/dashboard/GbListPanel";

export default async function LeadingLayout({ children }: { children: React.ReactNode }) {
  const { items } = await getMyCreateGroupBuying({ page: 1 });

  return (
    <div style={{ display: "flex" }}>
      <GbListPanel
        items={items}
        basePath="/dashboard/leading"
        emptyLabel="진행 중인 공구가 없어요"
      />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
