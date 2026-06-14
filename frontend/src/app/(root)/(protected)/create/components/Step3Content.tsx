"use client";

import { Box, Typography, Checkbox, FormControlLabel } from "@mui/material";

interface Step3Props {
  agree: boolean;
  setAgree: (value: boolean) => void;
}

export default function Step3Content({ agree, setAgree }: Step3Props) {
  return (
    <Box>
      {/* 주의사항 */}
      <Box
        sx={{
          mt: 2,
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
            공동구매 주최자는 참여자들의 입금 내역을 성실히 확인하고 관리할 책임이 있습니다.
          </li>
          <li style={{ marginBottom: "4px" }}>
            문제 발생 시(품절, 배송지연 등) 즉시 참여자들에게 공지해야 합니다.
          </li>
          <li style={{ marginBottom: "4px" }}>
            개인정보(연락처 등)는 공동구매 목적 외 사용이 불가합니다.
          </li>
        </Typography>
      </Box>

      {/* 동의 체크 */}
      <FormControlLabel
        control={<Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} />}
        label="위 주의사항을 모두 확인하였으며, 이에 동의합니다."
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
