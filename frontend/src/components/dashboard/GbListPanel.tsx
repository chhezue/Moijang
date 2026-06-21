"use client";

import React from "react";
import { Box, Chip, List, ListItemButton, Stack, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { GroupBuyingItem } from "@/types/groupBuying";
import { useStatusContext } from "@/providers/StatusProvider";
import { calcDday } from "@/utils/formatters";

interface GbListPanelProps {
  items: GroupBuyingItem[];
  basePath: string;
  emptyLabel?: string;
}

function GbListCard({
  item,
  isActive,
  onClick,
}: {
  item: GroupBuyingItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const { statusMap, colorMap } = useStatusContext();

  return (
    <ListItemButton
      onClick={onClick}
      selected={isActive}
      sx={{
        borderRadius: 1.5,
        mb: 0.5,
        px: 1.5,
        py: 1.25,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        "&.Mui-selected": { bgcolor: "rgba(139, 92, 246, 0.1)" },
        "&.Mui-selected:hover": { bgcolor: "rgba(139, 92, 246, 0.14)" },
      }}
    >
      <Typography
        variant="body2"
        fontWeight={isActive ? 700 : 500}
        noWrap
        sx={{ width: "100%", mb: 0.75 }}
      >
        {item.title}
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ width: "100%" }}
      >
        <Chip
          size="small"
          label={statusMap[item.groupBuyingStatus] ?? item.groupBuyingStatus}
          sx={{
            height: 20,
            fontSize: "0.68rem",
            fontWeight: 600,
            bgcolor: colorMap[item.groupBuyingStatus] ?? "#9CA3AF",
            color: "#fff",
            borderRadius: "6px",
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
          {calcDday(item.endDate)}
        </Typography>
      </Stack>
    </ListItemButton>
  );
}

export default function GbListPanel({
  items,
  basePath,
  emptyLabel = "항목이 없습니다",
}: GbListPanelProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box
      sx={{
        width: 260,
        minHeight: "calc(100vh - 68px)",
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "#FAFAFA",
        position: "sticky",
        top: 68,
        flexShrink: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          총 {items.length}개
        </Typography>
      </Box>

      {items.length === 0 ? (
        <Box sx={{ p: 3, textAlign: "center", mt: 4 }}>
          <Typography variant="body2" color="text.disabled">
            {emptyLabel}
          </Typography>
        </Box>
      ) : (
        <List dense sx={{ p: 1 }}>
          {items.map((item) => (
            <GbListCard
              key={item.id}
              item={item}
              isActive={pathname.includes(item.id)}
              onClick={() => router.push(`${basePath}/${item.id}`)}
            />
          ))}
        </List>
      )}
    </Box>
  );
}
