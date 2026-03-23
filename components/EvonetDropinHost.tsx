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

/** Strip callbacks so developers can copy/paste the exact SDK init object shape. */
function sdkOptionsToDebugPayload(
  options: EvonetDropinSdkOptions
): Record<string, unknown> {
  const {
    payment_method_select: _ps,
    payment_method_selected: _pss,
    payment_completed: _pc,
    payment_failed: _pf,
    payment_not_preformed: _pn,
    payment_cancelled: _pnc,
    ...rest
  } = options;
  return {
    ...rest,
    _note:
      "payment_method_select, payment_method_selected, payment_completed, payment_failed, payment_not_preformed, payment_cancelled are registered but omitted from JSON.",
  };
}

/**
 * Evonet / browser throws are often `Error` instances; `JSON.stringify` in logs
 * yields `{}`. Also handles strings and plain objects.
 */
function serializeCaught(value: unknown): Record<string, unknown> {
  if (value instanceof Error) {
    return {
      errorName: value.name,
      errorMessage: value.message,
      errorStack: value.stack,
    };
  }
  if (value === null || value === undefined) {
    return { errorDetail: String(value) };
  }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") {
    return { errorDetail: value };
  }
  if (t === "object") {
    try {
      const s = JSON.stringify(value);
      if (s && s !== "{}") {
        return { errorJSON: s };
      }
    } catch {
      /* ignore */
    }
    const o = value as Record<string, unknown>;
    if (o.message != null) {
      return { errorMessage: String(o.message) };
    }
    return { errorString: String(value) };
  }
  return { errorString: String(value) };
}

/**
 * Tear down a previous Drop-in instance before clearing DOM or constructing a new
 * one. Evonet may expose destroy/dispose/unmount on the instance or on `.value`.
 * Skipping this can leave Stencil (cil-dropin-components) holding stale nodes when
 * `innerHTML` is cleared — multiple inits then race on the same container.
 */
function safelyDestroyDropInInstance(instance: unknown): void {
  if (instance == null) {
    return;
  }
  const candidates: unknown[] = [instance];
  const wrapped = (instance as { value?: unknown }).value;
  if (wrapped != null && wrapped !== instance) {
    candidates.push(wrapped);
  }

  const methodNames = [
    "destroy",
    "dispose",
    "unmount",
    "teardown",
    "remove",
    "close",
    "stop",
  ] as const;

  for (const target of candidates) {
    if (target == null || typeof target !== "object") {
      continue;
    }
    const o = target as Record<string, unknown>;
    for (const name of methodNames) {
      const fn = o[name];
      if (typeof fn === "function") {
        try {
          (fn as () => void).call(target);
        } catch {
          /* best-effort */
        }
      }
    }
  }
}

function clearDropInContainer(containerId: string): void {
  const el = document.getElementById(containerId);
  if (el) {
    el.innerHTML = "";
  }
}

export interface SdkInitAppliedInfo {
  /** Monotonic counter from the host page (each successful DropInSDK construction). */
  initGeneration: number;
  /** ISO timestamp when DropInSDK was constructed. */
  appliedAt: string;
  /** JSON-safe view of options passed to `new DropInSDK(...)`. */
  debugPayload: Record<string, unknown>;
}

interface EvonetDropinHostProps {
  config: EvonetDropinConfig;
  /**
   * Increment to (re)construct DropInSDK. First meaningful init should use 1+.
   * Parameter-only tweaks should bump this via the parent (debounced) without
   * changing unrelated `config` identity semantics.
   */
  initGeneration: number;
  onEvent?: (event: EvonetDropinEvent) => void;
  /** Called after each successful `new DropInSDK(...)` with a serializable payload. */
  onSdkInitApplied?: (info: SdkInitAppliedInfo) => void;
}

