"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { EvonetDropinMode } from "../types/evonet";

export interface DropinModePreviewShellProps {
  /**
   * Real Evonet SDK mode. For `fullPage` / `bottomUp`, children (Drop-in host)
   * are mounted in a viewport portal so the SDK can render its own overlay.
   */
  mode: EvonetDropinMode;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Secondary copy next to the mode label (e.g. storefront vs console). */
  closeHint?: string;
}

/**
 * Mount stage for true SDK overlay modes (not an app-owned checkout sheet).
 * - embedded: pass-through (caller keeps the inline card)
 * - fullPage / bottomUp: fixed viewport portal; Evonet Drop-in owns the UI
 */
export function DropinModePreviewShell({
  mode,
  open,
  onClose,
  children,
  closeHint = "Close to return to the console",
}: DropinModePreviewShellProps) {
  const isSdkOverlay = mode === "fullPage" || mode === "bottomUp";

  useEffect(() => {
    if (!isSdkOverlay || !open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSdkOverlay, open]);

  if (!isSdkOverlay) {
    return <>{children}</>;
  }

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1400] flex h-[100dvh] w-screen flex-col"
      data-dropin-mode-stage={mode}
      role="dialog"
      aria-modal="true"
      aria-label={`Evonet Drop-in ${mode} preview`}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div className="relative z-[1] flex shrink-0 items-center justify-between gap-3 bg-[#0B1220]/90 px-3 py-2 text-white backdrop-blur-sm">
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
          SDK mode: <span className="font-mono">{mode}</span>
          {" · "}
          {closeHint}
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label="Close Drop-in preview"
          size="small"
          sx={{ color: "white" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
      {/* Full remaining viewport width — Columns layout needs a wide stage */}
      <div
        className="relative z-[1] min-h-0 w-full flex-1 overflow-auto"
        style={{
          backgroundColor: "var(--cil-dropIn-color-background, #ffffff)",
        }}
      >
        <div className="h-full w-full min-w-0">{children}</div>
      </div>
    </div>,
    document.body
  );
}
