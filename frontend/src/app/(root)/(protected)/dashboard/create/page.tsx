"use client";

import { useState } from "react";
import { Box, Button, CircularProgress, Divider, Typography } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Stepper from "@/components/Stepper";
import Step1Content from "../../create/components/Step1Content";
import Step2Content from "../../create/components/Step2Content";
import Step3Content from "../../create/components/Step3Content";
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
  { label: "최종 확인", description: "주의사항을 확인하고 동의해주세요" },
];

export default function DashboardCreatePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [agree, setAgree] = useState(false);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const methods = useForm<CreateGroupBuyingInput>({
    resolver: zodResolver(createGroupBuyingSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      productUrl: "",
      description: "",
      fixedCount: "",
      totalPrice: "",
      shippingFee: "",
      endDate: "",
      category: "",
      leaderCount: "",
    },
  });

  const {
    trigger,
    handleSubmit,
    getValues,
    formState: { isSubmitting },
  } = methods;

  const handleNext = async () => {
    if (activeStep === 1) {
      const fixedCount = getValues("fixedCount") as number;
      const leaderCount = getValues("leaderCount") as number;
      if (leaderCount < 1 || leaderCount >= fixedCount) return;
    }
    const ok = await trigger(STEP_FIELDS[activeStep], { shouldFocus: true });
    if (!ok) return;
    if (activeStep < steps.length - 1) setActiveStep((s) => s + 1);
    else handleSubmit(onSubmit)();
  };

  const handleBack = () => setActiveStep((s) => Math.max(0, s - 1));

  const onSubmit = async (raw: CreateGroupBuyingInput) => {
    try {
      const data: CreateGroupBuyingOutput = createGroupBuyingSchema.parse(raw);
      const res = await createGroupBuying(data);
      showSnackbar("공구 신청이 완료되었습니다.", "success");
      router.push(`/dashboard/leading/${res.id}`);
    } catch {
      showSnackbar("공구 생성에 실패했습니다. 다시 시도해주세요.", "error");
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
    <Box sx={{ p: 4, maxWidth: 720, mx: "auto" }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
        새 공동구매 만들기
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        3단계에 걸쳐 새로운 공동구매를 생성할게요.
      </Typography>

      <Stepper steps={steps} activeStep={activeStep} />

      <Divider sx={{ my: 3 }} />

      <FormProvider {...methods}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          {steps[activeStep]?.description}
        </Typography>

        <Box sx={{ minHeight: 280 }}>{renderStepContent(activeStep)}</Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button variant="outlined" disabled={activeStep === 0} onClick={handleBack}>
            이전
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={(activeStep === steps.length - 1 && !agree) || isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : activeStep === steps.length - 1 ? (
              "완료"
            ) : (
              "다음"
            )}
          </Button>
        </Box>
      </FormProvider>
    </Box>
  );
}
