"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Snackbar } from "@mui/material";
import {
  ArrowRight,
  Eye,
  Store,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { pageEnter, sectionEnter } from "../../../lib/pageMotion";
import { VIEWPORT_HEIGHT } from "../../../lib/responsiveLayout";
import {
  EvonetDropinHost,
  type SdkInitAppliedInfo,
} from "../../../components/EvonetDropinHost";
import { DemoTransactionWarning } from "../../../components/DemoTransactionWarning";
import { EvonetPaymentReturnDialog } from "../../../components/EvonetPaymentReturnDialog";
import {
  CODE_PANEL_PRE_SX,
  DEV_CONSOLE_SECTION_TITLE_SX,
} from "../../../lib/codePanelStyles";
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
  resolveStorefrontUnitPrice,
  writeStorefrontSnapshot,
} from "../../../lib/storefrontSnapshot";
import {
  buildTnCUiOption,
  isValidTnCUrl,
  normalizeTnCUrl,
} from "../../../lib/evonetUiOption";
import {
  StorefrontExperience,
  type StorefrontConfig,
} from "../../../components/storefront/StorefrontExperience";
import {
  StorefrontMorphOverlay,
  STOREFRONT_MORPH_MS,
  builderStageMorphSx,
} from "../../../components/storefront/StorefrontMorphOverlay";
import type {
  EvonetDropinConfig,
  EvonetDropinEvent,
  EvonetDropinMode,
  EvonetRecurringProcessingModel,
  EvonetSdkAppearance,
  EvonetSdkFontObject,
  EvonetSdkUiOption,
} from "../../../types/evonet";

const DEFAULT_ENVIRONMENT = getEvonetEnvironment();
const DEFAULT_SESSION_ID =
  process.env.NEXT_PUBLIC_EVONET_SESSION_ID ?? "REPLACE_WITH_REAL_SESSION_ID";
/** Evonet blue CTA class — see `.storefront-cta` in globals.css */
const OPEN_STOREFRONT_BUTTON_CLASS = "storefront-cta";
const ENV_CHIP_TAP_WINDOW_MS = 2000;
const ENV_CHIP_TAPS_REQUIRED = 5;

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
const POPULAR_FONT_OPTIONS = [
  {
    label: "DM Sans",
    value: '"DM Sans", sans-serif',
  },
  {
    label: "Inter",
    value: "Inter, sans-serif",
  },
  {
    label: "Roboto Serif",
    value: '"Roboto Serif", serif',
  },
  {
    label: "Roboto Mono",
    value: '"Roboto Mono", monospace',
  },
] as const;
const FONT_SIZE_OPTIONS = [
  "12px",
  "13px",
  "14px",
  "15px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
] as const;
const FONT_WEIGHT_OPTIONS = [
  "300",
  "400",
  "500",
  "600",
  "700",
] as const;

const RECURRING_MODEL_OPTIONS: {
  value: EvonetRecurringProcessingModel;
  label: string;
}[] = [
  { value: "Subscription", label: "Subscription" },
  { value: "Unscheduled", label: "Unscheduled (auto-debit)" },
];

const DROPIN_MODE_OPTIONS: { value: EvonetDropinMode; label: string }[] = [
  { value: "embedded", label: "Embedded" },
  { value: "fullPage", label: "Full page" },
  { value: "bottomUp", label: "Bottom sheet" },
];

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

function buildSdkFingerprint(parts: {
  sessionID: string;
  environment: string;
  mode: string;
  locale: string;
  verifyPaymentBrand: boolean;
  maxWaitTime: string;
  uiOption: EvonetSdkUiOption;
  appearance: EvonetSdkAppearance;
}): string {
  return JSON.stringify({
    sessionID: parts.sessionID,
    environment: parts.environment,
    mode: parts.mode,
    locale: parts.locale,
    isVerifyPaymentBrand: parts.verifyPaymentBrand,
    verifyOption: parts.verifyPaymentBrand
      ? { maxWaitTime: parts.maxWaitTime.trim() || "10" }
      : undefined,
    uiOption: parts.uiOption,
    appearance: parts.appearance,
  });
}

function normalizeHexColor(value: string): string {
  const raw = value.trim();
  if (!raw) {
    return "";
  }
  const candidate = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9a-fA-F]{6}$/.test(candidate)) {
    return candidate.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(candidate)) {
    return candidate.toLowerCase();
  }
  return raw;
}

function generateOrderId(): string {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `EVB-${Date.now()}-${suffix}`;
}

