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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AppearanceTabs,
  type AppearanceColorsState,
} from "@/components/dropin-builder/AppearanceTabs";
import { AppearanceSectionCard } from "@/components/dropin-builder/AppearanceSectionCard";
import { DropinPreviewStage } from "@/components/dropin-builder/DropinPreviewStage";
import { UiConfigImportPanel } from "@/components/dropin-builder/UiConfigImportPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { DropinSdkVersionBadge } from "@/components/DropinSdkVersionBadge";
import { useSiteLocale } from "@/components/SiteLocaleProvider";
import { parseBuilderUiConfigJson } from "@/lib/importBuilderUiConfig";
import { copyTextToClipboard } from "@/lib/copyTextToClipboard";
import { pageEnter, sectionEnter } from "../../../lib/pageMotion";
import { VIEWPORT_HEIGHT } from "../../../lib/responsiveLayout";
import {
  EvonetDropinHost,
  type SdkInitAppliedInfo,
} from "../../../components/EvonetDropinHost";
import { DropinModePreviewShell } from "../../../components/DropinModePreviewShell";
import { DemoTransactionWarning } from "../../../components/DemoTransactionWarning";
import { EvonetPaymentReturnDialog } from "../../../components/EvonetPaymentReturnDialog";
import { TokenMitChargePanel } from "../../../components/TokenMitChargePanel";
import {
  CODE_PANEL_PRE_SX,
  DEV_CONSOLE_SECTION_TITLE_SX,
} from "../../../lib/codePanelStyles";
import {
  getEvonetEnvironment,
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
  isFanClubStorefront,
  readStorefrontSnapshot,
  resolveStorefrontUnitPrice,
  writeStorefrontSnapshot,
} from "../../../lib/storefrontSnapshot";
import {
  buildClientEvonetReturnUrl,
  consumeFanClubCheckoutPending,
} from "../../../lib/evonetReturnUrl";
import { ensureUserInfoReference } from "../../../lib/userInfoReference";
import { CopyableIdInline } from "../../../components/CopyableIdValue";
import {
  amountDisplayChoice,
  amountDisplayFromChoice,
  buildCustomDescriptionUiOption,
  buildTnCUiOption,
  isValidTnCUrl,
  isZeroOrderAmount,
  normalizeTnCUrl,
  withoutCustomDescription,
} from "../../../lib/evonetUiOption";
import { applyDropinAppearanceCss } from "../../../lib/applyDropinAppearanceCss";
import {
  StorefrontExperience,
  type StorefrontConfig,
} from "../../../components/storefront/StorefrontExperience";
import { FanClubExperience } from "../../../components/storefront/fanClub/FanClubExperience";
import {
  StorefrontMorphOverlay,
  STOREFRONT_MORPH_MS,
  builderStageMorphSx,
} from "../../../components/storefront/StorefrontMorphOverlay";
import type {
  BinRule,
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
/** Figma sidebar-tabs: slate track, white active chip, Evonet blue label. */
const PRIMARY_TABS_LIST_CLASS =
  "h-auto w-full gap-1 rounded-[3px] border-0 bg-[#f8fafc] p-1 dark:bg-muted";
const PRIMARY_TABS_TRIGGER_CLASS =
  "h-auto min-w-0 flex-1 whitespace-normal rounded-[2px] px-1.5 py-2 text-center text-[12px] font-medium leading-snug text-[#64748b] shadow-none sm:px-3 sm:text-[13px] data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-[#1a86e8] data-[state=active]:shadow-[0px_1px_1px_rgba(0,0,0,0.04)] dark:text-muted-foreground dark:data-[state=active]:bg-card dark:data-[state=active]:text-[#1a86e8]";
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

/**
 * Structural / uiOption fingerprint only. Appearance is applied live via CSS
 * vars and must not trigger Drop-in remount (keeps pulses visible).
 * `customDescription` is patched onto the live SDK store — omit it here.
 */
function buildStructuralFingerprint(parts: {
  sessionID: string;
  environment: string;
  mode: string;
  locale: string;
  verifyPaymentBrand: boolean;
  maxWaitTime: string;
  columnsLayout: boolean;
  uiOption: EvonetSdkUiOption;
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
    uiOption: {
      ...withoutCustomDescription(parts.uiOption),
      ...(parts.columnsLayout ? { columns: true } : {}),
    },
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
  const { messages } = useSiteLocale();
  const t = messages.builder;
  const tc = messages.common;

  const dropinModeOptions: { value: EvonetDropinMode; label: string }[] = [
    { value: "embedded", label: t.modeLabelEmbedded },
    { value: "fullPage", label: t.modeLabelFullPage },
    { value: "bottomUp", label: t.modeLabelBottomUp },
  ];
  const recurringModelOptions: {
    value: EvonetRecurringProcessingModel;
    label: string;
  }[] = [
    { value: "Subscription", label: t.recurringSubscription },
    { value: "Unscheduled", label: t.recurringUnscheduled },
  ];

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
  /** Terminal payment result used this session — Re-init alone will fail until refresh. */
  const [sessionSpent, setSessionSpent] = useState(false);
  const [primaryTab, setPrimaryTab] = useState<"order" | "payment" | "appearance">(
    "order"
  );
  const [storefrontOpen, setStorefrontOpen] = useState(false);
  const [storefrontLaunchConfig, setStorefrontLaunchConfig] =
    useState<StorefrontConfig | null>(null);
  const [builderWarped, setBuilderWarped] = useState(false);

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

  /** Wallet / Apple Pay reload lands on Builder — reopen Fan Club to show the result. */
  useEffect(() => {
    if (!paymentReturnFromUrl) return;
    const pending = consumeFanClubCheckoutPending();
    if (!pending) return;
    const snapshot = readStorefrontSnapshot();
    if (!snapshot || !isFanClubStorefront(snapshot)) return;
    setStorefrontLaunchConfig(snapshot);
    setBuilderWarped(true);
    setStorefrontOpen(true);
    setReturnDialogDismissed(true);
  }, [paymentReturnFromUrl]);

  useEffect(() => {
    if (sessionSpent && returnDialogDismissed) {
      setPrimaryTab("order");
    }
  }, [sessionSpent, returnDialogDismissed]);

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
  const [allowAuthentication, setAllowAuthentication] = useState(false);
  const [saveCardForNextPurchase, setSaveCardForNextPurchase] = useState(false);
  const [userInfoReference, setUserInfoReference] = useState("");
  const [includeRecurringProcessingModel, setIncludeRecurringProcessingModel] =
    useState(true);
  const [recurringProcessingModel, setRecurringProcessingModel] =
    useState<EvonetRecurringProcessingModel>("Subscription");
  const [freeTrial, setFreeTrial] = useState(false);
  const [freeTrialDescription, setFreeTrialDescription] = useState(
    "This is a $0 subscription test"
  );
  const [freeTrialBtnText, setFreeTrialBtnText] = useState(
    "Subscribe for $0 now"
  );
  const [payBtnText, setPayBtnText] = useState("");
  const [hidePayAmount, setHidePayAmount] = useState<boolean | null>(null);
  const [saveCardDescription, setSaveCardDescription] = useState("");
  const [subscribeBtnText, setSubscribeBtnText] = useState("");
  const [hideSubscribeAmount, setHideSubscribeAmount] = useState<boolean | null>(
    null
  );
  const [subscribeDescription, setSubscribeDescription] = useState("");
  const amountBeforeFreeTrialRef = useRef("128.00");
  /** CIT order id used to auto-fetch pmt_ token for MIT panel. */
  const [mitCitOrderId, setMitCitOrderId] = useState<string | null>(null);
  const [enabledPaymentMethodInput, setEnabledPaymentMethodInput] = useState(
    DEFAULT_ENABLED_PAYMENT_METHOD
  );
  const [environment, setEnvironment] = useState(DEFAULT_ENVIRONMENT);
  const [mode, setMode] = useState<EvonetDropinConfig["mode"]>("embedded");
  const [modePreviewOpen, setModePreviewOpen] = useState(false);
  const [locale, setLocale] = useState<string>("en-US");
  const [verifyPaymentBrand, setVerifyPaymentBrand] = useState(true);

  const [maxWaitTime, setMaxWaitTime] = useState("10");
  const [binRules, setBinRules] = useState<BinRule[]>([
    {
      first6No: "552343",
      action: "allow",
      message: "This card is eligible for a limited-time checkout promotion.",
    },
  ]);
  const [binPromoMessage, setBinPromoMessage] = useState<string | null>(null);
  const [binRejectMessage, setBinRejectMessage] = useState<string | null>(null);

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
  const [tncUrl, setTncUrl] = useState(
    "https://evonetglobal.com/company-policies/privacy-policy/"
  );

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
  const [borderRadius, setBorderRadius] = useState<
    [number, number, number, number]
  >([0, 0, 0, 0]);
  const [borderRadiusSet, setBorderRadiusSet] = useState(false);
  const [typography, setTypography] = useState<TypographyState>(
    createEmptyTypographyState
  );

  const [livePreview, setLivePreview] = useState(true);
  const [previewWithPulses, setPreviewWithPulses] = useState(true);
  const [activePulseKey, setActivePulseKey] = useState<string | null>(null);
  const pulseClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sdkInitGeneration, setSdkInitGeneration] = useState(0);
  const prevStructuralFingerprintRef = useRef<string>("");
  const [previewEvents, setPreviewEvents] = useState<EvonetDropinEvent[]>([]);
  const [previewFallbackBadge, setPreviewFallbackBadge] = useState<string | null>(
    null
  );
  const [lastSdkInitInfo, setLastSdkInitInfo] = useState<SdkInitAppliedInfo | null>(
    null
  );

  const triggerPulse = useCallback(
    (key: string) => {
      if (!previewWithPulses) return;
      setActivePulseKey(key);
      if (pulseClearTimerRef.current) {
        clearTimeout(pulseClearTimerRef.current);
      }
      pulseClearTimerRef.current = setTimeout(() => {
        setActivePulseKey(null);
        pulseClearTimerRef.current = null;
      }, 1800);
    },
    [previewWithPulses]
  );

  const [importPanelOpen, setImportPanelOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
      if (pulseClearTimerRef.current) {
        clearTimeout(pulseClearTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!previewWithPulses) {
      setActivePulseKey(null);
      if (pulseClearTimerRef.current) {
        clearTimeout(pulseClearTimerRef.current);
        pulseClearTimerRef.current = null;
      }
    }
  }, [previewWithPulses]);

  const sdkUiOption: EvonetSdkUiOption = useMemo(() => {
    const tnc = buildTnCUiOption(showTnC, tncMode, tncUrl);
    const includeSubscribe =
      saveCardForNextPurchase &&
      includeRecurringProcessingModel &&
      recurringProcessingModel === "Subscription" &&
      !isZeroOrderAmount(orderAmount) &&
      !freeTrial;
    const customDescription = buildCustomDescriptionUiOption({
      includeFreeTrial: freeTrial,
      includePayment: !freeTrial && !includeSubscribe,
      includeSaveCard: saveCardForNextPurchase && !freeTrial,
      includeSubscribe,
      freeTrialDescription,
      freeTrialBtnText,
      payBtnText,
      hidePayAmount,
      saveCardDescription,
      subscribeBtnText,
      hideSubscribeAmount,
      subscribeDescription,
    });
    return {
      showSaveImage,
      ...(columnsLayout ? { columns: true } : {}),
      card: {
        showCardHolderName,
        CVVForSavedCard: cvvForSavedCard,
        ...(showScanCardButton ? { showScanCardButton: true } : {}),
        ...(autoInvokeCardScanner ? { autoInvokeCardScanner: true } : {}),
      },
      ...(tnc ? { TnC: tnc } : {}),
      ...(customDescription ? { customDescription } : {}),
    };
  }, [
      autoInvokeCardScanner,
      columnsLayout,
      cvvForSavedCard,
      freeTrial,
      freeTrialBtnText,
      freeTrialDescription,
      includeRecurringProcessingModel,
      orderAmount,
      hidePayAmount,
      payBtnText,
      recurringProcessingModel,
      saveCardDescription,
      saveCardForNextPurchase,
      showCardHolderName,
      showSaveImage,
      showScanCardButton,
      showTnC,
      hideSubscribeAmount,
      subscribeBtnText,
      subscribeDescription,
      tncMode,
      tncUrl,
    ]
  );

  const handleFreeTrialChange = (enabled: boolean) => {
    setFreeTrial(enabled);
    if (enabled) {
      amountBeforeFreeTrialRef.current = orderAmount.trim() || "128.00";
      setOrderAmount("0");
      setSaveCardForNextPurchase(true);
      setUserInfoReference((prev) => ensureUserInfoReference(prev));
      setIncludeRecurringProcessingModel(true);
      setRecurringProcessingModel("Subscription");
      return;
    }
    const restored = amountBeforeFreeTrialRef.current.trim();
    setOrderAmount(restored && restored !== "0" ? restored : "128.00");
  };

  const handleSaveCardChange = (enabled: boolean) => {
    setSaveCardForNextPurchase(enabled);
    if (enabled) {
      setUserInfoReference((prev) => ensureUserInfoReference(prev));
    }
  };

  const parsedBorderRadius = useMemo(() => {
    if (!borderRadiusSet) {
      return {
        values: null as number[] | null,
        message: "Move a slider to apply borderRadius to the SDK.",
      };
    }
    const isValid = borderRadius.every(
      (value) => Number.isFinite(value) && value >= 0 && value <= 100
    );
    if (!isValid) {
      return {
        values: null as number[] | null,
        message: "Each radius must be a number between 0 and 100.",
      };
    }
    return {
      values: [...borderRadius],
      message: "Applied to Drop-in preview and exported JSON.",
    };
  }, [borderRadius, borderRadiusSet]);

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
      // SDK validates each entry as string (e.g. "10px"), not number.
      appearance.borderRadius = parsedBorderRadius.values.map(
        (value) => `${value}px`
      );
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
      binRules: verifyPaymentBrand ? binRules : undefined,
      _note:
        "Callbacks (payment_method_select, payment_method_selected, payment_completed, payment_failed, payment_not_preformed, payment_cancelled) should be attached in your integration code. Two-column layout requires uiOption.columns: true (lowercase).",
    };
  }, [
    binRules,
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
      binRules: verifyPaymentBrand ? binRules : undefined,
    }),
    [
      binRules,
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

  const structuralFingerprint = useMemo(
    () =>
      buildStructuralFingerprint({
        sessionID,
        environment,
        mode,
        locale,
        verifyPaymentBrand,
        maxWaitTime,
        columnsLayout,
        uiOption: sdkUiOption,
      }),
    [
      columnsLayout,
      environment,
      locale,
      maxWaitTime,
      mode,
      sessionID,
      sdkUiOption,
      verifyPaymentBrand,
    ]
  );

  useEffect(() => {
    if (!livePreview || sdkInitGeneration < 1) {
      return;
    }
    if (prevStructuralFingerprintRef.current === structuralFingerprint) {
      return;
    }
    const timer = window.setTimeout(() => {
      prevStructuralFingerprintRef.current = structuralFingerprint;
      setSdkInitGeneration((value) => value + 1);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [livePreview, structuralFingerprint, sdkInitGeneration]);

  /** Appearance-only: patch :root CSS vars — no Drop-in remount. */
  useEffect(() => {
    if (!livePreview || sdkInitGeneration < 1) {
      return;
    }
    applyDropinAppearanceCss(sdkAppearance);
  }, [livePreview, sdkInitGeneration, sdkAppearance]);

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

  const isSdkOverlayMode = mode === "fullPage" || mode === "bottomUp";

  useEffect(() => {
    if (!isSdkOverlayMode) {
      setModePreviewOpen(false);
    }
  }, [isSdkOverlayMode]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const handleCopy = async (text: string) => {
    const ok = await copyTextToClipboard(text);
    showToast(ok ? tc.jsonCopied : tc.copyFailed);
  };

  /** Returns null on success, or an error message. */
  const handleImportBuilderConfig = (text: string): string | null => {
    const parsed = parseBuilderUiConfigJson(text);
    if (!parsed.ok) {
      return parsed.error;
    }

    const { uiOption, appearance } = parsed.value;

    setShowSaveImage(uiOption.showSaveImage);
    setColumnsLayout(uiOption.columns);
    setShowCardHolderName(uiOption.showCardHolderName);
    setCvvForSavedCard(uiOption.cvvForSavedCard);
    setShowScanCardButton(uiOption.showScanCardButton);
    setAutoInvokeCardScanner(uiOption.autoInvokeCardScanner);
    setShowTnC(uiOption.showTnC);
    setTncMode(uiOption.tncMode);
    setTncUrl(uiOption.tncUrl);
    setFreeTrial(uiOption.freeTrial);
    setFreeTrialDescription(uiOption.freeTrialDescription);
    setFreeTrialBtnText(uiOption.freeTrialBtnText);
    setPayBtnText(uiOption.payBtnText);
    setHidePayAmount(uiOption.hidePayAmount);
    setSaveCardDescription(uiOption.saveCardDescription);
    setSubscribeBtnText(uiOption.subscribeBtnText);
    setHideSubscribeAmount(uiOption.hideSubscribeAmount);
    setSubscribeDescription(uiOption.subscribeDescription);
    if (uiOption.freeTrial) {
      amountBeforeFreeTrialRef.current = orderAmount.trim() || "128.00";
      setOrderAmount("0");
      setSaveCardForNextPurchase(true);
      setUserInfoReference((prev) => ensureUserInfoReference(prev));
      setIncludeRecurringProcessingModel(true);
      setRecurringProcessingModel("Subscription");
    }

    setColorAction(appearance.colors.colorAction);
    setColorBackground(appearance.colors.colorBackground);
    setColorBoxStroke(appearance.colors.colorBoxStroke);
    setColorDisabled(appearance.colors.colorDisabled);
    setColorError(appearance.colors.colorError);
    setColorFormBackground(appearance.colors.colorFormBackground);
    setColorFormBorder(appearance.colors.colorFormBorder);
    setColorInverse(appearance.colors.colorInverse);
    setColorBoxFillingOutline(appearance.colors.colorBoxFillingOutline);
    setColorPlaceholder(appearance.colors.colorPlaceholder);
    setColorPrimary(appearance.colors.colorPrimary);
    setColorSecondary(appearance.colors.colorSecondary);
    setLogoPosition(appearance.logoPosition);

    if (appearance.borderRadius) {
      setBorderRadius(appearance.borderRadius);
      setBorderRadiusSet(true);
    } else {
      setBorderRadius([0, 0, 0, 0]);
      setBorderRadiusSet(false);
    }

    setTypography(appearance.typography);

    return null;
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
      binRules: verifyPaymentBrand ? binRules : undefined,
      enabledPaymentMethod: parseEnabledPaymentMethodInput(
        enabledPaymentMethodInput
      ),
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
    [
      binRules,
      enabledPaymentMethodInput,
      environment,
      includeRecurringProcessingModel,
      locale,
      maxWaitTime,
      mode,
      orderAmount,
      orderCurrency,
      recurringProcessingModel,
      saveCardForNextPurchase,
      sdkAppearance,
      sdkUiOption,
      userInfoReference,
      verifyPaymentBrand,
    ]
  );

  const openAsStorefront = useCallback(() => {
    let config = storefrontConfig;
    if (isFanClubStorefront(config) && !config.userInfoReference?.trim()) {
      const suffix =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID().slice(0, 10)
          : Math.random().toString(36).slice(2, 12);
      const generated = `fan-${suffix}`;
      setUserInfoReference(generated);
      config = { ...config, userInfoReference: generated };
    }
    // Keep a snapshot for the optional /evonet/storefront route; overlay keeps Builder state alive.
    writeStorefrontSnapshot(config);
    setStorefrontLaunchConfig(config);
    setBuilderWarped(true);
    setStorefrontOpen(true);
  }, [storefrontConfig]);

  const closeStorefront = useCallback(() => {
    setStorefrontOpen(false);
    setStorefrontLaunchConfig(null);
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
      if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
        throw new Error("Amount must be a non-negative number.");
      }
      if (!freeTrial && parsedAmount <= 0) {
        throw new Error("Amount must be a positive number.");
      }
      const amountForSession = freeTrial ? 0 : parsedAmount;
      const envForSession = options?.environmentOverride ?? environment;
      const targetForSession = targetFromSdkEnvironment(envForSession);
      const enabledPaymentMethod = parseEnabledPaymentMethodInput(
        enabledPaymentMethodInput
      );
      const returnURL = buildClientEvonetReturnUrl();
      const useSaveCard = freeTrial || saveCardForNextPurchase;
      const useRecurring =
        freeTrial || includeRecurringProcessingModel;
      const recurringModel = freeTrial
        ? "Subscription"
        : recurringProcessingModel;
      const response = await fetch("/api/evonet/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountForSession,
          currency: orderCurrency.trim() || "HKD",
          orderId: generateOrderId(),
          description: orderDescription.trim() || "Drop-in Builder Session",
          environment: envForSession,
          target: targetForSession,
          locale: locale.trim() || "en-US",
          ...(returnURL ? { returnURL } : {}),
          ...(enabledPaymentMethod ? { enabledPaymentMethod } : {}),
          ...(allowAuthentication ? { allowAuthentication: true } : {}),
          ...(useSaveCard
            ? {
                saveCardForNextPurchase: true,
                userInfoReference: userInfoReference.trim(),
                includeRecurringProcessingModel: useRecurring,
                ...(useRecurring
                  ? { recurringProcessingModel: recurringModel }
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
      setSessionSpent(false);
      prevStructuralFingerprintRef.current = "";
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

  /** Amount, save-card, and recurring model are baked into the Interaction session. */
  const skipAmountAutoSessionRef = useRef(true);
  useEffect(() => {
    if (skipAmountAutoSessionRef.current) {
      skipAmountAutoSessionRef.current = false;
      return;
    }
    const parsed = Number.parseFloat(orderAmount);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    if (!freeTrial && parsed <= 0) return;
    if (freeTrial || saveCardForNextPurchase) {
      if (!userInfoReference.trim()) {
        setUserInfoReference(ensureUserInfoReference());
        return;
      }
    }
    const timer = window.setTimeout(() => {
      void handleCreateSession();
    }, 650);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recreate when session-baked fields change
  }, [
    orderAmount,
    orderCurrency,
    freeTrial,
    userInfoReference,
    saveCardForNextPurchase,
    includeRecurringProcessingModel,
    recurringProcessingModel,
  ]);

  const markSessionSpentFromPayment = useCallback((result: EvonetReturnParams) => {
    setPaymentReturnPrompt(result);
    setReturnDialogDismissed(false);
    if (
      result.status === "success" ||
      result.status === "failed" ||
      result.status === "cancelled"
    ) {
      setSessionSpent(true);
    }
    if (result.status === "success") {
      const orderId =
        result.merchantOrderID?.trim() ||
        result.merchantTransID?.trim() ||
        null;
      if (orderId) setMitCitOrderId(orderId);
    }
  }, []);

  useEffect(() => {
    if (!paymentReturnFromUrl || paymentReturnFromUrl.status !== "success") {
      return;
    }
    const orderId =
      paymentReturnFromUrl.merchantOrderID?.trim() ||
      paymentReturnFromUrl.merchantTransID?.trim() ||
      null;
    if (orderId) setMitCitOrderId(orderId);
  }, [paymentReturnFromUrl]);

  const handleDropinPreviewEvent = useCallback(
    (event: EvonetDropinEvent) => {
      const payload = event.payload as
        | {
            source?: string;
            phase?: string;
            matchedRule?: BinRule | null;
            first6No?: string;
            dpanFirst6No?: string;
            isValid?: boolean;
            action?: string;
            msg?: string;
          }
        | undefined;

      if (event.type === "sdk_message" && payload?.source === "dropin_host") {
        if (payload.phase === "construct_ok") setPreviewFallbackBadge(null);
        else if (payload.phase === "construct_ok_without_font_weight") {
          setPreviewFallbackBadge(
            "SDK fallback: fontWeight was ignored for compatibility."
          );
        } else if (payload.phase === "construct_ok_without_border_radius") {
          setPreviewFallbackBadge(
            "SDK fallback: borderRadius was ignored for compatibility."
          );
        }
      }

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
        const matchedRule = payload.matchedRule;
        const first6 = String(payload.first6No ?? "");
        const isValid = Boolean(payload.isValid);
        const action =
          payload.action === "block" || matchedRule?.action === "block"
            ? "block"
            : "allow";

        if (!first6 || first6.length < 6) {
          setBinPromoMessage(null);
          setBinRejectMessage(null);
        } else if (!isValid || action === "block") {
          setBinPromoMessage(null);
          setBinRejectMessage(
            String(payload.msg ?? "").trim() ||
              matchedRule?.rejectMessage?.trim() ||
              t.rejectMessagePlaceholder
          );
        } else {
          setBinRejectMessage(null);
          setBinPromoMessage(matchedRule?.message?.trim() || null);
        }
      } else if (event.type === "payment_method_selected") {
        const maybeFirst6 =
          payload?.first6No || payload?.dpanFirst6No;
        if (maybeFirst6 && maybeFirst6.length >= 6) {
          const matchedRule = binRules.find(
            (rule) =>
              rule.first6No.length === 6 && rule.first6No === maybeFirst6
          );
          if (matchedRule?.action === "block") {
            setBinPromoMessage(null);
            setBinRejectMessage(
              matchedRule.rejectMessage?.trim() ||
                matchedRule.message?.trim() ||
                t.rejectMessagePlaceholder
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
        const fromSdk = parseEvonetSdkPaymentEvent(event.type, event.payload);
        if (fromSdk) markSessionSpentFromPayment(fromSdk);
      }
      setPreviewEvents((previous) => [event, ...previous].slice(0, 20));
    },
    [binRules, markSessionSpentFromPayment, t.rejectMessagePlaceholder]
  );

  /** Re-init alone cannot revive a spent session — mint a new one first. */
  const handlePreviewInit = useCallback(() => {
    if (sessionSpent) {
      void handleCreateSession();
      return;
    }
    setPreviewFallbackBadge(null);
    setBinPromoMessage(null);
    setBinRejectMessage(null);
    setPreviewEvents([]);
    setSdkInitGeneration((value) => value + 1);
  }, [sessionSpent]);

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
    setToastMessage(`Switched to ${nextTarget}`);
    setSessionID(DEFAULT_SESSION_ID);
    setSdkInitGeneration(0);
    setPreviewEvents([]);
    setSessionError(null);

    void handleCreateSession({ environmentOverride: nextEnv });
  };

  const handleResetBrand = () => {
    setColorAction("");
    setColorBackground("");
    setColorFormBackground("");
    setColorDisabled("");
  };

  const handleResetText = () => {
    setColorPrimary("");
    setColorSecondary("");
    setColorPlaceholder("");
    setColorError("");
    setColorInverse("");
  };

  const handleResetBorder = () => {
    setColorBoxStroke("");
    setColorFormBorder("");
    setColorBoxFillingOutline("");
  };

  const handleResetRadius = () => {
    setBorderRadius([0, 0, 0, 0]);
    setBorderRadiusSet(false);
    setLogoPosition("left");
  };

  const handleResetTypography = () => {
    setTypography(createEmptyTypographyState());
  };

  const handleColorChange = (
    key: keyof AppearanceColorsState,
    value: string
  ) => {
    const setters: Record<
      keyof AppearanceColorsState,
      (value: string) => void
    > = {
      colorAction: setColorAction,
      colorBackground: setColorBackground,
      colorFormBackground: setColorFormBackground,
      colorDisabled: setColorDisabled,
      colorPrimary: setColorPrimary,
      colorSecondary: setColorSecondary,
      colorPlaceholder: setColorPlaceholder,
      colorError: setColorError,
      colorInverse: setColorInverse,
      colorBoxStroke: setColorBoxStroke,
      colorFormBorder: setColorFormBorder,
      colorBoxFillingOutline: setColorBoxFillingOutline,
    };
    setters[key](value);
  };

  const handleBorderRadiusChange = (index: 0 | 1 | 2 | 3, value: number) => {
    setBorderRadiusSet(true);
    setBorderRadius((previous) => {
      const next: [number, number, number, number] = [...previous];
      next[index] = value;
      return next;
    });
  };

  const handleTypographyChange = (
    group: TypographyGroup,
    field: FontField,
    value: string
  ) => {
    setTypography((previous) => ({
      ...previous,
      [group]: { ...previous[group], [field]: value },
    }));
  };

  const handleSharedFontFamilyChange = (value: string) => {
    setTypography((previous) => {
      const next = { ...previous };
      for (const group of TYPOGRAPHY_GROUPS) {
        next[group] = { ...next[group], fontFamily: value };
      }
      return next;
    });
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

  const envTarget = targetFromSdkEnvironment(environment);
  const showSaveCardCopy =
    saveCardForNextPurchase &&
    !freeTrial &&
    !includeRecurringProcessingModel;
  const showPaidSubscriptionCopy =
    saveCardForNextPurchase &&
    !freeTrial &&
    includeRecurringProcessingModel &&
    recurringProcessingModel === "Subscription" &&
    !isZeroOrderAmount(orderAmount);
  const showPaymentCopy = !freeTrial && !showPaidSubscriptionCopy;

  return (
    <Box sx={{ minHeight: { md: VIEWPORT_HEIGHT }, overflowX: "hidden", ...pageEnter() }}>
      <Box sx={builderStageMorphSx(builderWarped)}>
        <main
          data-builder-chrome
          className="mx-auto h-auto max-w-7xl overflow-x-hidden px-3 py-5 sm:px-6 md:h-[var(--builder-height)] md:overflow-hidden md:py-4 lg:px-8"
          style={{ "--builder-height": VIEWPORT_HEIGHT } as React.CSSProperties}
          suppressHydrationWarning
        >
          <div className="grid min-w-0 items-start gap-5 md:h-[calc(var(--builder-height)-2rem)] md:grid-cols-[minmax(280px,1fr)_minmax(360px,1.25fr)] md:items-stretch md:gap-6">
            <Box
              className="min-h-0 min-w-0 space-y-5 pb-6 md:h-full md:overflow-x-clip md:overflow-y-auto md:overscroll-contain md:px-2 md:pr-3"
              sx={{
                ...sectionEnter(40),
                WebkitOverflowScrolling: "touch",
              }}
            >
              <Card>
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between md:gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <CardTitle className="text-2xl font-medium tracking-tight text-[#0a0a0a] sm:text-3xl dark:text-foreground">
                        {t.title}
                      </CardTitle>
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
                      <DropinSdkVersionBadge />
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <LocaleSwitcher />
                      <ThemeToggle />
                    </div>
                  </div>
                  <p className="break-words text-sm text-[#737373] sm:text-base dark:text-muted-foreground">
                    {t.description}
                  </p>
                  <div className="mt-1 flex w-full flex-col gap-3 md:hidden">
                    <Button
                      className={`h-auto min-h-10 w-full whitespace-normal ${OPEN_STOREFRONT_BUTTON_CLASS}`}
                      size="lg"
                      onClick={openAsStorefront}
                    >
                      <Store data-icon="inline-start" />
                      {t.openAsStorefront}
                    </Button>
                    <Button variant="outline" className="h-auto min-h-10 w-full whitespace-normal" size="lg" asChild>
                      <a href="#builder-preview">
                        <Eye data-icon="inline-start" />
                        {t.jumpToPreview}
                      </a>
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <Tabs
                value={primaryTab}
                onValueChange={(value) =>
                  setPrimaryTab(value as "order" | "payment" | "appearance")
                }
                className="w-full gap-4"
              >
                <TabsList className={PRIMARY_TABS_LIST_CLASS}>
                  <TabsTrigger
                    value="order"
                    data-builder-tab="primary"
                    className={PRIMARY_TABS_TRIGGER_CLASS}
                  >
                    {t.tabOrderInfo}
                  </TabsTrigger>
                  <TabsTrigger
                    value="payment"
                    data-builder-tab="primary"
                    className={PRIMARY_TABS_TRIGGER_CLASS}
                  >
                    {t.tabPaymentUi}
                  </TabsTrigger>
                  <TabsTrigger
                    value="appearance"
                    data-builder-tab="primary"
                    className={PRIMARY_TABS_TRIGGER_CLASS}
                  >
                    {t.tabVisualStyling}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="order" className="space-y-4">
                  <AppearanceSectionCard title={t.orderInfo}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="order-amount">{t.amount}</Label>
                        <Input
                          id="order-amount"
                          value={orderAmount}
                          onChange={(event) => setOrderAmount(event.target.value)}
                          placeholder="128.00"
                          aria-label="Order amount"
                          disabled={freeTrial}
                        />
                        {freeTrial ? (
                          <p className="text-xs text-muted-foreground">
                            {t.freeTrialHint}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="order-currency">{t.currency}</Label>
                        <Input
                          id="order-currency"
                          value={orderCurrency}
                          onChange={(event) => setOrderCurrency(event.target.value)}
                          placeholder="HKD"
                          aria-label="Order currency"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.locale}</Label>
                        <Select value={locale} onValueChange={setLocale}>
                          <SelectTrigger className="w-full" aria-label={t.locale}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["en-US", "zh-TW", "zh-CN", "ja-JP", "ko-KR"].map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {t.localeHint}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.mode}</Label>
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
                            {dropinModeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {mode === "embedded"
                            ? t.modeEmbedded
                            : mode === "fullPage"
                              ? t.modeFullPage
                              : t.modeBottomUp}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order-description">{t.descriptionLabel}</Label>
                      <Input
                        id="order-description"
                        value={orderDescription}
                        onChange={(event) => setOrderDescription(event.target.value)}
                        placeholder="Drop-in Builder Session"
                        aria-label="Order description"
                      />
                    </div>
                    <div className="rounded-none border border-[#bedbff] bg-[#eff6ff] px-3 py-2 text-sm text-[#162456] dark:border-blue-400/40 dark:bg-blue-950/40 dark:text-blue-100">
                      <span className="font-medium">{t.currentSessionId}</span>{" "}
                      <CopyableIdInline
                        value={sessionID || "N/A"}
                        label="sessionID"
                        className="align-middle text-[#162456] dark:text-blue-100"
                      />
                      {sessionSpent ? (
                        <span className="mt-1 block text-xs text-amber-700 dark:text-amber-400">
                          {t.sessionSpentHint}
                        </span>
                      ) : null}
                    </div>
                    {sessionError ? (
                      <Alert severity="error" variant="outlined">
                        {sessionError}
                      </Alert>
                    ) : null}
                    <div className="flex items-start justify-between gap-4 rounded-none border p-3">
                      <div>
                        <Label htmlFor="allow-authentication" className="font-medium">
                          {t.allowAuthentication}
                        </Label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t.allowAuthenticationHint}
                        </p>
                      </div>
                      <Switch
                        id="allow-authentication"
                        checked={allowAuthentication}
                        onCheckedChange={setAllowAuthentication}
                        aria-label={t.allowAuthentication}
                      />
                    </div>
                    <Accordion
                      type="single"
                      collapsible
                      className="rounded-none border border-border bg-card px-4 text-card-foreground"
                    >
                      <AccordionItem value="save-card" className="border-0">
                        <AccordionTrigger>
                          {t.saveCardAccordion}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                          <div className="flex items-start justify-between gap-4 rounded-none border p-3">
                            <div>
                              <Label htmlFor="save-card" className="font-medium">
                                {t.allowSaveCard}
                              </Label>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t.allowSaveCardHint}
                              </p>
                            </div>
                            <Switch
                              id="save-card"
                              checked={saveCardForNextPurchase}
                              onCheckedChange={handleSaveCardChange}
                              disabled={freeTrial}
                              aria-label={t.allowSaveCard}
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="user-reference">
                                {t.userReference}
                              </Label>
                              <Input
                                id="user-reference"
                                value={userInfoReference}
                                onChange={(event) =>
                                  setUserInfoReference(event.target.value)
                                }
                                placeholder="your_customer_id_123"
                                disabled={!saveCardForNextPurchase}
                                required={saveCardForNextPurchase}
                              />
                              <p className="text-xs text-muted-foreground">
                                {t.userReferenceHint}
                              </p>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="recurring-enabled">
                                  {t.includeRecurringModel}
                                </Label>
                                <Switch
                                  id="recurring-enabled"
                                  checked={includeRecurringProcessingModel}
                                  onCheckedChange={setIncludeRecurringProcessingModel}
                                  disabled={!saveCardForNextPurchase || freeTrial}
                                />
                              </div>
                              <Select
                                value={recurringProcessingModel}
                                onValueChange={(value) =>
                                  setRecurringProcessingModel(
                                    value as EvonetRecurringProcessingModel
                                  )
                                }
                                disabled={
                                  !saveCardForNextPurchase ||
                                  !includeRecurringProcessingModel ||
                                  freeTrial
                                }
                              >
                                <SelectTrigger
                                  className="w-full"
                                  aria-label={t.includeRecurringModel}
                                >
                                  <SelectValue placeholder={t.recurringModelPlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                  {recurringModelOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {showSaveCardCopy ? (
                            <div className="space-y-2">
                              <Label htmlFor="save-card-description">
                                {t.saveCardDescription}
                              </Label>
                              <Input
                                id="save-card-description"
                                value={saveCardDescription}
                                onChange={(event) =>
                                  setSaveCardDescription(event.target.value)
                                }
                                placeholder={t.saveCardDescriptionPlaceholder}
                              />
                              <p className="break-words text-xs text-muted-foreground">
                                {t.saveCardDescriptionHint}
                              </p>
                            </div>
                          ) : null}
                          {saveCardForNextPurchase &&
                          !freeTrial &&
                          includeRecurringProcessingModel ? (
                            <p className="break-words text-xs text-muted-foreground">
                              {t.saveCardCheckboxHiddenHint}
                            </p>
                          ) : null}
                          {showPaidSubscriptionCopy ? (
                            <div className="space-y-4 rounded-none border p-3">
                              <p className="text-sm font-medium">
                                {t.paidSubscriptionCopy}
                              </p>
                              <div className="space-y-4">
                                <div className="min-w-0 space-y-2">
                                  <Label htmlFor="subscribe-btn-text">
                                    {t.subscribeBtnText}
                                  </Label>
                                  <Input
                                    id="subscribe-btn-text"
                                    value={subscribeBtnText}
                                    onChange={(event) =>
                                      setSubscribeBtnText(event.target.value)
                                    }
                                    placeholder="Subscribe"
                                  />
                                  <p className="break-words text-xs text-muted-foreground">
                                    {t.subscribeBtnTextHint}
                                  </p>
                                </div>
                                <div className="min-w-0 space-y-2">
                                  <Label htmlFor="subscribe-description">
                                    {t.subscribeDescription}
                                  </Label>
                                  <Input
                                    id="subscribe-description"
                                    value={subscribeDescription}
                                    onChange={(event) =>
                                      setSubscribeDescription(event.target.value)
                                    }
                                    placeholder="Subscribe and pay now"
                                  />
                                  <p className="break-words text-xs text-muted-foreground">
                                    {t.subscribeDescriptionHint}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="subscribe-amount">
                                  {t.subscribeAmount}
                                </Label>
                                <Select
                                  value={amountDisplayChoice(hideSubscribeAmount)}
                                  onValueChange={(value) =>
                                    setHideSubscribeAmount(
                                      amountDisplayFromChoice(value)
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    id="subscribe-amount"
                                    className="w-full"
                                    aria-label={t.subscribeAmount}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="default">
                                      {t.amountDisplayDefault}
                                    </SelectItem>
                                    <SelectItem value="show">
                                      {t.amountDisplayShow}
                                    </SelectItem>
                                    <SelectItem value="hide">
                                      {t.amountDisplayHide}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  {t.subscribeAmountHint}
                                </p>
                              </div>
                            </div>
                          ) : null}
                          <div className="flex items-start justify-between gap-4 rounded-none border p-3">
                            <div>
                              <Label htmlFor="free-trial" className="font-medium">
                                {t.freeTrial}
                              </Label>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t.freeTrialHint}
                              </p>
                            </div>
                            <Switch
                              id="free-trial"
                              checked={freeTrial}
                              onCheckedChange={handleFreeTrialChange}
                              aria-label={t.freeTrial}
                            />
                          </div>
                          {freeTrial ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="free-trial-description">
                                  {t.freeTrialDescription}
                                </Label>
                                <Input
                                  id="free-trial-description"
                                  value={freeTrialDescription}
                                  onChange={(event) =>
                                    setFreeTrialDescription(event.target.value)
                                  }
                                  placeholder="This is a $0 subscription test"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="free-trial-btn-text">
                                  {t.freeTrialBtnText}
                                </Label>
                                <Input
                                  id="free-trial-btn-text"
                                  value={freeTrialBtnText}
                                  onChange={(event) =>
                                    setFreeTrialBtnText(event.target.value)
                                  }
                                  placeholder="Subscribe for $0 now"
                                />
                              </div>
                            </div>
                          ) : null}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    {saveCardForNextPurchase || freeTrial ? (
                      <TokenMitChargePanel
                        environment={environment}
                        currency={orderCurrency}
                        recurringProcessingModel={recurringProcessingModel}
                        defaultAmount={orderAmount}
                        fallbackAmount={amountBeforeFreeTrialRef.current}
                        citOrderId={mitCitOrderId}
                        idPrefix="builder-mit"
                      />
                    ) : null}
                    <Accordion
                      type="single"
                      collapsible
                      className="rounded-none border border-border bg-card px-4 text-card-foreground"
                    >
                      <AccordionItem value="bin-verification" className="border-0">
                        <AccordionTrigger>
                          {t.binVerificationAccordion}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                          <div className="flex items-start justify-between gap-4 rounded-none border p-3">
                            <div>
                              <Label
                                htmlFor="verify-payment-brand"
                                className="font-medium"
                              >
                                {t.verifyPaymentBrand}
                              </Label>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t.verifyPaymentBrandHint}
                              </p>
                            </div>
                            <Switch
                              id="verify-payment-brand"
                              checked={verifyPaymentBrand}
                              onCheckedChange={(checked) => {
                                setVerifyPaymentBrand(checked);
                                if (!checked) {
                                  setBinPromoMessage(null);
                                  setBinRejectMessage(null);
                                }
                              }}
                              aria-label={t.verifyPaymentBrand}
                            />
                          </div>
                          {verifyPaymentBrand ? (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="max-wait-time">
                                  {t.maxWaitTime}
                                </Label>
                                <Input
                                  id="max-wait-time"
                                  value={maxWaitTime}
                                  onChange={(event) =>
                                    setMaxWaitTime(event.target.value)
                                  }
                                  inputMode="numeric"
                                />
                                <p className="text-xs text-muted-foreground">
                                  {t.maxWaitTimeHint}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {t.binRulesHint}
                              </p>
                              {binRules.length === 0 ? (
                                <div className="rounded-none border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                                  {t.binRulesEmpty}
                                </div>
                              ) : null}
                              <div className="space-y-3">
                                {binRules.map((rule, index) => {
                                  const ruleAction =
                                    rule.action === "block" ? "block" : "allow";
                                  const binReady = rule.first6No.length === 6;
                                  return (
                                    <div
                                      key={index}
                                      className="rounded-none border border-border bg-muted/20 p-3"
                                    >
                                      <div className="mb-2.5 flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                          <p className="text-xs font-semibold tracking-tight">
                                            {t.binRuleLabel(index + 1)}
                                          </p>
                                          <Badge
                                            variant={
                                              binReady
                                                ? ruleAction === "block"
                                                  ? "destructive"
                                                  : "secondary"
                                                : "outline"
                                            }
                                            className="rounded-none px-1.5 py-0 font-mono text-[10px] uppercase tracking-wide"
                                          >
                                            {binReady
                                              ? ruleAction === "block"
                                                ? t.binRuleBlocking
                                                : t.binRuleAllowing
                                              : t.binRuleIncomplete}
                                          </Badge>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 shrink-0 px-2 text-destructive"
                                          onClick={() =>
                                            setBinRules((previous) =>
                                              previous.filter(
                                                (_, ruleIndex) =>
                                                  ruleIndex !== index
                                              )
                                            )
                                          }
                                        >
                                          {t.removeBinRule}
                                        </Button>
                                      </div>

                                      <div className="grid gap-2.5 sm:grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)]">
                                        <div className="space-y-1.5">
                                          <Label
                                            htmlFor={`builder-bin-${index}`}
                                            className="text-xs"
                                          >
                                            {t.cardBin}
                                          </Label>
                                          <Input
                                            id={`builder-bin-${index}`}
                                            value={rule.first6No}
                                            onChange={(event) => {
                                              const value = event.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 6);
                                              setBinRules((previous) =>
                                                previous.map(
                                                  (item, ruleIndex) =>
                                                    ruleIndex === index
                                                      ? {
                                                          ...item,
                                                          first6No: value,
                                                        }
                                                      : item
                                                )
                                              );
                                            }}
                                            maxLength={6}
                                            placeholder="491794"
                                            className="font-mono tabular-nums"
                                            inputMode="numeric"
                                            aria-invalid={!binReady}
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label
                                            htmlFor={`builder-bin-action-${index}`}
                                            className="text-xs"
                                          >
                                            {t.binAction}
                                          </Label>
                                          <Select
                                            value={ruleAction}
                                            onValueChange={(value) =>
                                              setBinRules((previous) =>
                                                previous.map(
                                                  (item, ruleIndex) =>
                                                    ruleIndex === index
                                                      ? {
                                                          ...item,
                                                          action: value as
                                                            | "allow"
                                                            | "block",
                                                        }
                                                      : item
                                                )
                                              )
                                            }
                                          >
                                            <SelectTrigger
                                              id={`builder-bin-action-${index}`}
                                              className="w-full"
                                              aria-label={t.binRuleLabel(
                                                index + 1
                                              )}
                                            >
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="allow">
                                                {t.binActionAllow}
                                              </SelectItem>
                                              <SelectItem value="block">
                                                {t.binActionBlock}
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      {!binReady ? (
                                        <p className="mt-1.5 text-xs text-muted-foreground">
                                          {t.cardBinIncompleteHint}
                                        </p>
                                      ) : null}

                                      <div className="mt-2.5 space-y-1.5">
                                        {ruleAction === "allow" ? (
                                          <>
                                            <Label
                                              htmlFor={`builder-bin-promo-${index}`}
                                              className="text-xs"
                                            >
                                              {t.promoMessage}
                                            </Label>
                                            <Input
                                              id={`builder-bin-promo-${index}`}
                                              value={rule.message ?? ""}
                                              onChange={(event) =>
                                                setBinRules((previous) =>
                                                  previous.map(
                                                    (item, ruleIndex) =>
                                                      ruleIndex === index
                                                        ? {
                                                            ...item,
                                                            message:
                                                              event.target
                                                                .value,
                                                          }
                                                        : item
                                                  )
                                                )
                                              }
                                            />
                                          </>
                                        ) : (
                                          <>
                                            <Label
                                              htmlFor={`builder-bin-reject-${index}`}
                                              className="text-xs"
                                            >
                                              {t.rejectMessage}
                                            </Label>
                                            <Input
                                              id={`builder-bin-reject-${index}`}
                                              value={rule.rejectMessage ?? ""}
                                              placeholder={
                                                t.rejectMessagePlaceholder
                                              }
                                              onChange={(event) =>
                                                setBinRules((previous) =>
                                                  previous.map(
                                                    (item, ruleIndex) =>
                                                      ruleIndex === index
                                                        ? {
                                                            ...item,
                                                            rejectMessage:
                                                              event.target
                                                                .value,
                                                          }
                                                        : item
                                                  )
                                                )
                                              }
                                            />
                                          </>
                                        )}
                                      </div>
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
                                      rejectMessage: t.rejectMessagePlaceholder,
                                    },
                                  ]);
                                }}
                              >
                                {t.addBinRule}
                              </Button>
                            </>
                          ) : null}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </AppearanceSectionCard>
                </TabsContent>

                <TabsContent value="payment" className="space-y-4">
                  <AppearanceSectionCard title={t.paymentUi}>
                    <div className="space-y-2">
                      <Label htmlFor="enabled-payment-method">
                        {t.orderPaymentMethods}
                      </Label>
                      <Input
                        id="enabled-payment-method"
                        value={enabledPaymentMethodInput}
                        onChange={(event) =>
                          setEnabledPaymentMethodInput(event.target.value)
                        }
                        placeholder="ApplePay,GooglePay,Octopus,*"
                        className="font-mono"
                        aria-label="Order Payment Methods"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t.orderPaymentMethodsHint}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-1">
                      {(
                        [
                          [
                            showSaveImage,
                            setShowSaveImage,
                            t.showSaveImage,
                            t.showSaveImageHint,
                          ],
                          [
                            columnsLayout,
                            setColumnsLayout,
                            t.columnsLayout,
                            t.columnsLayoutHint,
                          ],
                          [
                            showCardHolderName,
                            setShowCardHolderName,
                            t.showCardHolderName,
                          ],
                          [
                            cvvForSavedCard,
                            setCvvForSavedCard,
                            t.cvvForSavedCard,
                          ],
                        ] as const
                      ).map(([checked, onChange, label, caption]) => (
                        <div
                          key={label}
                          className="flex items-start justify-between gap-3 rounded-none border p-3"
                        >
                          <div>
                            <Label className="font-medium">{label}</Label>
                            {caption ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {caption}
                              </p>
                            ) : null}
                          </div>
                          <Switch
                            checked={checked}
                            onCheckedChange={onChange}
                            aria-label={label}
                          />
                        </div>
                      ))}
                    </div>
                    {showPaymentCopy ? (
                      <Accordion
                        type="single"
                        collapsible
                        className="rounded-none border border-border bg-card px-4 text-card-foreground"
                      >
                        <AccordionItem value="custom-payment-copy" className="border-0">
                          <AccordionTrigger>
                            {t.customPaymentCopyAccordion}
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4 pt-2">
                            <div className="space-y-2">
                              <Label htmlFor="pay-btn-text">{t.payBtnText}</Label>
                              <Input
                                id="pay-btn-text"
                                value={payBtnText}
                                onChange={(event) =>
                                  setPayBtnText(event.target.value)
                                }
                                placeholder={t.payBtnTextPlaceholder}
                              />
                              <p className="text-xs text-muted-foreground">
                                {t.payBtnTextHint}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="pay-amount">{t.payAmount}</Label>
                              <Select
                                value={amountDisplayChoice(hidePayAmount)}
                                onValueChange={(value) =>
                                  setHidePayAmount(amountDisplayFromChoice(value))
                                }
                              >
                                <SelectTrigger
                                  id="pay-amount"
                                  className="w-full"
                                  aria-label={t.payAmount}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default">
                                    {t.amountDisplayDefault}
                                  </SelectItem>
                                  <SelectItem value="show">
                                    {t.amountDisplayShow}
                                  </SelectItem>
                                  <SelectItem value="hide">
                                    {t.amountDisplayHide}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                {t.payAmountHint}
                              </p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : null}
                    <Accordion
                      type="single"
                      collapsible
                      className="rounded-none border border-border bg-card px-4 text-card-foreground"
                    >
                      <AccordionItem value="scanner-tnc" className="border-0">
                        <AccordionTrigger>{t.cardScannerTnc}</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                          <div className="grid gap-3 sm:grid-cols-1">
                            {(
                              [
                                [
                                  showScanCardButton,
                                  setShowScanCardButton,
                                  t.showScanCardButton,
                                ],
                                [
                                  autoInvokeCardScanner,
                                  setAutoInvokeCardScanner,
                                  t.autoInvokeCardScanner,
                                ],
                                [showTnC, setShowTnC, t.showTermsAndConditions],
                              ] as const
                            ).map(([checked, onChange, label]) => (
                              <div
                                key={label}
                                className="flex items-center justify-between gap-3 rounded-none border p-3"
                              >
                                <Label className="font-medium">{label}</Label>
                                <Switch
                                  checked={checked}
                                  onCheckedChange={onChange}
                                  aria-label={label}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label>{t.tncMode}</Label>
                              <Select
                                value={tncMode}
                                onValueChange={(value) =>
                                  setTncMode(value as "checkbox" | "click2accept")
                                }
                                disabled={!showTnC}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="checkbox">checkbox</SelectItem>
                                  <SelectItem value="click2accept">
                                    click2accept
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <Label htmlFor="tnc-url">{t.tncUrl}</Label>
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
                                {t.tncUrlHint}
                              </p>
                              {showTnC && tncUrl.trim() && !isValidTnCUrl(tncUrl) ? (
                                <p className="text-xs text-destructive">
                                  {t.tncUrlInvalid}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </AppearanceSectionCard>
                </TabsContent>

                <TabsContent value="appearance">
                  <AppearanceTabs
                    colors={{
                      colorAction,
                      colorBackground,
                      colorFormBackground,
                      colorDisabled,
                      colorPrimary,
                      colorSecondary,
                      colorPlaceholder,
                      colorError,
                      colorInverse,
                      colorBoxStroke,
                      colorFormBorder,
                      colorBoxFillingOutline,
                    }}
                    onColorChange={handleColorChange}
                    onResetBrand={handleResetBrand}
                    onResetText={handleResetText}
                    onResetBorder={handleResetBorder}
                    borderRadius={borderRadius}
                    onBorderRadiusChange={handleBorderRadiusChange}
                    onResetRadius={handleResetRadius}
                    logoPosition={logoPosition}
                    onLogoPositionChange={setLogoPosition}
                    typography={typography}
                    onTypographyChange={handleTypographyChange}
                    onSharedFontFamilyChange={handleSharedFontFamilyChange}
                    onResetTypography={handleResetTypography}
                    onPulseKey={triggerPulse}
                  />
                </TabsContent>
              </Tabs>
            </Box>

            <Box id="builder-preview" className="min-h-0 min-w-0 scroll-mt-4 md:h-full" sx={sectionEnter(80)}>
              <Card className="min-w-0 gap-0 overflow-visible rounded-none border border-border py-0 md:flex md:h-full md:flex-col">
                <CardHeader className="space-y-4 border-b bg-muted/40 px-4 py-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-medium text-[#0a0a0a] dark:text-foreground">
                        {t.dropinPreview}
                      </CardTitle>
                      <Badge variant="outline" className="font-mono text-xs">
                        {dropinModeOptions.find((option) => option.value === mode)?.label ?? mode}
                      </Badge>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                      <Label htmlFor="live-preview">{t.autoRefresh}</Label>
                      <Switch
                        id="live-preview"
                        checked={livePreview}
                        onCheckedChange={setLivePreview}
                      />
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className={`h-auto min-h-9 w-full whitespace-normal ${OPEN_STOREFRONT_BUTTON_CLASS}`}
                    onClick={openAsStorefront}
                  >
                    <Store data-icon="inline-start" />
                    {t.openStorefrontCta}
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                  <p className="break-words text-xs text-muted-foreground">{t.openStorefrontHint}</p>
                </CardHeader>
                <CardContent className="min-w-0 space-y-4 overflow-x-clip overflow-y-auto p-4 md:min-h-0 md:flex-1">
                  {sessionSpent && !showReturnDialog ? (
                    <Alert severity="warning" variant="outlined">
                      {t.sessionSpentWarning}
                    </Alert>
                  ) : null}
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <Button
                      className="h-auto min-h-8 w-full whitespace-normal sm:w-auto"
                      onClick={handlePreviewInit}
                      disabled={
                        isCreatingSession || (!canRenderPreview && !sessionSpent)
                      }
                    >
                      {isCreatingSession
                        ? t.creatingSession
                        : sessionSpent
                          ? t.refreshSessionAndReinit
                          : t.initializeReinit}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto min-h-8 w-full whitespace-normal border-border bg-background text-foreground shadow-none sm:w-auto hover:bg-muted/60"
                      onClick={() => void handleCreateSession()}
                      disabled={isCreatingSession}
                    >
                      {isCreatingSession
                        ? t.creatingSession
                        : sessionSpent
                          ? t.refreshSessionIdRequired
                          : t.refreshSessionId}
                    </Button>
                  </div>
                  {!canRenderPreview && !sessionSpent ? (
                    <Alert severity="warning" variant="outlined">
                      {t.previewDisabled}
                    </Alert>
                  ) : null}
                  <DemoTransactionWarning
                    environment={environment}
                    sx={{ mb: 2, wordBreak: "break-word" }}
                  />
                  {binRejectMessage ? (
                    <div
                      role="alert"
                      className="rounded-none border border-red-200 bg-red-50 p-3 text-sm text-red-950 dark:border-red-400/40 dark:bg-red-950/40 dark:text-red-100"
                    >
                      {binRejectMessage}
                    </div>
                  ) : null}
                  {binPromoMessage ? (
                    <div
                      role="status"
                      className="rounded-none border border-border bg-muted p-3 text-sm text-foreground"
                    >
                      {binPromoMessage}
                    </div>
                  ) : null}
                  {isSdkOverlayMode ? (
                    <div className="space-y-3 rounded-none border border-dashed border-border bg-muted/30 p-4">
                      <p className="text-sm font-medium">{t.sdkModeTitle(mode)}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.sdkModeBody(mode)}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="h-auto min-h-7 whitespace-normal"
                        disabled={isCreatingSession || (!canRenderPreview && !sessionSpent)}
                        onClick={() => {
                          if (sessionSpent || sdkInitGeneration < 1) {
                            handlePreviewInit();
                          }
                          setModePreviewOpen(true);
                        }}
                      >
                        {sessionSpent
                          ? t.refreshSessionAndOpenPreview
                          : sdkInitGeneration < 1
                            ? t.initializeAndOpenPreview
                            : t.openPreview}
                      </Button>
                    </div>
                  ) : (
                    <DropinPreviewStage
                      pulsesEnabled={previewWithPulses}
                      onPulsesChange={setPreviewWithPulses}
                    >
                      <EvonetDropinHost
                        config={dropinConfigForPreview}
                        initGeneration={sdkInitGeneration}
                        pulseKey={activePulseKey}
                        onEvent={handleDropinPreviewEvent}
                        onSdkInitApplied={(info) => setLastSdkInitInfo(info)}
                        compact
                      />
                    </DropinPreviewStage>
                  )}
                  <DropinModePreviewShell
                    mode={mode}
                    open={modePreviewOpen}
                    onClose={() => setModePreviewOpen(false)}
                  >
                    {isSdkOverlayMode && modePreviewOpen && canRenderPreview ? (
                      <EvonetDropinHost
                        config={dropinConfigForPreview}
                        initGeneration={sdkInitGeneration}
                        pulseKey={activePulseKey}
                        onEvent={handleDropinPreviewEvent}
                        onSdkInitApplied={(info) => setLastSdkInitInfo(info)}
                        compact={false}
                      />
                    ) : null}
                  </DropinModePreviewShell>
                  {previewFallbackBadge ? <Alert severity="info" variant="outlined">{previewFallbackBadge}</Alert> : null}
                  <Separator />
                  <section className="min-w-0 flex flex-col gap-3">
                    <h2 className="text-sm font-semibold text-foreground" style={DEV_CONSOLE_SECTION_TITLE_SX}>{t.uiConfigTitle}</h2>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">{t.uiConfigSubtitle}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setImportPanelOpen((open) => !open)}
                        >
                          {tc.import}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleCopy(builderConfigJson)}
                        >
                          {tc.copy}
                        </Button>
                      </div>
                    </div>
                    <Box
                      component="pre"
                      className="code-panel-scroll"
                      sx={{ ...CODE_PANEL_PRE_SX, maxWidth: "100%", maxHeight: 220 }}
                    >
                      {builderConfigJson}
                    </Box>
                    <UiConfigImportPanel
                      open={importPanelOpen}
                      onOpenChange={setImportPanelOpen}
                      onNotify={showToast}
                      onApply={(text) => {
                        const error = handleImportBuilderConfig(text);
                        if (!error) {
                          showToast(tc.imported);
                        }
                        return error;
                      }}
                    />
                    <Accordion
                      type="single"
                      collapsible
                      className="mt-2 rounded-none border border-border bg-card px-4 text-card-foreground"
                    >
                      <AccordionItem value="runtime" className="border-0">
                        <AccordionTrigger>{t.sdkRuntimeJson}</AccordionTrigger>
                        <AccordionContent className="space-y-3 pt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleCopy(sdkPayloadJson)}
                            >
                              {tc.copy}
                            </Button>
                          </div>
                          <Box
                            component="pre"
                            className="code-panel-scroll"
                            sx={{
                              ...CODE_PANEL_PRE_SX,
                              maxWidth: "100%",
                              maxHeight: 220,
                            }}
                          >
                            {sdkPayloadJson}
                          </Box>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </section>
                </CardContent>
              </Card>
            </Box>
          </div>

          <EvonetPaymentReturnDialog
            open={showReturnDialog}
            params={paymentReturnPrompt}
            onDismiss={() => {
              setReturnDialogDismissed(true);
              if (sessionSpent) {
                setPrimaryTab("order");
              }
            }}
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
          {(() => {
            const launch = storefrontLaunchConfig ?? storefrontConfig;
            return isFanClubStorefront(launch) ? (
              <FanClubExperience
                config={launch}
                onBackToBuilder={closeStorefront}
              />
            ) : (
              <StorefrontExperience
                config={launch}
                onBackToBuilder={closeStorefront}
              />
            );
          })()}
        </Suspense>
      </StorefrontMorphOverlay>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={2200}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        ContentProps={{
          sx: {
            minWidth: 0,
            typography: "body2",
            fontWeight: 500,
          },
        }}
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
