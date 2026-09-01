"use client";

import { Alert, Box } from "@mui/material";
import { useEffect, useId, useRef, useState } from "react";
import type {
  EvonetDropinConfig,
  EvonetDropinEvent,
  EvonetDropinMode,
  EvonetDropinSdkOptions,
  EvonetSdkUiOption,
  EvonetWindow,
} from "../types/evonet";
import { DROPIN_SCRIPT_SRC } from "../lib/dropinSdkScript";
import { buildDropinPulseCss } from "../lib/dropinPulseTargets";
import { applyDropinAppearanceCss } from "../lib/applyDropinAppearanceCss";
import { dismissDropinQrOverlays } from "../lib/dismissDropinQrOverlay";
import {
  installGooglePayProbeGlobal,
  runGooglePayProbeAfterInit,
} from "../lib/googlePayProbe";

function resolveContainerMinHeight(
  mode: EvonetDropinMode,
  compact: boolean
): number {
  if (mode === "fullPage") {
    return 560;
  }
  if (mode === "bottomUp") {
    return 480;
  }
  return compact ? 0 : 320;
}

const DEFAULT_SCRIPT_SRC = DROPIN_SCRIPT_SRC;

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
      "payment_method_select, payment_method_selected, payment_completed, payment_failed, payment_not_preformed, payment_cancelled, order_created are registered but omitted from JSON.",
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

function unwrapDropinSdkInstance(
  instance: unknown
): {
  options?: Record<string, unknown>;
  store?: { state?: { options?: Record<string, unknown> } };
} | null {
  if (instance == null || typeof instance !== "object") {
    return null;
  }
  const root = instance as Record<string, unknown>;
  const wrapped = root.value;
  const target =
    wrapped != null && typeof wrapped === "object"
      ? (wrapped as Record<string, unknown>)
      : root;
  return target as {
    options?: Record<string, unknown>;
    store?: { state?: { options?: Record<string, unknown> } };
  };
}

/**
 * Patch `uiOption.customDescription` on the live Vuex store. Do not call
 * `setOptions` — that rewrites appearance CSS vars and would undo Builder live
 * color/font tweaks. Replace `state.options` so Vue computeds invalidate.
 */
function hotPatchDropinCustomDescription(
  instance: unknown,
  customDescription: EvonetSdkUiOption["customDescription"] | undefined
): boolean {
  const inst = unwrapDropinSdkInstance(instance);
  const stateOptions = inst?.store?.state?.options;
  if (!inst || !stateOptions || typeof stateOptions !== "object") {
    return false;
  }
  const nextCopy: Record<string, unknown> =
    customDescription && Object.keys(customDescription).length > 0
      ? { ...customDescription }
      : {};
  const prevUi =
    stateOptions.uiOption && typeof stateOptions.uiOption === "object"
      ? (stateOptions.uiOption as Record<string, unknown>)
      : {};
  const nextOptions = {
    ...stateOptions,
    uiOption: {
      ...prevUi,
      customDescription: nextCopy,
    },
  };
  inst.store!.state!.options = nextOptions;
  inst.options = nextOptions;
  return true;
}

const APPEARANCE_FONT_GROUP_KEYS = [
  "button",
  "heading",
  "subHeading",
  "label",
  "labelInfo",
  "inputField",
  "paragraph",
  "placeholder",
] as const;

function stripAppearanceTypographyField(
  appearance: unknown,
  field: "fontWeight"
): Record<string, unknown> | null {
  if (!appearance || typeof appearance !== "object") {
    return null;
  }
  const next: Record<string, unknown> = {
    ...(appearance as Record<string, unknown>),
  };
  let changed = false;
  for (const key of APPEARANCE_FONT_GROUP_KEYS) {
    const group = next[key];
    if (!group || typeof group !== "object") {
      continue;
    }
    const groupObj = { ...(group as Record<string, unknown>) };
    if (field in groupObj) {
      delete groupObj[field];
      changed = true;
    }
    if (Object.keys(groupObj).length > 0) {
      next[key] = groupObj;
    } else {
      delete next[key];
    }
  }
  return changed ? next : null;
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
  /**
   * Tighter host chrome for constrained surfaces (e.g. storefront checkout sheet).
   * Avoids a tall empty frame before payment methods paint.
   */
  compact?: boolean;
  /**
   * Keep the Drop-in pay CTA visible inside a short scroll parent (storefront
   * drawer). SDK only position:fixed-s the footer for fullPage/bottomUp; embedded
   * leaves it at content end where a constrained drawer can hide it.
   */
  stickyPayButton?: boolean;
  /**
   * Builder “Highlight UI Controls”: appearance parameter key whose mapped Drop-in
   * regions receive a cyan outline pulse. Null/undefined clears the highlight.
   */
  pulseKey?: string | null;
}

