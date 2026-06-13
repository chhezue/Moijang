"use client";

import { Box, Typography } from "@mui/material";
import { GroupBuyingItem } from "@/types/groupBuying";

interface CancelledBannerProps {
  item: GroupBuyingItem;
}

const CancelledBanner: React.FC<CancelledBannerProps> = ({ item }) => {
  const isCancelled = item.groupBuyingStatus === "CANCELLED";
  if (!isCancelled) return null;

  // 사유별 안내 문구
  let reasonText: React.ReactNode = null;

  switch (item.cancelReason) {
    case "RECRUITMENT_FAILED":
      reasonText = (
        <>
          모집 인원을 채우지 못해 <strong>공동구매가 무산</strong>되었어요.
        </>
      );
      break;

    case "PRODUCT_UNAVAILABLE":
      reasonText = (
        <>
          상품이 <strong>품절되었거나 가격이 변동</strong>되어 공동구매가 취소되었어요.
        </>
      );
      break;

    case "SYSTEM_CANCELLED":
      reasonText = <>시스템에 의해 공동구매가 자동 취소되었어요.</>;
      break;

    default:
      reasonText = <>총대님의 요청으로 공동구매가 취소되었어요.</>;
      break;
  }

  return (
    <Box
      sx={{
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.error.light}20 0%, ${theme.palette.error.light}10 100%)`,
        border: (theme) => `1px solid ${theme.palette.error.light}40`,
        borderRadius: "20px",
        p: 3,
        mb: 3,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: (theme) =>
            `linear-gradient(90deg, ${theme.palette.error.light} 0%, ${theme.palette.error.light} 50%, ${theme.palette.error.dark} 100%)`,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: "50%",
          right: "-20px",
          transform: "translateY(-50%)",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: (theme) =>
            `radial-gradient(circle, ${theme.palette.error.light}20 0%, transparent 70%)`,
          opacity: 0.6,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2.5,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "16px",
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.error.light} 0%, ${theme.palette.error.main} 30%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            flexShrink: 0,
            boxShadow: (theme) => `0 4px 16px ${theme.palette.error.light}40`,
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              top: "-2px",
              left: "-2px",
              right: "-2px",
              bottom: "-2px",
              borderRadius: "18px",
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.error.light}, ${theme.palette.error.light})`,
              zIndex: -1,
              opacity: 0.3,
            },
          }}
        >
          🚫
        </Box>
        <Box sx={{ textAlign: "left", flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              color: (theme) => theme.palette.error.dark,
              fontWeight: 700,
              mb: 0.5,
              fontSize: "1.125rem",
              letterSpacing: "-0.01em",
            }}
          >
            취소된 공구예요.
          </Typography>
          <Typography
            component="div"
            variant="body1"
            sx={{
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: (theme) => theme.palette.text.secondary,
              fontWeight: 500,
            }}
          >
            {reasonText}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CancelledBanner;
