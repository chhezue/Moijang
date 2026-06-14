// Step1Content.tsx
"use client";

import { useMemo, useState } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useCategoryContext } from "@/providers/CategoryProvider";
import { CreateGroupBuyingInput } from "@/schemas/groupBuying";
import { Controller, useFormContext, useWatch } from "react-hook-form";

export default function Step1Content() {
  const { isLoading, categoryList, categoryIconMap } = useCategoryContext();
  const { control } = useFormContext<CreateGroupBuyingInput>();

  // 💰 계산에 필요한 필드만 watch (리렌더 최소화)
  const price = useWatch({ control, name: "totalPrice" }) || "";
  const qty = useWatch({ control, name: "fixedCount" }) || "";
  const shipping = useWatch({ control, name: "shippingFee" }) || "";

  const unitPrice = useMemo(() => {
    const p = Number(price) || 0;
    const s = Number(shipping) || 0;
    const q = Number(qty) || 0;
    if (!q) return null;
    return (p + s) / q;
  }, [price, shipping, qty]);

  const unitPriceText =
    unitPrice == null ? "—" : `${new Intl.NumberFormat("ko-KR").format(Math.ceil(unitPrice))}원`;

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid size={12}>
          {/* 제목 */}
          <Controller
            name="title"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="공동구매 제목"
                placeholder="상품명도 함께 기재해주세요."
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        {/* URL */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="productUrl"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="원본 상품 URL"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        {/* 카테고리 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="category"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl
                fullWidth
                variant="outlined"
                disabled={isLoading}
                error={!!fieldState.error}
              >
                <InputLabel id="category-label">상품 카테고리</InputLabel>
                <Select
                  {...field}
                  labelId="category-label"
                  label="상품 카테고리"
                  renderValue={(val) => {
                    if (!val) return "카테고리를 선택하세요";
                    const found = categoryList.find((c) => c.key === val);
                    return found?.label ?? val;
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: { maxHeight: 300, overflowY: "auto" },
                    },
                  }}
                >
                  {isLoading ? (
                    <MenuItem disabled>
                      <ListItemIcon>
                        <CircularProgress size={18} />
                      </ListItemIcon>
                      <ListItemText primary="불러오는 중..." />
                    </MenuItem>
                  ) : categoryList.length === 0 ? (
                    <MenuItem disabled>카테고리가 없습니다</MenuItem>
                  ) : (
                    categoryList.map((c) => {
                      const Icon = categoryIconMap[c.key];
                      return (
                        <MenuItem key={c.key} value={c.key}>
                          {Icon && (
                            <ListItemIcon>
                              <Icon />
                            </ListItemIcon>
                          )}
                          <ListItemText primary={c.label} />
                        </MenuItem>
                      );
                    })
                  )}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        {/* 설명 */}
        <Grid size={12}>
          <Controller
            name="description"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={4}
                label="상세 설명"
                placeholder="상품에 대한 상세 설명, 주의사항 등을 자유롭게 기재해주세요."
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        {/* 총 상품 가격 */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="totalPrice"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                label="총 상품 가격 (원)"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, ""))}
              />
            )}
          />
        </Grid>

        {/* 목표 총 수량 */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="fixedCount"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                label="목표 총 수량"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, ""))}
              />
            )}
          />
        </Grid>

        {/* 배송비 */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="shippingFee"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                label="배송비 (원)"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, ""))}
              />
            )}
          />
        </Grid>

        {/* 안내 + 계산 */}
        <Grid size={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            한 개당 가격은 <b>(총 상품 가격 + 배송비) ÷ 목표 총 수량</b>으로 계산돼요.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            산정된 한 개당 가격:
            {unitPrice !== null && <b> &nbsp; {unitPriceText}</b>}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}
