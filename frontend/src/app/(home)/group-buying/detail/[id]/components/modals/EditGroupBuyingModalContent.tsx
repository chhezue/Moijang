"use client";

import React, { useMemo } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
  Grid,
  alpha,
} from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BANK_NAMES, BankName } from "@/apis/interfaces";
import {
  updateGroupBuyingSchema,
  UpdateGroupBuyingInput,
  UpdateGroupBuyingOutput,
  makeUpdateGroupBuyingSchema,
} from "@/schemas/groupBuying";
import { useSnackbar } from "@/providers/SnackbarProvider";
import { updateGroupBuying } from "@/apis/services/groupBuying";
import { useCategoryContext } from "@/providers/CategoryProvider";
import { useRouter } from "next/navigation";
import { theme } from "@/styles/theme";

interface Props {
  item: any; // 기존 데이터 (id, fixedCount 포함)
  close: () => void;
  onlyPrice?: boolean;
}

const EditGroupBuyingModalContent = ({
  item,
  close,
  onlyPrice = false,
}: Props) => {
  const { showSnackbar } = useSnackbar();
  const { isLoading, categoryList, categoryIconMap } = useCategoryContext();
  const router = useRouter();
  console.log(item);

  const schema = useMemo(
    () =>
      makeUpdateGroupBuyingSchema(
        item.fixedCount,
        item.currentCount,
        item.leaderCount
      ),
    [item]
  );

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<UpdateGroupBuyingInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: item.title,
      productUrl: item.productUrl,
      description: item.description,
      totalPrice: item.totalPrice, // number
      shippingFee: item.shippingFee, // number
      account: item.account,
      bank: item.bank as BankName,
      endDate: item.endDate.split("T")[0], // yyyy-MM-dd
      category: item.category,
      leaderCount: item.leaderCount, // number
    },
  });

  //  계산에 필요한 필드 watch
  const price = Number(useWatch({ control, name: "totalPrice" }) || 0);
  const shipping = Number(useWatch({ control, name: "shippingFee" }) || 0);
  const qty = item.fixedCount || 0;

  const estimatedPrice = useMemo(() => {
    // 이제 price, shipping은 number 타입이 보장됩니다.
    const p = price;
    const s = shipping;
    if (!qty) return null;
    const raw = (p + s) / qty;
    return Number.isInteger(raw) ? raw : Math.ceil(raw);
  }, [price, shipping, qty]);

  const estimatedPriceText =
    estimatedPrice == null
      ? "—"
      : `${new Intl.NumberFormat("ko-KR").format(estimatedPrice)}원`;

  const onSubmit = async (data: UpdateGroupBuyingInput) => {
    try {
      const parsedData = updateGroupBuyingSchema.parse(data);
      const payload: UpdateGroupBuyingOutput = {
        ...parsedData,
      };
      await updateGroupBuying(item.id, payload);
      showSnackbar("공동구매가 수정되었습니다", "success");
      close();
      router.refresh();
    } catch (e: any) {
      console.log("수정 실패:", e.response?.data || e);
      showSnackbar("수정 실패", "error");
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
      {/* 상품 정보 */}
      <Box mb={3}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 20,
              bgcolor: theme.palette.primary.main,
              borderRadius: 1,
            }}
          />
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              fontSize: "1rem",
              color: "text.primary",
            }}
          >
            1. 상품 정보
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {/* 제목 */}
          <Grid size={{ xs: 12 }}>
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="공동구매 제목"
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
                  sx={{
                    "& .MuiInputLabel-root": { fontSize: "0.85rem" },
                    "& .MuiInputBase-input": { fontSize: "0.85rem" },
                    "& .MuiFormHelperText-root": { fontSize: "0.75rem" },
                  }}
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
                  sx={{
                    "& .MuiInputLabel-root": { fontSize: "0.85rem" },
                    "& .MuiSelect-select": { fontSize: "0.85rem" },
                    "& .MuiMenuItem-root": { fontSize: "0.85rem" },
                  }}
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
                      <MenuItem disabled>카테고리가 없습니다.</MenuItem>
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
          <Grid size={{ xs: 12 }}>
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={3}
                  label="상세 설명"
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

          {/* 총 가격 */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="totalPrice"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
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
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="shippingFee"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
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

          {/* 총 목표 수량 (읽기 전용) */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              value={item.fixedCount} // props로 전달받은 값 그대로 표시
              type="number"
              fullWidth
              label="총 목표 수량"
              disabled
              sx={{
                "& .MuiInputLabel-root": { fontSize: "0.85rem" },
                "& .MuiInputBase-input": { fontSize: "0.85rem" },
              }}
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
                <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                  (수정 불가, 자동 계산)
                </span>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
      {/* 참여 조건 */}
      <Box mb={3}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 20,
              bgcolor: theme.palette.primary.main,
              borderRadius: 1,
            }}
          />
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              fontSize: "1rem",
              color: "text.primary",
            }}
          >
            2. 참여 조건
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
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
                  sx={{
                    "& .MuiInputLabel-root": { fontSize: "0.85rem" },
                    "& .MuiInputBase-input": { fontSize: "0.85rem" },
                    "& .MuiFormHelperText-root": { fontSize: "0.75rem" },
                  }}
                />
              )}
            />
          </Grid>
          {/* 총대 구매 수량 */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="leaderCount"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  fullWidth
                  label="나의 구매 수량"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  onChange={(e) =>
                    field.onChange(e.target.value.replace(/[^\d]/g, ""))
                  }
                  sx={{
                    "& .MuiInputLabel-root": { fontSize: "0.85rem" },
                    "& .MuiInputBase-input": { fontSize: "0.85rem" },
                    "& .MuiFormHelperText-root": { fontSize: "0.75rem" },
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Box>
      {/* 입금 정보 */}
      <Box mb={3}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 20,
              bgcolor: theme.palette.primary.main,
              borderRadius: 1,
            }}
          />
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              fontSize: "1rem",
              color: "text.primary",
            }}
          >
            3. 입금 정보 및 최종 확인
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="bank"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl
                  fullWidth
                  error={!!fieldState.error}
                  sx={{
                    "& .MuiInputLabel-root": { fontSize: "0.85rem" },
                    "& .MuiSelect-select": { fontSize: "0.85rem" },
                    "& .MuiMenuItem-root": { fontSize: "0.85rem" },
                  }}
                >
                  <InputLabel id="bank-label">은행</InputLabel>
                  <Select {...field} labelId="bank-label">
                    {BANK_NAMES.map((bank) => (
                      <MenuItem key={bank} value={bank}>
                        {bank}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="account"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="계좌번호"
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
        </Grid>
      </Box>
      {/* 버튼 */}
      <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
        <Button
          variant="contained"
          type="submit"
          disabled={isSubmitting}
          onClick={() => console.log("버튼 클릭됨")}
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

export default EditGroupBuyingModalContent;
