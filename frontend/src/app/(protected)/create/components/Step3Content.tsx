"use client";

import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Typography,
  Checkbox,
  Select,
  MenuItem,
  FormControlLabel,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Controller, useFormContext } from "react-hook-form";
import { BANK_NAMES } from "@/apis/interfaces";
import { CreateGroupBuyingInput } from "@/schemas/groupBuying";

interface Step3Props {
  agree: boolean;
  setAgree: (value: boolean) => void;
}

export default function Step3Content({ agree, setAgree }: Step3Props) {
  const { control } = useFormContext<CreateGroupBuyingInput>();

  return (
    <Box>
      <Grid container spacing={2}>
        {/* 은행 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="bank"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel id="bank-label">은행</InputLabel>
                <Select
                  {...field}
                  labelId="bank-label"
                  MenuProps={{
                    PaperProps: { sx: { maxHeight: 320, overflowY: "auto" } },
                  }}
                >
                  {BANK_NAMES.map((bank) => (
                    <MenuItem key={bank} value={bank}>
                      {bank}
                    </MenuItem>
                  ))}
                </Select>
                {fieldState.error && (
                  <Typography variant="caption" color="error">
                    {fieldState.error.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />
        </Grid>

        {/* 계좌번호 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="account"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="계좌번호"
                variant="outlined"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
      </Grid>

      {/* 주의사항 */}
      <Box
        sx={{
          mt: 4,
          p: 2,
          backgroundColor: "#fffbe5",
          border: "1px solid #ffeb3b",
          borderRadius: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
          주의사항
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
          <li style={{ marginBottom: "4px" }}>
            공동구매 주최자는 참여자들의 입금 내역을 성실히 확인하고 관리할
            책임이 있습니다.
          </li>
          <li style={{ marginBottom: "4px" }}>
            문제 발생 시(품절, 배송지연 등) 즉시 참여자들에게 공지해야 합니다.
          </li>
          <li style={{ marginBottom: "4px" }}>
            개인정보(계좌, 연락처 등)는 공동구매 목적 외 사용이 불가합니다.
          </li>
        </Typography>
      </Box>

      {/* 동의 체크 */}
      <FormControlLabel
        control={
          <Checkbox
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
        }
        label="위 주의사항을 모두 확인하였으며, 이에 동의합니다."
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
