// src/styles/theme.d.ts
import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    header: Palette["primary"];
  }
  interface PaletteOptions {
    header?: PaletteOptions["primary"];
  }
}

// 타입스크립트 모듈 인식 위해 필요
export {};
