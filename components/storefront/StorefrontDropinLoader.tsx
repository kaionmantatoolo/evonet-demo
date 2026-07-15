"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography, keyframes } from "@mui/material";
import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const scanline = keyframes`
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
`;

const blink = keyframes`
  0%, 45% { opacity: 1; }
  50%, 100% { opacity: 0; }
`;

const ringSpin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const glitchFlicker = keyframes`
  0%, 100% { opacity: 1; transform: translate(0, 0); }
  92% { opacity: 1; transform: translate(0, 0); }
  93% { opacity: 0.7; transform: translate(1px, -0.5px); }
  94% { opacity: 1; transform: translate(-1px, 0.5px); }
  95% { opacity: 0.85; transform: translate(0.5px, 0); }
`;

const LOG_LINES = [
  { tag: "SYS", text: "boot · storefront checkout module" },
  { tag: "NET", text: "handshake → Evonet interaction API" },
  { tag: "AUTH", text: "minting payment session token…" },
  { tag: "GW", text: "initializing payment gateway" },
  { tag: "SDK", text: "hydrate Drop-in runtime" },
  { tag: "PCI", text: "sandboxing card / wallet rails" },
  { tag: "UI", text: "mounting secure iframe viewport" },
  { tag: "CHK", text: "verify merchant returnURL bindings" },
  { tag: "OK", text: "channels ready · standing by" },
] as const;

interface StorefrontDropinLoaderProps {
  isCreatingSession?: boolean;
  compact?: boolean;
}

interface VisibleLog {
  id: number;
  tag: string;
  text: string;
  opacity: number;
}

