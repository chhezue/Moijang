"use client";

import { Box, Skeleton } from "@mui/material";

export default function DashboardLoading() {
  return (
    <Box sx={{ p: 4 }}>
      <Skeleton variant="text" width={240} height={36} sx={{ mb: 3 }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
    </Box>
  );
}
