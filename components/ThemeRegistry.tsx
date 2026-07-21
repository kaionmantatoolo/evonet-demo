"use client";

import type { ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // MUI sets `button { color: inherit }` outside @layer, which beats
        // Tailwind utility layers and makes shadcn primary buttons unreadable
        // (dark text on dark bg). Revert to the previous cascade layer.
        "button, [data-slot='button']": {
          color: "revert-layer",
        },
      },
    },
  },
});

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* Global mobile safety: prevent horizontal bleed / iOS rubber-band traps */}
        <style>{`
          html, body {
            max-width: 100%;
            overflow-x: hidden;
            -webkit-text-size-adjust: 100%;
          }
        `}</style>
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
