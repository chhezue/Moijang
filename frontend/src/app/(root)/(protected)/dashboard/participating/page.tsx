"use client";

import { Box, Typography } from "@mui/material";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";

export default function ParticipatingPage() {
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
        <ShoppingBagIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" fontWeight={600}>
          공구를 선택하세요
        </Typography>
        <Typography variant="body2" color="text.disabled" mt={0.5}>
          왼쪽 목록에서 참여 중인 공구를 선택하면 진행상황을 확인할 수 있어요
        </Typography>
      </Box>
    </Box>
  );
}
