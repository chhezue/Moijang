"use client";

import { Box, Typography, Divider } from "@mui/material";
import React from "react";

interface Step {
  label: string;
}

interface StepperProps {
  steps: Step[];
  activeStep: number;
}

const Stepper = ({ steps, activeStep }: StepperProps) => {
  // 공구 취소 단계를 제외한 steps 필터링
  const filteredSteps = steps.filter((step) => !step.label.includes("취소"));

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center", // 내부 요소들을 수직 중앙 정렬
        maxWidth: "1200px",
        width: "100%",
        margin: "0 auto", // 가운데 정렬
        px: 1,
      }}
    >
      {filteredSteps.map((step, index) => {
        const originalIndex = steps.findIndex((s) => s.label === step.label);
        const isActive = originalIndex === activeStep;
        const isCompleted = originalIndex < activeStep;

        return (
          // React.Fragment를 사용해 스텝과 연결선을 그룹화
          <React.Fragment key={index}>
            {/* 스텝 내용(원 + 라벨)을 감싸는 Box */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
              }}
            >
              {/* 원형 스텝 인디케이터 */}
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: isActive
                    ? "secondary.main"
                    : isCompleted
                      ? "primary.main"
                      : "#E0E6F2",
                  color: isActive || isCompleted ? "#fff" : "text.primary",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  marginRight: 1,
                  flexShrink: 0, // 너비가 줄어들 때 원이 찌그러지지 않도록 방지
                }}
              >
                {index + 1}
              </Box>

              {/* 단계 라벨 */}
              <Typography
                sx={{
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.875rem",
                  color: isActive
                    ? "secondary.dark"
                    : isCompleted
                      ? "primary.main"
                      : "text.secondary",
                  whiteSpace: "nowrap", // 라벨이 길어져도 줄바꿈되지 않도록 방지
                }}
              >
                {step.label}
              </Typography>
            </Box>

            {/* 연결선 (마지막 단계는 제외) */}
            {index < filteredSteps.length - 1 && (
              <Box
                sx={{
                  flex: 1, // 이 Box가 남은 공간을 모두 차지하도록 설정
                  mx: 2, // 좌우 여백
                }}
              >
                <Divider />
              </Box>
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default Stepper;
