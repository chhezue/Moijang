"use client";

import { Box, TextField, Button, Typography, InputAdornment } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { emailLocalSchema, getError } from "@/schemas/auth";

interface Props {
  domain: string;
  emailLocal: string;
  onEmailLocalChange: (v: string) => void;
  codeSent: boolean;
  onSendCode: () => void;
  code: string;
  onCodeChange: (v: string) => void;
  verified: boolean;
  onVerify: () => void;
}

export default function Step2Email({
  domain,
  emailLocal,
  onEmailLocalChange,
  codeSent,
  onSendCode,
  code,
  onCodeChange,
  verified,
  onVerify,
}: Props) {
  const localError = emailLocal.length > 0 ? getError(emailLocalSchema, emailLocal) : null;
  const isEmailValid = !localError && emailLocal.length > 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          label="학교 이메일"
          value={emailLocal}
          onChange={(e) => onEmailLocalChange(e.target.value)}
          fullWidth
          autoComplete="email"
          disabled={verified}
          error={!!localError}
          helperText={localError ?? " "}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                  @{domain}
                </Typography>
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          onClick={onSendCode}
          disabled={!isEmailValid || verified}
          sx={{ whiteSpace: "nowrap", height: 56, px: 2.5, alignSelf: "flex-start" }}
        >
          {codeSent ? "재발송" : "인증코드 발송"}
        </Button>
      </Box>

      {codeSent && !verified && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            label="인증코드"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            fullWidth
            inputProps={{ maxLength: 6 }}
            helperText=" "
          />
          <Button
            variant="outlined"
            onClick={onVerify}
            disabled={code.length < 6}
            sx={{ whiteSpace: "nowrap", height: 56, px: 2.5, alignSelf: "flex-start" }}
          >
            확인
          </Button>
        </Box>
      )}

      {verified && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "success.main" }}>
          <CheckCircleOutlineIcon fontSize="small" />
          <Typography variant="body2">이메일 인증이 완료되었습니다.</Typography>
        </Box>
      )}
    </Box>
  );
}
