"use client";
import React from "react";
import { Box } from "@mui/material";
import SearchAndFilterHeader from "@/app/(home)/group-buying/list/component/SearchAndFilterBar/SearchAndFilterHeader";

export default function GroupBuyingViewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mb: "1rem",
            }}
          >
            <SearchAndFilterHeader />
          </Box>

          {children}
        </Box>
      </Box>
    </Box>
  );
}
