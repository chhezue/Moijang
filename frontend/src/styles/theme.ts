import { createTheme } from "@mui/material";

// Modern 2024 Design System Theme
declare module "@mui/material/styles" {
  interface Palette {
    accent: {
      green: string;
      coral: string;
      neon: string;
      pink: string;
    };
    glass: {
      background: string;
      border: string;
    };
    header: {
      main: string;
      contrastText: string;
    };
  }

  interface PaletteOptions {
    accent?: {
      green?: string;
      coral?: string;
      neon?: string;
      pink?: string;
    };
    glass?: {
      background?: string;
      border?: string;
    };
    header?: {
      main?: string;
      contrastText?: string;
    };
  }
}

export const theme = createTheme({
  // Trendy Colors based on user's palette
  palette: {
    mode: "light",
    primary: {
      main: "#8B5CF6", // Violet (Main Accent)
      light: "#A78BFA",
      dark: "#7C3AED",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#F59E0B", // Warm Yellow (Sub Accent)
      light: "#FBBF24",
      dark: "#D97706",
      contrastText: "#111827",
    },
    accent: {
      green: "#10b981",
      coral: "#F59E0B",
      neon: "#00ff88",
      pink: "#ec4899",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#F59E0B",
      light: "#FBBF24",
      dark: "#D97706",
      contrastText: "#111827",
    },
    info: {
      main: "#6366F1",
      light: "#818CF8",
      dark: "#4F46E5",
      contrastText: "#ffffff",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
      contrastText: "#ffffff",
    },
    background: {
      default: "#FFFFFF", // Clean white background (60)
      paper: "#FFFFFF",
    },
    text: {
      primary: "#111827",
      secondary: "#6B7280",
      disabled: "#9CA3AF",
    },
    divider: "#E5E7EB",
    glass: {
      background: "rgba(255, 255, 255, 0.1)",
      border: "rgba(255, 255, 255, 0.2)",
    },
    header: {
      main: "rgba(255, 255, 255, 0.8)",
      contrastText: "#111827",
    },
  },

  // Typography
  typography: {
    fontFamily:
      "'Inter', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: {
      fontSize: "clamp(2.25rem, 1.9rem + 1.75vw, 3rem)",
      fontWeight: 800,
      lineHeight: 1.25,
      letterSpacing: "-0.025em",
    },
    h2: {
      fontSize: "clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)",
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: "-0.025em",
    },
    h3: {
      fontSize: "clamp(1.5rem, 1.3rem + 1vw, 2rem)",
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: "-0.025em",
    },
    h4: {
      fontSize: "clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "clamp(1.125rem, 1rem + 0.625vw, 1.25rem)",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: "clamp(1rem, 0.9rem + 0.5vw, 1.125rem)",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "clamp(1rem, 0.9rem + 0.5vw, 1.125rem)",
      lineHeight: 1.6,
      letterSpacing: "0.01em",
    },
    body2: {
      fontSize: "clamp(0.875rem, 0.8rem + 0.375vw, 1rem)",
      lineHeight: 1.5,
    },
    caption: {
      fontSize: "clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)",
      lineHeight: 1.4,
      letterSpacing: "0.025em",
    },
    button: {
      fontWeight: 600,
      letterSpacing: "0.025em",
      textTransform: "none",
    },
  },

  spacing: 8,
  shape: { borderRadius: 12 },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#FFFFFF",
          backgroundImage: "none",
          minHeight: "100vh",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableRipple: false, disableElevation: false },
      styleOverrides: {
        root: {
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.875rem",
          padding: "10px 20px",
          position: "relative",
          overflow: "hidden",
          transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": { transform: "translateY(-2px)" },
        },
        /*contained: {
          background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
          boxShadow: "0 4px 16px rgba(139, 92, 246, 0.24)",
          "&:hover": {
            background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
            boxShadow: "0 8px 24px rgba(139, 92, 246, 0.32)",
          },
          "&:active": { transform: "translateY(0px)" },
        },*/
        contained: ({ ownerState }) => ({
          // ✅ ownerState.color가 'primary'일 때만 보라색 스타일을 적용합니다.
          ...(ownerState.color === "primary" && {
            background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
            boxShadow: "0 4px 16px rgba(139, 92, 246, 0.24)",
            "&:hover": {
              background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
              boxShadow: "0 8px 24px rgba(139, 92, 246, 0.32)",
            },
            "&:active": { transform: "translateY(0px)" },
          }),
          // ✅ ownerState.color가 'secondary'일 때의 스타일을 추가할 수 있습니다.
          ...(ownerState.color === "secondary" && {
            color: "white",
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", // 예시: 초록색 계열
            boxShadow: "0 4px 16px rgba(16, 185, 129, 0.24)",
            "&:hover": {
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              boxShadow: "0 8px 24px rgba(16, 185, 129, 0.32)",
            },
          }),
          ...(ownerState.color === "warning" && {
            color: "white",
            background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
            boxShadow: "0 4px 16px rgba(245, 158, 11, 0.24)",
            "&:hover": {
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              boxShadow: "0 8px 24px rgba(245, 158, 11, 0.32)",
            },
          }),
        }),
        outlined: {
          borderWidth: "2px",
          "&:hover": {
            borderWidth: "2px",
            backgroundColor: "rgba(139, 92, 246, 0.08)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "20px",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
          border: "1px solid #F3F4F6",
          background: "#FFFFFF",
          transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.12)",
            borderColor: "#E5E7EB",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          fontWeight: 500,
          fontSize: "0.75rem",
          height: "28px",
        },
        filled: {
          backgroundColor: "rgba(139, 92, 246, 0.12)",
          color: "#7C3AED",
          "&:hover": { backgroundColor: "rgba(139, 92, 246, 0.16)" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        elevation1: { boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)" },
        elevation2: { boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)" },
        elevation4: { boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)" },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "#FFFFFF",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#A78BFA",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#8B5CF6",
              borderWidth: "2px",
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #E5E7EB",
          boxShadow: "0 2px 16px rgba(0, 0, 0, 0.04)",
        },
      },
    },
  },
});
