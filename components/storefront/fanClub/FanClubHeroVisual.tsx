"use client";

import { Box } from "@mui/material";
import { enterUp } from "../storefrontMotion";

const HERO = {
  src: "/storefront/fan-club-hero-concert-card.png",
  alt: "ANON TOKYO Fan Club membership card under concert stage lights",
} as const;

/** Single Fan Club hero: concert atmosphere + membership card composite. */
export function FanClubHeroVisual() {
  return (
    <Box
      sx={{
        borderRadius: { xs: 0, md: 3 },
        overflow: "hidden",
        position: "relative",
        bgcolor: "#0c0a09",
        boxShadow: {
          xs: "none",
          md: "0 28px 70px rgba(15, 23, 42, 0.18)",
        },
        /* Mobile: shorter full-bleed plane so brand/CTA fit first viewport */
        height: { xs: "min(48vh, 360px)", sm: "min(52vh, 420px)", md: "auto" },
        minHeight: { md: 560 },
        aspectRatio: { md: "3 / 4" },
        mx: { xs: -2, sm: 0 },
        width: { xs: "calc(100% + 32px)", sm: "100%" },
        ...enterUp(80, 700),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <Box
        component="img"
        src={`${HERO.src}?v=2`}
        alt={HERO.alt}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: { xs: "50% 38%", md: "50% 45%" },
          display: "block",
          transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
          "@media (hover: hover)": {
            "&:hover": { transform: "scale(1.03)" },
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: {
            xs: "linear-gradient(180deg, transparent 42%, color-mix(in srgb, var(--shop-bg) 72%, transparent))",
            md: "linear-gradient(180deg, transparent 58%, color-mix(in srgb, var(--shop-bg) 38%, transparent))",
          },
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}