export function EvonetDropinHost({
  config,
  initGeneration,
  onEvent,
  onSdkInitApplied,
}: EvonetDropinHostProps) {
  const containerIdRef = useRef<string>("evonet-dropin-root");
  const dropInInstanceRef = useRef<unknown>(null);
  const handledVerificationIdsRef = useRef<Set<string>>(new Set());
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const configRef = useRef(config);
  configRef.current = config;

  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const onSdkInitAppliedRef = useRef(onSdkInitApplied);
  onSdkInitAppliedRef.current = onSdkInitApplied;

  const initGenRef = useRef(initGeneration);
  initGenRef.current = initGeneration;

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      onEventRef.current?.({
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
  }, []);

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
        onEventRef.current?.({
          type: "error",
          payload: { message: "Failed to load Evonet Drop-in script" },
        });
      },
      { once: true }
    );
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptLoaded) {
      return;
    }
    if (initGeneration < 1) {
      return;
    }

    const win = window as unknown as EvonetWindow;

    const SdkCtor = win.DropInSDK;
    if (!SdkCtor) {
      onEventRef.current?.({
        type: "error",
        payload: {
          message:
            "DropInSDK constructor not available on window after script load.",
        },
      });
      return;
    }

    safelyDestroyDropInInstance(dropInInstanceRef.current);
    dropInInstanceRef.current = null;
    clearDropInContainer(containerIdRef.current);

    const handlePaymentMethodSelected = (payload: unknown) => {
      onEventRef.current?.({
        type: "payment_method_selected",
        payload,
      });

      onEventRef.current?.({
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
        onEventRef.current?.({
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
        onEventRef.current?.({
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

      const latest = configRef.current;
      const first6No = String(p?.first6No ?? "");
      const rules = latest.binRules ?? [];
      const matchedRule = rules.find((r) => r.first6No === first6No);

      const isValid = true;

      onEventRef.current?.({
        type: "sdk_message",
        payload: {
          source: "bin_verification_decision",
          first6No,
          matchedRule: matchedRule ?? null,
          isValid,
          msg: "",
          verificationID: verificationIdStr,
          paymentBrand: p?.paymentBrand ?? "",
        },
      });

      const params: { isValid: boolean; id: string } = {
        isValid: true,
        id: verificationIdStr,
      };

      if (typeof callbackVerification === "function") {
        try {
          if (typeof base?.callbackVerification === "function") {
            base.callbackVerification(params);
          } else {
            inst.callbackVerification(params);
          }
        } catch (err) {
          handledVerificationIdsRef.current.delete(verificationIdStr);
          onEventRef.current?.({
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
        onEventRef.current?.({
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

    const capturedGen = initGeneration;
    let aborted = false;

    /**
     * Evonet bundles Stencil (cil-dropin-components). Enabling scan adds UI that
     * can throw `dynamicChildren` if we call `new DropInSDK` in the same tick as
     * `innerHTML = ""` or while React/StrictMode is re-running effects. Defer below.
     */
    const deferScanUi =
      configRef.current.uiOption?.card?.showScanCardButton === true;

    const runMount = () => {
      if (aborted) {
        return;
      }
      if (initGenRef.current !== capturedGen) {
        return;
      }

      const cfg = configRef.current;

      const envMap: Record<string, string> = {
        PROD: "HKG_prod",
        prod: "HKG_prod",
        TEST: "UAT",
        test: "UAT",
      };
      const sdkEnvironment = envMap[cfg.environment] ?? cfg.environment;

      const verifyBrand = Boolean(cfg.isVerifyPaymentBrand);
      const verifyOption = {
        ...cfg.verifyOption,
        isVerifyPaymentBrand: Boolean(
          cfg.verifyOption?.isVerifyPaymentBrand ?? verifyBrand
        ),
      };

      const appearanceDefaults = { colorBackground: "#ffffff" };
      const appearance = {
        ...appearanceDefaults,
        ...(cfg.appearance ?? {}),
      };

      const options: EvonetDropinSdkOptions = {
        id: `#${containerIdRef.current}`,
        type: "payment",
        sessionID: cfg.sessionID,
        locale: cfg.language ?? "en-US",
        mode: cfg.mode,
        environment: sdkEnvironment as EvonetDropinSdkOptions["environment"],
        isVerifyPaymentBrand: verifyBrand,
        verifyOption,
        ...(cfg.uiOption && Object.keys(cfg.uiOption).length > 0
          ? { uiOption: cfg.uiOption }
          : {}),
        appearance,
        payment_method_select: handlePaymentMethodSelected,
        payment_method_selected: handlePaymentMethodSelected,
        payment_completed: (payload: unknown) => {
          onEventRef.current?.({
            type: "payment_success",
            payload,
          });
        },
        payment_failed: (payload: unknown) => {
          onEventRef.current?.({
            type: "payment_fail",
            payload,
          });
        },
        payment_not_preformed: (payload: unknown) => {
          onEventRef.current?.({
            type: "payment_pending",
            payload,
          });
        },
        payment_cancelled: (payload: unknown) => {
          onEventRef.current?.({
            type: "payment_cancelled",
            payload,
          });
        },
      };

      try {
        safelyDestroyDropInInstance(dropInInstanceRef.current);
        dropInInstanceRef.current = null;
        clearDropInContainer(containerIdRef.current);

        const debugPayload = sdkOptionsToDebugPayload(options);
        // eslint-disable-next-line no-new
        dropInInstanceRef.current = new SdkCtor(options);
        handledVerificationIdsRef.current = new Set();

        onSdkInitAppliedRef.current?.({
          initGeneration: capturedGen,
          appliedAt: new Date().toISOString(),
          debugPayload,
        });
      } catch (error) {
        const card = cfg.uiOption?.card;
        const payload: Record<string, unknown> = {
          message: "Failed to initialize DropInSDK",
          ...serializeCaught(error),
        };
        if (card && Object.keys(card).length > 0) {
          payload.uiOptionCardSnapshot = card;
        }
        if (card?.showScanCardButton === true) {
          payload.scanHint =
            "Scan UI uses cil-dropin-components (Stencil). Errors like dynamicChildren often mean mount ran while the previous tree was still tearing down—this host defers mount with rAF/setTimeout. If it persists: use HTTPS/Safari, avoid @latest if Evonet recommends a pinned SDK, or disable showScanCardButton.";
        }
        onEventRef.current?.({
          type: "error",
          payload,
        });
      }
    };

    let raf1 = 0;
    raf1 = requestAnimationFrame(() => {
      if (aborted) {
        return;
      }
      requestAnimationFrame(() => {
        if (aborted || initGenRef.current !== capturedGen) {
          return;
        }
        if (deferScanUi) {
          window.setTimeout(runMount, 0);
        } else {
          runMount();
        }
      });
    });

    return () => {
      aborted = true;
      cancelAnimationFrame(raf1);
      safelyDestroyDropInInstance(dropInInstanceRef.current);
      dropInInstanceRef.current = null;
      clearDropInContainer(containerIdRef.current);
    };
  }, [initGeneration, scriptLoaded]);

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
