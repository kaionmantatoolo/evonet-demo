"use client";

import { Box, Stack, keyframes } from "@mui/material";

const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

function Bone({
  width = "100%",
  height = 12,
  radius = 1.5,
}: {
  width?: string | number;
  height?: number;
  radius?: number;
}) {
  return (
    <Box
      sx={{
        width,
        height,
        borderRadius: radius,
        background:
          "linear-gradient(90deg, #eceae6 18%, #f7f6f4 42%, #eceae6 68%)",
        backgroundSize: "200% 100%",
        animation: `${shimmer} 1.35s ease-in-out infinite`,
      }}
    />
  );
}

interface StorefrontDropinLoaderProps {
  /** Kept for call-site compatibility; skeleton does not vary by phase. */
  isCreatingSession?: boolean;
  loadingLabel?: string;
}

/**
 * Soft payment-panel skeleton shown until Drop-in UI is ready to fade in.
 */
export function StorefrontDropinLoader({
  loadingLabel = "Loading payment methods",
}: StorefrontDropinLoaderProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={loadingLabel}
      sx={{
        height: "100%",
        width: "100%",
        minHeight: 200,
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 2.5 },
        bgcolor: "#ffffff",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={1}>
          <Bone width="42%" height={10} />
          <Bone width="68%" height={18} radius={2} />
        </Stack>

        <Stack spacing={1.25}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 18px",
                gap: 1.5,
                alignItems: "center",
                p: 1.5,
                borderRadius: 2,
                border: "1px solid #ebe8e3",
                animationDelay: `${i * 0.12}s`,
                "& > *": {
                  animationDelay: `${i * 0.12}s`,
                },
              }}
            >
              <Bone width={40} height={28} radius={1.25} />
              <Stack spacing={0.75}>
                <Bone width={`${72 - i * 8}%`} height={11} />
                <Bone width={`${48 - i * 4}%`} height={8} />
              </Stack>
              <Bone width={14} height={14} radius={7} />
            </Box>
          ))}
        </Stack>

        <Box sx={{ pt: 0.5 }}>
          <Bone width="100%" height={44} radius={2} />
        </Box>
      </Stack>
    </Box>
  );
}
