"use client";

import React from "react";
import { Box } from "@mui/material";
import TabMenu from "@/components/TabMenu";

export default function MyGroupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "1200px",
        mx: "auto",
        pt: "30px",
      }}
    >
      <Box
        component="nav"
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <TabMenu
          tabs={[
            { label: "참여 중인 공동구매", value: "participating" },
            { label: "내가 만든 공동구매", value: "created" },
          ]}
          basePath="/my"
        />
      </Box>
      {children}
    </Box>
  );
}
