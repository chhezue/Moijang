import React from "react";
import { Avatar, Box, Chip, Typography } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

interface LeaderInfoCardProps {
  name: string;
  count: number;
  variant?: "default" | "plain";
}

const LeaderInfoCard: React.FC<LeaderInfoCardProps> = ({ name, count, variant = "default" }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: variant === "plain" ? "divider" : "primary.main",
      borderRadius: "12px",
      p: 1.5,
      backgroundColor: variant === "plain" ? "background.paper" : "primary.50",
      display: "flex",
      alignItems: "center",
    }}
  >
    <Avatar sx={{ bgcolor: "#7C3AED", width: 36, height: 36, mr: 1.5, flexShrink: 0 }}>
      <AccountCircleIcon fontSize="small" />
    </Avatar>
    <Box flex={1}>
      <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.85rem" }}>
        {name}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        component="div"
        sx={{ fontSize: "0.75rem", opacity: 0.8 }}
      >
        {count ? `구매 수량: ${count}개` : "총대는 구매하지 않은 상품입니다."}
      </Typography>
    </Box>
    <Chip
      size="small"
      label="총대"
      color="primary"
      sx={{ height: "22px", fontSize: "0.7rem", fontWeight: 600 }}
    />
  </Box>
);

export default LeaderInfoCard;
