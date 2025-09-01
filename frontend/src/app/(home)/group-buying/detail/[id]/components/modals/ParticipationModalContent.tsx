"use client";
import React, { useEffect, useState } from "react";
import TextInput from "@/components/TextInput";
import styled from "styled-components";
import {
  Button,
  FormControl,
  MenuItem,
  Select,
  Box,
  Typography,
  alpha,
} from "@mui/material";
import {
  joinParticipant,
  modifyParticipant,
  getParticipantInfo,
} from "@/apis/services/participant";
import { useSnackbar } from "@/providers/SnackbarProvider";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { BANK_NAMES, BankName } from "@/apis/interfaces";
import { theme } from "@/styles/theme";

const Label = styled.label`
  font-size: 13px;
`;
const Container = styled.div`
  width: 400px;
`;
const Wrapper = styled.div`
  margin-bottom: 15px;
`;

interface Props {
  gbId: string;
  close: () => void;
  action?: "join" | "modify";
  remainingCount: number;
  isLeader?: boolean;
}
const ParticipationModalContent = ({
  gbId,
  close,
  action,
  isLeader,
  remainingCount,
}: Props) => {
  const [count, setCount] = useState<number>(1);
  const [originalCount, setOriginalCount] = useState<number>(0);
  const [refundBank, setRefundBank] = useState<BankName | "">("");
  const [refundAccount, setRefundAccount] = useState<string>("");
  const { showSnackbar } = useSnackbar();
  const user = useSelector((state: RootState) => state.common.user);
  const router = useRouter();

  // 제목과 설명 텍스트
  const title = action === "modify" ? "참여 정보 수정" : "공구 참여 신청";
  const description =
    action === "modify"
      ? "수량과 환불 계좌 정보를 수정해주세요."
      : "참여할 수량과 환불 계좌 정보를 입력해주세요.";
  const register = async () => {
    try {
      //API
      const payload = {
        gbId,
        count,
        refundBank,
        refundAccount,
      };
      const data = await joinParticipant(payload);
      console.log(data);
      showSnackbar("공구 참여가 완료되었습니다.", "success");
      close();
      router.refresh();
    } catch (e: any) {
      console.log(e);
      showSnackbar(e.response.data.message, "error");
    }
  };
  const modify = async () => {
    try {
      //API
      const payload = {
        gbId,
        count,
        refundBank,
        refundAccount,
        //cookieHeader,
      };

      const data = await modifyParticipant(payload);
      console.log(data);
      showSnackbar("참여 정보가 수정되었습니다.", "success");
      close();
      router.refresh();
    } catch (e: any) {
      console.log(e);
      showSnackbar(e.response.data.message, "error");
    }
  };

  const getParticipant = async () => {
    if (!user) {
      showSnackbar("유저 정보가 없습니다.", "error");
      return;
    }
    const data = await getParticipantInfo({ gbId, id: user.id });
    setCount(data.count);
    setOriginalCount(data.count);
    setRefundBank(data.refundBank);
    setRefundAccount(data.refundAccount);
  };

  useEffect(() => {
    if (action === "modify") getParticipant().then();
  }, []);
  return (
    <Container>
      {/* 제목과 설명 섹션 */}
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
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{
            fontSize: "0.9rem",
            color: "text.primary",
          }}
        >
          {action === "modify" ? "✏️" : "🎯"} {title}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: "0.8rem",
            color: "text.secondary",
            lineHeight: 1.4,
            mb: 1,
          }}
        >
          {description}
        </Typography>
      </Box>

      <Wrapper>
        <Label>수량</Label>
        <TextInput
          type="number"
          min={1}
          max={originalCount + remainingCount}
          value={count.toString()}
          onChange={(e) => {
            setCount(Number(e.target.value));
          }}
          onBlur={() => {
            const maxAllowed = originalCount + remainingCount;
            if (count < 1) setCount(1);
            if (count > maxAllowed) setCount(maxAllowed);
          }}
        ></TextInput>
      </Wrapper>

      {/*{!isLeader && (*/}
      <>
        <Wrapper>
          <Label>환불 은행</Label>
          <FormControl fullWidth size="small">
            <Select
              value={refundBank}
              onChange={(e) => setRefundBank(e.target.value as BankName)}
              displayEmpty
            >
              <MenuItem value="">
                <em>은행 선택</em>
              </MenuItem>
              {BANK_NAMES.map((bank) => (
                <MenuItem key={bank} value={bank}>
                  {bank}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Wrapper>
        <Wrapper>
          <Label>환불 계좌번호</Label>
          <TextInput
            value={refundAccount}
            onChange={(e) => {
              setRefundAccount(e.target.value);
            }}
            placeholder="예: 123-456-7890"
          ></TextInput>
        </Wrapper>
      </>
      {/*)}*/}
      {action === "join" ? (
        <Button
          variant="contained"
          fullWidth
          onClick={() => {
            register().then();
          }}
        >
          확인 및 참여
        </Button>
      ) : (
        <Button
          variant="contained"
          fullWidth
          onClick={() => {
            modify().then();
          }}
        >
          수정하기
        </Button>
      )}
    </Container>
  );
};

export default ParticipationModalContent;
