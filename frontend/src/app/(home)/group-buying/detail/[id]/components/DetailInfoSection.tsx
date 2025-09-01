"use client";

import {
  Box,
  Typography,
  Divider,
  Link as MuiLink,
  Stack,
  Skeleton,
} from "@mui/material";
import StatusTag from "@/components/StatusTag";
import { GroupBuyingItem } from "@/apis/interfaces";
import { useStatusContext } from "@/providers/StatusProvider";
import CategoryTag from "@/components/CategoryTag";
import { useCategoryContext } from "@/providers/CategoryProvider";
import { formatCurrency } from "@/utils/formatters";

interface DetailInfoSectionProps {
  item: GroupBuyingItem;
}

const InfoItem = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Stack sx={{ p: 2 }} spacing={0.5}>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ fontWeight: 500 }}
    >
      {label}
    </Typography>
    <Box>
      <Typography variant="body2" color="text.primary" fontWeight={500}>
        {children}
      </Typography>
    </Box>
  </Stack>
);

const DetailInfoSection: React.FC<DetailInfoSectionProps> = ({ item }) => {
  const {
    isLoading: isStatusLoading,
    statusMap,
    colorMap,
  } = useStatusContext();
  const {
    categoryMap,
    categoryIconMap,
    isLoading: isCategoryLoading,
  } = useCategoryContext();

  const isLoading = isStatusLoading || isCategoryLoading;

  const label = categoryMap[item.category];
  const Icon = categoryIconMap[item.category];

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        {/* 상태/주최자 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Skeleton variant="rounded" width={80} height={28} />
          <Skeleton variant="rounded" width={150} height={28} />
        </Box>

        {/* 제목과 링크 */}
        <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="30%" height={24} />

        <Divider sx={{ my: 4, opacity: 0.6 }} />

        {/* 핵심 정보 그리드 */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(1, 1fr)", sm: "repeat(3, 1fr)" },
            gap: { xs: 2.5, sm: 3, md: 4 },
            mb: 4,
          }}
        >
          {[...Array(6)].map((_, i) => (
            <Box key={i} sx={{ p: 2 }}>
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="text" width="70%" height={28} />
            </Box>
          ))}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* 상세 설명 */}
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="90%" height={20} />
        <Skeleton variant="text" width="95%" height={20} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* 상태 태그와 주최자 정보 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <StatusTag
          status={item.groupBuyingStatus}
          label={statusMap[item.groupBuyingStatus]}
          color={colorMap[item.groupBuyingStatus]}
        />

        {/* 주최자 정보 - 한 줄 디자인 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: "rgba(139, 92, 246, 0.08)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            borderRadius: "20px",
            px: 2,
            py: 0.8,
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(139, 92, 246, 0.12)",
              borderColor: "rgba(139, 92, 246, 0.3)",
            },
          }}
        >
          <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
            👤
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            color="primary.dark"
            sx={{ fontSize: "0.85rem" }}
          >
            {item.leaderId.displayName}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: "0.75rem" }}
          >
            • {item.leaderId.department}
          </Typography>
        </Box>
      </Box>

      {/* 제목과 링크 */}
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 1 }}>
          {item.title}
        </Typography>
        <MuiLink
          href={item.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          color="primary"
          fontWeight={500}
        >
          원본 상품 페이지 보기 ↗
        </MuiLink>
      </Box>

      <Divider sx={{ my: 4, opacity: 0.6 }} />

      {/* 핵심 정보 그리드 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(1, 1fr)", sm: "repeat(3, 1fr)" },
          gap: { xs: 2.5, sm: 3, md: 4 },
          mb: 4,
        }}
      >
        <InfoItem label="카테고리">
          <CategoryTag label={label} IconComponent={Icon} />
        </InfoItem>
        <InfoItem label="목표 수량">{item.fixedCount}개</InfoItem>
        <InfoItem label="모집 기간">
          {new Date(item.startDate).toLocaleDateString()} ~ <br />
          {new Date(item.endDate).toLocaleDateString()}
        </InfoItem>
        <InfoItem label="상품 총 가격">
          {formatCurrency(item.totalPrice)}
        </InfoItem>
        <InfoItem label="배송비">{formatCurrency(item.shippingFee)}</InfoItem>
        <InfoItem label="1개당 가격(배송비 포함)">
          {formatCurrency(item.estimatedPrice)}
        </InfoItem>
      </Box>

      {/* 상세 설명 */}
      <Divider sx={{ mb: 3 }} />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ whiteSpace: "pre-line", lineHeight: 1.8 }}
      >
        {item.description}
      </Typography>

      {/* 주최자 정보는 위로 이동했으므로 이 자리에서는 삭제되었습니다. */}
    </Box>
  );
};

export default DetailInfoSection;
