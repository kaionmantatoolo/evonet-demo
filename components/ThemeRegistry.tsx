"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

/**
 * Concrete hex mirrors of app/globals.css tokens.
 * MUI palette must be parseable (#/rgb/hsl) — CSS `var(...)` / `oklch(...)`
 * crash getContrastText / alpha and break routes like storefront.
 */
const LIGHT = {
  background: "#ffffff",
  paper: "#ffffff",
  text: "#0a0a0a",
  textSecondary: "#737373",
  divider: "#ebebeb",
} as const;

const DARK = {
  background: "#111111",
  paper: "#1a1a1a",
  text: "#fafafa",
  textSecondary: "#c4c4c4",
  divider: "rgba(255,255,255,0.12)",
} as const;

function buildMuiTheme(mode: "light" | "dark") {
  const colors = mode === "dark" ? DARK : LIGHT;
  return createTheme({
    palette: {
      mode,
      background: {
        default: colors.background,
        paper: colors.paper,
      },
      text: {
        primary: colors.text,
        secondary: colors.textSecondary,
      },
      divider: colors.divider,
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          // Prefer CSS variables on the document so body tracks Tailwind tokens;
          // palette above stays hex for MUI math.
          body: {
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
          },
          // MUI sets `button { color: inherit }` outside @layer, which beats
          // Tailwind utility layers and makes shadcn primary buttons unreadable
          // (dark text on dark bg). Revert to the previous cascade layer.
          "button, [data-slot='button']": {
            color: "revert-layer",
          },
        },
      },
      MuiSnackbarContent: {
        styleOverrides: {
          root: {
            backgroundColor: colors.paper,
            color: colors.text,
            border: `1px solid ${colors.divider}`,
            boxShadow:
              mode === "dark"
                ? "0 8px 24px rgba(0,0,0,0.45)"
                : "0 8px 24px rgba(0,0,0,0.12)",
          },
          message: {
            color: colors.text,
          },
          action: {
            color: colors.textSecondary,
          },
        },
      },
    },
  });
}

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  // next-themes leaves resolvedTheme undefined until mount; meanwhile the
  // blocking script may already have set html.dark. Track that so MUI mode
  // matches CSS variables as soon as the client hydrates.
  const [htmlDark, setHtmlDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setHtmlDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const mode: "light" | "dark" =
    resolvedTheme === "dark" || resolvedTheme === "light"
      ? resolvedTheme
      : htmlDark
        ? "dark"
        : "light";
  const theme = useMemo(() => buildMuiTheme(mode), [mode]);

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
