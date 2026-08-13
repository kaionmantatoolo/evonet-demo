"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import {
  EvonetDropinHost,
  type SdkInitAppliedInfo,
} from "../../../components/EvonetDropinHost";
import { DropinModePreviewShell } from "../../../components/DropinModePreviewShell";
import { VIEWPORT_HEIGHT } from "../../../lib/responsiveLayout";
import { DemoTransactionWarning } from "../../../components/DemoTransactionWarning";
import { EvonetPaymentReturnDialog } from "../../../components/EvonetPaymentReturnDialog";
import {
  getEvonetEnvironment,
  isEvonetProductionEnvironment,
} from "../../../lib/evonetEnvironment";
import {
  readStoredTargetOverride,
  sdkEnvironmentForTarget,
  targetFromSdkEnvironment,
  writeStoredTargetOverride,
  type EvonetTarget,
} from "../../../lib/evonetTarget";
import {
  parseEvonetReturnParams,
  parseEvonetSdkPaymentEvent,
  stripEvonetReturnQuery,
  type EvonetReturnParams,
} from "../../../lib/evonetReturnParams";
import {
  buildTnCUiOption,
  isValidTnCUrl,
  normalizeTnCUrl,
} from "../../../lib/evonetUiOption";
import type {
  BinRule,
  EvonetDropinConfig,
  EvonetDropinEvent,
  EvonetRecurringProcessingModel,
  EvonetSdkAppearance,
  EvonetSdkFontObject,
  EvonetSdkUiOption,
} from "../../../types/evonet";

const DEFAULT_ENVIRONMENT = getEvonetEnvironment();
const DEFAULT_SESSION_ID =
  process.env.NEXT_PUBLIC_EVONET_SESSION_ID ?? "REPLACE_WITH_REAL_SESSION_ID";
const DEFAULT_CURRENCY =
  process.env.NEXT_PUBLIC_EVONET_DEFAULT_CURRENCY ?? "HKD";
const ENV_CHIP_TAP_WINDOW_MS = 2000;
const ENV_CHIP_TAPS_REQUIRED = 5;

function generateOrderId(): string {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `EVT-${Date.now()}-${suffix}`;
}

/** Stable JSON fingerprint for DropInSDK-facing options (live-apply + auto-start init). */
function buildDropinSdkFingerprint(parts: {
  sessionID: string;
  environment: string;
  mode: string;
  locale: string;
  verifyPaymentBrand: boolean;
  maxWaitTime: string;
  columnsLayout: boolean;
  sdkUiOption: EvonetSdkUiOption;
  sdkAppearance: EvonetSdkAppearance;
}): string {
  const verifyOpt = parts.verifyPaymentBrand
    ? { maxWaitTime: parts.maxWaitTime.trim() || "10" }
    : undefined;
  return JSON.stringify({
    sessionID: parts.sessionID,
    environment: parts.environment,
    mode: parts.mode,
    locale: parts.locale,
    isVerifyPaymentBrand: parts.verifyPaymentBrand,
    verifyOption: verifyOpt,
    uiOption: {
      ...parts.sdkUiOption,
      ...(parts.columnsLayout ? { columns: true } : {}),
    },
    appearance: parts.sdkAppearance,
  });
}

const TYPOGRAPHY_GROUPS = [
  "button",
  "heading",
  "subHeading",
  "label",
  "labelInfo",
  "inputField",
  "paragraph",
  "placeholder",
] as const;

const FONT_FIELDS = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
] as const;

const RECURRING_MODEL_OPTIONS: {
  value: EvonetRecurringProcessingModel;
  label: string;
}[] = [
  { value: "Subscription", label: "Subscription" },
  { value: "Unscheduled", label: "Unscheduled (auto-debit)" },
];

const DEFAULT_ENABLED_PAYMENT_METHOD =
  "ApplePay,GooglePay,Octopus,*";

/** Parse comma-separated enabledPaymentMethod input into a string array. */
function parseEnabledPaymentMethodInput(
  input: string
): string[] | undefined {
  const methods = input
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return methods.length > 0 ? methods : undefined;
}

type TypographyGroup = (typeof TYPOGRAPHY_GROUPS)[number];
type FontField = (typeof FONT_FIELDS)[number];
type TypographyState = Record<TypographyGroup, EvonetSdkFontObject>;

function emptyFontObject(): EvonetSdkFontObject {
  return {
    fontFamily: "",
    fontSize: "",
    fontWeight: "",
    letterSpacing: "",
    lineHeight: "",
  };
}

function createEmptyTypographyState(): TypographyState {
  return {
    button: emptyFontObject(),
    heading: emptyFontObject(),
    subHeading: emptyFontObject(),
    label: emptyFontObject(),
    labelInfo: emptyFontObject(),
    inputField: emptyFontObject(),
    paragraph: emptyFontObject(),
    placeholder: emptyFontObject(),
  };
}

