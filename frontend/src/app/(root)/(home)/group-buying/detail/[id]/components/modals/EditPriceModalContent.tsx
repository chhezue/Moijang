"use client";

import React, { useMemo } from "react";
import { Box, Button, CircularProgress, TextField, Typography, Grid, alpha } from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSnackbar } from "@/providers/SnackbarProvider";
import { updateGroupBuying } from "@/apis/services/groupBuying";
import { z } from "zod";
import { theme } from "@/styles/theme";

interface Props {
  item: {
    id: string;
    fixedCount: number;
    totalPrice: number;
    shippingFee: number;
  };
  onSuccess?: () => void;
}

const updatePriceSchema = z.object({
  totalPrice: z.coerce.number().min(1, "총 가격을 입력해주세요."),
  shippingFee: z.coerce.number().min(0, "배송비는 0 이상이어야 합니다."),
});

type UpdatePriceInput = z.infer<typeof updatePriceSchema>;

const EditPriceModalContent = ({ item, onSuccess }: Props) => {
  const { showSnackbar } = useSnackbar();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(updatePriceSchema),
    defaultValues: {
      totalPrice: item.totalPrice,
      shippingFee: item.shippingFee,
    },
  });

  // 단가 계산
  const price = Number(useWatch({ control, name: "totalPrice" }) || 0);
  const shipping = Number(useWatch({ control, name: "shippingFee" }) || 0);
  const qty = item.fixedCount || 0;

  const estimatedPrice = useMemo(() => {
    if (!qty) return null;
    const raw = (price + shipping) / qty;
    return Number.isInteger(raw) ? raw : Math.ceil(raw);
  }, [price, shipping, qty]);

  const estimatedPriceText =
    estimatedPrice == null ? "—" : `${new Intl.NumberFormat("ko-KR").format(estimatedPrice)}원`;

  // API 호출
  const onSubmit = async (data: UpdatePriceInput) => {
    try {
      await updateGroupBuying(item.id, {
        totalPrice: data.totalPrice,
        shippingFee: data.shippingFee,
      });
      showSnackbar("가격이 수정되었습니다.", "success");
      onSuccess?.();
    } catch (e: any) {
      console.error("가격 수정 실패:", e.response?.data || e);
      showSnackbar("가격 수정 실패", "error");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit, (err) => {
        console.log("❌ 유효성 검증 실패", err);
      })}
      noValidate
    >
      {/* 가격 정보 */}
      <Box mb={3}>
        <Grid container spacing={2} mt={2}>
          {/* 총 가격 */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="totalPrice"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  fullWidth
                  label="총 상품 가격"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{
                    "& .MuiInputLabel-root": { fontSize: "0.85rem" },
                    "& .MuiInputBase-input": { fontSize: "0.85rem" },
                    "& .MuiFormHelperText-root": { fontSize: "0.75rem" },
                  }}
                />
              )}
            />
          </Grid>

          {/* 배송비 */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="shippingFee"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  fullWidth
                  label="배송비"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{
                    "& .MuiInputLabel-root": { fontSize: "0.85rem" },
                    "& .MuiInputBase-input": { fontSize: "0.85rem" },
                    "& .MuiFormHelperText-root": { fontSize: "0.75rem" },
                  }}
                />
              )}
            />
          </Grid>

          {/* 단가 안내 */}
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                p: 1.5,
                backgroundColor: alpha(theme.palette.info.light, 0.08),
                border: `1px solid ${alpha(theme.palette.info.light, 0.2)}`,
                borderRadius: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.8rem",
                  color: "info.dark",
                  fontWeight: 500,
                }}
              >
                💡 산정된 1개당 가격 = <strong>{estimatedPriceText}</strong>
                <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>(수정 불가, 자동 계산)</span>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* 버튼 */}
      <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
        <Button
          variant="contained"
          type="submit"
          disabled={isSubmitting}
          sx={{
            fontSize: "0.85rem",
            py: 1.2,
            px: 3,
            fontWeight: 600,
          }}
        >
          {isSubmitting ? <CircularProgress size={18} /> : "수정하기"}
        </Button>
      </Box>
    </Box>
  );
};

export default EditPriceModalContent;
