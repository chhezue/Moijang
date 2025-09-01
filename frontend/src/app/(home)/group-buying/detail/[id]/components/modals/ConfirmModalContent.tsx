"use client";

import { Box, Button, Typography } from "@mui/material";
import { ReactNode } from "react";

interface ConfirmModalContentProps {
  message: ReactNode;
  onConfirm: () => void;
  confirmLabel?: string;
}

const ConfirmModalContent: React.FC<ConfirmModalContentProps> = ({
  message,
  onConfirm,
  confirmLabel = "확인",
}) => {
  return (
    <Box>
      {/* 메시지 섹션 */}
      <Box sx={{ pl: 2, pr: 2, pt: 1, pb: 1 }}>
        <Typography
          sx={{
            fontSize: "0.9rem",
            lineHeight: 1.5,
            color: "text.primary",
            mb: 2,
          }}
        >
          {message}
        </Typography>
      </Box>

      {/* 버튼 영역 */}
      <Box display="flex" justifyContent="end" gap={1}>
        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </Box>
    </Box>
  );
};

export default ConfirmModalContent;
