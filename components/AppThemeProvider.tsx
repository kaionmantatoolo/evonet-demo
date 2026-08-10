"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";

/**
 * First visit follows the device (`prefers-color-scheme`). Once resolved,
 * lock to concrete `light` | `dark` so the UI only offers those two modes
 * (no lingering "system" preference).
 */
function LockResolvedTheme() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (theme === "system" && (resolvedTheme === "light" || resolvedTheme === "dark")) {
      setTheme(resolvedTheme);
    }
  }, [theme, resolvedTheme, setTheme]);

  return null;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="evonet-color-theme"
    >
      <LockResolvedTheme />
      {children}
    </ThemeProvider>
  );
}