export function EvonetDropinHost({
  config,
  initGeneration,
  onEvent,
  onSdkInitApplied,
  compact = false,
  stickyPayButton = false,
  pulseKey = null,
}: EvonetDropinHostProps) {
  // Unique per host — Builder + storefront checkout can both mount Drop-in;
  // a shared `#evonet-dropin-root` made the SDK bind to the hidden Builder node.
  const containerId = `evonet-dropin-${useId().replace(/:/g, "")}`;
  const containerIdRef = useRef(containerId);
  containerIdRef.current = containerId;
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

  const pulseKeyRef = useRef(pulseKey);
  pulseKeyRef.current = pulseKey;

  /** Scoped pulse keyframes + selectors (same-document Drop-in chrome). */
  useEffect(() => {
    const styleId = `${containerId}-pulse-css`;
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = buildDropinPulseCss(containerId);
    return () => {
      styleEl?.remove();
    };
  }, [containerId]);

  /** Console helper: `window.__evonetProbeGooglePay()` — no UI. */
  useEffect(() => {
    installGooglePayProbeGlobal();
  }, []);

  /**
   * Apply / restart `data-pulse` after Auto refresh remounts Drop-in children
   * so the outline animation survives destroy/rebuild.
   */
  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el) {
      return;
    }
    const key = pulseKeyRef.current;
    if (!key) {
      el.removeAttribute("data-pulse");
      return;
    }
    el.removeAttribute("data-pulse");
    const raf = requestAnimationFrame(() => {
      const current = pulseKeyRef.current;
      if (current) {
        el.setAttribute("data-pulse", current);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [containerId, pulseKey, initGeneration]);

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
    const win = window as unknown as EvonetWindow;

    const markScriptLoaded = (script?: HTMLScriptElement) => {
      if (script) {
        script.dataset.loaded = "true";
      }
      setScriptLoaded(true);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-evonet-dropin="true"]'
    );
    if (existing) {
      const scriptReadyState = (
        existing as HTMLScriptElement & { readyState?: string }
      ).readyState;
      if (
        existing.dataset.loaded === "true" ||
        scriptReadyState === "complete" ||
        scriptReadyState === "loaded" ||
        win.DropInSDK
      ) {
        markScriptLoaded(existing);
        return;
      }
      existing.addEventListener("load", () => markScriptLoaded(existing), {
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
        markScriptLoaded(script);
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

  /**
   * Drop-in only fires payment_method_selected once the PAN reaches 8 digits.
   * Clearing the field does not emit an event, so promo/block banners would stick.
   * Watch card-number inputs and notify the host page when BIN is no longer usable.
   */
  useEffect(() => {
    const root = document.getElementById(containerId);
    if (!root) {
      return;
    }

    let lastDigits = "";
    const readDigits = (event: Event): string | null => {
      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      const candidates: EventTarget[] = [
        ...path,
        event.target,
      ].filter(Boolean) as EventTarget[];

      for (const node of candidates) {
        if (!(node instanceof HTMLInputElement)) {
          continue;
        }
        const name = (node.name || node.id || "").toLowerCase();
        const autocomplete = (node.getAttribute("autocomplete") || "").toLowerCase();
        const placeholder = (node.getAttribute("placeholder") || "").toLowerCase();
        const aria = (node.getAttribute("aria-label") || "").toLowerCase();
        const maxLen = Number(node.maxLength || 0);
        const looksLikeCard =
          name.includes("cardnumber") ||
          name.includes("card_number") ||
          name.includes("card-number") ||
          autocomplete.includes("cc-number") ||
          placeholder.includes("card number") ||
          aria.includes("card number") ||
          (node.type === "tel" && maxLen >= 16 && maxLen <= 24);
        if (!looksLikeCard) {
          continue;
        }
        return node.value.replace(/\D/g, "");
      }
      return null;
    };

    const maybeClear = (digits: string) => {
      if (digits === lastDigits) {
        return;
      }
      const wasReady = lastDigits.length >= 6;
      lastDigits = digits;
      if (wasReady && digits.length < 6) {
        handledVerificationIdsRef.current.clear();
        onEventRef.current?.({
          type: "sdk_message",
          payload: {
            source: "bin_verification_cleared",
            reason: "card_number_incomplete",
            digitsLength: digits.length,
          },
        });
      }
    };

    const onInput = (event: Event) => {
      const digits = readDigits(event);
      if (digits == null) {
        return;
      }
      maybeClear(digits);
    };

    root.addEventListener("input", onInput, true);
    root.addEventListener("change", onInput, true);
    return () => {
      root.removeEventListener("input", onInput, true);
      root.removeEventListener("change", onInput, true);
    };
  }, [containerId, initGeneration, scriptLoaded]);

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

    const capturedGen = initGeneration;
    let aborted = false;

    /** Lets the demo page see explicit destroy / clear / construct steps in the event list. */
    const emitHostPhase = (phase: string, extra?: Record<string, unknown>) => {
      onEventRef.current?.({
        type: "sdk_message",
        payload: {
          source: "dropin_host",
          phase,
          initGeneration: capturedGen,
          ...extra,
        },
      });
    };

    emitHostPhase("effect_enter");

    emitHostPhase("sync_destroy_previous_instance", {
      hadPreviousRef: dropInInstanceRef.current != null,
    });
    safelyDestroyDropInInstance(dropInInstanceRef.current);
    dropInInstanceRef.current = null;

    emitHostPhase("sync_clear_container", {
      containerId: containerIdRef.current,
    });
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
      const dpanFirst6No = String(p?.dpanFirst6No ?? "");
      const bin = first6No || dpanFirst6No;
      const rules = latest.binRules ?? [];
      const matchedRule = bin
        ? rules.find((r) => r.first6No.length === 6 && r.first6No === bin)
        : undefined;
      const action = matchedRule?.action === "block" ? "block" : "allow";
      const isValid = action !== "block";
      const msg = !isValid
        ? (
            matchedRule?.rejectMessage?.trim() ||
            matchedRule?.message?.trim() ||
            "Card not accepted"
          )
        : "";

      onEventRef.current?.({
        type: "sdk_message",
        payload: {
          source: "bin_verification_decision",
          first6No: bin,
          dpanFirst6No: dpanFirst6No || undefined,
          matchedRule: matchedRule ?? null,
          action,
          isValid,
          msg,
          verificationID: verificationIdStr,
          paymentBrand: p?.paymentBrand ?? "",
          paymentMethod: p?.paymentMethod ?? "",
        },
      });

      const params: { isValid: boolean; id: string; msg?: string } = {
        isValid,
        id: verificationIdStr,
      };
      if (!isValid) {
        params.msg = msg;
      }

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

    /**
     * Evonet bundles Stencil (cil-dropin-components). Enabling scan adds UI that
     * can throw `dynamicChildren` if we call `new DropInSDK` in the same tick as
     * `innerHTML = ""` or while React/StrictMode is re-running effects. Defer below.
     */
    const deferScanUi =
      configRef.current.uiOption?.card?.showScanCardButton === true;

    emitHostPhase("sync_teardown_complete", {
      deferScanUi,
      next: deferScanUi ? "raf_then_setTimeout_runMount" : "raf_then_runMount",
    });

    const runMount = () => {
      if (aborted) {
        return;
      }
      if (initGenRef.current !== capturedGen) {
        emitHostPhase("runMount_skipped_stale_generation", {
          currentGen: initGenRef.current,
          capturedGen,
        });
        return;
      }

      emitHostPhase("runMount_start");

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

      // SDK (cil-dropin-components) gates the web 2-column panel on
      // `uiOption.columns` (lowercase). Docs' `Columns` key is ignored.
      const wantColumns =
        cfg.Columns === true || cfg.uiOption?.columns === true;
      const uiOption = {
        ...(cfg.uiOption ?? {}),
        ...(wantColumns ? { columns: true as const } : {}),
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
        ...(Object.keys(uiOption).length > 0 ? { uiOption } : {}),
        appearance,
        payment_method_select: handlePaymentMethodSelected,
        payment_method_selected: handlePaymentMethodSelected,
        payment_completed: (payload: unknown) => {
          // SDK inquiry Success does not close the in-page QR van-popup.
          dismissDropinQrOverlays();
          onEventRef.current?.({
            type: "payment_success",
            payload,
          });
        },
        payment_failed: (payload: unknown) => {
          dismissDropinQrOverlays();
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
          dismissDropinQrOverlays();
          onEventRef.current?.({
            type: "payment_cancelled",
            payload,
          });
        },
        order_created: (payload: unknown) => {
          // QR "Completed" only signals user intent — merchant must confirm status.
          dismissDropinQrOverlays();
          onEventRef.current?.({
            type: "order_created",
            payload,
          });
        },
      };

      try {
        emitHostPhase("runMount_destroy_previous_instance", {
          hadPreviousRef: dropInInstanceRef.current != null,
        });
        safelyDestroyDropInInstance(dropInInstanceRef.current);
        dropInInstanceRef.current = null;

        emitHostPhase("runMount_clear_container", {
          containerId: containerIdRef.current,
        });
        clearDropInContainer(containerIdRef.current);

        emitHostPhase("before_new_dropinsdk", {
          containerSelector: `#${containerIdRef.current}`,
        });

        const debugPayload = sdkOptionsToDebugPayload(options);
        // eslint-disable-next-line no-new
        dropInInstanceRef.current = new SdkCtor(options);
        handledVerificationIdsRef.current = new Set();

        onSdkInitAppliedRef.current?.({
          initGeneration: capturedGen,
          appliedAt: new Date().toISOString(),
          debugPayload,
        });

        emitHostPhase("construct_ok", {
          note: "new DropInSDK(...) returned; instance ref set",
        });
        // Keep :root vars aligned with Builder live appearance (same helper as Auto refresh).
        applyDropinAppearanceCss(appearance);
        runGooglePayProbeAfterInit(sdkEnvironment);
      } catch (error) {
        const hasBorderRadius =
          Array.isArray(options.appearance?.borderRadius) &&
          options.appearance!.borderRadius!.length > 0;
        if (hasBorderRadius) {
          try {
            const safeAppearance: Record<string, unknown> = {
              ...(options.appearance as Record<string, unknown>),
            };
            delete safeAppearance.borderRadius;
            const fallbackOptions: EvonetDropinSdkOptions = {
              ...options,
              appearance: safeAppearance as EvonetDropinSdkOptions["appearance"],
            };

            emitHostPhase("construct_retry_without_border_radius");
            const debugPayload = sdkOptionsToDebugPayload(fallbackOptions);
            // eslint-disable-next-line no-new
            dropInInstanceRef.current = new SdkCtor(fallbackOptions);
            handledVerificationIdsRef.current = new Set();

            onSdkInitAppliedRef.current?.({
              initGeneration: capturedGen,
              appliedAt: new Date().toISOString(),
              debugPayload: {
                ...debugPayload,
                _note:
                  "borderRadius caused SDK init failure and was removed for fallback preview.",
              },
            });

            onEventRef.current?.({
              type: "sdk_message",
              payload: {
                source: "dropin_host",
                phase: "construct_ok_without_border_radius",
                note: "Fallback init succeeded after removing appearance.borderRadius.",
              },
            });

            applyDropinAppearanceCss(appearance);
            runGooglePayProbeAfterInit(sdkEnvironment);
            return;
          } catch {
            // Fall through to normal error reporting.
          }
        }

        const appearanceWithoutFontWeight = stripAppearanceTypographyField(
          options.appearance,
          "fontWeight"
        );
        if (appearanceWithoutFontWeight) {
          try {
            const fallbackOptions: EvonetDropinSdkOptions = {
              ...options,
              appearance:
                appearanceWithoutFontWeight as EvonetDropinSdkOptions["appearance"],
            };
            emitHostPhase("construct_retry_without_font_weight");
            const debugPayload = sdkOptionsToDebugPayload(fallbackOptions);
            // eslint-disable-next-line no-new
            dropInInstanceRef.current = new SdkCtor(fallbackOptions);
            handledVerificationIdsRef.current = new Set();

            onSdkInitAppliedRef.current?.({
              initGeneration: capturedGen,
              appliedAt: new Date().toISOString(),
              debugPayload: {
                ...debugPayload,
                _note:
                  "fontWeight caused SDK init failure and was removed from appearance typography for fallback preview.",
              },
            });

            onEventRef.current?.({
              type: "sdk_message",
              payload: {
                source: "dropin_host",
                phase: "construct_ok_without_font_weight",
                note: "Fallback init succeeded after removing appearance.*.fontWeight.",
              },
            });
            applyDropinAppearanceCss(appearanceWithoutFontWeight);
            runGooglePayProbeAfterInit(sdkEnvironment);
            return;
          } catch {
            // Fall through to normal error reporting.
          }
        }

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
        emitHostPhase("construct_threw", {
          errorMessage: payload.errorMessage,
        });
      }
    };

    emitHostPhase("raf_scheduled");

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
      onEventRef.current?.({
        type: "sdk_message",
        payload: {
          source: "dropin_host",
          phase: "effect_cleanup_destroy_previous_instance",
          initGeneration: capturedGen,
          hadPreviousRef: dropInInstanceRef.current != null,
        },
      });
      safelyDestroyDropInInstance(dropInInstanceRef.current);
      dropInInstanceRef.current = null;
      onEventRef.current?.({
        type: "sdk_message",
        payload: {
          source: "dropin_host",
          phase: "effect_cleanup_clear_container",
          initGeneration: capturedGen,
          containerId: containerIdRef.current,
        },
      });
      clearDropInContainer(containerIdRef.current);
    };
  }, [initGeneration, scriptLoaded]);

  const customDescriptionJson = JSON.stringify(
    config.uiOption?.customDescription ?? null
  );

  useEffect(() => {
    if (initGeneration < 1 || !scriptLoaded) {
      return;
    }
    hotPatchDropinCustomDescription(
      dropInInstanceRef.current,
      config.uiOption?.customDescription
    );
  }, [customDescriptionJson, initGeneration, scriptLoaded]);

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      {!scriptLoaded && (
        <Alert severity="warning" variant="outlined" sx={{ mb: compact ? 1 : 2 }}>
          Loading Evonet Drop-in SDK in the browser…
        </Alert>
      )}
      <Box
        id={containerId}
        data-pulse={pulseKey || undefined}
        sx={{
          minHeight: resolveContainerMinHeight(config.mode, compact),
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          /* Merchant/SDK panel fill — tracks Appearance colorBackground. */
          bgcolor: "var(--cil-dropIn-color-background, #ffffff)",
          /* Stage card already provides Figma’s 20px inset — keep host chrome tight. */
          px: compact ? 0 : { xs: 0.75, sm: 2 },
          py: compact ? 0 : { xs: 1, sm: 2 },
          // Keep overflow visible so SDK selection rings are not clipped.
          overflow: "visible",
        }}
      />
      <style jsx global>{`
        #${containerId} {
          max-width: 100% !important;
          /* Do not use overflow-x:auto here — CSS forces the other axis to clip too,
             which cuts the left/right of .cil-channel-title::after selection rings. */
          overflow: visible !important;
          /* Vant cell-group defaults to white; map to form / panel background. */
          --van-background-2: var(
            --cil-dropIn-color-form-background,
            var(--cil-dropIn-color-background, #ffffff)
          );
          --van-background-3: var(
            --cil-dropIn-color-form-background,
            var(--cil-dropIn-color-background, #ffffff)
          );
          --van-cell-group-background: var(--van-background-2);
          --van-cell-background: var(--van-background-2);
        }
        /* 3DS / payment iframes only — do not restyle wallet button internals. */
        #${containerId} iframe:not(.google-pay-btn iframe) {
          display: block;
          width: 100% !important;
          max-width: 100% !important;
          border: 0 !important;
          /* Let Evonet set height; never clip payment UI on iOS. */
          min-height: 0;
        }
        #${containerId} > * {
          max-width: 100% !important;
          box-sizing: border-box !important;
          overflow: visible !important;
        }
        /* Payment chrome must not clip the checked-channel ring. */
        #${containerId} .cil-dropIn-container,
        #${containerId} .cil-payment-method-conatiner,
        #${containerId} .cil-channel-wrap,
        #${containerId} .cil-channel-title {
          overflow: visible !important;
          outline: none;
        }
        /*
          SDK hardcodes .cil-dropIn-container { color: #212121 }, so payment
          method names ignore appearance.colorPrimary. Wire them to the token
          so Colors → Text → colorPrimary actually controls list labels.
        */
        #${containerId} .cil-dropIn-container {
          color: var(--cil-dropIn-color-primary) !important;
        }
        #${containerId} .cil-payment-method-name {
          color: var(--cil-dropIn-color-primary) !important;
        }
        /*
          SDK design: list has padding 0 16px; selected row paints a ring via
          .cil-channel-title::after { left/right: -17px } so it sits flush with
          the list border. Do not inflate padding — that separates the ring
          from the list stroke (especially on the first row).
        */
        #${containerId} .cil-payment-method-conatiner {
          padding: 0 16px !important;
          box-sizing: border-box !important;
        }
        #${containerId} .cil-channel-title::after {
          left: -17px !important;
          right: -17px !important;
        }
        /* Keep card PAN/expiry/CVC 1px borders inside the padded stage. */
        #${containerId} .card-form-container,
        #${containerId} .van-cell,
        #${containerId} .van-field {
          overflow: visible !important;
          box-sizing: border-box !important;
          max-width: 100%;
        }
        /*
          Card expand panel white flash: Vant cell-group + SDK
          .sub-payment-method-card { background: #fff }. Paint wrappers with
          colorFormBackground so dark themes stay consistent.
        */
        #${containerId} .extra-form-box,
        #${containerId} .mobile-card-form-wrap,
        #${containerId} .van-cell-group,
        #${containerId} .sub-payment-method-card {
          background: var(
            --cil-dropIn-color-form-background,
            var(--cil-dropIn-color-background, #ffffff)
          ) !important;
        }
        #${containerId} .extra-form-box::before {
          background-color: var(
            --cil-dropIn-color-form-background,
            var(--cil-dropIn-color-background, #ffffff)
          ) !important;
        }
        /* SDK hardcodes Total amount to #212121 / #646464. */
        #${containerId} .footer-summary-wrap .amount-label-field {
          color: var(--cil-dropIn-color-secondary, #757575) !important;
        }
        #${containerId} .footer-summary-wrap .amount-value-field {
          color: var(--cil-dropIn-color-primary, #212121) !important;
        }
        /*
          Google Pay CTA is Google's official button (not colorAction).
          Tailwind preflight sets button { background-color: transparent;
          background-image: none }, which can wash the GPay mark away.
          Restore a black fill WITHOUT forcing background-image:none — classic
          GPay buttons put the logo in background-image; !important none kills it.
        */
        #${containerId} .google-pay-btn {
          width: 100%;
          min-height: 46px;
        }
        #${containerId} .google-pay-btn > button,
        #${containerId} .google-pay-btn button.gpay-button,
        #${containerId} .google-pay-btn .gpay-button {
          background-color: #000 !important;
          /* Let Google's stylesheet own background-image / logo mark. */
          background-image: revert-layer !important;
          opacity: 1 !important;
          visibility: visible !important;
          border: 0 !important;
          min-height: 40px !important;
          width: 100% !important;
          cursor: pointer !important;
          color: #fff !important;
        }
        #${containerId} .google-pay-btn > button.white,
        #${containerId} .google-pay-btn button.gpay-button.white,
        #${containerId} .google-pay-btn .gpay-button.white {
          background-color: #fff !important;
          color: #3c4043 !important;
          outline: 1px solid #dadce0;
        }
        /* Prefer SVG / text children Google injects for the mark. */
        #${containerId} .google-pay-btn button.gpay-button > *,
        #${containerId} .google-pay-btn .gpay-button > * {
          opacity: 1 !important;
          visibility: visible !important;
        }
        #${containerId} .loading-button.google-loading-btn {
          background: #000 !important;
          min-height: 46px;
        }
        /* Checked radio: keep the inner dot visible (SDK uses #fff on action fill). */
        #${containerId} .cil-custom-radio.checked .radio-inner {
          background: #fff !important;
          width: 6px !important;
          height: 6px !important;
          border-radius: 50% !important;
          display: block !important;
          opacity: 1 !important;
        }
        ${
          stickyPayButton
            ? `
        /* Embedded mode: pin pay CTA to the bottom of the nearest scrollport.
           Skip when SDK already uses .fixed-footer (fullPage / bottomUp). */
        #${containerId} .cil-payment-method-footer:not(.fixed-footer) {
          position: sticky !important;
          bottom: 0 !important;
          z-index: 5 !important;
          margin-top: 8px !important;
          padding-top: 8px !important;
          padding-bottom: max(8px, env(safe-area-inset-bottom, 0px)) !important;
          background: var(--cil-dropIn-color-background, #ffffff) !important;
          box-shadow: none !important;
        }
        #${containerId} .mixin-payment-info-wrap:not(.has-fixed-footer) {
          padding-bottom: 0 !important;
        }
        #${containerId} .cil-payment-method-conatiner {
          /* Avoid SDK default bottom padding stacking with sticky footer. */
          margin-bottom: 0 !important;
        }
        `
            : ""
        }
      `}</style>
    </Box>
  );
}
