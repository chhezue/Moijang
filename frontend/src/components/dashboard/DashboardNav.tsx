"use client";

import React from "react";
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import HomeIcon from "@mui/icons-material/Home";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { label: "만들기", icon: AddCircleOutlineIcon, href: "/create", external: true },
  { label: "진행중인거", icon: TrendingUpIcon, href: "/dashboard/leading" },
  { label: "참여중인거", icon: ShoppingBagIcon, href: "/dashboard/participating" },
  { label: "문의사항", icon: HelpOutlineIcon, href: "/dashboard/inquiry", disabled: true },
  {
    label: "PG계좌 정산현황",
    icon: AccountBalanceIcon,
    href: "/dashboard/settlement",
    disabled: true,
  },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box
      sx={{
        width: 240,
        minHeight: "calc(100vh - 68px)",
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        position: "sticky",
        top: 68,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ px: 2, pt: 2.5, pb: 1 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          fontWeight={700}
          sx={{ fontSize: "0.7rem", letterSpacing: "0.08em" }}
        >
          대시보드
        </Typography>
      </Box>

      <List dense sx={{ px: 1, flex: 1 }}>
        {NAV_ITEMS.map(({ label, icon: Icon, href, disabled, external }) => {
          const isActive = !external && pathname.startsWith(href);
          return (
            <ListItemButton
              key={href}
              onClick={() => !disabled && router.push(href)}
              disabled={disabled}
              selected={isActive}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: "rgba(139, 92, 246, 0.1)",
                  color: "primary.main",
                  "& .MuiListItemIcon-root": { color: "primary.main" },
                },
                "&.Mui-selected:hover": {
                  bgcolor: "rgba(139, 92, 246, 0.14)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 600 : 400,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />
      <List dense sx={{ px: 1, py: 1 }}>
        <ListItemButton onClick={() => router.push("/")} sx={{ borderRadius: 1.5 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <HomeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="홈으로" primaryTypographyProps={{ fontSize: "0.875rem" }} />
        </ListItemButton>
      </List>
    </Box>
  );
}
