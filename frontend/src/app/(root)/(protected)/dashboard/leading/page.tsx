"use client";

import { Box, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

export default function LeadingPage() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "calc(100vh - 68px)",
        p: 4,
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <TrendingUpIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" fontWeight={600}>
          공구를 선택하세요
        </Typography>
        <Typography variant="body2" color="text.disabled" mt={0.5}>
          왼쪽 목록에서 진행 중인 공구를 선택하면 관리할 수 있어요
        </Typography>
      </Box>
    </Box>
  );
}
