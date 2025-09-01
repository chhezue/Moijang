// CreatePage.tsx
"use client";

import { useState } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Stepper from "@/components/Stepper";
import Step1Content from "./components/Step1Content";
import Step2Content from "./components/Step2Content";
import Step3Content from "./components/Step3Content";
import { createGroupBuying } from "@/apis/services/groupBuying";
import {
  createGroupBuyingSchema,
  STEP_FIELDS,
  CreateGroupBuyingInput,
  CreateGroupBuyingOutput,
} from "@/schemas/groupBuying";
import { useRouter } from "next/navigation";
import { useSnackbar } from "@/providers/SnackbarProvider";

const steps = [
  { label: "상품 정보", description: "상품 정보를 입력하세요" },
  { label: "참여 조건", description: "참여 조건을 입력하세요" },
  {
    label: "계좌 및 확인",
    description: "입금 정보를 입력하고 주의사항을 확인하세요",
  },
];

// 오늘 "YYYY-MM-DD"
const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function CreatePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [agree, setAgree] = useState(false);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [myCount, setMyCount] = useState<number>(1);

  // 제네릭은 입력 타입
  const methods = useForm<CreateGroupBuyingInput>({
    resolver: zodResolver(createGroupBuyingSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      productUrl: "",
      description: "",
      fixedCount: "", // "" 가능 (coerce.number가 변환)
      totalPrice: "",
      shippingFee: "",
      account: "",
      bank: "",
      endDate: "",
      category: "",
      leaderCount: "",
    },
  });
  const { trigger, handleSubmit, getValues } = methods;

  const handleNext = async () => {
    if (activeStep === 1) {
      const fixedCount = getValues("fixedCount") as number;
      if (myCount < 1 || myCount > fixedCount) {
        return; // 유효성 안 맞으면 다음으로 못 넘어감
      }
    }
    const ok = await trigger(STEP_FIELDS[activeStep], { shouldFocus: true });
    if (!ok) return;
    if (activeStep < steps.length - 1) setActiveStep((s) => s + 1);
    else handleSubmit(onSubmit)();
  };

  const handleBack = () => setActiveStep((s) => Math.max(0, s - 1));

  // 출력 타입으로 변환해서 백엔드로 보냄
  const onSubmit = async (raw: CreateGroupBuyingInput) => {
    try {
      const data: CreateGroupBuyingOutput = createGroupBuyingSchema.parse(raw);
      console.log("payload to POST", data); // 여기서 leaderCount 확인 가능

      // API 요청만 수행 (응답은 안 씀)
      const res = await createGroupBuying(data);
      const gbId = res.id;
      showSnackbar("공구 신청이 완료되었습니다.", "success");

      // 그냥 리스트로 이동 (예: /group-buying)
      setTimeout(() => {
        router.push(`group-buying/detail/${gbId}`);
      }, 1000);
    } catch (error) {
      showSnackbar("공구 생성에 실패했습니다. 다시 시도해주세요.", "error");
      console.error(error);
    }
  };
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <Step1Content />;
      case 1:
        return <Step2Content />;
      case 2:
        return <Step3Content agree={agree} setAgree={setAgree} />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 800, width: "100%" }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
          새 공동구매 만들기
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          3단계에 걸쳐 새로운 공동구매를 생성할게요.
        </Typography>

        <Stepper steps={steps} activeStep={activeStep} />

        <FormProvider {...methods}>
          <Box sx={{ mt: 4, mb: 4, minHeight: 300 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {steps[activeStep]?.description}
            </Typography>
            {renderStepContent(activeStep)}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              이전
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={activeStep === steps.length - 1 && !agree}
            >
              {activeStep === steps.length - 1 ? "완료" : "다음"}
            </Button>
          </Box>
        </FormProvider>
      </Paper>
    </Box>
  );
}
