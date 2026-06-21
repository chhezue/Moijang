import React from "react";
import DashboardNav from "@/components/dashboard/DashboardNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 68px)" }}>
      <DashboardNav />
      <div style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>{children}</div>
    </div>
  );
}
