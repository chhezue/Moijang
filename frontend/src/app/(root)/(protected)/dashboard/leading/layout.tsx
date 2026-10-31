"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyCreateGroupBuying } from "@/apis/services/groupBuying";
import GbListPanel from "@/components/dashboard/GbListPanel";

export default function LeadingLayout({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    queryKey: ["my-create-group-buying", { page: 1 }],
    queryFn: () => getMyCreateGroupBuying({ page: 1 }),
  });

  return (
    <div style={{ display: "flex" }}>
      <GbListPanel
        items={data?.items ?? []}
        basePath="/dashboard/leading"
        emptyLabel="진행 중인 공구가 없어요"
      />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
