"use client";

import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Stack,
  alpha,
  Typography,
} from "@mui/material";
import { theme } from "@/styles/theme";

interface ShippedModalContentProps {
  initialPlace?: string;
  initialTime?: string;
  onSubmit: (data: { pickupPlace: string; pickupTime: string }) => void;
}

export const ShippedModalContent: React.FC<ShippedModalContentProps> = ({
  initialPlace = "",
  initialTime = "",
  onSubmit,
}) => {
  const [pickupPlace, setPickupPlace] = useState(initialPlace);
  const [pickupTime, setPickupTime] = useState(initialTime);

  return (
    <Box sx={{ width: "100%", minWidth: "400px" }}>
      {/* 간단한 설명 추가 */}
      <Box
        sx={{
          mb: 2,
          p: 1.5,
          pl: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          borderRadius: 1,
        }}
      >
        <Box
          sx={{ fontSize: "0.9rem", color: "text.secondary", lineHeight: 1.4 }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              fontSize: "0.9rem",
              color: "text.primary",
            }}
          >
            📦 상품 배송 완료
          </Typography>
          참여자들이 수령할 시간과 장소를 입력해주세요.
        </Box>
      </Box>

      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label="픽업 시간"
          placeholder="예: 2025년 1월 1일 오전 10시"
          fullWidth
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value)}
          sx={{
            "& .MuiInputLabel-root": { fontSize: "0.9rem" },
            "& .MuiInputBase-input": { fontSize: "0.9rem" },
            "& .MuiInputBase-input::placeholder": { fontSize: "0.8rem" },
          }}
        />
        <TextField
          label="픽업 장소"
          placeholder="예: 3층 회의실"
          fullWidth
          value={pickupPlace}
          onChange={(e) => setPickupPlace(e.target.value)}
          sx={{
            "& .MuiInputLabel-root": { fontSize: "0.9rem" },
            "& .MuiInputBase-input": { fontSize: "0.9rem" },
            "& .MuiInputBase-input::placeholder": { fontSize: "0.8rem" },
          }}
        />
      </Stack>

      <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
        <Button
          onClick={() => onSubmit({ pickupPlace, pickupTime })}
          variant="contained"
          sx={{ fontSize: "0.8rem" }}
        >
          완료
        </Button>
      </Box>
    </Box>
  );
};