function DropinBuilderPage() {
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
  const [storefrontOpen, setStorefrontOpen] = useState(false);
  const [builderWarped, setBuilderWarped] = useState(false);

  useEffect(() => {
    if (paymentReturnFromUrl) {
      setPaymentReturnPrompt(paymentReturnFromUrl);
      setReturnDialogDismissed(false);
    }
  }, [paymentReturnFromUrl]);

  const [mountedAt, setMountedAt] = useState<string>("");
  const [sessionID, setSessionID] = useState(DEFAULT_SESSION_ID);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState("128.00");
  const [orderCurrency, setOrderCurrency] = useState(
    process.env.NEXT_PUBLIC_EVONET_DEFAULT_CURRENCY ?? "HKD"
  );
  const [orderDescription, setOrderDescription] = useState(
    "Drop-in Builder Session"
  );
  const [saveCardForNextPurchase, setSaveCardForNextPurchase] = useState(false);
  const [userInfoReference, setUserInfoReference] = useState("");
  const [includeRecurringProcessingModel, setIncludeRecurringProcessingModel] =
    useState(true);
  const [recurringProcessingModel, setRecurringProcessingModel] =
    useState<EvonetRecurringProcessingModel>("Subscription");
  const [environment, setEnvironment] = useState(DEFAULT_ENVIRONMENT);
  const [mode, setMode] = useState<EvonetDropinConfig["mode"]>("embedded");
  const [locale, setLocale] = useState("en-US");
  const [verifyPaymentBrand, setVerifyPaymentBrand] = useState(true);
  const [maxWaitTime, setMaxWaitTime] = useState("10");

  const [showSaveImage, setShowSaveImage] = useState(false);
  const [columnsLayout, setColumnsLayout] = useState(false);
  const [showCardHolderName, setShowCardHolderName] = useState(true);
  const [cvvForSavedCard, setCvvForSavedCard] = useState(true);
  const [showScanCardButton, setShowScanCardButton] = useState(false);
  const [autoInvokeCardScanner, setAutoInvokeCardScanner] = useState(false);
  const [showTnC, setShowTnC] = useState(false);
  const [tncMode, setTncMode] = useState<"checkbox" | "click2accept">(
    "click2accept"
  );
  const [tncUrl, setTncUrl] = useState("");

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
  const [logoPosition, setLogoPosition] = useState<"left" | "middle" | "right">(
    "left"
  );
  const [borderRadiusInput, setBorderRadiusInput] = useState("");
  const [typography, setTypography] = useState<TypographyState>(
    createEmptyTypographyState
  );

  const [livePreview, setLivePreview] = useState(true);
  const [sdkInitGeneration, setSdkInitGeneration] = useState(0);
  const prevSdkFingerprintRef = useRef<string>("");
  const [previewEvents, setPreviewEvents] = useState<EvonetDropinEvent[]>([]);
  const [previewFallbackBadge, setPreviewFallbackBadge] = useState<string | null>(
    null
  );
  const [lastSdkInitInfo, setLastSdkInitInfo] = useState<SdkInitAppliedInfo | null>(
    null
  );

  const [copyBuilderHint, setCopyBuilderHint] = useState<string | null>(null);
  const [copySdkHint, setCopySdkHint] = useState<string | null>(null);
  const [targetSwitchHint, setTargetSwitchHint] = useState<string | null>(null);
  const envChipTapCountRef = useRef(0);
  const envChipTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!builderWarped) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [builderWarped]);

  useEffect(() => {
    setMountedAt(new Date().toISOString());
  }, []);

  useEffect(() => {
    return () => {
      if (envChipTapTimerRef.current) {
        clearTimeout(envChipTapTimerRef.current);
      }
    };
  }, []);

  const sdkUiOption: EvonetSdkUiOption = useMemo(() => {
    const tnc = buildTnCUiOption(showTnC, tncMode, tncUrl);
    return {
      showSaveImage,
      Columns: columnsLayout,
      card: {
        showCardHolderName,
        CVVForSavedCard: cvvForSavedCard,
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

  const parsedBorderRadius = useMemo(() => {
    const rawParts = borderRadiusInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (rawParts.length === 0) {
      return { values: null as number[] | null, message: "Use four values, e.g. 8,8,8,8" };
    }
    if (rawParts.length !== 4) {
      return {
        values: null as number[] | null,
        message: "Border radius must contain exactly 4 comma-separated numbers.",
      };
    }
    const values = rawParts.map((value) => Number(value));
    const isValid = values.every(
      (value) => Number.isFinite(value) && value >= 0 && value <= 64
    );
    if (!isValid) {
      return {
        values: null as number[] | null,
        message: "Each radius must be a number between 0 and 64.",
      };
    }
    return { values, message: "Applied to Drop-in preview and exported JSON." };
  }, [borderRadiusInput]);

  const sdkAppearance: EvonetSdkAppearance = useMemo(() => {
    const appearance: EvonetSdkAppearance = {};
    const put = (key: keyof EvonetSdkAppearance, value: string) => {
      const v = value.trim();
      if (v) {
        const normalized =
          key.toString().startsWith("color") ? normalizeHexColor(v) : v;
        (appearance as Record<string, unknown>)[key as string] = normalized;
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
      appearance.logoPosition = logoPosition;
    }

    if (parsedBorderRadius.values) {
      appearance.borderRadius = parsedBorderRadius.values;
    }

    for (const group of TYPOGRAPHY_GROUPS) {
      const sanitized: EvonetSdkFontObject = {};
      for (const field of FONT_FIELDS) {
        const raw = typography[group][field];
        const trimmed = typeof raw === "string" ? raw.trim() : "";
        if (trimmed) {
          sanitized[field] = trimmed;
        }
      }
      if (Object.keys(sanitized).length > 0) {
        appearance[group] = sanitized;
      }
    }
    return appearance;
  }, [
    parsedBorderRadius,
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

  const builderConfig = useMemo(
    () => ({
      uiOption: sdkUiOption,
      appearance: sdkAppearance,
    }),
    [sdkAppearance, sdkUiOption]
  );

  const sdkRuntimePayload = useMemo(() => {
    const envMap: Record<string, string> = {
      PROD: "HKG_prod",
      prod: "HKG_prod",
      TEST: "UAT",
      test: "UAT",
    };
    const normalizedEnvironment = envMap[environment] ?? environment;

    return {
      id: "#your-dropin-container",
      type: "payment",
      sessionID: sessionID.trim(),
      locale: locale.trim() || "en-US",
      mode,
      environment: normalizedEnvironment,
      isVerifyPaymentBrand: verifyPaymentBrand,
      verifyOption: verifyPaymentBrand
        ? { isVerifyPaymentBrand: true, maxWaitTime: maxWaitTime.trim() || "10" }
        : { isVerifyPaymentBrand: false },
      uiOption: sdkUiOption,
      appearance: sdkAppearance,
      _note:
        "Callbacks (payment_method_select, payment_method_selected, payment_completed, payment_failed, payment_not_preformed, payment_cancelled) should be attached in your integration code.",
    };
  }, [
    environment,
    locale,
    maxWaitTime,
    mode,
    sessionID,
    sdkAppearance,
    sdkUiOption,
    verifyPaymentBrand,
  ]);

  const dropinConfigForPreview: EvonetDropinConfig = useMemo(
    () => ({
      type: "payment",
      sessionID: sessionID.trim(),
      environment: environment as EvonetDropinConfig["environment"],
      mode,
      language: locale.trim() || "en-US",
      isVerifyPaymentBrand: verifyPaymentBrand,
      verifyOption: verifyPaymentBrand
        ? { maxWaitTime: maxWaitTime.trim() || "10" }
        : undefined,
      uiOption: sdkUiOption,
      appearance: sdkAppearance,
    }),
    [
      environment,
      locale,
      maxWaitTime,
      mode,
      sessionID,
      sdkAppearance,
      sdkUiOption,
      verifyPaymentBrand,
    ]
  );

  const sdkFingerprint = useMemo(
    () =>
      buildSdkFingerprint({
        sessionID,
        environment,
        mode,
        locale,
        verifyPaymentBrand,
        maxWaitTime,
        uiOption: sdkUiOption,
        appearance: sdkAppearance,
      }),
    [
      environment,
      locale,
      maxWaitTime,
      mode,
      sessionID,
      sdkAppearance,
      sdkUiOption,
      verifyPaymentBrand,
    ]
  );

  useEffect(() => {
    if (!livePreview || sdkInitGeneration < 1) {
      return;
    }
    if (prevSdkFingerprintRef.current === sdkFingerprint) {
      return;
    }
    const timer = window.setTimeout(() => {
      prevSdkFingerprintRef.current = sdkFingerprint;
      setSdkInitGeneration((value) => value + 1);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [livePreview, sdkFingerprint, sdkInitGeneration]);

  const builderConfigJson = useMemo(
    () => JSON.stringify(builderConfig, null, 2),
    [builderConfig]
  );
  const sdkPayloadJson = useMemo(
    () => JSON.stringify(sdkRuntimePayload, null, 2),
    [sdkRuntimePayload]
  );

  const canRenderPreview =
    Boolean(sessionID.trim()) && sessionID.trim() !== "REPLACE_WITH_REAL_SESSION_ID";

  const previewShellClass = useMemo(() => {
    switch (mode) {
      case "fullPage":
        return "mx-auto w-full max-w-none overflow-auto rounded-none border border-[#D1D5DB] bg-muted/30 p-2 sm:p-4 min-h-[min(80vh,720px)]";
      case "bottomUp":
        return "mx-auto flex w-full max-w-none flex-col justify-end overflow-auto rounded-none border border-[#D1D5DB] bg-black/5 p-2 sm:p-4 min-h-[min(70vh,640px)]";
      default:
        return "mx-auto w-full max-w-lg overflow-x-auto rounded-none border border-[#D1D5DB] bg-background p-2 sm:p-3";
    }
  }, [mode]);

  const handleCopy = async (
    text: string,
    setHint: (hint: string | null) => void
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setHint("JSON copied");
    } catch {
      setHint("Copy failed");
    } finally {
      window.setTimeout(() => setHint(null), 1800);
    }
  };

  const clearPaymentReturnQuery = useCallback(() => {
    const next = stripEvonetReturnQuery(
      new URLSearchParams(searchParams.toString())
    );
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, searchParams]);

  const storefrontConfig: StorefrontConfig = useMemo(
    () => ({
      appearance: sdkAppearance,
      environment,
      locale: locale.trim() || "en-US",
      mode,
      currency: orderCurrency.trim() || "HKD",
      amount: resolveStorefrontUnitPrice(orderAmount),
      uiOption: sdkUiOption,
      verifyPaymentBrand,
      maxWaitTime: maxWaitTime.trim() || "10",
    }),
    [
      environment,
      locale,
      maxWaitTime,
      mode,
      orderAmount,
      orderCurrency,
      sdkAppearance,
      sdkUiOption,
      verifyPaymentBrand,
    ]
  );

  const openAsStorefront = useCallback(() => {
    // Keep a snapshot for the optional /evonet/storefront route; overlay keeps Builder state alive.
    writeStorefrontSnapshot(storefrontConfig);
    setBuilderWarped(true);
    setStorefrontOpen(true);
  }, [storefrontConfig]);

  const closeStorefront = useCallback(() => {
    setStorefrontOpen(false);
    window.setTimeout(() => setBuilderWarped(false), STOREFRONT_MORPH_MS);
  }, []);

  const handleCreateSession = async (options?: {
    environmentOverride?: string;
  }) => {
    setSessionError(null);
    if (saveCardForNextPurchase && !userInfoReference.trim()) {
      setSessionError(
        "User reference is required when Allow save card for next purchase is enabled (maps to userInfo.reference)."
      );
      return;
    }
    setIsCreatingSession(true);
    try {
      const parsedAmount = Number.parseFloat(orderAmount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Amount must be a positive number.");
      }
      const envForSession = options?.environmentOverride ?? environment;
      const targetForSession = targetFromSdkEnvironment(envForSession);
      const response = await fetch("/api/evonet/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          currency: orderCurrency.trim() || "HKD",
          orderId: generateOrderId(),
          description: orderDescription.trim() || "Drop-in Builder Session",
          environment: envForSession,
          target: targetForSession,
          locale: locale.trim() || "en-US",
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

      const data = (await response.json()) as { sessionId?: string; error?: string };
      if (!response.ok || !data.sessionId) {
        throw new Error(
          data.error ?? "Failed to create session ID via Evonet interaction API."
        );
      }
      setSessionID(data.sessionId);
      prevSdkFingerprintRef.current = "";
      setPreviewFallbackBadge(null);
      setPreviewEvents([]);
      setSdkInitGeneration((value) => value + 1);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error creating session ID.";
      setSessionError(message);
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

    writeStoredTargetOverride(nextTarget);
    setEnvironment(nextEnv);
    setTargetSwitchHint(`Switched to ${nextTarget}`);
    setSessionID(DEFAULT_SESSION_ID);
    setSdkInitGeneration(0);
    setPreviewEvents([]);
    setSessionError(null);

    void handleCreateSession({ environmentOverride: nextEnv });
  };

  const handleResetTheme = () => {
    setColorAction("");
    setColorBackground("");
    setColorBoxStroke("");
    setColorDisabled("");
    setColorError("");
    setColorFormBackground("");
    setColorFormBorder("");
    setColorInverse("");
    setColorBoxFillingOutline("");
    setColorPlaceholder("");
    setColorPrimary("");
    setColorSecondary("");
    setLogoPosition("left");
    setBorderRadiusInput("");
    setTypography(createEmptyTypographyState());
  };

  const handleResetTypography = () => {
    setTypography(createEmptyTypographyState());
  };

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      parseEvonetReturnParams(new URLSearchParams(window.location.search))
    ) {
      return;
    }
    const storedTarget = readStoredTargetOverride();
    if (storedTarget) {
      const envForLoad = sdkEnvironmentForTarget(storedTarget);
      setEnvironment(envForLoad);
      void handleCreateSession({ environmentOverride: envForLoad });
      return;
    }
    void handleCreateSession();
    // Auto-create once when page loads (skip wallet returnURL landings).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ minHeight: { md: VIEWPORT_HEIGHT }, overflowX: "hidden", ...pageEnter() }}>
      <Box sx={builderStageMorphSx(builderWarped)}>
        <main
          data-builder-chrome
          className="mx-auto h-auto max-w-7xl overflow-x-hidden px-3 py-5 sm:px-6 md:h-[var(--builder-height)] md:overflow-hidden md:py-4 lg:px-8"
          style={{ "--builder-height": VIEWPORT_HEIGHT } as React.CSSProperties}
          suppressHydrationWarning
        >
          <div className="grid min-w-0 items-start gap-5 md:h-[calc(var(--builder-height)-2rem)] md:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] md:gap-6">
            <Box
              className="min-h-0 min-w-0 space-y-5 md:h-full md:overflow-y-auto md:px-0.5 md:pr-2"
              sx={sectionEnter(40)}
            >
              <Card>
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-2xl tracking-tight sm:text-3xl">
                      Drop-in Builder
                    </CardTitle>
                    {isEvonetProductionEnvironment(environment) ? (
                      <Badge variant="destructive">PROD</Badge>
                    ) : null}
                    <Badge
                      variant="outline"
                      className="cursor-pointer font-mono"
                      onClick={handleEnvironmentChipTap}
                    >
                      {environment}
                    </Badge>
                  </div>
                  <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                    Configure Evonet Drop-in SDK options with a guided interface,
                    preview the result instantly, and copy JSON in one click.
                  </p>
                  <div className="mt-1 flex w-full flex-col gap-3 md:hidden">
                    <Button className={`w-full ${OPEN_STOREFRONT_BUTTON_CLASS}`} size="lg" onClick={openAsStorefront}>
                      <Store data-icon="inline-start" />
                      Open as storefront
                    </Button>
                    <Button variant="outline" className="w-full" size="lg" asChild>
                      <a href="#builder-preview">
                        <Eye data-icon="inline-start" />
                        Jump to preview
                      </a>
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Order Info</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="order-amount">Amount</Label>
                      <Input id="order-amount" value={orderAmount} onChange={(event) => setOrderAmount(event.target.value)} placeholder="128.00" aria-label="Order amount" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order-currency">Currency</Label>
                      <Input id="order-currency" value={orderCurrency} onChange={(event) => setOrderCurrency(event.target.value)} placeholder="HKD" aria-label="Order currency" />
                    </div>
                    <div className="space-y-2">
                      <Label>Locale</Label>
                      <Select value={locale} onValueChange={setLocale}>
                        <SelectTrigger className="w-full" aria-label="Session locale"><SelectValue /></SelectTrigger>
                        <SelectContent>{["en-US", "zh-TW", "zh-CN", "ja-JP"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Used for session and Drop-in locale.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Mode</Label>
                      <Select
                        value={mode}
                        onValueChange={(value) =>
                          setMode(value as EvonetDropinMode)
                        }
                      >
                        <SelectTrigger className="w-full" aria-label="Drop-in mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DROPIN_MODE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {mode === "embedded"
                          ? "Inline widget inside your page."
                          : mode === "fullPage"
                            ? "Full-screen checkout overlay."
                            : "Bottom sheet that slides up from the screen edge."}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order-description">Description</Label>
                    <Input id="order-description" value={orderDescription} onChange={(event) => setOrderDescription(event.target.value)} placeholder="Drop-in Builder Session" aria-label="Order description" />
                  </div>
                  <Button variant="outline" onClick={() => void handleCreateSession()} disabled={isCreatingSession}>
                    {isCreatingSession ? "Creating Session..." : "Refresh Session ID"}
                  </Button>
                  <div className="rounded-none border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-950">
                    <span className="font-medium">Current Session ID:</span>{" "}
                    <span className="break-all font-mono text-xs">{sessionID || "N/A"}</span>
                  </div>
                  {sessionError ? <Alert severity="error" variant="outlined">{sessionError}</Alert> : null}
                  <Accordion type="single" collapsible className="rounded-none border px-3">
                    <AccordionItem value="save-card" className="border-0">
                      <AccordionTrigger>Save card for next purchase</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div className="flex items-start justify-between gap-4 rounded-none border p-3">
                          <div>
                            <Label htmlFor="save-card" className="font-medium">Allow save card for next purchase</Label>
                            <p className="mt-1 text-xs text-muted-foreground">Sends userInfo.reference and paymentMethod.recurringProcessingModel. Refresh the session after changing this.</p>
                          </div>
                          <Switch id="save-card" checked={saveCardForNextPurchase} onCheckedChange={setSaveCardForNextPurchase} aria-label="Allow save card for next purchase" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="user-reference">User reference (userInfo.reference)</Label>
                            <Input id="user-reference" value={userInfoReference} onChange={(event) => setUserInfoReference(event.target.value)} placeholder="your_customer_id_123" disabled={!saveCardForNextPurchase} required={saveCardForNextPurchase} />
                            <p className="text-xs text-muted-foreground">Stable shopper ID used to associate stored tokens.</p>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <Label htmlFor="recurring-enabled">Include recurring processing model</Label>
                              <Switch id="recurring-enabled" checked={includeRecurringProcessingModel} onCheckedChange={setIncludeRecurringProcessingModel} disabled={!saveCardForNextPurchase} />
                            </div>
                            <Select value={recurringProcessingModel} onValueChange={(value) => setRecurringProcessingModel(value as EvonetRecurringProcessingModel)} disabled={!saveCardForNextPurchase || !includeRecurringProcessingModel}>
                              <SelectTrigger className="w-full" aria-label="Recurring processing model"><SelectValue placeholder="Recurring model" /></SelectTrigger>
                              <SelectContent>{RECURRING_MODEL_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Payment UI</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      [showSaveImage, setShowSaveImage, "Show Save Image", "Allow saving QR code to device (not card storage)."],
                      [columnsLayout, setColumnsLayout, "Columns Layout"],
                      [showCardHolderName, setShowCardHolderName, "Show Card Holder Name"],
                      [cvvForSavedCard, setCvvForSavedCard, "CVV For Saved Card"],
                    ].map(([checked, onChange, label, caption]) => (
                      <div key={label as string} className="flex items-start justify-between gap-3 rounded-none border p-3">
                        <div><Label className="font-medium">{label as string}</Label>{caption ? <p className="mt-1 text-xs text-muted-foreground">{caption as string}</p> : null}</div>
                        <Switch checked={checked as boolean} onCheckedChange={onChange as (value: boolean) => void} aria-label={label as string} />
                      </div>
                    ))}
                  </div>
                  <Accordion type="single" collapsible className="rounded-none border px-3">
                    <AccordionItem value="scanner-tnc" className="border-0">
                      <AccordionTrigger>Card scanner &amp; TnC</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {[
                            [showScanCardButton, setShowScanCardButton, "Show Scan Card Button"],
                            [autoInvokeCardScanner, setAutoInvokeCardScanner, "Auto Invoke Card Scanner"],
                            [showTnC, setShowTnC, "Show Terms and Conditions"],
                          ].map(([checked, onChange, label]) => (
                            <div key={label as string} className="flex items-center justify-between gap-3 rounded-none border p-3">
                              <Label className="font-medium">{label as string}</Label>
                              <Switch checked={checked as boolean} onCheckedChange={onChange as (value: boolean) => void} aria-label={label as string} />
                            </div>
                          ))}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label>TnC Mode</Label>
                            <Select value={tncMode} onValueChange={(value) => setTncMode(value as "checkbox" | "click2accept")} disabled={!showTnC}>
                              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="checkbox">checkbox</SelectItem><SelectItem value="click2accept">click2accept</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 sm:col-span-2">
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
                              placeholder="https://example.com/tnc"
                              disabled={!showTnC}
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
                  </Accordion>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-base">Theme</CardTitle>
                  <CardAction>
                    <Button variant="outline" size="sm" onClick={handleResetTheme}>
                      Reset
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">Core colors</p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      ["Background", colorBackground, setColorBackground, "#ffffff"],
                      ["Primary", colorPrimary, setColorPrimary, "#4f46e5"],
                      ["Secondary", colorSecondary, setColorSecondary, "#0ea5e9"],
                      ["Action", colorAction, setColorAction, "#111827"],
                      ["Error", colorError, setColorError, "#dc2626"],
                    ].map(([label, value, onChange, placeholder]) => (
                      <div key={label as string} className="space-y-2">
                        <Label>{label as string}</Label>
                        <div className="grid grid-cols-[44px_1fr] gap-2">
                          <input className="h-8 w-11 cursor-pointer rounded border border-input bg-background p-1" type="color" value={normalizeHexColor(value as string) || (placeholder as string)} onChange={(event) => (onChange as (value: string) => void)(event.target.value)} aria-label={`${label as string} color picker`} />
                          <Input value={value as string} onChange={(event) => (onChange as (value: string) => void)(event.target.value)} placeholder={placeholder as string} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Accordion type="single" collapsible className="rounded-none border px-3">
                    <AccordionItem value="surfaces" className="border-0">
                      <AccordionTrigger>Form &amp; surfaces + Layout</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {[
                            ["Disabled", colorDisabled, setColorDisabled, "#9ca3af"],
                            ["Form Background", colorFormBackground, setColorFormBackground, "#ffffff"],
                            ["Form Border", colorFormBorder, setColorFormBorder, "#d1d5db"],
                            ["Box Stroke", colorBoxStroke, setColorBoxStroke, "#d1d5db"],
                            ["Box Filling Outline", colorBoxFillingOutline, setColorBoxFillingOutline, "#e5e7eb"],
                            ["Placeholder", colorPlaceholder, setColorPlaceholder, "#9ca3af"],
                            ["Inverse", colorInverse, setColorInverse, "#0f172a"],
                          ].map(([label, value, onChange, placeholder]) => (
                            <div key={label as string} className="space-y-2">
                              <Label>{label as string}</Label>
                              <div className="grid grid-cols-[44px_1fr] gap-2">
                                <input className="h-8 w-11 cursor-pointer rounded border border-input bg-background p-1" type="color" value={normalizeHexColor(value as string) || (placeholder as string)} onChange={(event) => (onChange as (value: string) => void)(event.target.value)} aria-label={`${label as string} color picker`} />
                                <Input value={value as string} onChange={(event) => (onChange as (value: string) => void)(event.target.value)} placeholder={placeholder as string} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <Separator />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2"><Label>Logo Position</Label><Select value={logoPosition} onValueChange={(value) => setLogoPosition(value as "left" | "middle" | "right")}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="left">left (default)</SelectItem><SelectItem value="middle">middle</SelectItem><SelectItem value="right">right</SelectItem></SelectContent></Select></div>
                          <div className="space-y-2"><Label htmlFor="border-radius">borderRadius (four comma-separated values)</Label><Input id="border-radius" value={borderRadiusInput} onChange={(event) => setBorderRadiusInput(event.target.value)} placeholder="8,8,8,8" aria-invalid={Boolean(borderRadiusInput.trim()) && !parsedBorderRadius.values} /><p className={parsedBorderRadius.values || !borderRadiusInput.trim() ? "text-xs text-muted-foreground" : "text-xs text-destructive"}>{parsedBorderRadius.message}</p></div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-base">Advanced Typography</CardTitle>
                  <CardAction>
                    <Button variant="outline" size="sm" onClick={handleResetTypography}>
                      Reset
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="rounded-none border px-3">
                    {TYPOGRAPHY_GROUPS.map((group) => (
                      <AccordionItem key={group} value={group}>
                        <AccordionTrigger className="capitalize">{group}</AccordionTrigger>
                        <AccordionContent className="pt-2">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {FONT_FIELDS.map((field) => {
                              const setValue = (value: string) => setTypography((previous) => ({ ...previous, [group]: { ...previous[group], [field]: value } }));
                              if (field === "fontFamily") return <div key={field} className="space-y-2"><Label>{field}</Label><Select value={typography[group][field] ?? ""} onValueChange={(value) => setValue(value === "none" ? "" : value)}><SelectTrigger className="w-full"><SelectValue placeholder="inherit/default" /></SelectTrigger><SelectContent><SelectItem value="none">(inherit/default)</SelectItem>{POPULAR_FONT_OPTIONS.map((font) => <SelectItem key={font.label} value={font.value}>{font.label}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Popular Google Fonts</p></div>;
                              if (field === "fontSize" || field === "fontWeight") {
                                const values = field === "fontSize" ? FONT_SIZE_OPTIONS : FONT_WEIGHT_OPTIONS;
                                return <div key={field} className="space-y-2"><Label>{field}</Label><Select value={typography[group][field] ?? ""} onValueChange={(value) => setValue(value === "none" ? "" : value)}><SelectTrigger className="w-full"><SelectValue placeholder="inherit/default" /></SelectTrigger><SelectContent><SelectItem value="none">(inherit/default)</SelectItem>{values.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>;
                              }
                              return <div key={field} className="space-y-2"><Label htmlFor={`${group}-${field}`}>{field}</Label><Input id={`${group}-${field}`} value={typography[group][field] ?? ""} onChange={(event) => setValue(event.target.value)} /></div>;
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </Box>

            <Box id="builder-preview" className="min-h-0 min-w-0 scroll-mt-4 md:h-full" sx={sectionEnter(80)}>
              <Card className="min-w-0 gap-0 overflow-x-auto rounded-none border border-border py-0 md:flex md:h-full md:flex-col">
                <CardHeader className="space-y-4 border-b bg-muted/40 px-4 py-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">Drop-in Preview</CardTitle>
                      <Badge variant="outline" className="font-mono text-xs">
                        {DROPIN_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2"><Label htmlFor="live-preview">Auto refresh</Label><Switch id="live-preview" checked={livePreview} onCheckedChange={setLivePreview} /></div>
                  </div>
                  <Button size="lg" className={`w-full ${OPEN_STOREFRONT_BUTTON_CLASS}`} onClick={openAsStorefront}>
                    <Store data-icon="inline-start" />Open as storefront<ArrowRight data-icon="inline-end" />
                  </Button>
                  <p className="text-xs text-muted-foreground">Preview this theme in a full ecommerce checkout demo.</p>
                </CardHeader>
                <CardContent className="min-w-0 space-y-4 p-4 md:min-h-0 md:flex-1 md:overflow-y-auto">
                  <Button onClick={() => { setPreviewFallbackBadge(null); setPreviewEvents([]); setSdkInitGeneration((value) => value + 1); }} disabled={!canRenderPreview}>Initialize / Re-init</Button>
                  {!canRenderPreview ? <Alert severity="warning" variant="outlined">Preview is disabled because sessionID is missing or placeholder.</Alert> : null}
                  <DemoTransactionWarning environment={environment} sx={{ mb: 0, wordBreak: "break-word" }} />
                  <div className={previewShellClass}>
                    <EvonetDropinHost
                      config={dropinConfigForPreview}
                      initGeneration={sdkInitGeneration}
                      onEvent={(event) => {
                        const payload = event.payload as { source?: string; phase?: string } | undefined;
                        if (event.type === "sdk_message" && payload?.source === "dropin_host") {
                          if (payload.phase === "construct_ok_without_font_weight") setPreviewFallbackBadge("SDK fallback: fontWeight was ignored for compatibility.");
                          else if (payload.phase === "construct_ok_without_border_radius") setPreviewFallbackBadge("SDK fallback: borderRadius was ignored for compatibility.");
                        }
                        if (event.type === "payment_success" || event.type === "payment_fail" || event.type === "payment_cancelled") {
                          const fromSdk = parseEvonetSdkPaymentEvent(event.type, event.payload);
                          if (fromSdk) { setPaymentReturnPrompt(fromSdk); setReturnDialogDismissed(false); }
                        }
                        setPreviewEvents((previous) => [event, ...previous].slice(0, 20));
                      }}
                      onSdkInitApplied={(info) => setLastSdkInitInfo(info)}
                      compact={mode === "embedded"}
                    />
                  </div>
                  {previewFallbackBadge ? <Alert severity="info" variant="outlined">{previewFallbackBadge}</Alert> : null}
                  <Separator />
                  <section className="min-w-0 flex flex-col gap-3">
                    <h2 className="text-sm font-semibold" style={DEV_CONSOLE_SECTION_TITLE_SX}>UI Config JSON (UI Options + Appearance only)</h2>
                    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium">UI options + appearance JSON</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => handleCopy(builderConfigJson, setCopyBuilderHint)}>Copy</Button>{copyBuilderHint ? <Badge variant={copyBuilderHint === "Copy failed" ? "destructive" : "secondary"}>{copyBuilderHint}</Badge> : null}</div></div>
                    <Box component="pre" className="code-panel-scroll" sx={{ ...CODE_PANEL_PRE_SX, maxWidth: "100%", maxHeight: 220 }}>{builderConfigJson}</Box>
                    <Accordion type="single" collapsible className="mt-2 rounded-none border px-3">
                      <AccordionItem value="runtime" className="border-0"><AccordionTrigger>SDK runtime payload JSON</AccordionTrigger><AccordionContent className="space-y-3 pt-2"><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => void handleCopy(sdkPayloadJson, setCopySdkHint)}>Copy</Button>{copySdkHint ? <Badge variant={copySdkHint === "Copy failed" ? "destructive" : "secondary"}>{copySdkHint}</Badge> : null}</div><Box component="pre" className="code-panel-scroll" sx={{ ...CODE_PANEL_PRE_SX, maxWidth: "100%", maxHeight: 220 }}>{sdkPayloadJson}</Box></AccordionContent></AccordionItem>
                    </Accordion>
                  </section>
                </CardContent>
              </Card>
            </Box>
          </div>

          <EvonetPaymentReturnDialog
            open={showReturnDialog}
            params={paymentReturnPrompt}
            onDismiss={() => setReturnDialogDismissed(true)}
            onStartNewPayment={() => {
              setReturnDialogDismissed(true);
              setPaymentReturnPrompt(null);
              clearPaymentReturnQuery();
              void handleCreateSession();
            }}
          />
        </main>
      </Box>

      <StorefrontMorphOverlay open={storefrontOpen}>
        <Suspense fallback={null}>
          <StorefrontExperience config={storefrontConfig} onBackToBuilder={closeStorefront} />
        </Suspense>
      </StorefrontMorphOverlay>

      <Snackbar
        open={Boolean(targetSwitchHint)}
        autoHideDuration={2500}
        onClose={() => setTargetSwitchHint(null)}
        message={targetSwitchHint}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}

export default function DropinBuilderPageRoute() {
  return (
    <Suspense fallback={null}>
      <DropinBuilderPage />
    </Suspense>
  );
}
