"use client";

import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";

interface GradientTitleProps {
  size?: string;
  center?: boolean;
  padding?: string;
}
export const GradientTitle = styled("div").withConfig({
  shouldForwardProp: (prop) => !["center", "size", "padding"].includes(prop),
})<GradientTitleProps>`
  background-image: linear-gradient(
    to right,
    ${theme.palette.primary.main},
    ${theme.palette.secondary.main},
    ${theme.palette.warning.main}
  );
  background-size: 100% 100%;
  background-position: 0% 50%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  overflow: hidden;
  font-family: "Inter", sans-serif;
  font-weight: 700;
  font-size: ${({ size = "1.8rem" }) => size};
  letter-spacing: 1px;
  padding: ${({ padding = "10px" }) => padding};
  cursor: pointer;
  transition: all 0.3s ease;

  ${({ center = false }) =>
    center &&
    css`
      display: flex;
      justify-content: center;
      align-items: center;
    `}

  &:hover {
    background-size: 400% 400%;
    animation: gradientMove 3s ease infinite;
  }

  @keyframes gradientMove {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;
