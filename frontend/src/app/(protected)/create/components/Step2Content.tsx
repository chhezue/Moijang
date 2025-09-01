// Step2Content.tsx
"use client";

import { Box, TextField, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { CreateGroupBuyingInput } from "@/schemas/groupBuying";

export default function Step2Content() {
  const { control } = useFormContext<CreateGroupBuyingInput>();

  return (
    <Box>
      <Grid container spacing={2}>
        {/* 모집 마감일 */}
        <Grid size={6}>
          <Controller
            name="endDate"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="date"
                fullWidth
                label="모집 마감일"
                InputLabelProps={{ shrink: true }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                inputProps={{
                  min: new Date().toISOString().split("T")[0], // 오늘 날짜 이전 선택 불가
                }}
              />
            )}
          />
        </Grid>

        {/* 내가 구매할 수량 */}
        <Grid size={12}>
          <Typography variant="h5" sx={{ mt: 4, mb: 0 }}>
            내가 구매할 수량을 입력하세요
          </Typography>
        </Grid>

        <Grid size={6}>
          <Controller
            name="leaderCount"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label="나의 구매 수량"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) =>
                  field.onChange(e.target.value.replace(/[^\d]/g, ""))
                }
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
