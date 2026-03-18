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
  const handledVerificationIdsRef = useRef<Set<string>>(new Set());
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

      const verificationIdStr = String(verificationID);
      if (handledVerificationIdsRef.current.has(verificationIdStr)) {
        onEvent?.({
          type: "sdk_message",
          payload: {
            source: "payment_method_selected",
            note: "duplicate verificationID ignored",
            verificationID: verificationIdStr,
          },
        });
        return;
      }
      handledVerificationIdsRef.current.add(verificationIdStr);

      const inst = dropInInstanceRef.current as any;
      const base = inst?.value ?? inst;
      const callbackVerification =
        typeof base?.callbackVerification === "function"
          ? (base.callbackVerification as (params: {
              msg: string;
              isValid: boolean;
              id: string;
            }) => void)
          : typeof inst?.callbackVerification === "function"
            ? (inst.callbackVerification as (params: {
                msg: string;
                isValid: boolean;
                id: string;
              }) => void)
            : null;

      // --- BIN rules logic ---
      const first6No = String(p?.first6No ?? "");
      const rules = config.binRules ?? [];
      const matchedRule = rules.find((r) => r.first6No === first6No);

      let isValid: boolean;
      let msg: string;

      if (matchedRule) {
        isValid = true;
        msg = "";
      } else if (rules.some((rule) => rule.first6No.trim().length > 0)) {
        // If merchant configured BIN rules, unmatched cards are rejected.
        // Empty falseMessage lets the SDK use its documented default message.
        isValid = false;
        msg =
          rules.find((rule) => (rule.falseMessage ?? "").trim().length > 0)
            ?.falseMessage ?? "";
      } else {
        // No BIN configured → use SDK's normal behavior with no custom filter.
        isValid = true;
        msg = "";
      }

      onEvent?.({
        type: "sdk_message",
        payload: {
          source: "bin_verification_decision",
          first6No,
          matchedRule: matchedRule ?? null,
          isValid,
          msg,
          verificationID: verificationIdStr,
          paymentBrand: p?.paymentBrand ?? "",
        },
      });

      const params = {
        msg,
        isValid,
        id: verificationIdStr,
      };

      if (typeof callbackVerification === "function") {
        try {
          // Call as a method to preserve expected `this` binding in older SDK builds.
          if (typeof base?.callbackVerification === "function") {
            base.callbackVerification(params);
          } else {
            inst.callbackVerification(params);
          }
        } catch (err) {
          handledVerificationIdsRef.current.delete(verificationIdStr);
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
        handledVerificationIdsRef.current.delete(verificationIdStr);
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
      handledVerificationIdsRef.current = new Set();
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
