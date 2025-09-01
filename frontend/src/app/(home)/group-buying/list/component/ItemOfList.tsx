"use client";

import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Divider,
  Skeleton,
} from "@mui/material";
import StatusTag from "@/components/StatusTag";
import CategoryTag from "@/components/CategoryTag";
import { useStatusContext } from "@/providers/StatusProvider";
import { useCategoryContext } from "@/providers/CategoryProvider";
import { formatCurrency, calcDday } from "@/utils/formatters";
import { GroupBuyingItem } from "@/apis/interfaces";

export interface ItemOfListProps {
  item: GroupBuyingItem;
}

export const ItemOfList = ({ item }: ItemOfListProps) => {
  const {
    statusMap,
    colorMap,
    isLoading: isStatusLoading,
  } = useStatusContext();
  const {
    categoryMap,
    categoryIconMap,
    isLoading: isCategoryLoading,
  } = useCategoryContext();

  const percentage =
    item.fixedCount > 0
      ? Math.min((item.currentCount / item.fixedCount) * 100, 100)
      : 0;

  if (isStatusLoading || isCategoryLoading) {
    return (
      <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
        <CardContent sx={{ py: 2.25, px: 2.25 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton variant="circular" width={48} height={48} />
            <Stack direction="column" sx={{ flexGrow: 1 }} spacing={0.5}>
              <Skeleton variant="text" width="60%" height={28} />
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="text" width="30%" height={20} />
            </Stack>
            <Stack direction="column" alignItems="flex-end" spacing={0.75}>
              <Skeleton variant="rounded" width={64} height={24} />
              <Skeleton variant="text" width={80} height={20} />
              <Skeleton variant="text" width={40} height={18} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const label = categoryMap[item.category];
  const Icon = categoryIconMap[item.category];

  return (
    <Card
      variant="outlined"
      // onClick={() => onClick(id)}
      sx={{
        cursor: "pointer",
        mb: 2,
        borderRadius: 2,
        transition:
          "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
        "&:hover": {
          borderColor: (theme) => theme.palette.divider,
          boxShadow: 2,
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent sx={{ py: 2.25, px: 2.25 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* 좌측: 원형 배경의 아이콘 */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: (theme) => theme.palette.action.hover,
              color: (theme) => theme.palette.text.secondary,
              flexShrink: 0,
            }}
          >
            {Icon ? <Icon /> : null}
          </Box>

          {/* 중앙: 타이틀/카테고리/주최자/보조정보 */}
          <Stack direction="column" sx={{ flexGrow: 1 }} spacing={0.5}>
            <Typography variant="h6" component="h3" fontWeight={700} noWrap>
              {item.title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <CategoryTag label={label} IconComponent={Icon} />
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <Typography variant="caption" sx={{ fontSize: "0.85rem" }}>
                👤
              </Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                color="primary.dark"
                sx={{ fontSize: "0.75rem" }}
              >
                {item.leaderId?.displayName}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.75rem" }}
              >
                • {item.leaderId.department}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.disabled">
              남은 수량 {item.fixedCount - item.currentCount}개 · 달성률{" "}
              {Math.round(percentage)}%
            </Typography>
          </Stack>

          {/* 우측: 상태/가격/D-day */}
          <Stack direction="column" alignItems="flex-end" spacing={0.75}>
            <StatusTag
              status={item.groupBuyingStatus}
              label={statusMap[item.groupBuyingStatus]}
              color={colorMap[item.groupBuyingStatus]}
            />
            <Typography
              variant="subtitle2"
              color="text.primary"
              fontWeight={700}
            >
              {formatCurrency(item.estimatedPrice)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {calcDday(item.endDate)}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
