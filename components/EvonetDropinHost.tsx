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
  const dropInInstanceRef = useRef<unknown>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Capture any postMessage traffic from the Drop-in iframe so we can
  // surface raw SDK messages in the host page event log.
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      onEvent?.({
        type: "sdk_message",
        payload: {
          origin: event.origin,
          data: event.data,
        },
      });
    };

    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
    };
  }, [onEvent]);

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

    const handlePaymentMethodSelected = (payload: unknown) => {
      // High-level event for the host UI.
      onEvent?.({
        type: "payment_method_selected",
        payload,
      });

      // Also surface this as a raw SDK message for easier debugging.
      onEvent?.({
        type: "sdk_message",
        payload: {
          source: "payment_method_selected",
          data: payload,
        },
      });

      const p = payload as {
        verificationID?: string;
        verificationId?: string;
        paymentBrand?: string;
        [key: string]: unknown;
      } | undefined;
      const verificationID =
        p?.verificationID ?? p?.verificationId ?? (p as any)?.verification_id;
      if (!verificationID) {
        onEvent?.({
          type: "error",
          payload: {
            message:
              "payment_method_selected missing verificationID; cannot enable Pay button",
            rawPayload: p,
          },
        });
        return;
      }

      const inst = dropInInstanceRef.current as Record<string, unknown> | null;
      const base = (inst?.value ?? inst) as Record<string, unknown> | null;
      const callback =
        (typeof base?.callbackVerification === "function"
          ? base.callbackVerification
          : typeof (inst as any)?.callbackVerification === "function"
            ? (inst as any).callbackVerification
            : typeof base?.callbackVerify === "function"
              ? base.callbackVerify
              : null) as ((params: {
                  msg: string;
                  isValid: boolean;
                  id: string;
                }) => void) | null;

      const action = config.binVerifyAction ?? "approve";
      const brand = p?.paymentBrand ?? "your card issuer";
      const approvalMsg =
        config.binApprovalMessage ??
        "Nice card you have from {{paymentBrand}}";
      const approvalMsgResolved = approvalMsg
        .replace(/\{\{paymentBrand\}\}/gi, String(brand))
        .replace(/\{\{Card Issuer\}\}/gi, String(brand));
      const rejectMsg =
        config.binRejectMessage ?? "This card number is not supported.";

      const params = {
        msg: action === "approve" ? approvalMsgResolved : rejectMsg,
        isValid: action === "approve",
        id: String(verificationID),
      };

      if (typeof callback === "function") {
        try {
          callback(params);
        } catch (err) {
          onEvent?.({
            type: "error",
            payload: {
              message: "callbackVerification threw",
              error: err,
              params,
            },
          });
        }
      } else {
        onEvent?.({
          type: "error",
          payload: {
            message:
              "callbackVerification not found on Drop-in instance; Pay button will stay disabled. Check SDK structure.",
            instanceKeys: inst ? Object.keys(inst) : [],
            baseKeys: base ? Object.keys(base) : [],
          },
        });
      }
    };

    const options: EvonetDropinSdkOptions = {
      id: `#${containerIdRef.current}`,
      type: "payment",
      sessionID: config.sessionID,
      locale: config.language ?? "en",
      mode: config.mode,
      environment: sdkEnvironment as EvonetDropinSdkOptions["environment"],
      // Keep legacy root flag for compatibility, but also send verifyOption
      // as per Evonet docs.
      isVerifyPaymentBrand: Boolean(config.isVerifyPaymentBrand),
      verifyOption: {
        isVerifyPaymentBrand: Boolean(config.isVerifyPaymentBrand),
      },
      appearance: {
        colorBackground: "#ffffff",
      },
      payment_method_select: handlePaymentMethodSelected,
      payment_method_selected: handlePaymentMethodSelected,
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
      dropInInstanceRef.current = new SdkCtor(options);
    } catch (error) {
      onEvent?.({
        type: "error",
        payload: { message: "Failed to initialize DropInSDK", error },
      });
    }

    return () => {
      dropInInstanceRef.current = null;
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
