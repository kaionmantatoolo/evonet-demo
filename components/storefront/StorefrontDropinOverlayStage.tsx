"use client";

import { Alert, Box } from "@mui/material";
import { EvonetDropinHost } from "../EvonetDropinHost";
import { StorefrontDropinLoader } from "./StorefrontDropinLoader";
import type { EvonetDropinConfig, EvonetDropinEvent } from "../../types/evonet";

interface StorefrontDropinOverlayStageProps {
  sessionError: string | null;
  isCreatingSession: boolean;
  dropinConfig: EvonetDropinConfig | null;
  sdkInitGeneration: number;
  onEvent: (event: EvonetDropinEvent) => void;
  loadingLabel?: string;
}

/**
 * Full-viewport stage for SDK fullPage / bottomUp checkout.
 * Do not wrap in phone-width cards — the SDK owns the overlay layout.
 */
export function StorefrontDropinOverlayStage({
  sessionError,
  isCreatingSession,
  dropinConfig,
  sdkInitGeneration,
  onEvent,
  loadingLabel,
}: StorefrontDropinOverlayStageProps) {
  const showLoader =
    !sessionError && (isCreatingSession || !dropinConfig || sdkInitGeneration < 1);

  return (
    <Box
      sx={{
        minHeight: "100%",
        width: "100%",
        minWidth: 0,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        bgcolor: "var(--cil-dropIn-color-background, #ffffff)",
      }}
    >
      {sessionError ? (
        <Alert severity="error" sx={{ m: 2 }}>
          {sessionError}
        </Alert>
      ) : null}

      {showLoader ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            minHeight: 320,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 420 }}>
            <StorefrontDropinLoader
              isCreatingSession={isCreatingSession}
              loadingLabel={loadingLabel}
            />
          </Box>
        </Box>
      ) : null}

      {dropinConfig && sdkInitGeneration > 0 ? (
        <Box sx={{ flex: 1, width: "100%", minWidth: 0, minHeight: 0 }}>
          <EvonetDropinHost
            key={`storefront-overlay-${sdkInitGeneration}`}
            config={dropinConfig}
            initGeneration={sdkInitGeneration}
            onEvent={onEvent}
            compact={false}
          />
        </Box>
      ) : null}
    </Box>
  );
}
