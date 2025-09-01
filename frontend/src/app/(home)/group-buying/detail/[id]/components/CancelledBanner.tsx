"use client";

import { Box, Typography } from "@mui/material";
import { GroupBuyingItem, IUser } from "@/apis/interfaces";

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

    case "PAYMENT_FAILED":
      console.log("🚨 cancelReason: PAYMENT_FAILED", item.nonDepositors);
      reasonText = (
        <>
          일부 참여자가 입금을 완료하지 않아 <strong>공동구매가 취소</strong>
          되었어요.
          {item.nonDepositors && item.nonDepositors.length > 0 && (
            <Box mt={1}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    flexShrink: 0,
                  }}
                >
                  미입금자 명단:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.75,
                    alignItems: "center",
                  }}
                >
                  {item.nonDepositors.map((user: IUser, index: number) => (
                    <Box
                      key={user.id}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "20px",
                        backgroundColor: (theme) => theme.palette.grey[50],
                        fontSize: "0.75rem",
                        color: (theme) => theme.palette.text.secondary,
                        fontWeight: 500,
                        "&:hover": {
                          backgroundColor: (theme) => theme.palette.grey[100],
                        },
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      {user.displayName} ({user.department})
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </>
      );
      break;

    case "PRODUCT_UNAVAILABLE":
      reasonText = (
        <>
          상품이 <strong>품절되었거나 가격이 변동</strong>되어 공동구매가
          취소되었어요.
        </>
      );
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