function EventLogList({
  events,
  filterSdk,
  emptyLabel,
  eventColor,
}: {
  events: EvonetDropinEvent[];
  filterSdk: boolean;
  emptyLabel: string;
  eventColor: string;
}) {
  const filtered = events.filter((e) =>
    filterSdk ? e.type === "sdk_message" : e.type !== "sdk_message"
  );

  if (filtered.length === 0) {
    return <p className="font-mono text-xs text-slate-400">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2">
      {filtered.map((event, index) => (
        <li key={index} className="rounded-none border border-white/20 bg-white/[0.04] px-3 py-2">
          <p className="font-mono text-xs font-semibold" style={{ color: eventColor }}>
            {event.type}
          </p>
          {event.payload != null && (
            <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-300">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          )}
        </li>
      ))}
    </ul>
  );
}

function EvonetDropinTestPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paymentReturnFromUrl = useMemo(
    () => parseEvonetReturnParams(searchParams),
    [searchParams]
  );
  const [paymentReturnPrompt, setPaymentReturnPrompt] =
    useState<EvonetReturnParams | null>(null);
  const [returnDialogDismissed, setReturnDialogDismissed] = useState(false);
  const showReturnDialog =
    Boolean(paymentReturnPrompt) && !returnDialogDismissed;
  const [sessionSpent, setSessionSpent] = useState(false);

  useEffect(() => {
    if (paymentReturnFromUrl) {
      setPaymentReturnPrompt(paymentReturnFromUrl);
      setReturnDialogDismissed(false);
      if (
        paymentReturnFromUrl.status === "success" ||
        paymentReturnFromUrl.status === "failed" ||
        paymentReturnFromUrl.status === "cancelled"
      ) {
        setSessionSpent(true);
      }
    }
  }, [paymentReturnFromUrl]);

  const [amount, setAmount] = useState<string>("10.00");
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [orderId, setOrderId] = useState("");
  const [description, setDescription] = useState<string>(
    isEvonetProductionEnvironment(DEFAULT_ENVIRONMENT)
      ? "Production validation transaction"
      : "UAT validation transaction"
  );
  const [allowAuthentication, setAllowAuthentication] = useState(false);
  const [saveCardForNextPurchase, setSaveCardForNextPurchase] = useState(false);
  const [userInfoReference, setUserInfoReference] = useState("");
  const [includeRecurringProcessingModel, setIncludeRecurringProcessingModel] =
    useState(true);
  const [recurringProcessingModel, setRecurringProcessingModel] =
    useState<EvonetRecurringProcessingModel>("Subscription");
  const [enabledPaymentMethodInput, setEnabledPaymentMethodInput] = useState(
    DEFAULT_ENABLED_PAYMENT_METHOD
  );

  const [customerName, setCustomerName] = useState<string>("Test User");
  const [customerEmail, setCustomerEmail] = useState<string>("test@example.com");
  const [customerPhone, setCustomerPhone] = useState<string>("85212345678");

  const [billingCountry, setBillingCountry] = useState<string>("HK");
  const [billingCity, setBillingCity] = useState<string>("Hong Kong");
  const [billingPostalCode, setBillingPostalCode] = useState<string>("000000");

  const [shippingCountry, setShippingCountry] = useState<string>("HK");
  const [shippingCity, setShippingCity] = useState<string>("Hong Kong");
  const [shippingPostalCode, setShippingPostalCode] = useState<string>("000000");

  const [environment, setEnvironment] = useState<string>(DEFAULT_ENVIRONMENT);
  const [mode, setMode] = useState<EvonetDropinConfig["mode"]>("embedded");
  const [modePreviewOpen, setModePreviewOpen] = useState(false);
  /** SDK / interaction API locale (Evonet: en-US, zh-CN, zh-TW, …). */
  const [locale, setLocale] = useState<string>("en-US");
  const [verifyPaymentBrand, setVerifyPaymentBrand] = useState<boolean>(true);
  const [maxWaitTime, setMaxWaitTime] = useState<string>("10");

  const [showSaveImage, setShowSaveImage] = useState(false);
  const [showCardHolderName, setShowCardHolderName] = useState(true);
  const [cvvForSavedCard, setCvvForSavedCard] = useState(true);
  const [showScanCardButton, setShowScanCardButton] = useState(false);
  const [autoInvokeCardScanner, setAutoInvokeCardScanner] = useState(false);
  const [showTnC, setShowTnC] = useState(false);
  const [tncMode, setTncMode] = useState<"checkbox" | "click2accept">(
    "click2accept"
  );
  const [tncUrl, setTncUrl] = useState(
    "https://evonetglobal.com/company-policies/privacy-policy/"
  );
  const [columnsLayout, setColumnsLayout] = useState(false);

  const [colorAction, setColorAction] = useState("");
  const [colorBackground, setColorBackground] = useState("");
  const [colorBoxStroke, setColorBoxStroke] = useState("");
  const [colorDisabled, setColorDisabled] = useState("");
  const [colorError, setColorError] = useState("");
  const [colorFormBackground, setColorFormBackground] = useState("");
  const [colorFormBorder, setColorFormBorder] = useState("");
  const [colorInverse, setColorInverse] = useState("");
  const [colorBoxFillingOutline, setColorBoxFillingOutline] = useState("");
  const [colorPlaceholder, setColorPlaceholder] = useState("");
  const [colorPrimary, setColorPrimary] = useState("");
  const [colorSecondary, setColorSecondary] = useState("");
  const [typography, setTypography] = useState<TypographyState>(
    createEmptyTypographyState
  );
  const [logoPosition, setLogoPosition] = useState<
    "left" | "middle" | "right"
  >("left");
  const [borderRadiusInput, setBorderRadiusInput] = useState("");
  const [binRules, setBinRules] = useState<BinRule[]>([
    {
      first6No: "552343",
      action: "allow",
      message: "This card is eligible for a limited-time checkout promotion.",
    },
  ]);

  const [sessionId, setSessionId] = useState<string>(DEFAULT_SESSION_ID);

  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  /**
   * Each increment re-runs `new DropInSDK(...)` with the latest `config` (read from a ref inside the host).
   * Use debounced bumps for live parameter tweaks so the iframe reflects uiOption / appearance / locale, etc.
   */
  const [sdkInitGeneration, setSdkInitGeneration] = useState(0);
  /** When true, changing SDK-facing parameters (fingerprint) re-inits Drop-in after a short debounce. */
  const [liveApplySdk, setLiveApplySdk] = useState(true);
  const prevSdkFingerprintRef = useRef<string>("");

  const [lastSdkInitInfo, setLastSdkInitInfo] = useState<SdkInitAppliedInfo | null>(
    null
  );
  const [copySdkPayloadHint, setCopySdkPayloadHint] = useState<string | null>(
    null
  );
  const [targetSwitchHint, setTargetSwitchHint] = useState<string | null>(null);
  const envChipTapCountRef = useRef(0);
  const envChipTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!targetSwitchHint) return;
    const id = window.setTimeout(() => setTargetSwitchHint(null), 2500);
    return () => window.clearTimeout(id);
  }, [targetSwitchHint]);

  const [events, setEvents] = useState<EvonetDropinEvent[]>([]);
  const [userAgent, setUserAgent] = useState<string>("Detecting user agent…");
  const [binPromoMessage, setBinPromoMessage] = useState<string | null>(null);
  const [binRejectMessage, setBinRejectMessage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    type: "payment_success" | "payment_fail" | "payment_cancelled" | null;
    payload?: {
      merchantTransID?: string;
      sessionID?: string;
      code?: string;
      message?: string;
    };
  }>({ type: null });

  const sdkUiOption: EvonetSdkUiOption = useMemo(() => {
    const tnc = buildTnCUiOption(showTnC, tncMode, tncUrl);
    return {
      showSaveImage,
      ...(columnsLayout ? { columns: true } : {}),
      card: {
        showCardHolderName,
        CVVForSavedCard: cvvForSavedCard,
        // Evonet defaults are false; omit when off so strict SDK validators don’t break.
        // When true, init may still fail without HTTPS / camera-capable context.
        ...(showScanCardButton ? { showScanCardButton: true } : {}),
        ...(autoInvokeCardScanner ? { autoInvokeCardScanner: true } : {}),
      },
      ...(tnc ? { TnC: tnc } : {}),
    };
  }, [
      autoInvokeCardScanner,
      columnsLayout,
      cvvForSavedCard,
      showCardHolderName,
      showSaveImage,
      showScanCardButton,
      showTnC,
      tncMode,
      tncUrl,
    ]
  );

  const sdkAppearance: EvonetSdkAppearance = useMemo(() => {
    const a: EvonetSdkAppearance = {};
    const put = (key: keyof EvonetSdkAppearance, value: string) => {
      const t = value.trim();
      if (t) {
        (a as Record<string, unknown>)[key as string] = t;
      }
    };
    put("colorBackground", colorBackground);
    put("colorAction", colorAction);
    put("colorBoxStroke", colorBoxStroke);
    put("colorDisabled", colorDisabled);
    put("colorError", colorError);
    put("colorFormBackground", colorFormBackground);
    put("colorFormBorder", colorFormBorder);
    put("colorInverse", colorInverse);
    put("colorBoxFillingOutline", colorBoxFillingOutline);
    put("colorPlaceholder", colorPlaceholder);
    put("colorPrimary", colorPrimary);
    put("colorSecondary", colorSecondary);
    if (logoPosition !== "left") {
      a.logoPosition = logoPosition;
    }
    const br = borderRadiusInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        if (/^\d+(\.\d+)?px$/i.test(s)) return s.toLowerCase();
        const n = Number.parseInt(s, 10);
        return Number.isNaN(n) ? "" : `${n}px`;
      })
      .filter(Boolean);
    if (br.length === 4) {
      a.borderRadius = br;
    }
    for (const group of TYPOGRAPHY_GROUPS) {
      const src = typography[group];
      const sanitized: EvonetSdkFontObject = {};
      for (const field of FONT_FIELDS) {
        const raw = src[field];
        const trimmed = typeof raw === "string" ? raw.trim() : "";
        if (trimmed) {
          sanitized[field] = trimmed;
        }
      }
      if (Object.keys(sanitized).length > 0) {
        a[group] = sanitized;
      }
    }
    return a;
  }, [
    borderRadiusInput,
    colorAction,
    colorBackground,
    colorBoxFillingOutline,
    colorBoxStroke,
    colorDisabled,
    colorError,
    colorFormBackground,
    colorFormBorder,
    colorInverse,
    colorPlaceholder,
    colorPrimary,
    colorSecondary,
    logoPosition,
    typography,
  ]);

  /** Only fields that are passed into `DropInSDK` — used for live re-init + debug diff. */
  const sdkOptionsFingerprint = useMemo(
    () =>
      buildDropinSdkFingerprint({
        sessionID: sessionId,
        environment,
        mode,
        locale,
        verifyPaymentBrand,
        maxWaitTime,
        columnsLayout,
        sdkUiOption,
        sdkAppearance,
      }),
    [
      columnsLayout,
      environment,
      locale,
      maxWaitTime,
      mode,
      sdkAppearance,
      sdkUiOption,
      sessionId,
      verifyPaymentBrand,
    ]
  );

  const config: EvonetDropinConfig = useMemo(
    () => ({
      type: "payment",
      sessionID: sessionId,
      environment: environment as EvonetDropinConfig["environment"],
      mode,
      amount: Number.isNaN(parseFloat(amount)) ? undefined : parseFloat(amount),
      currency,
      orderId,
      description,
      customerName,
      customerEmail,
      customerPhone,
      billingCountry,
      billingCity,
      billingPostalCode,
      shippingCountry,
      shippingCity,
      shippingPostalCode,
      language: locale,
      isVerifyPaymentBrand: verifyPaymentBrand,
      verifyOption: verifyPaymentBrand
        ? { maxWaitTime: maxWaitTime.trim() || "10" }
        : undefined,
      uiOption: sdkUiOption,
      appearance: sdkAppearance,
      binRules,
    }),
    [
      amount,
      billingCity,
      billingCountry,
      billingPostalCode,
      currency,
      customerEmail,
      customerName,
      customerPhone,
      description,
      environment,
      locale,
      maxWaitTime,
      mode,
      orderId,
      sdkAppearance,
      sdkUiOption,
      sessionId,
      shippingCity,
      shippingCountry,
      shippingPostalCode,
      verifyPaymentBrand,
      binRules,
    ]
  );

  const isSdkOverlayMode = mode === "fullPage" || mode === "bottomUp";

  useEffect(() => {
    if (!isSdkOverlayMode) {
      setModePreviewOpen(false);
    }
  }, [isSdkOverlayMode]);

  const handleInitialize = () => {
    if (sessionSpent) {
      void handleCreateSession({ initDropin: true });
      return;
    }
    if (!sessionId || sessionId === "REPLACE_WITH_REAL_SESSION_ID") {
      alert("Please provide a valid Evonet sessionID before initializing.");
      return;
    }
    if (!amount || Number.isNaN(parseFloat(amount))) {
      alert("Please enter a valid amount.");
      return;
    }
    setOrderId(generateOrderId());
    setEvents([]);
    prevSdkFingerprintRef.current = buildDropinSdkFingerprint({
      sessionID: sessionId,
      environment,
      mode,
      locale,
      verifyPaymentBrand,
      maxWaitTime,
      columnsLayout,
      sdkUiOption,
      sdkAppearance,
    });
    setSdkInitGeneration((g) => g + 1);
  };

  /** Re-run Drop-in with current SDK-facing params (no new orderId). */
  const handleApplySdkParamsNow = () => {
    if (sdkInitGeneration < 1) {
      alert(
        "Initialize Drop-in at least once using “Initialize / Re-init Drop-in” before applying parameters."
      );
      return;
    }
    prevSdkFingerprintRef.current = sdkOptionsFingerprint;
    setSdkInitGeneration((g) => g + 1);
  };

  useEffect(() => {
    if (!liveApplySdk || sdkInitGeneration < 1) {
      return;
    }
    if (prevSdkFingerprintRef.current === sdkOptionsFingerprint) {
      return;
    }
    const id = window.setTimeout(() => {
      prevSdkFingerprintRef.current = sdkOptionsFingerprint;
      setSdkInitGeneration((g) => g + 1);
    }, 500);
    return () => window.clearTimeout(id);
  }, [liveApplySdk, sdkInitGeneration, sdkOptionsFingerprint]);

  const handleEvent = useCallback((event: EvonetDropinEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, 50));

    const payload = event.payload as any;

    if (
      event.type === "sdk_message" &&
      payload?.source === "bin_verification_cleared"
    ) {
      setBinPromoMessage(null);
      setBinRejectMessage(null);
    } else if (
      event.type === "sdk_message" &&
      payload?.source === "bin_verification_decision"
    ) {
      const matchedRule = payload?.matchedRule as BinRule | null | undefined;
      const first6 = String(payload?.first6No ?? "");
      const isValid = Boolean(payload?.isValid);
      const action =
        payload?.action === "block" || matchedRule?.action === "block"
          ? "block"
          : "allow";

      if (!first6 || first6.length < 6) {
        setBinPromoMessage(null);
        setBinRejectMessage(null);
      } else if (!isValid || action === "block") {
        setBinPromoMessage(null);
        setBinRejectMessage(
          String(payload?.msg ?? "").trim() ||
            matchedRule?.rejectMessage?.trim() ||
            "Card not accepted"
        );
      } else {
        setBinRejectMessage(null);
        setBinPromoMessage(matchedRule?.message?.trim() || null);
      }
    } else if (event.type === "payment_method_selected") {
      const maybeFirst6 =
        (payload?.first6No as string | undefined) ||
        (payload?.dpanFirst6No as string | undefined);
      if (maybeFirst6 && maybeFirst6.length >= 6) {
        const matchedRule = binRules.find(
          (rule) => rule.first6No.length === 6 && rule.first6No === maybeFirst6
        );
        if (matchedRule?.action === "block") {
          setBinPromoMessage(null);
          setBinRejectMessage(
            matchedRule.rejectMessage?.trim() ||
              matchedRule.message?.trim() ||
              "Card not accepted"
          );
        } else {
          setBinRejectMessage(null);
          setBinPromoMessage(matchedRule?.message?.trim() || null);
        }
      } else {
        setBinPromoMessage(null);
        setBinRejectMessage(null);
      }
    }

    if (
      event.type === "payment_success" ||
      event.type === "payment_fail" ||
      event.type === "payment_cancelled"
    ) {
      setLastResult({
        type: event.type as "payment_success" | "payment_fail" | "payment_cancelled",
        payload,
      });
      const fromSdk = parseEvonetSdkPaymentEvent(event.type, payload);
      if (fromSdk) {
        setPaymentReturnPrompt(fromSdk);
        setReturnDialogDismissed(false);
        setSessionSpent(true);
      }
    }
  }, [binRules]);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setUserAgent(navigator.userAgent);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (envChipTapTimerRef.current) {
        clearTimeout(envChipTapTimerRef.current);
      }
    };
  }, []);

  const clearPaymentReturnQuery = useCallback(() => {
    const next = stripEvonetReturnQuery(
      new URLSearchParams(searchParams.toString())
    );
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, searchParams]);

  const handleCreateSession = async (options?: {
    initDropin?: boolean;
    environmentOverride?: string;
  }) => {
    setSessionError(null);
    if (saveCardForNextPurchase && !userInfoReference.trim()) {
      setSessionError(
        "User reference is required when Allow save card for next purchase is enabled (maps to userInfo.reference)."
      );
      return;
    }

    const numericAmount = parseFloat(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setSessionError("Please enter a valid amount before creating sessionID.");
      return;
    }

    if (!currency) {
      setSessionError("Currency is required.");
      return;
    }

    const envForSession = options?.environmentOverride ?? environment;
    const targetForSession = targetFromSdkEnvironment(envForSession);

    const newOrderId = generateOrderId();
    setOrderId(newOrderId);

    setIsCreatingSession(true);
    try {
      const enabledPaymentMethod = parseEnabledPaymentMethodInput(
        enabledPaymentMethodInput
      );
      const response = await fetch("/api/evonet/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: numericAmount,
          currency,
          orderId: newOrderId,
          description,
          environment: envForSession,
          target: targetForSession,
          locale,
          ...(enabledPaymentMethod ? { enabledPaymentMethod } : {}),
          ...(allowAuthentication ? { allowAuthentication: true } : {}),
          ...(saveCardForNextPurchase
            ? {
                saveCardForNextPurchase: true,
                userInfoReference: userInfoReference.trim(),
                includeRecurringProcessingModel,
                ...(includeRecurringProcessingModel
                  ? { recurringProcessingModel }
                  : {}),
              }
            : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const err =
          data?.error ?? "Failed to create sessionID via Evonet interaction API.";
        const details = data?.details;
        const detailStr =
          details && typeof details === "object"
            ? ` — ${JSON.stringify(details).slice(0, 400)}`
            : "";
        setSessionError(`${err}${detailStr}`);
        return;
      }

      if (!data?.sessionId) {
        setSessionError(
          "Interaction API did not return sessionId. Check server logs and Evonet docs."
        );
        return;
      }

      const sid = data.sessionId as string;
      setSessionId(sid);
      setSessionSpent(false);
      if (options?.initDropin) {
        prevSdkFingerprintRef.current = buildDropinSdkFingerprint({
          sessionID: sid,
          environment: envForSession,
          mode,
          locale,
          verifyPaymentBrand,
          maxWaitTime,
          columnsLayout,
          sdkUiOption,
          sdkAppearance,
        });
        setEvents([]);
        setSdkInitGeneration((g) => g + 1);
      }
    } catch (error) {
      setSessionError(
        error instanceof Error
          ? error.message
          : "Unexpected error creating sessionID."
      );
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleEnvironmentChipTap = () => {
    if (envChipTapTimerRef.current) {
      clearTimeout(envChipTapTimerRef.current);
    }
    envChipTapCountRef.current += 1;
    const taps = envChipTapCountRef.current;

    if (taps < ENV_CHIP_TAPS_REQUIRED) {
      envChipTapTimerRef.current = setTimeout(() => {
        envChipTapCountRef.current = 0;
        envChipTapTimerRef.current = null;
      }, ENV_CHIP_TAP_WINDOW_MS);
      return;
    }

    envChipTapCountRef.current = 0;
    envChipTapTimerRef.current = null;

    const nextTarget: EvonetTarget =
      targetFromSdkEnvironment(environment) === "PROD" ? "UAT" : "PROD";
    const nextEnv = sdkEnvironmentForTarget(nextTarget);

    try {
      writeStoredTargetOverride(nextTarget);
    } catch {
      /* ignore */
    }

    setEnvironment(nextEnv);
    setDescription(
      nextTarget === "PROD"
        ? "Production validation transaction"
        : "UAT validation transaction"
    );
    setTargetSwitchHint(`Switched to ${nextTarget}`);
    setSessionId(DEFAULT_SESSION_ID);
    setSdkInitGeneration(0);
    setEvents([]);
    setSessionError(null);

    void handleCreateSession({
      initDropin: true,
      environmentOverride: nextEnv,
    });
  };

  // On first load: create session via interaction API, then initialize Drop-in (host destroys old instance before re-init).
  // Skip when this tab is a wallet returnURL landing (e.g. Alipay/WeChat).
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      parseEvonetReturnParams(new URLSearchParams(window.location.search))
    ) {
      return;
    }

    const ac = new AbortController();
    let cancelled = false;

    const storedTarget = readStoredTargetOverride();
    const envForLoad = storedTarget
      ? sdkEnvironmentForTarget(storedTarget)
      : environment;
    if (storedTarget && envForLoad !== environment) {
      setEnvironment(envForLoad);
      setDescription(
        storedTarget === "PROD"
          ? "Production validation transaction"
          : "UAT validation transaction"
      );
    }

    const snap = {
      amount,
      currency,
      description:
        storedTarget === "PROD"
          ? "Production validation transaction"
          : storedTarget === "UAT"
            ? "UAT validation transaction"
            : description,
      environment: envForLoad,
      locale,
      enabledPaymentMethodInput,
      allowAuthentication,
      saveCardForNextPurchase,
      userInfoReference,
      includeRecurringProcessingModel,
      recurringProcessingModel,
      mode,
      verifyPaymentBrand,
      maxWaitTime,
      columnsLayout,
      sdkUiOption,
      sdkAppearance,
    };

    void (async () => {
      setSessionError(null);
      const numericAmount = parseFloat(snap.amount);
      if (Number.isNaN(numericAmount) || numericAmount <= 0) {
        setSessionError(
          "Enter a valid amount, then create a session."
        );
        return;
      }
      if (!snap.currency?.trim()) {
        setSessionError("Currency is required.");
        return;
      }
      if (snap.saveCardForNextPurchase && !snap.userInfoReference.trim()) {
        setSessionError(
          "User reference is required when save-card is enabled."
        );
        return;
      }

      setIsCreatingSession(true);
      const newOrderId = generateOrderId();
      setOrderId(newOrderId);

      try {
        const enabledPaymentMethod = parseEnabledPaymentMethodInput(
          snap.enabledPaymentMethodInput
        );
        const response = await fetch("/api/evonet/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: numericAmount,
            currency: snap.currency,
            orderId: newOrderId,
            description: snap.description,
            environment: snap.environment,
            target: targetFromSdkEnvironment(snap.environment),
            locale: snap.locale,
            ...(enabledPaymentMethod ? { enabledPaymentMethod } : {}),
            ...(snap.allowAuthentication ? { allowAuthentication: true } : {}),
            ...(snap.saveCardForNextPurchase
              ? {
                  saveCardForNextPurchase: true,
                  userInfoReference: snap.userInfoReference.trim(),
                  includeRecurringProcessingModel:
                    snap.includeRecurringProcessingModel,
                  ...(snap.includeRecurringProcessingModel
                    ? {
                        recurringProcessingModel:
                          snap.recurringProcessingModel,
                      }
                    : {}),
                }
              : {}),
          }),
          signal: ac.signal,
        });

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          const err =
            data?.error ??
            "Failed to create sessionID via Evonet interaction API.";
          const details = data?.details;
          const detailStr =
            details && typeof details === "object"
              ? ` — ${JSON.stringify(details).slice(0, 400)}`
              : "";
          setSessionError(`${err}${detailStr}`);
          return;
        }

        if (!data?.sessionId) {
          setSessionError(
            "Interaction API did not return sessionId. Check server logs and Evonet docs."
          );
          return;
        }

        const sid = data.sessionId as string;
        prevSdkFingerprintRef.current = buildDropinSdkFingerprint({
          sessionID: sid,
          environment: snap.environment,
          mode: snap.mode,
          locale: snap.locale,
          verifyPaymentBrand: snap.verifyPaymentBrand,
          maxWaitTime: snap.maxWaitTime,
          columnsLayout: snap.columnsLayout,
          sdkUiOption: snap.sdkUiOption,
          sdkAppearance: snap.sdkAppearance,
        });
        setSessionId(sid);
        setEvents([]);
        setSdkInitGeneration((g) => g + 1);
      } catch (error) {
        if ((error as Error)?.name === "AbortError") {
          return;
        }
        if (!cancelled) {
          setSessionError(
            error instanceof Error
              ? error.message
              : "Unexpected error while creating session on page load."
          );
        }
      } finally {
        // Always clear spinner (including React Strict Mode abort) so a follow-up run can show it again.
        setIsCreatingSession(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
    // Intentionally run once on mount with initial form defaults (React Strict Mode may abort & retry).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const envTarget = targetFromSdkEnvironment(environment);

  return (
    <main
      data-builder-chrome
      className="min-h-[var(--console-height)] overflow-x-hidden bg-background"
      style={{ "--console-height": VIEWPORT_HEIGHT } as React.CSSProperties}
    >
      <div className="mx-auto max-w-[1600px] space-y-4 px-2 py-3 sm:px-4 md:px-6 md:py-4">
        <Card className="rounded-none border border-border">
          <CardContent className="flex flex-col justify-between gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="text-base font-bold">Drop-in Dev Console</h1>
              <Badge
                variant={envTarget === "PROD" ? "destructive" : "warning"}
                className="cursor-pointer select-none"
                onClick={handleEnvironmentChipTap}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleEnvironmentChipTap();
                  }
                }}
                title="Tap 5 times to switch UAT / PROD"
                aria-label={`Environment ${envTarget}. Tap 5 times to switch.`}
              >
                {envTarget}
              </Badge>
              <Badge variant="outline" className="font-mono">init #{sdkInitGeneration}</Badge>
              <Badge variant="outline" className="font-mono">mode: {mode}</Badge>
              <Badge variant="outline" className="font-mono">locale: {locale}</Badge>
              {lastResult.type ? (
                <Badge
                  variant={lastResult.type === "payment_fail" ? "destructive" : "secondary"}
                  className={
                    lastResult.type === "payment_success"
                      ? "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                      : lastResult.type === "payment_cancelled"
                        ? "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
                        : ""
                  }
                >
                  {lastResult.type.replace("payment_", "")}
                </Badge>
              ) : null}
              <div className="ml-auto flex items-center gap-2 lg:hidden">
                <LocaleSwitcher />
                <ThemeToggle />
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-1 font-mono text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
              <span className="truncate text-amber-700 dark:text-amber-400">session: {sessionId.slice(0, 12) || "—"}…</span>
              <span className="truncate">order: {orderId || "—"}</span>
              <div className="hidden items-center gap-2 lg:flex">
                <LocaleSwitcher />
                <ThemeToggle />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid min-w-0 items-stretch gap-4 lg:grid-cols-3">
          <section className="order-2 flex min-h-0 min-w-0 lg:order-1">
            <Card className="flex h-full min-h-0 w-full flex-col rounded-none border border-border">
              <CardHeader className="shrink-0 border-b px-3 sm:px-4">
                <CardTitle className="text-base">Configuration</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Session auto-creates on load. Re-create after amount, currency, or environment changes.{" "}
                  <a
                    href="https://developer.evonetonline.com/docs/sdk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    SDK docs
                  </a>
                </p>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 sm:px-4">
                <div className="space-y-4 rounded-none border border-border p-3">
                  <div className="flex items-start justify-between gap-3 rounded-none border p-3">
                    <div className="min-w-0 flex-1">
                      <Label
                        htmlFor="allow-authentication"
                        className="min-w-0 items-start leading-snug break-words"
                      >
                        Allow authentication
                      </Label>
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        When enabled, sends allowAuthentication=true. Off by default (field omitted).
                      </p>
                    </div>
                    <Switch
                      id="allow-authentication"
                      className="shrink-0"
                      checked={allowAuthentication}
                      onCheckedChange={setAllowAuthentication}
                      aria-label="Allow authentication on interaction"
                    />
                  </div>
                  <div className="flex items-start justify-between gap-3 rounded-none border p-3">
                    <div className="min-w-0 flex-1">
                      <Label
                        htmlFor="save-card"
                        className="min-w-0 items-start leading-snug break-words"
                      >
                        Allow save card for next purchase
                      </Label>
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        Sends userInfo.reference and paymentMethod.recurringProcessingModel.
                      </p>
                    </div>
                    <Switch
                      id="save-card"
                      className="shrink-0"
                      checked={saveCardForNextPurchase}
                      onCheckedChange={setSaveCardForNextPurchase}
                      aria-label="Allow save card for next purchase interaction"
                    />
                  </div>
                  <div className="flex items-start justify-between gap-3 rounded-none border p-3">
                    <div className="min-w-0 flex-1">
                      <Label
                        htmlFor="recurring-model-enabled"
                        className="min-w-0 items-start leading-snug break-all"
                      >
                        Include paymentMethod.recurringProcessingModel
                      </Label>
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        Disable to send only userInfo.reference.
                      </p>
                    </div>
                    <Switch
                      id="recurring-model-enabled"
                      className="shrink-0"
                      checked={includeRecurringProcessingModel}
                      onCheckedChange={setIncludeRecurringProcessingModel}
                      disabled={!saveCardForNextPurchase}
                    />
                  </div>
                  <div className="grid gap-4">
                    <div className="min-w-0 space-y-2">
                      <Label
                        htmlFor="user-reference"
                        className="min-w-0 items-start leading-snug break-all"
                      >
                        User reference (userInfo.reference)
                      </Label>
                      <Input
                        id="user-reference"
                        value={userInfoReference}
                        onChange={(event) => setUserInfoReference(event.target.value)}
                        placeholder="your_customer_id_123"
                        disabled={!saveCardForNextPurchase}
                        required={saveCardForNextPurchase}
                      />
                      <p className="break-words text-xs text-muted-foreground">
                        Stable shopper ID used to bind the token.
                      </p>
                    </div>
                    <div className="min-w-0 space-y-2">
                      <Label>Recurring model</Label>
                      <Select
                        value={recurringProcessingModel}
                        onValueChange={(value) =>
                          setRecurringProcessingModel(value as EvonetRecurringProcessingModel)
                        }
                        disabled={!saveCardForNextPurchase || !includeRecurringProcessingModel}
                      >
                        <SelectTrigger className="w-full" aria-label="Recurring model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RECURRING_MODEL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-id">sessionID</Label>
                  <Input
                    id="session-id"
                    value={sessionId}
                    onChange={(event) => setSessionId(event.target.value)}
                    placeholder="Generated by interaction API / backend"
                    className="font-mono"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleCreateSession()}
                    disabled={isCreatingSession}
                  >
                    {isCreatingSession ? "Creating session…" : "Create session"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={handleInitialize}>
                    {sessionSpent
                      ? "Refresh session & Re-init Drop-in"
                      : "Initialize / Re-init Drop-in"}
                  </Button>
                </div>
                {sessionSpent && !showReturnDialog ? (
                  <div
                    role="status"
                    className="rounded-none border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground"
                  >
                    This session was already used for a payment. Re-init alone will fail —
                    create a fresh session first (the Re-init button does both when spent).
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Session uses server credentials. Initialize runs Drop-in in this browser.
                </p>

                <div className="space-y-3 rounded-none border border-border bg-muted/40 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Live SDK sync</p>
                  <div className="flex items-start justify-between gap-3 rounded-none border bg-background p-3">
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="live-sdk-sync">Auto-apply changes</Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Re-initialize when locale, UI, or appearance options change.
                      </p>
                    </div>
                    <Switch
                      id="live-sdk-sync"
                      className="shrink-0"
                      checked={liveApplySdk}
                      onCheckedChange={setLiveApplySdk}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleApplySdkParamsNow}
                    disabled={sdkInitGeneration < 1}
                  >
                    Apply parameters now
                  </Button>
                </div>

                {sessionError ? (
                  <div role="alert" className="rounded-none border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {sessionError}
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment</Label>
                    <Input
                      id="environment"
                      value={environment}
                      onChange={(event) => setEnvironment(event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">e.g. HKG_prod, BKK_prod, UAT</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <Select
                      value={mode}
                      onValueChange={(value) => setMode(value as EvonetDropinConfig["mode"])}
                    >
                      <SelectTrigger className="w-full" aria-label="Drop-in mode"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="embedded">embedded</SelectItem>
                        <SelectItem value="fullPage">fullPage</SelectItem>
                        <SelectItem value="bottomUp">bottomUp</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {mode === "embedded"
                        ? "Inline widget inside the preview card."
                        : mode === "fullPage"
                          ? "Real SDK fullPage mode — opens in a viewport stage (not an app sheet wrapping embedded)."
                          : "Real SDK bottomUp mode — opens in a viewport stage so the SDK sheet can render."}
                    </p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Locale (SDK)</Label>
                    <Select value={locale} onValueChange={setLocale}>
                      <SelectTrigger className="w-full" aria-label="SDK locale"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (en-US)</SelectItem>
                        <SelectItem value="zh-CN">Chinese Simplified (zh-CN)</SelectItem>
                        <SelectItem value="zh-TW">Traditional Chinese (zh-TW)</SelectItem>
                        <SelectItem value="ja-JP">Japanese (ja-JP)</SelectItem>
                        <SelectItem value="ko-KR">Korean (ko-KR)</SelectItem>
                        <SelectItem value="th-TH">Thai (th-TH)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Accordion type="multiple" className="space-y-3">
                  <AccordionItem value="payment-ui" className="rounded-none border border-border px-3">
                    <AccordionTrigger>Payment UI</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      {[
                        [showSaveImage, setShowSaveImage, "showSaveImage", "Allow saving QR to device"],
                        [columnsLayout, setColumnsLayout, "Columns (two-column layout)", "Sent as uiOption.columns (lowercase — SDK ignores docs' Columns). Web + wide viewport; shows method list + Payment Summary side by side."],
                        [showCardHolderName, setShowCardHolderName, "showCardHolderName", "uiOption.card"],
                        [cvvForSavedCard, setCvvForSavedCard, "CVVForSavedCard", "uiOption.card"],
                        [showScanCardButton, setShowScanCardButton, "showScanCardButton", "Requires supported HTTPS context"],
                        [autoInvokeCardScanner, setAutoInvokeCardScanner, "autoInvokeCardScanner", "Requires supported HTTPS context"],
                        [showTnC, setShowTnC, "showTnC", "uiOption.TnC"],
                      ].map(([checked, setter, label, caption]) => (
                        <div key={label as string} className="flex items-start justify-between gap-3 rounded-none border p-3">
                          <div className="min-w-0 flex-1">
                            <Label>{label as string}</Label>
                            <p className="mt-1 text-xs text-muted-foreground">{caption as string}</p>
                          </div>
                          <Switch
                            className="shrink-0"
                            checked={checked as boolean}
                            onCheckedChange={setter as (value: boolean) => void}
                            aria-label={label as string}
                          />
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">
                        Scan options can fail on unsupported browsers; check <code>errorMessage</code> and <code>scanHint</code> in the event log.
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>TnC mode</Label>
                          <Select
                            value={tncMode}
                            onValueChange={(value) => setTncMode(value as "checkbox" | "click2accept")}
                            disabled={!showTnC}
                          >
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="click2accept">click2accept</SelectItem>
                              <SelectItem value="checkbox">checkbox</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tnc-url">TnC URL</Label>
                          <Input
                            id="tnc-url"
                            type="url"
                            inputMode="url"
                            value={tncUrl}
                            onChange={(event) => setTncUrl(event.target.value)}
                            onBlur={(event) =>
                              setTncUrl(normalizeTnCUrl(event.target.value))
                            }
                            disabled={!showTnC}
                            placeholder="https://example.com/tnc"
                          />
                          <p className="text-xs text-muted-foreground">
                            Required when TnC is enabled. Use a full page URL;
                            https:// is added automatically if omitted.
                          </p>
                          {showTnC && tncUrl.trim() && !isValidTnCUrl(tncUrl) ? (
                            <p className="text-xs text-destructive">
                              Enter a valid http(s) URL.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="appearance" className="rounded-none border border-border px-3">
                    <AccordionTrigger>Appearance</AccordionTrigger>
                    <AccordionContent className="space-y-5 pt-2">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {[
                          ["colorBackground", colorBackground, setColorBackground, "#ffffff"],
                          ["colorPrimary", colorPrimary, setColorPrimary, "#000000"],
                          ["colorSecondary", colorSecondary, setColorSecondary, ""],
                          ["colorAction", colorAction, setColorAction, ""],
                          ["colorError", colorError, setColorError, ""],
                          ["colorDisabled", colorDisabled, setColorDisabled, ""],
                          ["colorFormBackground", colorFormBackground, setColorFormBackground, ""],
                          ["colorFormBorder", colorFormBorder, setColorFormBorder, ""],
                          ["colorBoxStroke", colorBoxStroke, setColorBoxStroke, ""],
                          ["colorBoxFillingOutline", colorBoxFillingOutline, setColorBoxFillingOutline, ""],
                          ["colorPlaceholder", colorPlaceholder, setColorPlaceholder, ""],
                          ["colorInverse", colorInverse, setColorInverse, ""],
                        ].map(([label, value, setter, placeholder]) => (
                          <div key={label as string} className="space-y-2">
                            <Label htmlFor={label as string}>{label as string}</Label>
                            <Input
                              id={label as string}
                              value={value as string}
                              onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                              placeholder={placeholder as string}
                              className="font-mono"
                            />
                          </div>
                        ))}
                        <div className="space-y-2">
                          <Label>logoPosition</Label>
                          <Select
                            value={logoPosition}
                            onValueChange={(value) => setLogoPosition(value as "left" | "middle" | "right")}
                          >
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">left</SelectItem>
                              <SelectItem value="middle">middle</SelectItem>
                              <SelectItem value="right">right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="border-radius">borderRadius [r1,r2,r3,r4]</Label>
                          <Input
                            id="border-radius"
                            value={borderRadiusInput}
                            onChange={(event) => setBorderRadiusInput(event.target.value)}
                            placeholder="8,8,12,12"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          Typography (appearance.*.font)
                        </p>
                        <Accordion
                          type="multiple"
                          className="rounded-none border border-border bg-card px-4 text-card-foreground"
                        >
                          {TYPOGRAPHY_GROUPS.map((group) => (
                            <AccordionItem key={group} value={group}>
                              <AccordionTrigger className="capitalize">{group}</AccordionTrigger>
                              <AccordionContent className="grid gap-3 pt-2 sm:grid-cols-2">
                                {FONT_FIELDS.map((field) => (
                                  <div key={`${group}-${field}`} className="space-y-2">
                                    <Label htmlFor={`${group}-${field}`}>{group}.{field}</Label>
                                    <Input
                                      id={`${group}-${field}`}
                                      value={typography[group][field] ?? ""}
                                      onChange={(event) =>
                                        setTypography((previous) => ({
                                          ...previous,
                                          [group]: {
                                            ...previous[group],
                                            [field]: event.target.value,
                                          },
                                        }))
                                      }
                                    />
                                  </div>
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                        <p className="text-xs text-muted-foreground">
                          Rendering depends on the SDK build and merchant configuration.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="bin-verification" className="rounded-none border border-border px-3">
                    <AccordionTrigger>BIN verification</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <div className="flex items-start justify-between gap-3 rounded-none border p-3">
                        <div className="min-w-0 flex-1">
                          <Label htmlFor="verify-payment-brand">isVerifyPaymentBrand</Label>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Host matches first6No (or Apple Pay dpanFirst6No). Rules can show promo or block payment; unmatched BINs are allowed.
                          </p>
                        </div>
                        <Switch
                          id="verify-payment-brand"
                          className="shrink-0"
                          checked={verifyPaymentBrand}
                          onCheckedChange={setVerifyPaymentBrand}
                        />
                      </div>
                      {verifyPaymentBrand ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="max-wait-time">verifyOption.maxWaitTime (seconds)</Label>
                            <Input
                              id="max-wait-time"
                              value={maxWaitTime}
                              onChange={(event) => setMaxWaitTime(event.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Default per docs: 10. Apple Pay must receive callbackVerification before this timeout.</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Rules listed below are live (edit in place). Allow shows promo; Block rejects via callbackVerification. Unmatched BINs are allowed. BIN must be exactly 6 digits to match.
                          </p>
                          {binRules.length === 0 ? (
                            <div className="rounded-none border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                              No BIN rules yet. Every card is allowed until you add one.
                            </div>
                          ) : null}
                          <div className="space-y-3">
                            {binRules.map((rule, index) => {
                              const ruleAction = rule.action === "block" ? "block" : "allow";
                              const binReady = rule.first6No.length === 6;
                              return (
                              <div key={index} className="space-y-3 rounded-none border p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    <p className="text-xs font-bold">Rule {index + 1}</p>
                                    <Badge
                                      variant={binReady ? "secondary" : "outline"}
                                      className="rounded-none font-mono text-[10px] uppercase tracking-wide"
                                    >
                                      {binReady
                                        ? ruleAction === "block"
                                          ? "Blocking"
                                          : "Allowing"
                                        : "Incomplete"}
                                    </Badge>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() =>
                                      setBinRules((previous) =>
                                        previous.filter((_, ruleIndex) => ruleIndex !== index)
                                      )
                                    }
                                  >
                                    Remove
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`bin-${index}`}>Card BIN (6 digits)</Label>
                                  <Input
                                    id={`bin-${index}`}
                                    value={rule.first6No}
                                    onChange={(event) => {
                                      const value = event.target.value.replace(/\D/g, "").slice(0, 6);
                                      setBinRules((previous) =>
                                        previous.map((item, ruleIndex) =>
                                          ruleIndex === index ? { ...item, first6No: value } : item
                                        )
                                      );
                                    }}
                                    maxLength={6}
                                    placeholder="e.g. 491794"
                                    className="font-mono"
                                  />
                                  {!binReady ? (
                                    <p className="text-xs text-muted-foreground">
                                      Enter 6 digits — this rule is ignored until then.
                                    </p>
                                  ) : null}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`action-${index}`}>Action</Label>
                                  <Select
                                    value={ruleAction}
                                    onValueChange={(value) =>
                                      setBinRules((previous) =>
                                        previous.map((item, ruleIndex) =>
                                          ruleIndex === index
                                            ? {
                                                ...item,
                                                action: value as "allow" | "block",
                                              }
                                            : item
                                        )
                                      )
                                    }
                                  >
                                    <SelectTrigger
                                      id={`action-${index}`}
                                      className="w-full"
                                      aria-label={`BIN rule ${index + 1} action`}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="allow">Allow (promo)</SelectItem>
                                      <SelectItem value="block">Block</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {ruleAction === "allow" ? (
                                  <div className="space-y-2">
                                    <Label htmlFor={`promo-${index}`}>Promotion message</Label>
                                    <Input
                                      id={`promo-${index}`}
                                      value={rule.message ?? ""}
                                      onChange={(event) =>
                                        setBinRules((previous) =>
                                          previous.map((item, ruleIndex) =>
                                            ruleIndex === index
                                              ? { ...item, message: event.target.value }
                                              : item
                                          )
                                        )
                                      }
                                    />
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <Label htmlFor={`reject-${index}`}>Reject message</Label>
                                    <Input
                                      id={`reject-${index}`}
                                      value={rule.rejectMessage ?? ""}
                                      placeholder="Card not accepted"
                                      onChange={(event) =>
                                        setBinRules((previous) =>
                                          previous.map((item, ruleIndex) =>
                                            ruleIndex === index
                                              ? { ...item, rejectMessage: event.target.value }
                                              : item
                                          )
                                        )
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                              );
                            })}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setBinRules((previous) => [
                                ...previous,
                                {
                                  first6No: "",
                                  action: "block",
                                  rejectMessage: "Card not accepted",
                                },
                              ]);
                            }}
                          >
                            + Add BIN rule
                          </Button>
                        </>
                      ) : null}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="order-customer" className="rounded-none border border-border px-3">
                    <AccordionTrigger>Order &amp; customer</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-2">
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Order details</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" type="number" min={0} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input id="currency" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="order-id">Order ID</Label>
                            <Input id="order-id" value={orderId} onChange={(event) => setOrderId(event.target.value)} className="font-mono" />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Input id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="enabled-payment-method">
                              enabledPaymentMethod
                            </Label>
                            <Input
                              id="enabled-payment-method"
                              value={enabledPaymentMethodInput}
                              onChange={(event) =>
                                setEnabledPaymentMethodInput(event.target.value)
                              }
                              placeholder="ApplePay,GooglePay,Octopus,*"
                              className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                              Order of payment methods in Drop-in. Use * for
                              remaining methods. Create session after changing.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Customer</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="customer-name">Name</Label>
                            <Input id="customer-name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-email">Email</Label>
                            <Input id="customer-email" type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-phone">Phone</Label>
                            <Input id="customer-phone" type="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Billing &amp; shipping</p>
                        <div className="grid gap-4 sm:grid-cols-3">
                          {[
                            ["Billing Country", billingCountry, (value: string) => setBillingCountry(value.toUpperCase())],
                            ["Billing City", billingCity, setBillingCity],
                            ["Billing Postal Code", billingPostalCode, setBillingPostalCode],
                            ["Shipping Country", shippingCountry, (value: string) => setShippingCountry(value.toUpperCase())],
                            ["Shipping City", shippingCity, setShippingCity],
                            ["Shipping Postal Code", shippingPostalCode, setShippingPostalCode],
                          ].map(([label, value, setter]) => {
                            const id = (label as string).toLowerCase().replaceAll(" ", "-");
                            return (
                              <div key={id} className="space-y-2">
                                <Label htmlFor={id}>{label as string}</Label>
                                <Input
                                  id={id}
                                  value={value as string}
                                  onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section className="order-1 min-w-0 space-y-4 lg:order-2 lg:col-span-2">
            <Card id="dropin-test-preview" className="min-w-0 gap-0 overflow-x-auto rounded-none border border-border py-0">
              <CardHeader className="border-b bg-muted/40 px-4 py-3">
                <CardTitle className="text-base">Drop-in preview</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0 space-y-3 p-4">
                <DemoTransactionWarning
                  environment={environment}
                  sx={{ mb: 2, wordBreak: "break-word", "& .MuiAlert-message": { overflowWrap: "anywhere" } }}
                />
                {binRejectMessage ? (
                  <div role="alert" className="rounded-none border border-red-200 bg-red-50 p-3 text-sm text-red-950">
                    {binRejectMessage}
                  </div>
                ) : null}
                {binPromoMessage ? (
                  <div role="status" className="rounded-none border border-border bg-muted p-3 text-sm text-foreground">
                    {binPromoMessage}
                  </div>
                ) : null}
                {isSdkOverlayMode ? (
                  <div className="space-y-3 rounded-none border border-dashed border-border bg-muted/30 p-4">
                    <p className="text-sm font-medium">
                      SDK {mode} mode
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Drop-in runs with real SDK{" "}
                      <span className="font-mono">{mode}</span> in a full-viewport
                      stage (so the SDK overlay is not clipped by the preview card).
                      Create or initialize a session to open it.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (!sessionId || sessionId === "REPLACE_WITH_REAL_SESSION_ID") {
                          alert("Create a session first, then open the preview.");
                          return;
                        }
                        if (sdkInitGeneration < 1) {
                          handleInitialize();
                        }
                        setModePreviewOpen(true);
                      }}
                      disabled={isCreatingSession}
                    >
                      {sdkInitGeneration < 1 ? "Initialize & open preview" : "Open preview"}
                    </Button>
                  </div>
                ) : (
                  <div className="mx-auto w-full max-w-lg overflow-visible rounded-none border border-border bg-white p-5 sm:p-6">
                    <EvonetDropinHost
                      config={config}
                      initGeneration={sdkInitGeneration}
                      onEvent={handleEvent}
                      onSdkInitApplied={setLastSdkInitInfo}
                      compact
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <DropinModePreviewShell
              mode={mode}
              open={modePreviewOpen}
              onClose={() => setModePreviewOpen(false)}
            >
              {isSdkOverlayMode && modePreviewOpen ? (
                <EvonetDropinHost
                  config={config}
                  initGeneration={sdkInitGeneration}
                  onEvent={handleEvent}
                  onSdkInitApplied={setLastSdkInitInfo}
                  compact={false}
                />
              ) : null}
            </DropinModePreviewShell>

            <Card className="min-w-0 rounded-none border border-border">
              <CardHeader className="gap-3 border-b px-3 sm:px-4">
                <CardTitle className="text-base">Developer console</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!lastSdkInitInfo}
                    onClick={async () => {
                      if (!lastSdkInitInfo) return;
                      try {
                        await navigator.clipboard.writeText(
                          JSON.stringify(lastSdkInitInfo.debugPayload, null, 2)
                        );
                        setCopySdkPayloadHint("Copied");
                        window.setTimeout(() => setCopySdkPayloadHint(null), 2000);
                      } catch {
                        setCopySdkPayloadHint("Copy failed");
                        window.setTimeout(() => setCopySdkPayloadHint(null), 2000);
                      }
                    }}
                  >
                    Copy SDK JSON
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEvents([])}>
                    Clear logs
                  </Button>
                  {copySdkPayloadHint ? (
                    <Badge variant={copySdkPayloadHint === "Copy failed" ? "destructive" : "secondary"}>
                      {copySdkPayloadHint}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="min-w-0 space-y-4 px-3 sm:px-4">
                <div className="grid min-w-0 gap-4 lg:grid-cols-3">
                  <section className="min-w-0 space-y-2">
                    <h2 className="text-sm font-semibold">SDK runtime payload JSON</h2>
                    <div className="code-panel-scroll max-h-[320px] min-h-36 overflow-auto rounded-none bg-[#0B1220] p-3 font-mono text-xs leading-5 text-slate-200 sm:max-h-[420px] sm:min-h-44">
                      {lastSdkInitInfo ? (
                        <pre className="m-0 whitespace-pre-wrap break-words">
                          {JSON.stringify(lastSdkInitInfo.debugPayload, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-slate-400">Waiting for init…</p>
                      )}
                    </div>
                  </section>
                  <section className="min-w-0 space-y-2">
                    <h2 className="text-sm font-semibold">Payment events</h2>
                    <div className="code-panel-scroll max-h-[320px] min-h-36 overflow-auto rounded-none bg-[#0B1220] p-3 sm:max-h-[420px] sm:min-h-44">
                      <EventLogList
                        events={events}
                        filterSdk={false}
                        emptyLabel="// payment_success | payment_fail | payment_method_selected …"
                        eventColor="#86EFAC"
                      />
                    </div>
                  </section>
                  <section className="min-w-0 space-y-2">
                    <h2 className="text-sm font-semibold">SDK / host messages</h2>
                    <div className="code-panel-scroll max-h-[320px] min-h-36 overflow-auto rounded-none bg-[#0B1220] p-3 sm:max-h-[420px] sm:min-h-44">
                      <EventLogList
                        events={events}
                        filterSdk
                        emptyLabel="// dropin_host phases · postMessage · bin_verification …"
                        eventColor="#7DD3FC"
                      />
                    </div>
                  </section>
                </div>
                <section className="min-w-0 space-y-2">
                  <h2 className="text-sm font-semibold">navigator.userAgent</h2>
                  <pre className="code-panel-scroll m-0 overflow-auto whitespace-pre-wrap break-words rounded-none bg-[#0B1220] p-3 font-mono text-xs leading-5 text-slate-200">
                    {userAgent}
                  </pre>
                </section>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      <EvonetPaymentReturnDialog
        open={showReturnDialog}
        params={paymentReturnPrompt}
        onDismiss={() => setReturnDialogDismissed(true)}
        onStartNewPayment={() => {
          setReturnDialogDismissed(true);
          setPaymentReturnPrompt(null);
          clearPaymentReturnQuery();
          void handleCreateSession({ initDropin: true });
        }}
      />

      {targetSwitchHint ? (
        <div
          role="status"
          className="fixed top-5 left-1/2 z-50 -translate-x-1/2 border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg"
        >
          {targetSwitchHint}
        </div>
      ) : null}
    </main>
  );
}

export default function EvonetDropinTestPageRoute() {
  return (
    <Suspense fallback={null}>
      <EvonetDropinTestPage />
    </Suspense>
  );
}
