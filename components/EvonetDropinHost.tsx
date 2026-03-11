"use client";

import { Alert, Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type {
  EvonetDropinConfig,
  EvonetDropinEvent,
  EvonetDropinSdkOptions,
  EvonetWindow,
} from "../types/evonet";

const DEFAULT_SCRIPT_SRC =
  process.env.NEXT_PUBLIC_EVONET_DROPIN_SCRIPT_URL ??
  "https://cdn.evonetonline.com/sdk/evonet-dropin.js";

interface EvonetDropinHostProps {
  config: EvonetDropinConfig;
  configVersion: number;
  onEvent?: (event: EvonetDropinEvent) => void;
}

export function EvonetDropinHost({
  config,
  configVersion,
  onEvent,
}: EvonetDropinHostProps) {
  const containerIdRef = useRef<string>("evonet-dropin-root");
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-evonet-dropin="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = DEFAULT_SCRIPT_SRC;
    script.async = true;
    script.dataset.evonetDropin = "true";
    script.addEventListener(
      "load",
      () => {
        setScriptLoaded(true);
      },
      { once: true }
    );
    script.addEventListener(
      "error",
      () => {
        setScriptLoaded(false);
        onEvent?.({
          type: "error",
          payload: { message: "Failed to load Evonet Drop-in script" },
        });
      },
      { once: true }
    );
    document.body.appendChild(script);
  }, [onEvent]);

  useEffect(() => {
    if (!scriptLoaded) {
      return;
    }
    // Only initialize after explicit user action from the host page.
    if (configVersion < 1) {
      return;
    }

    const win = window as unknown as EvonetWindow;

    const SdkCtor = win.DropInSDK;
    if (!SdkCtor) {
      onEvent?.({
        type: "error",
        payload: {
          message:
            "DropInSDK constructor not available on window after script load.",
        },
      });
      return;
    }

    const container = document.getElementById(containerIdRef.current);
    if (container) {
      container.innerHTML = "";
    }

    const envMap: Record<string, string> = {
      PROD: "HKG_prod",
      prod: "HKG_prod",
      TEST: "UAT",
      test: "UAT",
    };
    const sdkEnvironment =
      envMap[config.environment] ?? config.environment;

    const options: EvonetDropinSdkOptions = {
      id: `#${containerIdRef.current}`,
      type: "payment",
      sessionID: config.sessionID,
      locale: config.language ?? "en",
      mode: config.mode,
      environment: sdkEnvironment as EvonetDropinSdkOptions["environment"],
      appearance: {
        colorBackground: "#ffffff",
      },
      payment_completed: (payload: unknown) => {
        onEvent?.({
          type: "payment_success",
          payload,
        });
      },
      payment_failed: (payload: unknown) => {
        onEvent?.({
          type: "payment_fail",
          payload,
        });
      },
      payment_not_preformed: (payload: unknown) => {
        onEvent?.({
          type: "payment_pending",
          payload,
        });
      },
      payment_cancelled: (payload: unknown) => {
        onEvent?.({
          type: "payment_cancelled",
          payload,
        });
      },
    };

    try {
      // eslint-disable-next-line no-new
      new SdkCtor(options);
    } catch (error) {
      onEvent?.({
        type: "error",
        payload: { message: "Failed to initialize DropInSDK", error },
      });
    }

    return () => {
      const c = document.getElementById(containerIdRef.current);
      if (c) {
        c.innerHTML = "";
      }
    };
  }, [config, configVersion, scriptLoaded, onEvent]);

  return (
    <Box sx={{ width: "100%" }}>
      {!scriptLoaded && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
          Loading Evonet Drop-in SDK in the browser…
        </Alert>
      )}
      <Box
        id={containerIdRef.current}
        sx={{
          minHeight: 320,
          width: "100%",
          bgcolor: "background.paper",
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
        }}
      />
      <style jsx global>{`
        #evonet-dropin-root iframe {
          display: block;
          width: 100% !important;
          border: 0 !important;
        }
      `}</style>
    </Box>
  );
}
