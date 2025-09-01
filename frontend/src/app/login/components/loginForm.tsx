"use client";

import styled from "styled-components";
import LoginIcon from "@mui/icons-material/Login";
import { redirectToLogin } from "@/apis/services/auth";
import { GradientTitle } from "@/components/GradientTitle";
import { Button, Box } from "@mui/material";

const ButtonSection = styled.div`
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const LoginForm = () => {
  const handleLogin = () => {
    redirectToLogin();
  };

  return (
    <Box
      sx={{
        width: 800,
        height: 250,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <GradientTitle size="5.3rem" center>
        MOIJANG
      </GradientTitle>
      <ButtonSection>
        <Button
          variant="outlined"
          startIcon={<LoginIcon />}
          size="medium"
          onClick={handleLogin}
        >
          Sign in with Teams
        </Button>
      </ButtonSection>
    </Box>
  );
};
