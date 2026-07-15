"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Box, Portal } from "@mui/material";

const FADE_MS = 320;

interface StorefrontMorphOverlayProps {
  open: boolean;
  children: ReactNode;
}

/**
 * Full-screen fade overlay, portaled to document.body so Builder layout
 * never traps position:fixed or pointer-events.
 */
export function StorefrontMorphOverlay({
  open,
  children,
}: StorefrontMorphOverlayProps) {
  const [mounted, setMounted] = useState(open);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setActive(true));
      });
      return () => window.cancelAnimationFrame(id);
    }

    setActive(false);
    const timer = window.setTimeout(() => setMounted(false), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!mounted) {
    return null;
  }

  return (
    <Portal>
      <Box
        aria-hidden={!active}
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: (theme) => theme.zIndex.modal + 4,
          bgcolor: "#ffffff",
          overflow: "auto",
          opacity: active ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease`,
          pointerEvents: "auto",
        }}
      >
        {children}
      </Box>
    </Portal>
  );
}

/** Soften Builder while the storefront overlay is open (no 3D). */
export function builderStageMorphSx(open: boolean) {
  return {
    opacity: open ? 0.35 : 1,
    transition: `opacity ${FADE_MS}ms ease`,
    pointerEvents: open ? ("none" as const) : ("auto" as const),
  };
}

export const STOREFRONT_MORPH_MS = FADE_MS;
