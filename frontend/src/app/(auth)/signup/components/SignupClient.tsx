"use client";

import { useState } from "react";
import { Box, Button, Paper, Typography, CircularProgress } from "@mui/material";
import Link from "next/link";
import { GradientTitle } from "@/components/GradientTitle";
import Stepper from "@/components/Stepper";
import Step1University from "./Step1University";
import Step2Email from "./Step2Email";
import Step3Account from "./Step3Account";
import StepComplete from "./StepComplete";
import { checkLoginId } from "@/apis/services/auth";
// import { sendCode, confirmCode, signup } from "@/apis/services/auth";
import { useSnackbar } from "@/providers/SnackbarProvider";
import { usernameSchema, nameSchema, passwordSchema } from "@/schemas/auth";
import { University, SignupResponse } from "@/types/auth";

const steps = [
  { label: "대학교" },
  { label: "이메일 인증" },
  { label: "계정 정보" },
  { label: "완료" },
];

export default function SignupClient() {
  const { showSnackbar } = useSnackbar();
  // 화면 분기 상태
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [signupResult, setSignupResult] = useState<SignupResponse | null>(null);

  // Step 1
  const [university, setUniversity] = useState<University | null>(null);

  // Step 2
  const [emailLocal, setEmailLocal] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [signupToken, setSignupToken] = useState("");

  // Step 3
  const [loginId, setLoginId] = useState("");
  const [loginIdAvailable, setLoginIdAvailable] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // 대학 입력에 따른 변화
  const handleUniversityChange = (u: University | null) => {
    setUniversity(u);
    setEmailLocal("");
    setCodeSent(false);
    setCode("");
    setVerificationId("");
    setEmailConfirmed(false);
    setSignupToken("");
  };

  // 이메일 인증코드 전송 api
  const handleSendCode = async () => {
    setLoading(true);
    try {
      // const res = await sendCode({
      //   universityId: university!.id,
      //   universityEmail: `${emailLocal}@${university!.domain}`,
      // });
      // setVerificationToken(res.verificationToken);
      setVerificationId("stub-token"); // stub
      setCodeSent(true);
      showSnackbar("인증코드가 발송되었습니다.", "success", 3000);
    } catch {
      showSnackbar("인증코드 발송에 실패했습니다. 다시 시도해주세요.", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  // 인증코드 확인 api
  const handleConfirmCode = async () => {
    setLoading(true);
    try {
      // TODO: 백엔드 연결 후 주석 해제
      // const res = await confirmCode({ verificationId, code });
      // setSignupToken(res.signupToken);
      // setEmailConfirmed(true);
      setSignupToken("stub-signup-token"); // stub
      setEmailConfirmed(true);
      showSnackbar("이메일 인증이 완료되었습니다.", "success", 3000);
    } catch {
      showSnackbar("인증에 실패했습니다. 다시 시도해주세요.", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 api
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // TODO: 백엔드 연결 후 주석 해제
      // const result = await signup({ loginId, password, name, signupToken });
      // setSignupResult(result);
      setSignupResult({ // stub
        loginId,
        name,
        universityEmail: `${emailLocal}@${university!.domain}`,
        universityId: university!.id,
        universityName: university!.name,
      });
      setActiveStep(steps.length - 1);
    } catch {
      showSnackbar("회원가입에 실패했습니다. 다시 시도해주세요.", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginIdChange = (v: string) => {
    setLoginId(v);
    setLoginIdAvailable(null);
  };

  const handleCheckLoginId = async () => {
    try {
      // const available = await checkLoginId(loginId);
      const available = false
      setLoginIdAvailable(available);
    } catch {
      showSnackbar("중복 확인에 실패했습니다. 다시 시도해주세요.", "error", 3000);
    }
  };

  const isNextDisabled = () => {
    if (loading) return true;
    if (activeStep === 0) return !university;
    if (activeStep === 1) return !emailConfirmed;
    if (activeStep === 2)
      return (
        !usernameSchema.safeParse(loginId).success ||
        loginIdAvailable !== true ||
        !nameSchema.safeParse(name).success ||
        !passwordSchema.safeParse(password).success ||
        password !== passwordConfirm
      );
    return false;
  };

  const handleNext = () => {
    if (activeStep < steps.length - 2) {
      setActiveStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => setActiveStep((s) => Math.max(0, s - 1));

  return (
    <Paper elevation={2} sx={{ p: 4, width: 480, borderRadius: 3 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <GradientTitle size="2rem" center>
          MOIJANG
        </GradientTitle>

        <Stepper steps={steps} activeStep={activeStep} />

        <Box sx={{ minHeight: 160 }}>
          {activeStep === 0 && (
            <Step1University
              university={university}
              onUniversityChange={handleUniversityChange}
            />
          )}
          {activeStep === 1 && (
            <Step2Email
              domain={university!.domain}
              emailLocal={emailLocal}
              onEmailLocalChange={setEmailLocal}
              codeSent={codeSent}
              onSendCode={handleSendCode}
              code={code}
              onCodeChange={setCode}
              verified={emailConfirmed}
              onVerify={handleConfirmCode}
            />
          )}
          {activeStep === 2 && (
            <Step3Account
              loginId={loginId}
              onLoginIdChange={handleLoginIdChange}
              loginIdAvailable={loginIdAvailable}
              onCheckLoginId={handleCheckLoginId}
              name={name}
              onNameChange={setName}
              password={password}
              onPasswordChange={setPassword}
              passwordConfirm={passwordConfirm}
              onPasswordConfirmChange={setPasswordConfirm}
            />
          )}
          {activeStep === 3 && signupResult && (
            <StepComplete result={signupResult} />
          )}
        </Box>

        {activeStep < steps.length - 1 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Button disabled={activeStep === 0 || loading} onClick={handleBack}>
              이전
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isNextDisabled()}
            >
              {loading
                ? <CircularProgress size={20} color="inherit" />
                : activeStep === steps.length - 2 ? "가입 완료" : "다음"
              }
            </Button>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" textAlign="center">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" style={{ color: "#8B5CF6", fontWeight: 600 }}>
            로그인
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
}
