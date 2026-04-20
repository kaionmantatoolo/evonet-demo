"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  EvonetDropinHost,
  type SdkInitAppliedInfo,
} from "../../../components/EvonetDropinHost";
import type {
  EvonetDropinConfig,
  EvonetDropinEvent,
  EvonetSdkAppearance,
  EvonetSdkFontObject,
  EvonetSdkUiOption,
} from "../../../types/evonet";

const DEFAULT_ENVIRONMENT =
  (process.env.NEXT_PUBLIC_EVONET_ENVIRONMENT as string | undefined) ??
  "HKG_prod";
const DEFAULT_SESSION_ID =
  process.env.NEXT_PUBLIC_EVONET_SESSION_ID ?? "REPLACE_WITH_REAL_SESSION_ID";

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
    label: "System Sans (Recommended)",
    value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },
  {
    label: "Roboto",
    value: 'Roboto, "Segoe UI", Arial, sans-serif',
  },
  {
    label: "Arial",
    value: "Arial, sans-serif",
  },
  {
    label: "Helvetica",
    value: "Helvetica, Arial, sans-serif",
  },
  {
    label: "Verdana",
    value: "Verdana, Arial, sans-serif",
  },
  {
    label: "Georgia",
    value: "Georgia, serif",
  },
  {
    label: "Times New Roman",
    value: '"Times New Roman", Times, serif',
  },
  {
    label: "JetBrains Mono",
    value: '"JetBrains Mono", Menlo, Monaco, Consolas, monospace',
  },
  {
    label: "Courier New",
    value: '"Courier New", Courier, monospace',
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
  "normal",
  "400",
  "700",
  "bold",
] as const;

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

