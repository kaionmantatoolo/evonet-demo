"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Box, Portal, keyframes } from "@mui/material";

const shineSweep = keyframes`
  0% { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
  35% { opacity: 0.28; }
  100% { transform: translateX(220%) skewX(-18deg); opacity: 0; }
`;

const MORPH_MS = 780;

interface StorefrontMorphOverlayProps {
  open: boolean;
  children: ReactNode;
}

/**
 * Full-screen 3D page-flip overlay, portaled to document.body so parent
 * transforms (Builder warp) never trap position:fixed or pointer-events.
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
    const timer = window.setTimeout(() => setMounted(false), MORPH_MS);
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
          perspective: { xs: "900px", md: "1600px" },
          perspectiveOrigin: "50% 45%",
          // Stay clickable even mid-flip once open has been requested.
          pointerEvents: "auto",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(28, 25, 23, 0.18)",
            opacity: active ? 1 : 0,
            transition: `opacity ${MORPH_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transformOrigin: "12% 50%",
            transform: active
              ? "rotateY(0deg) translateZ(0) scale(1)"
              : "rotateY(72deg) translate3d(6%, 0, -80px) scale(0.96)",
            opacity: 1,
            transition: `transform ${MORPH_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            bgcolor: "#ffffff",
            overflow: "auto",
            boxShadow: active
              ? "-28px 0 80px rgba(15, 23, 42, 0.22)"
              : "-8px 0 24px rgba(15, 23, 42, 0.08)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {active ? (
            <Box
              aria-hidden
              sx={{
                pointerEvents: "none",
                position: "absolute",
                inset: 0,
                zIndex: 50,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "38%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                  animation: `${shineSweep} 900ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both`,
                }}
              />
            </Box>
          ) : null}

          {children}
        </Box>
      </Box>
    </Portal>
  );
}

/** Subtle 3D warp applied to the Builder stage while the storefront is open. */
export function builderStageMorphSx(open: boolean) {
  return {
    transformOrigin: "center center",
    transform: open
      ? "scale(0.94) rotateY(-12deg) translateX(-1.5%)"
      : "scale(1) rotateY(0deg) translateX(0)",
    filter: open ? "brightness(0.88) saturate(0.92)" : "none",
    opacity: open ? 0.78 : 1,
    transition: [
      `transform ${MORPH_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      `filter ${MORPH_MS}ms ease`,
      `opacity ${MORPH_MS}ms ease`,
    ].join(", "),
    pointerEvents: open ? ("none" as const) : ("auto" as const),
  };
}

export const STOREFRONT_MORPH_MS = MORPH_MS;
