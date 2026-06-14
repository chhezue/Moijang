"use client";

import { Box, TextField, Typography, Button } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { usernameSchema, nameSchema, passwordSchema, getError } from "@/schemas/auth";

interface Props {
  loginId: string;
  onLoginIdChange: (v: string) => void;
  loginIdAvailable: boolean | null;
  onCheckLoginId: () => void;
  name: string;
  onNameChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;
  passwordConfirm: string;
  onPasswordConfirmChange: (v: string) => void;
}

export default function Step3Account({
  loginId,
  onLoginIdChange,
  loginIdAvailable,
  onCheckLoginId,
  name,
  onNameChange,
  password,
  onPasswordChange,
  passwordConfirm,
  onPasswordConfirmChange,
}: Props) {
  const loginIdError = loginId.length > 0 ? getError(usernameSchema, loginId) : null;
  const nameError = name.length > 0 ? getError(nameSchema, name) : null;
  const passwordError = password.length > 0 ? getError(passwordSchema, password) : null;
  const mismatch = passwordConfirm.length > 0 && password !== passwordConfirm;
  const match = passwordConfirm.length > 0 && !passwordError && password === passwordConfirm;

  const loginIdHelperText = loginIdError
    ? loginIdError
    : loginIdAvailable === true
      ? "사용 가능한 아이디입니다."
      : loginIdAvailable === false
        ? "이미 사용중인 아이디입니다."
        : "영문, 숫자, 언더스코어(_) 4~20자";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label="이름"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        fullWidth
        autoComplete="name"
        error={!!nameError}
        helperText={nameError ?? " "}
      />

      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          label="아이디"
          value={loginId}
          onChange={(e) => {
            onLoginIdChange(e.target.value);
          }}
          fullWidth
          autoComplete="username"
          error={!!loginIdError || loginIdAvailable === false}
          FormHelperTextProps={{
            sx: { color: loginIdAvailable === true ? "success.main" : undefined },
          }}
          helperText={loginIdHelperText}
        />
        <Button
          variant="outlined"
          onClick={onCheckLoginId}
          disabled={!!loginIdError || loginId.length === 0}
          sx={{ whiteSpace: "nowrap", height: 56, px: 2.5, alignSelf: "flex-start" }}
        >
          중복 확인
        </Button>
      </Box>

      <TextField
        label="비밀번호"
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        fullWidth
        autoComplete="new-password"
        error={!!passwordError}
        helperText={passwordError ?? "영문 + 숫자 포함 8자 이상"}
      />

      <TextField
        label="비밀번호 확인"
        type="password"
        value={passwordConfirm}
        onChange={(e) => onPasswordConfirmChange(e.target.value)}
        fullWidth
        autoComplete="new-password"
        error={mismatch}
        helperText={mismatch ? "비밀번호가 일치하지 않습니다." : " "}
      />

      {match && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "success.main" }}>
          <CheckCircleOutlineIcon fontSize="small" />
          <Typography variant="body2">비밀번호가 일치합니다.</Typography>
        </Box>
      )}
    </Box>
  );
}
