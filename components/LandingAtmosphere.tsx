"use client";

import { useEffect, useRef } from "react";
import { Box } from "@mui/material";

const DEFAULT = { x: 50, y: 18 };
const LERP = 0.085;

/**
 * Pointer-reactive blue atmosphere for the landing page.
 * Updates CSS custom properties (no React re-render per frame).
 * Disabled for coarse pointers / reduced motion.
 */
export function LandingAtmosphere() {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const finePointer = window.matchMedia("(pointer: fine)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const canTrack = () => finePointer.matches && !reduceMotion.matches;

    let target = { ...DEFAULT };
    let current = { ...DEFAULT };
    let raf = 0;

    const paint = () => {
      const mx = current.x;
      const my = current.y;
      const mx2 = 100 - mx;
      const my2 = Math.min(92, Math.max(8, 100 - my * 0.85));
      layer.style.setProperty("--land-mx", `${mx.toFixed(2)}%`);
      layer.style.setProperty("--land-my", `${my.toFixed(2)}%`);
      layer.style.setProperty("--land-mx2", `${mx2.toFixed(2)}%`);
      layer.style.setProperty("--land-my2", `${my2.toFixed(2)}%`);
    };

    paint();

    const tick = () => {
      current.x += (target.x - current.x) * LERP;
      current.y += (target.y - current.y) * LERP;
      paint();

      const dx = Math.abs(target.x - current.x);
      const dy = Math.abs(target.y - current.y);
      if (dx > 0.04 || dy > 0.04) {
        raf = window.requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (event: PointerEvent) => {
      if (!canTrack()) return;
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      target = {
        x: (event.clientX / w) * 100,
        y: (event.clientY / h) * 100,
      };
      if (!raf) raf = window.requestAnimationFrame(tick);
    };

    const reset = () => {
      target = { ...DEFAULT };
      current = { ...DEFAULT };
      paint();
      if (raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onCapabilityChange = () => {
      if (!canTrack()) reset();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    finePointer.addEventListener("change", onCapabilityChange);
    reduceMotion.addEventListener("change", onCapabilityChange);

    return () => {
      window.removeEventListener("pointermove", onMove);
      finePointer.removeEventListener("change", onCapabilityChange);
      reduceMotion.removeEventListener("change", onCapabilityChange);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Box
      ref={layerRef}
      aria-hidden
      sx={(theme) => ({
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        "--land-mx": "50%",
        "--land-my": "18%",
        "--land-mx2": "50%",
        "--land-my2": "78%",
        background:
          theme.palette.mode === "dark"
            ? `
            radial-gradient(ellipse 70% 55% at var(--land-mx) var(--land-my), rgba(56, 189, 248, 0.3), transparent 58%),
            radial-gradient(ellipse 55% 45% at var(--land-mx2) var(--land-my2), rgba(26, 134, 232, 0.24), transparent 60%),
            radial-gradient(ellipse 90% 60% at 50% -10%, rgba(0, 122, 255, 0.2), transparent 55%)
          `
            : `
            radial-gradient(ellipse 70% 55% at var(--land-mx) var(--land-my), rgba(0, 122, 255, 0.22), transparent 58%),
            radial-gradient(ellipse 50% 40% at var(--land-mx2) var(--land-my2), rgba(52, 199, 89, 0.09), transparent 55%),
            radial-gradient(ellipse 90% 55% at 50% -15%, rgba(0, 122, 255, 0.1), transparent 58%)
          `,
      })}
    />
  );
}
