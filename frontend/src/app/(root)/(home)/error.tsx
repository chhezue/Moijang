"use client";

import { Box, Button, Typography } from "@mui/material";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 2,
        px: 2,
        textAlign: "center",
      }}
    >
      <Typography variant="h6" fontWeight={600}>
        문제가 발생했습니다
      </Typography>
      <Typography variant="body2" color="text.secondary">
        잠시 후 다시 시도해주세요.
      </Typography>
      {process.env.NODE_ENV === "development" && (
        <Typography variant="caption" color="error" sx={{ maxWidth: 400, wordBreak: "break-all" }}>
          {error.message}
        </Typography>
      )}
      <Button variant="outlined" size="small" onClick={reset}>
        다시 시도
      </Button>
    </Box>
  );
}
