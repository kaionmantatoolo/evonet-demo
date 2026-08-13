"use client";

import { Box } from "@mui/material";
import { enterUp } from "../storefrontMotion";

const HERO = {
  src: "/storefront/fan-club-hero-concert-card.png",
  alt: "ANON TOKYO Fan Club membership card under concert stage lights",
  objectPosition: "50% 42%",
} as const;

/** Single Fan Club hero: concert atmosphere + membership card composite. */
export function FanClubHeroVisual() {
  return (
    <Box
      sx={{
        borderRadius: { xs: 2, md: 3 },
        overflow: "hidden",
        position: "relative",
        bgcolor: "#0c0a09",
        boxShadow: "0 28px 70px rgba(15, 23, 42, 0.18)",
        minHeight: { xs: 320, sm: 440, md: 560 },
        aspectRatio: { xs: "3 / 4", md: "3 / 4" },
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
          objectPosition: "50% 45%",
          display: "block",
          transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
          "&:hover": { transform: "scale(1.03)" },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 58%, color-mix(in srgb, var(--shop-bg) 38%, transparent))",
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}
