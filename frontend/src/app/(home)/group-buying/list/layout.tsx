"use client";
import React, { Suspense, useState } from "react";
import { Box } from "@mui/material";
import SearchAndFilterHeader from "@/app/(home)/group-buying/list/component/SearchAndFilterBar/SearchAndFilterHeader";
import TabMenu from "@/components/TabMenu";

const TABS = [
  { label: "우리학교", value: "my-university" },
  { label: "다른학교 둘러보기", value: "other-universities" },
];

export default function GroupBuyingViewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [activeTab, setActiveTab] = useState("my-university");

  return (
    <Box
      sx={{
        display: "flex",
        height: "calc(100% - 40px)",
        overflowX: "hidden",
        minWidth: "800px",
      }}
    >
      <Box
        component="main"
        sx={{
          width: "100%",
          height: "100%",
          minWidth: "800px",
          letterSpacing: "0.025em",
        }}
      >
        <Box
          sx={{
            width: "1200px",
            mx: "auto",
            pt: "40px",
            color: "#1B1C1D",
          }}
        >
          <Box
            component="nav"
            sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}`, mb: 2 }}
          >
            <TabMenu tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mb: "1rem",
            }}
          >
            <Suspense>
              <SearchAndFilterHeader />
            </Suspense>
          </Box>

          {children}
        </Box>
      </Box>
    </Box>
  );
}