export default function DropinBuilderPage() {
  const [mountedAt, setMountedAt] = useState<string>("");
  const [sessionID, setSessionID] = useState(DEFAULT_SESSION_ID);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState("10.00");
  const [orderCurrency, setOrderCurrency] = useState(
    process.env.NEXT_PUBLIC_EVONET_DEFAULT_CURRENCY ?? "HKD"
  );
  const [orderDescription, setOrderDescription] = useState(
    "Drop-in Builder Session"
  );
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

  const [colorAction, setColorAction] = useState("#111827");
  const [colorBackground, setColorBackground] = useState("#ffffff");
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

  useEffect(() => {
    setMountedAt(new Date().toISOString());
  }, []);

  const sdkUiOption: EvonetSdkUiOption = useMemo(
    () => ({
      showSaveImage,
      Columns: columnsLayout,
      card: {
        showCardHolderName,
        CVVForSavedCard: cvvForSavedCard,
        ...(showScanCardButton ? { showScanCardButton: true } : {}),
        ...(autoInvokeCardScanner ? { autoInvokeCardScanner: true } : {}),
      },
      TnC: {
        showTnC,
        mode: tncMode,
        url: showTnC ? tncUrl : "",
      },
    }),
    [
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
    const appearance: EvonetSdkAppearance = {
      colorBackground: colorBackground.trim() || "#ffffff",
    };
    const put = (key: keyof EvonetSdkAppearance, value: string) => {
      const v = value.trim();
      if (v) {
        const normalized =
          key.toString().startsWith("color") ? normalizeHexColor(v) : v;
        (appearance as Record<string, unknown>)[key as string] = normalized;
      }
    };
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
      profile: "dropin-builder-v1",
      generatedAt: mountedAt,
      sdk: {
        sessionID: sessionID.trim(),
        environment: environment.trim(),
        mode,
        locale: locale.trim() || "en-US",
        verifyPaymentBrand,
        maxWaitTime: maxWaitTime.trim() || "10",
        uiOption: sdkUiOption,
        appearance: sdkAppearance,
      },
    }),
    [
      environment,
      locale,
      mountedAt,
      maxWaitTime,
      mode,
      sessionID,
      sdkAppearance,
      sdkUiOption,
      verifyPaymentBrand,
    ]
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

  const handleCreateSession = async () => {
    setSessionError(null);
    setIsCreatingSession(true);
    try {
      const parsedAmount = Number.parseFloat(orderAmount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Amount must be a positive number.");
      }
      const response = await fetch("/api/evonet/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          currency: orderCurrency.trim() || "HKD",
          orderId: generateOrderId(),
          description: orderDescription.trim() || "Drop-in Builder Session",
          environment,
          locale: locale.trim() || "en-US",
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

  const handleResetTheme = () => {
    setColorAction("#111827");
    setColorBackground("#ffffff");
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
    void handleCreateSession();
    // Auto-create once when page loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 4, sm: 2 },
        height: { sm: "100vh" },
        overflow: { sm: "hidden" },
      }}
      suppressHydrationWarning
    >
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1.7fr) minmax(300px, 1fr)" },
          alignItems: "start",
          height: { sm: "calc(100vh - 32px)" },
        }}
      >
        <Box
          sx={{
            minHeight: { sm: 0 },
            height: { sm: "100%" },
            overflowY: { sm: "auto" },
            pr: { sm: 1 },
          }}
        >
          <Stack spacing={3}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "#E5E7EB",
                bgcolor: "#FFFFFF",
              }}
            >
              <Stack spacing={1.5}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, letterSpacing: -0.3, color: "#1F2937" }}
                >
                  Drop-in Builder
                </Typography>
                <Typography variant="body1" sx={{ color: "#4B5563", maxWidth: 760 }}>
                  Configure Evonet Drop-in SDK options with a guided interface,
                  preview the result instantly, and copy JSON in one click.
                </Typography>
                <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                  <Button size="small" variant="outlined">
                    SDK-only config
                  </Button>
                  <Button size="small" variant="outlined">
                    1-click copy JSON
                  </Button>
                  <Button size="small" variant="outlined">
                    Sticky live preview
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "#E5E7EB",
                bgcolor: "#FFFFFF",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#1F2937" }}>
                Order Info
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Amount"
                    value={orderAmount}
                    onChange={(event) => setOrderAmount(event.target.value)}
                    placeholder="10.00"
                    inputProps={{ "aria-label": "Order amount" }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Currency"
                    value={orderCurrency}
                    onChange={(event) => setOrderCurrency(event.target.value)}
                    placeholder="HKD"
                    inputProps={{ "aria-label": "Order currency" }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleCreateSession}
                    disabled={isCreatingSession}
                    sx={{ height: 56 }}
                  >
                    {isCreatingSession ? "Creating Session..." : "Refresh Session ID"}
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={orderDescription}
                    onChange={(event) => setOrderDescription(event.target.value)}
                    placeholder="Drop-in Builder Session"
                    inputProps={{ "aria-label": "Order description" }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info" variant="outlined">
                    Current Session ID: {sessionID || "N/A"}
                  </Alert>
                </Grid>
                {sessionError ? (
                  <Grid item xs={12}>
                    <Alert severity="error" variant="outlined">
                      {sessionError}
                    </Alert>
                  </Grid>
                ) : null}
              </Grid>
            </Paper>

            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "#E5E7EB",
                bgcolor: "#FFFFFF",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#1F2937" }}>
                Payment UI
              </Typography>
              <Grid container spacing={1.75}>
                {[
                  {
                    checked: showSaveImage,
                    onChange: setShowSaveImage,
                    label: "Show Save Image",
                  },
                  {
                    checked: columnsLayout,
                    onChange: setColumnsLayout,
                    label: "Columns Layout",
                  },
                  {
                    checked: showCardHolderName,
                    onChange: setShowCardHolderName,
                    label: "Show Card Holder Name",
                  },
                  {
                    checked: cvvForSavedCard,
                    onChange: setCvvForSavedCard,
                    label: "CVV For Saved Card",
                  },
                  {
                    checked: showScanCardButton,
                    onChange: setShowScanCardButton,
                    label: "Show Scan Card Button",
                  },
                  {
                    checked: autoInvokeCardScanner,
                    onChange: setAutoInvokeCardScanner,
                    label: "Auto Invoke Card Scanner",
                  },
                  {
                    checked: showTnC,
                    onChange: setShowTnC,
                    label: "Show Terms and Conditions",
                  },
                ].map((item) => (
                  <Grid item key={item.label} xs={12} sm={6} md={4}>
                    <Box
                      sx={{
                        border: "1px solid #E5E7EB",
                        borderRadius: 2,
                        px: 1.5,
                        py: 1.25,
                        minHeight: 56,
                        display: "flex",
                        alignItems: "center",
                        bgcolor: "#FAFAFA",
                      }}
                    >
                      <FormControlLabel
                        sx={{ m: 0, width: "100%" }}
                        control={
                          <Switch
                            checked={item.checked}
                            onChange={(event) => item.onChange(event.target.checked)}
                            sx={{
                              mr: 1,
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "#3B82F6",
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                bgcolor: "#3B82F6",
                              },
                            }}
                          />
                        }
                        label={item.label}
                        slotProps={{
                          typography: { variant: "body2", sx: { color: "#1F2937" } },
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small" disabled={!showTnC}>
                    <InputLabel id="builder-tnc-mode-label">TnC Mode</InputLabel>
                    <Select
                      labelId="builder-tnc-mode-label"
                      label="TnC Mode"
                      value={tncMode}
                      onChange={(event) =>
                        setTncMode(event.target.value as "checkbox" | "click2accept")
                      }
                    >
                      <MenuItem value="checkbox">checkbox</MenuItem>
                      <MenuItem value="click2accept">click2accept</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={8}>
                  <TextField
                    fullWidth
                    size="small"
                    disabled={!showTnC}
                    label="TnC URL"
                    value={tncUrl}
                    onChange={(event) => setTncUrl(event.target.value)}
                    placeholder="https://example.com/tnc"
                    inputProps={{ "aria-label": "Terms and conditions URL" }}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "#E5E7EB",
                bgcolor: "#FFFFFF",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#1F2937" }}>
                  Theme
                </Typography>
                <Button size="small" variant="text" onClick={handleResetTheme}>
                  Reset Theme
                </Button>
              </Stack>
              <Grid container spacing={1.75}>
                <Grid item xs={12} sm={6} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="color"
                      size="small"
                      value={normalizeHexColor(colorBackground) || "#ffffff"}
                      onChange={(event) => setColorBackground(event.target.value)}
                      inputProps={{ "aria-label": "Background color picker" }}
                      sx={{ width: 52 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Background"
                      value={colorBackground}
                      onChange={(event) => setColorBackground(event.target.value)}
                      placeholder="#ffffff"
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="color"
                      size="small"
                      value={normalizeHexColor(colorPrimary) || "#3b82f6"}
                      onChange={(event) => setColorPrimary(event.target.value)}
                      inputProps={{ "aria-label": "Primary color picker" }}
                      sx={{ width: 52 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Primary"
                      value={colorPrimary}
                      onChange={(event) => setColorPrimary(event.target.value)}
                      placeholder="#4f46e5"
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="color"
                      size="small"
                      value={normalizeHexColor(colorSecondary) || "#0ea5e9"}
                      onChange={(event) => setColorSecondary(event.target.value)}
                      inputProps={{ "aria-label": "Secondary color picker" }}
                      sx={{ width: 52 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Secondary"
                      value={colorSecondary}
                      onChange={(event) => setColorSecondary(event.target.value)}
                      placeholder="#0ea5e9"
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="color"
                      size="small"
                      value={normalizeHexColor(colorAction) || "#111827"}
                      onChange={(event) => setColorAction(event.target.value)}
                      inputProps={{ "aria-label": "Action color picker" }}
                      sx={{ width: 52 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Action"
                      value={colorAction}
                      onChange={(event) => setColorAction(event.target.value)}
                      placeholder="#111827"
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="color"
                      size="small"
                      value={normalizeHexColor(colorError) || "#dc2626"}
                      onChange={(event) => setColorError(event.target.value)}
                      inputProps={{ "aria-label": "Error color picker" }}
                      sx={{ width: 52 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Error"
                      value={colorError}
                      onChange={(event) => setColorError(event.target.value)}
                      placeholder="#DC2626"
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="color"
                      size="small"
                      value={normalizeHexColor(colorDisabled) || "#9ca3af"}
                      onChange={(event) => setColorDisabled(event.target.value)}
                      inputProps={{ "aria-label": "Disabled color picker" }}
                      sx={{ width: 52 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Disabled"
                      value={colorDisabled}
                      onChange={(event) => setColorDisabled(event.target.value)}
                      placeholder="#9CA3AF"
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="color"
                      size="small"
                      value={normalizeHexColor(colorFormBackground) || "#ffffff"}
                      onChange={(event) => setColorFormBackground(event.target.value)}
                      inputProps={{ "aria-label": "Form background color picker" }}
                      sx={{ width: 52 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Form Background"
                      value={colorFormBackground}
                      onChange={(event) => setColorFormBackground(event.target.value)}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="color"
                      size="small"
                      value={normalizeHexColor(colorFormBorder) || "#d1d5db"}
                      onChange={(event) => setColorFormBorder(event.target.value)}
                      inputProps={{ "aria-label": "Form border color picker" }}
                      sx={{ width: 52 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Form Border"
                      value={colorFormBorder}
                      onChange={(event) => setColorFormBorder(event.target.value)}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="color"
                      size="small"
                      value={normalizeHexColor(colorBoxStroke) || "#d1d5db"}
                      onChange={(event) => setColorBoxStroke(event.target.value)}
                      inputProps={{ "aria-label": "Box stroke color picker" }}
                      sx={{ width: 52 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Box Stroke"
                      value={colorBoxStroke}
                      onChange={(event) => setColorBoxStroke(event.target.value)}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="color"
                      size="small"
                      value={normalizeHexColor(colorBoxFillingOutline) || "#e5e7eb"}
                      onChange={(event) => setColorBoxFillingOutline(event.target.value)}
                      inputProps={{ "aria-label": "Box filling outline color picker" }}
                      sx={{ width: 52 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Box Filling Outline"
                      value={colorBoxFillingOutline}
                      onChange={(event) => setColorBoxFillingOutline(event.target.value)}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="color"
                      size="small"
                      value={normalizeHexColor(colorPlaceholder) || "#9ca3af"}
                      onChange={(event) => setColorPlaceholder(event.target.value)}
                      inputProps={{ "aria-label": "Placeholder color picker" }}
                      sx={{ width: 52 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Placeholder"
                      value={colorPlaceholder}
                      onChange={(event) => setColorPlaceholder(event.target.value)}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="color"
                      size="small"
                      value={normalizeHexColor(colorInverse) || "#0f172a"}
                      onChange={(event) => setColorInverse(event.target.value)}
                      inputProps={{ "aria-label": "Inverse color picker" }}
                      sx={{ width: 52 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Inverse"
                      value={colorInverse}
                      onChange={(event) => setColorInverse(event.target.value)}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Logo Position"
                    value={logoPosition}
                    onChange={(event) =>
                      setLogoPosition(event.target.value as "left" | "middle" | "right")
                    }
                  >
                    <MenuItem value="left">left (default)</MenuItem>
                    <MenuItem value="middle">middle</MenuItem>
                    <MenuItem value="right">right</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    size="small"
                    label="borderRadius (comma-separated 4 values)"
                    value={borderRadiusInput}
                    onChange={(event) => setBorderRadiusInput(event.target.value)}
                    placeholder="8,8,8,8"
                    error={Boolean(borderRadiusInput.trim()) && !parsedBorderRadius.values}
                    helperText={parsedBorderRadius.message}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "#E5E7EB",
                bgcolor: "#FFFFFF",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#1F2937" }}>
                  Advanced Typography
                </Typography>
                <Button size="small" variant="text" onClick={handleResetTypography}>
                  Reset Typography
                </Button>
              </Stack>
              <Stack spacing={2}>
                {TYPOGRAPHY_GROUPS.map((group) => (
                  <Paper key={group} variant="outlined" sx={{ p: 2, pb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {group}
                    </Typography>
                    <Grid container spacing={1.5}>
                      {FONT_FIELDS.map((field) => (
                        <Grid item xs={12} sm={6} md={3} key={`${group}-${field}`}>
                          {field === "fontFamily" ? (
                            <TextField
                              fullWidth
                              select
                              size="small"
                              label="fontFamily"
                              value={typography[group][field] ?? ""}
                              onChange={(event) =>
                                setTypography((prev) => ({
                                  ...prev,
                                  [group]: {
                                    ...prev[group],
                                    [field]: event.target.value,
                                  },
                                }))
                              }
                              helperText="Popular Google Fonts"
                            >
                              <MenuItem value="">(inherit/default)</MenuItem>
                              {POPULAR_FONT_OPTIONS.map((font) => (
                                <MenuItem key={font.label} value={font.value}>
                                  {font.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : field === "fontSize" ? (
                            <TextField
                              fullWidth
                              select
                              size="small"
                              label="fontSize"
                              value={typography[group][field] ?? ""}
                              onChange={(event) =>
                                setTypography((prev) => ({
                                  ...prev,
                                  [group]: {
                                    ...prev[group],
                                    [field]: event.target.value,
                                  },
                                }))
                              }
                            >
                              <MenuItem value="">(inherit/default)</MenuItem>
                              {FONT_SIZE_OPTIONS.map((size) => (
                                <MenuItem key={size} value={size}>
                                  {size}
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : field === "fontWeight" ? (
                            <TextField
                              fullWidth
                              select
                              size="small"
                              label="fontWeight"
                              value={typography[group][field] ?? ""}
                              onChange={(event) =>
                                setTypography((prev) => ({
                                  ...prev,
                                  [group]: {
                                    ...prev[group],
                                    [field]: event.target.value,
                                  },
                                }))
                              }
                            >
                              <MenuItem value="">(inherit/default)</MenuItem>
                              {FONT_WEIGHT_OPTIONS.map((weight) => (
                                <MenuItem key={weight} value={weight}>
                                  {weight}
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : (
                            <TextField
                              fullWidth
                              size="small"
                              label={field}
                              value={typography[group][field] ?? ""}
                              onChange={(event) =>
                                setTypography((prev) => ({
                                  ...prev,
                                  [group]: {
                                    ...prev[group],
                                    [field]: event.target.value,
                                  },
                                }))
                              }
                            />
                          )}
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            </Paper>

          </Stack>
        </Box>

        <Box sx={{ minHeight: { sm: 0 }, height: { sm: "100%" } }}>
          <Box sx={{ height: { sm: "100%" } }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "#E5E7EB",
                bgcolor: "#FFFFFF",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
                height: { sm: "100%" },
                overflowY: { sm: "auto" },
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Drop-in Preview
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={livePreview}
                        onChange={(event) => setLivePreview(event.target.checked)}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#3B82F6",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                            bgcolor: "#3B82F6",
                          },
                        }}
                      />
                    }
                    label="Auto refresh"
                  />
                </Stack>

                <Button
                  variant="contained"
                  onClick={() => {
                    setPreviewFallbackBadge(null);
                    setPreviewEvents([]);
                    setSdkInitGeneration((value) => value + 1);
                  }}
                  disabled={!canRenderPreview}
                >
                  Initialize / Re-init
                </Button>

                {!canRenderPreview ? (
                  <Alert
                    severity="warning"
                    variant="outlined"
                    sx={{
                      borderColor: "#F59E0B",
                      bgcolor: "#FFFBEB",
                      "& .MuiAlert-message": { color: "#92400E" },
                    }}
                  >
                    Preview is disabled because sessionID is missing or placeholder.
                  </Alert>
                ) : null}

                <Box sx={{ border: "1px solid #D1D5DB", borderRadius: 2, p: 1 }}>
                  <EvonetDropinHost
                    config={dropinConfigForPreview}
                    initGeneration={sdkInitGeneration}
                    onEvent={(event) => {
                      const payload = event.payload as
                        | { source?: string; phase?: string }
                        | undefined;
                      if (
                        event.type === "sdk_message" &&
                        payload?.source === "dropin_host"
                      ) {
                        if (payload.phase === "construct_ok_without_font_weight") {
                          setPreviewFallbackBadge(
                            "SDK fallback: fontWeight was ignored for compatibility."
                          );
                        } else if (
                          payload.phase === "construct_ok_without_border_radius"
                        ) {
                          setPreviewFallbackBadge(
                            "SDK fallback: borderRadius was ignored for compatibility."
                          );
                        }
                      }
                      setPreviewEvents((prev) => [event, ...prev].slice(0, 20));
                    }}
                    onSdkInitApplied={(info) => setLastSdkInitInfo(info)}
                  />
                </Box>

                {previewFallbackBadge ? (
                  <Alert severity="info" variant="outlined">
                    {previewFallbackBadge}
                  </Alert>
                ) : null}

                <Box sx={{ pt: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1.5, color: "#1F2937" }}
                  >
                    Config JSON
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack spacing={1.25}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography variant="subtitle2">
                          Builder full config JSON
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleCopy(builderConfigJson, setCopyBuilderHint)}
                        >
                          Copy
                        </Button>
                        {copyBuilderHint ? (
                          <Chip
                            size="small"
                            label={copyBuilderHint}
                            color={copyBuilderHint === "Copy failed" ? "error" : "success"}
                          />
                        ) : null}
                      </Stack>
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          minWidth: 0,
                          width: "100%",
                          p: 2,
                          borderRadius: 2,
                          border: "1px solid #E5E7EB",
                          bgcolor: "#0B1220",
                          color: "#E5E7EB",
                          fontSize: 12,
                          lineHeight: 1.5,
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          maxHeight: 220,
                          overflowX: "auto",
                          overflowY: "auto",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {builderConfigJson}
                      </Box>
                    </Stack>
                    <Stack spacing={1.25}>
                      <Accordion
                        disableGutters
                        sx={{
                          border: "1px solid #E5E7EB",
                          borderRadius: 2,
                          "&:before": { display: "none" },
                          boxShadow: "none",
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ width: "100%" }}
                          >
                            <Typography variant="subtitle2">
                              SDK runtime payload JSON
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleCopy(sdkPayloadJson, setCopySdkHint);
                              }}
                            >
                              Copy
                            </Button>
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          {copySdkHint ? (
                            <Chip
                              size="small"
                              label={copySdkHint}
                              color={copySdkHint === "Copy failed" ? "error" : "success"}
                              sx={{ mb: 1 }}
                            />
                          ) : null}
                          <Box
                            component="pre"
                            sx={{
                              m: 0,
                              minWidth: 0,
                              width: "100%",
                              p: 2,
                              borderRadius: 2,
                              border: "1px solid #E5E7EB",
                              bgcolor: "#0B1220",
                              color: "#E5E7EB",
                              fontSize: 12,
                              lineHeight: 1.5,
                              fontFamily:
                                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                              maxHeight: 220,
                              overflowX: "auto",
                              overflowY: "auto",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {sdkPayloadJson}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