export function StorefrontDropinLoader({
  isCreatingSession = false,
}: StorefrontDropinLoaderProps) {
  const startAt = isCreatingSession ? 0 : 2;
  const [tick, setTick] = useState(startAt);
  const [clock, setClock] = useState("00:00.00");

  useEffect(() => {
    setTick(startAt);
  }, [startAt]);

  useEffect(() => {
    const started = performance.now();
    const clockId = window.setInterval(() => {
      const elapsed = (performance.now() - started) / 1000;
      const mm = Math.floor(elapsed / 60)
        .toString()
        .padStart(2, "0");
      const ss = Math.floor(elapsed % 60)
        .toString()
        .padStart(2, "0");
      const cs = Math.floor((elapsed % 1) * 100)
        .toString()
        .padStart(2, "0");
      setClock(`${mm}:${ss}.${cs}`);
    }, 40);

    const logId = window.setInterval(() => {
      setTick((t) => Math.min(t + 1, LOG_LINES.length - 1));
    }, 720);

    return () => {
      window.clearInterval(clockId);
      window.clearInterval(logId);
    };
  }, []);

  const visibleLogs: VisibleLog[] = useMemo(() => {
    const windowSize = 5;
    const end = Math.min(tick + 1, LOG_LINES.length);
    const start = Math.max(0, end - windowSize);
    const slice = LOG_LINES.slice(start, end);
    return slice.map((line, i) => {
      const age = slice.length - 1 - i;
      const opacity =
        age === 0 ? 1 : age === 1 ? 0.72 : age === 2 ? 0.42 : age === 3 ? 0.22 : 0.1;
      return {
        id: start + i,
        tag: line.tag,
        text: line.text,
        opacity,
      };
    });
  }, [tick]);

  const hex = useMemo(() => {
    const n = (tick * 9973 + 0x4e56) & 0xffff;
    return `0x${n.toString(16).toUpperCase().padStart(4, "0")}`;
  }, [tick]);

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={mono.className}
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        px: 2.25,
        py: 3,
        overflow: "hidden",
        bgcolor: "#06080c",
        color: "#c8f7e0",
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 255, 170, 0.12), transparent 55%),
          linear-gradient(180deg, #0a0e14 0%, #050608 100%)
        `,
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 170, 0.03) 2px, rgba(0, 255, 170, 0.03) 3px)",
          pointerEvents: "none",
          opacity: 0.7,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          left: 0,
          right: 0,
          height: "28%",
          background:
            "linear-gradient(180deg, transparent, rgba(0, 255, 170, 0.06), transparent)",
          animation: `${scanline} 3.2s linear infinite`,
          pointerEvents: "none",
        },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2.5, position: "relative", zIndex: 1 }}
      >
        <Typography
          sx={{
            fontSize: 10,
            letterSpacing: 2.4,
            textTransform: "uppercase",
            color: "#5dffb0",
            fontWeight: 600,
            animation: `${glitchFlicker} 4.5s steps(1) infinite`,
          }}
        >
          EVONET // DROP-IN
        </Typography>
        <Typography sx={{ fontSize: 10, color: "#3d7a5c", letterSpacing: 1 }}>
          t+{clock}
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ mb: 2.5, position: "relative", zIndex: 1 }}
      >
        <Box
          sx={{
            position: "relative",
            width: 44,
            height: 44,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "1px solid rgba(0, 255, 170, 0.35)",
              borderTopColor: "#5dffb0",
              animation: `${ringSpin} 0.9s linear infinite`,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 7,
              borderRadius: "50%",
              border: "1px solid rgba(0, 255, 170, 0.2)",
              borderBottomColor: "#34d399",
              animation: `${ringSpin} 1.4s linear infinite reverse`,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              fontSize: 9,
              fontWeight: 600,
              color: "#5dffb0",
              letterSpacing: 0.5,
            }}
          >
            GW
          </Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e6fff3",
              letterSpacing: 0.3,
            }}
          >
            initializing payment gateway
          </Typography>
          <Typography sx={{ fontSize: 10, color: "#3d7a5c", mt: 0.35 }}>
            channel {hex} · mode EMBEDDED · tls 1.3
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          border: "1px solid rgba(0, 255, 170, 0.18)",
          borderRadius: 1,
          bgcolor: "rgba(0, 0, 0, 0.45)",
          px: 1.5,
          py: 1.35,
          minHeight: 148,
          boxShadow: "inset 0 0 24px rgba(0, 255, 170, 0.04)",
        }}
      >
        <Typography
          sx={{
            fontSize: 9,
            color: "#2f6b4d",
            letterSpacing: 1.6,
            textTransform: "uppercase",
            mb: 1,
          }}
        >
          boot_log · live
        </Typography>

        <Stack spacing={0.65}>
          {visibleLogs.map((log) => (
            <Box
              key={log.id}
              sx={{
                display: "grid",
                gridTemplateColumns: "44px 1fr",
                gap: 1,
                opacity: log.opacity,
                transition: "opacity 420ms ease",
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  color:
                    log.tag === "OK" || log.tag === "GW"
                      ? "#5dffb0"
                      : "#2dd4a0",
                }}
              >
                [{log.tag}]
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontSize: 11,
                  color: "#b8e6cf",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {log.text}
                {log.id === tick ? (
                  <Box
                    component="span"
                    sx={{
                      display: "inline-block",
                      width: 7,
                      height: 12,
                      ml: 0.5,
                      verticalAlign: "text-bottom",
                      bgcolor: "#5dffb0",
                      animation: `${blink} 0.9s step-end infinite`,
                    }}
                  />
                ) : null}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{ mt: 2, position: "relative", zIndex: 1 }}
      >
        <Typography sx={{ fontSize: 9, color: "#2f6b4d", letterSpacing: 1.2 }}>
          {isCreatingSession ? "PHASE/SESSION" : "PHASE/SDK_MOUNT"}
        </Typography>
        <Typography sx={{ fontSize: 9, color: "#5dffb0", letterSpacing: 1.2 }}>
          AWAIT_UI ▌
        </Typography>
      </Stack>
    </Box>
  );
}
