"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  EvonetDropinHost,
  type SdkInitAppliedInfo,
} from "../../../components/EvonetDropinHost";
import type {
  BinRule,
  EvonetDropinConfig,
  EvonetDropinEvent,
  EvonetSdkAppearance,
  EvonetSdkUiOption,
} from "../../../types/evonet";

const DEFAULT_ENVIRONMENT =
  (process.env.NEXT_PUBLIC_EVONET_ENVIRONMENT as string | undefined) ??
  "HKG_prod";

const DEFAULT_SESSION_ID =
  process.env.NEXT_PUBLIC_EVONET_SESSION_ID ?? "REPLACE_WITH_REAL_SESSION_ID";

const DEFAULT_CURRENCY =
  process.env.NEXT_PUBLIC_EVONET_DEFAULT_CURRENCY ?? "HKD";

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
    uiOption: parts.sdkUiOption,
    appearance: parts.sdkAppearance,
  });
}

export default function EvonetDropinTestPage() {
  const [amount, setAmount] = useState<string>("10.00");
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [orderId, setOrderId] = useState<string>(
    `EVT-${Date.now().toString().slice(-6)}`
  );
  const [description, setDescription] = useState<string>("Local PROD-like test");

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
  const [tncUrl, setTncUrl] = useState("");
  const [columnsLayout, setColumnsLayout] = useState(false);

  const [colorAction, setColorAction] = useState("");
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
  const [logoPosition, setLogoPosition] = useState<
    "left" | "middle" | "right"
  >("left");
  const [borderRadiusInput, setBorderRadiusInput] = useState("");
  const [binRules, setBinRules] = useState<BinRule[]>([
    {
      first6No: "552343",
      message: "This card is eligible for the promotion with SC Double Fun points",
    },
  ]);
  const [newRuleFirst6, setNewRuleFirst6] = useState<string>("");
  const [newRuleMessage, setNewRuleMessage] = useState<string>("");

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

  const [events, setEvents] = useState<EvonetDropinEvent[]>([]);
  const [userAgent, setUserAgent] = useState<string>("Detecting user agent…");
  const [binPromoMessage, setBinPromoMessage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    type: "payment_success" | "payment_fail" | "payment_cancelled" | null;
    payload?: {
      merchantTransID?: string;
      sessionID?: string;
      code?: string;
      message?: string;
    };
  }>({ type: null });

  const sdkUiOption: EvonetSdkUiOption = useMemo(
    () => ({
      showSaveImage,
      Columns: columnsLayout,
      card: {
        showCardHolderName,
        CVVForSavedCard: cvvForSavedCard,
        // Evonet defaults are false; omit when off so strict SDK validators don’t break.
        // When true, init may still fail without HTTPS / camera-capable context.
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

  const sdkAppearance: EvonetSdkAppearance = useMemo(() => {
    const a: EvonetSdkAppearance = {
      colorBackground: colorBackground.trim() || "#ffffff",
    };
    const put = (key: keyof EvonetSdkAppearance, value: string) => {
      const t = value.trim();
      if (t) {
        (a as Record<string, unknown>)[key as string] = t;
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
      a.logoPosition = logoPosition;
    }
    const br = borderRadiusInput
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n));
    if (br.length === 4) {
      a.borderRadius = br;
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
        sdkUiOption,
        sdkAppearance,
      }),
    [
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

  const handleInitialize = () => {
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
      payload?.source === "bin_verification_decision"
    ) {
      const matchedRule = payload?.matchedRule as BinRule | null | undefined;
      const isValid = Boolean(payload?.isValid);

      setBinPromoMessage(
        isValid ? matchedRule?.message?.trim() || null : null
      );
    } else if (event.type === "payment_method_selected") {
      const maybeFirst6 = payload?.first6No as string | undefined;
      if (maybeFirst6) {
        const matchedRule = binRules.find(
          (rule) => rule.first6No === maybeFirst6
        );
        setBinPromoMessage(matchedRule?.message?.trim() || null);
      } else {
        setBinPromoMessage(null);
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
    }
  }, [binRules]);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setUserAgent(navigator.userAgent);
    }
  }, []);

  const handleCreateSession = async () => {
    setSessionError(null);

    const numericAmount = parseFloat(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setSessionError("Please enter a valid amount before creating sessionID.");
      return;
    }

    if (!currency) {
      setSessionError("Currency is required.");
      return;
    }

    const newOrderId = generateOrderId();
    setOrderId(newOrderId);

    setIsCreatingSession(true);
    try {
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
          environment,
          locale,
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

      setSessionId(data.sessionId as string);
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

  // On first load: create session via interaction API, then initialize Drop-in (host destroys old instance before re-init).
  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;

    const snap = {
      amount,
      currency,
      description,
      environment,
      locale,
      mode,
      verifyPaymentBrand,
      maxWaitTime,
      sdkUiOption,
      sdkAppearance,
    };

    void (async () => {
      setSessionError(null);
      const numericAmount = parseFloat(snap.amount);
      if (Number.isNaN(numericAmount) || numericAmount <= 0) {
        setSessionError(
          "Auto-start: enter a valid amount to create a session, then use Create session ID."
        );
        return;
      }
      if (!snap.currency?.trim()) {
        setSessionError(
          "Auto-start: currency is required. Set currency and refresh."
        );
        return;
      }

      setIsCreatingSession(true);
      const newOrderId = generateOrderId();
      setOrderId(newOrderId);

      try {
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
            locale: snap.locale,
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
              : "Unexpected error creating sessionID (auto-start)."
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, lg: 5 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <Stack spacing={2}>
              <Alert severity="error" variant="outlined">
                You are configuring a PROD-like Evonet Drop-in test page. Ensure
                you use sandbox credentials or very small live amounts.
              </Alert>

              <Alert severity="info" variant="outlined">
                On load, this page automatically requests a{" "}
                <strong>sessionID</strong> and then <strong>initializes Drop-in</strong>{" "}
                in the browser. The host tears down any previous instance before
                re-init to avoid DOM conflicts. After changing amount or
                environment, use <strong>Create session ID</strong>; tweak SDK
                options with <strong>auto-apply</strong> on/off as needed.
              </Alert>

              <Box>
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                  Evonet Drop-in Test (Local)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure order and customer details, then initialize Evonet
                  Drop-in to run local test transactions using your real browser
                  user agent.
                </Typography>
              </Box>

              {lastResult.type && (
                <Alert
                  severity={
                    lastResult.type === "payment_success"
                      ? "success"
                      : lastResult.type === "payment_fail"
                      ? "error"
                      : "warning"
                  }
                  variant="outlined"
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    {lastResult.type === "payment_success"
                      ? "Payment successful"
                      : lastResult.type === "payment_fail"
                      ? "Payment failed"
                      : "Payment cancelled"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lastResult.payload?.merchantTransID
                      ? `merchantTransID: ${lastResult.payload.merchantTransID}`
                      : lastResult.payload?.code
                      ? `code: ${lastResult.payload.code}`
                      : "See the event log below for details."}
                  </Typography>
                </Alert>
              )}

              <Paper variant="outlined" sx={{ p: { xs: 2, lg: 3 } }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 2, fontWeight: 600 }}
                    >
                      Session &amp; SDK basics
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                      Create a session, then initialize Drop-in here — no need to scroll to the bottom.
                      See{" "}
                      <Box
                        component="a"
                        href="https://developer.evonetonline.com/docs/sdk"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: "primary.main" }}
                      >
                        SDK Parameter Reference
                      </Box>
                      .
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          label="sessionID"
                          value={sessionId}
                          onChange={(e) => setSessionId(e.target.value)}
                          placeholder="Generated by interaction API / backend"
                          size="small"
                          fullWidth
                        />
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          sx={{ mt: 1.5 }}
                          alignItems={{ sm: "center" }}
                          flexWrap="wrap"
                        >
                          <Button
                            type="button"
                            onClick={handleCreateSession}
                            disabled={isCreatingSession}
                            variant="contained"
                            size="small"
                            sx={{ textTransform: "none" }}
                          >
                            {isCreatingSession
                              ? "Creating session ID…"
                              : "Create session ID"}
                          </Button>
                          <Button
                            type="button"
                            onClick={handleInitialize}
                            variant="contained"
                            color="secondary"
                            size="small"
                            sx={{ textTransform: "none" }}
                          >
                            Initialize / Re-init Drop-in
                          </Button>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                          Create session uses your server credentials (interaction API). Initialize runs
                          in this browser with your real user agent.
                        </Typography>
                        <Paper variant="outlined" sx={{ mt: 2, p: 1.5, bgcolor: "action.hover" }}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1 }}>
                            Developer: SDK parameter apply
                          </Typography>
                          <Stack spacing={1.25}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  Auto-apply (500ms debounce)
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  When locale, uiOption, appearance, verifyOption, etc. change, Drop-in re-initializes automatically so you can compare the UI.
                                </Typography>
                              </Box>
                              <Switch
                                checked={liveApplySdk}
                                onChange={() => setLiveApplySdk((v) => !v)}
                                inputProps={{ "aria-label": "Auto-apply SDK parameter changes" }}
                              />
                            </Stack>
                            <Button
                              type="button"
                              variant="outlined"
                              size="small"
                              sx={{ alignSelf: "flex-start", textTransform: "none" }}
                              onClick={handleApplySdkParamsNow}
                              disabled={sdkInitGeneration < 1}
                            >
                              Manual apply parameters to drop-in now
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                              initGeneration: {sdkInitGeneration} · fingerprint len {sdkOptionsFingerprint.length}
                              {sdkInitGeneration < 1 ? " · not initialized yet" : ""}
                            </Typography>
                          </Stack>
                        </Paper>
                        {sessionError && (
                          <Alert severity="error" sx={{ mt: 1.5 }}>
                            {sessionError}
                          </Alert>
                        )}
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Environment"
                          value={environment}
                          onChange={(e) => setEnvironment(e.target.value)}
                          size="small"
                          fullWidth
                          helperText="e.g. HKG_prod, BKK_prod, UAT"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl size="small" fullWidth>
                          <InputLabel id="mode-label">mode</InputLabel>
                          <Select
                            labelId="mode-label"
                            label="mode"
                            value={mode}
                            onChange={(e) =>
                              setMode(
                                e.target.value as EvonetDropinConfig["mode"]
                              )
                            }
                          >
                            <MenuItem value="embedded">embedded</MenuItem>
                            <MenuItem value="fullPage">fullPage</MenuItem>
                            <MenuItem value="bottomUp">bottomUp</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12}>
                        <FormControl size="small" fullWidth>
                          <InputLabel id="locale-label">locale (SDK)</InputLabel>
                          <Select
                            labelId="locale-label"
                            label="locale (SDK)"
                            value={locale}
                            onChange={(e) => setLocale(e.target.value)}
                          >
                            <MenuItem value="en-US">English (en-US)</MenuItem>
                            <MenuItem value="zh-CN">Chinese Simplified (zh-CN)</MenuItem>
                            <MenuItem value="zh-TW">Traditional Chinese (zh-TW)</MenuItem>
                            <MenuItem value="ja-JP">Japanese (ja-JP)</MenuItem>
                            <MenuItem value="ko-KR">Korean (ko-KR)</MenuItem>
                            <MenuItem value="th-TH">Thai (th-TH)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>

                  <Accordion defaultExpanded disableGutters sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, "&:before": { display: "none" } }}>
                    <AccordionSummary sx={{ px: 2, minHeight: 48 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        SDK: Payment workflow (uiOption)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="body2" fontWeight={600}>showSaveImage</Typography>
                            <Typography variant="caption" color="text.secondary">Allow saving QR to device</Typography>
                          </Box>
                          <Switch checked={showSaveImage} onChange={() => setShowSaveImage((v) => !v)} inputProps={{ "aria-label": "showSaveImage" }} />
                        </Stack>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="body2" fontWeight={600}>Columns (two-column layout)</Typography>
                            <Typography variant="caption" color="text.secondary">uiOption.Columns</Typography>
                          </Box>
                          <Switch checked={columnsLayout} onChange={() => setColumnsLayout((v) => !v)} inputProps={{ "aria-label": "Columns" }} />
                        </Stack>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">Card (uiOption.card)</Typography>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">showCardHolderName</Typography>
                          <Switch checked={showCardHolderName} onChange={() => setShowCardHolderName((v) => !v)} inputProps={{ "aria-label": "showCardHolderName" }} />
                        </Stack>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">CVVForSavedCard</Typography>
                          <Switch checked={cvvForSavedCard} onChange={() => setCvvForSavedCard((v) => !v)} inputProps={{ "aria-label": "CVVForSavedCard" }} />
                        </Stack>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">showScanCardButton</Typography>
                          <Switch checked={showScanCardButton} onChange={() => setShowScanCardButton((v) => !v)} inputProps={{ "aria-label": "showScanCardButton" }} />
                        </Stack>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">autoInvokeCardScanner</Typography>
                          <Switch checked={autoInvokeCardScanner} onChange={() => setAutoInvokeCardScanner((v) => !v)} inputProps={{ "aria-label": "autoInvokeCardScanner" }} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: -0.5 }}>
                          Scan options often need <strong>HTTPS</strong> and a supported mobile/browser context.
                          Some Evonet Drop-in builds throw on init when scanning is enabled but the environment
                          is unsupported—check the event log for <code>errorMessage</code> / <code>scanHint</code>.
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">Terms &amp; Conditions (uiOption.TnC)</Typography>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">showTnC</Typography>
                          <Switch checked={showTnC} onChange={() => setShowTnC((v) => !v)} inputProps={{ "aria-label": "showTnC" }} />
                        </Stack>
                        <FormControl size="small" fullWidth disabled={!showTnC}>
                          <InputLabel id="tnc-mode-label">TnC mode</InputLabel>
                          <Select
                            labelId="tnc-mode-label"
                            label="TnC mode"
                            value={tncMode}
                            onChange={(e) =>
                              setTncMode(e.target.value as "checkbox" | "click2accept")
                            }
                          >
                            <MenuItem value="click2accept">click2accept</MenuItem>
                            <MenuItem value="checkbox">checkbox</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          label="TnC url (required if showTnC)"
                          value={tncUrl}
                          onChange={(e) => setTncUrl(e.target.value)}
                          size="small"
                          fullWidth
                          disabled={!showTnC}
                          helperText="Mandatory in docs when showTnC is true"
                        />
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion defaultExpanded={false} disableGutters sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, "&:before": { display: "none" } }}>
                    <AccordionSummary sx={{ px: 2, minHeight: 48 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        SDK: Appearance (hex colors &amp; layout)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField label="colorBackground" value={colorBackground} onChange={(e) => setColorBackground(e.target.value)} size="small" fullWidth placeholder="#ffffff" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="colorPrimary" value={colorPrimary} onChange={(e) => setColorPrimary(e.target.value)} size="small" fullWidth placeholder="#000000" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="colorSecondary" value={colorSecondary} onChange={(e) => setColorSecondary(e.target.value)} size="small" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="colorAction" value={colorAction} onChange={(e) => setColorAction(e.target.value)} size="small" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="colorError" value={colorError} onChange={(e) => setColorError(e.target.value)} size="small" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="colorDisabled" value={colorDisabled} onChange={(e) => setColorDisabled(e.target.value)} size="small" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="colorFormBackground" value={colorFormBackground} onChange={(e) => setColorFormBackground(e.target.value)} size="small" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="colorFormBorder" value={colorFormBorder} onChange={(e) => setColorFormBorder(e.target.value)} size="small" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="colorBoxStroke" value={colorBoxStroke} onChange={(e) => setColorBoxStroke(e.target.value)} size="small" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="colorBoxFillingOutline" value={colorBoxFillingOutline} onChange={(e) => setColorBoxFillingOutline(e.target.value)} size="small" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="colorPlaceholder" value={colorPlaceholder} onChange={(e) => setColorPlaceholder(e.target.value)} size="small" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="colorInverse" value={colorInverse} onChange={(e) => setColorInverse(e.target.value)} size="small" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl size="small" fullWidth>
                            <InputLabel id="logo-pos-label">logoPosition</InputLabel>
                            <Select
                              labelId="logo-pos-label"
                              label="logoPosition"
                              value={logoPosition}
                              onChange={(e) =>
                                setLogoPosition(e.target.value as "left" | "middle" | "right")
                              }
                            >
                              <MenuItem value="left">left</MenuItem>
                              <MenuItem value="middle">middle</MenuItem>
                              <MenuItem value="right">right</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="borderRadius [r1,r2,r3,r4]"
                            value={borderRadiusInput}
                            onChange={(e) => setBorderRadiusInput(e.target.value)}
                            size="small"
                            fullWidth
                            placeholder="e.g. 8,8,12,12"
                            helperText="Four comma-separated numbers"
                          />
                        </Grid>
                      </Grid>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        Font objects (button/font, heading/font, …) are not exposed here; add via Evonet UX customization if needed.
                      </Typography>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion defaultExpanded disableGutters sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, "&:before": { display: "none" } }}>
                    <AccordionSummary sx={{ px: 2, minHeight: 48 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        SDK: BIN verification (verifyOption + host rules)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          isVerifyPaymentBrand
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          When enabled, BIN is processed and returned in SDK events. Host rules below only affect promo text.
                        </Typography>
                      </Box>
                      <Switch
                        checked={verifyPaymentBrand}
                        onChange={() => setVerifyPaymentBrand((v) => !v)}
                        inputProps={{ "aria-label": "Verify payment brand" }}
                      />
                    </Stack>

                    {verifyPaymentBrand && (
                      <TextField
                        label="verifyOption.maxWaitTime (seconds)"
                        value={maxWaitTime}
                        onChange={(e) => setMaxWaitTime(e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ mt: 2 }}
                        helperText="Default per docs: 10"
                      />
                    )}

                    {verifyPaymentBrand && (
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Add BIN conditions to show a promotion message above the
                          Drop-in. BIN verification will not block Pay.
                        </Typography>

                        <Stack spacing={1.5}>
                          {binRules.map((rule, index) => (
                            <Paper
                              // Keep key stable while user types; otherwise React remounts
                              // the row (key changes with `first6No`) and the input loses focus.
                              key={index}
                              variant="outlined"
                              sx={{ p: 1.5 }}
                            >
                              <Stack spacing={1.25}>
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  justifyContent="space-between"
                                >
                                  <Typography variant="caption" fontWeight={700}>
                                    Condition {index + 1}
                                  </Typography>
                                  <Button
                                    size="small"
                                    color="error"
                                    sx={{ textTransform: "none", minWidth: 0, px: 0.5 }}
                                    onClick={() =>
                                      setBinRules((prev) =>
                                        prev.filter((_, idx) => idx !== index)
                                      )
                                    }
                                  >
                                    Remove
                                  </Button>
                                </Stack>

                                <TextField
                                  label="Custom card BIN"
                                  value={rule.first6No}
                                  onChange={(e) => {
                                    const value = e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 6);
                                    setBinRules((prev) =>
                                      prev.map((item, idx) =>
                                        idx === index
                                          ? { ...item, first6No: value }
                                          : item
                                      )
                                    );
                                  }}
                                  size="small"
                                  inputProps={{
                                    maxLength: 6,
                                    style: { fontFamily: "monospace" },
                                  }}
                                />

                                <TextField
                                  label="Promotion message"
                                  value={rule.message ?? ""}
                                  onChange={(e) =>
                                    setBinRules((prev) =>
                                      prev.map((item, idx) =>
                                        idx === index
                                          ? { ...item, message: e.target.value }
                                          : item
                                      )
                                    )
                                  }
                                  size="small"
                                  helperText="Shown above Drop-in when this BIN matches"
                                />
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>

                        <Paper variant="outlined" sx={{ p: 1.5 }}>
                          <Stack spacing={1.25}>
                            <Typography variant="caption" fontWeight={700}>
                              Add condition
                            </Typography>
                            <TextField
                              label="Custom card BIN"
                              value={newRuleFirst6}
                              onChange={(e) =>
                                setNewRuleFirst6(
                                  e.target.value.replace(/\D/g, "").slice(0, 6)
                                )
                              }
                              size="small"
                              inputProps={{
                                maxLength: 6,
                                style: { fontFamily: "monospace" },
                              }}
                            />
                            <TextField
                              label="Promotion message"
                              value={newRuleMessage}
                              onChange={(e) => setNewRuleMessage(e.target.value)}
                              size="small"
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{ alignSelf: "flex-start", textTransform: "none" }}
                              disabled={newRuleFirst6.length !== 6}
                              onClick={() => {
                                setBinRules((prev) => [
                                  ...prev,
                                  {
                                    first6No: newRuleFirst6,
                                    message: newRuleMessage,
                                  },
                                ]);
                                setNewRuleFirst6("");
                                setNewRuleMessage("");
                              }}
                            >
                              Add condition
                            </Button>
                          </Stack>
                        </Paper>
                      </Stack>
                    )}
                    </AccordionDetails>
                  </Accordion>

                  <Accordion defaultExpanded={false} disableGutters sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, "&:before": { display: "none" } }}>
                    <AccordionSummary sx={{ px: 2, minHeight: 48 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Order &amp; customer (metadata for this page)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
                      <Stack spacing={3}>
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1 }}>
                            Order details
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Amount"
                                type="number"
                                inputProps={{ min: 0, step: "0.01" }}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Currency"
                                value={currency}
                                onChange={(e) =>
                                  setCurrency(e.target.value.toUpperCase())
                                }
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                label="Order ID"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                size="small"
                                fullWidth
                              />
                            </Grid>
                          </Grid>
                        </Box>
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1 }}>
                            Customer
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <TextField
                                label="Name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Email"
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Phone"
                                type="tel"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                size="small"
                                fullWidth
                              />
                            </Grid>
                          </Grid>
                        </Box>
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1 }}>
                            Billing &amp; shipping
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Billing Country"
                                value={billingCountry}
                                onChange={(e) =>
                                  setBillingCountry(e.target.value.toUpperCase())
                                }
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Billing City"
                                value={billingCity}
                                onChange={(e) => setBillingCity(e.target.value)}
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Billing Postal Code"
                                value={billingPostalCode}
                                onChange={(e) => setBillingPostalCode(e.target.value)}
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Shipping Country"
                                value={shippingCountry}
                                onChange={(e) =>
                                  setShippingCountry(e.target.value.toUpperCase())
                                }
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Shipping City"
                                value={shippingCity}
                                onChange={(e) => setShippingCity(e.target.value)}
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Shipping Postal Code"
                                value={shippingPostalCode}
                                onChange={(e) =>
                                  setShippingPostalCode(e.target.value)
                                }
                                size="small"
                                fullWidth
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Stack>
              </Paper>

              <Paper
                sx={{
                  bgcolor: "grey.900",
                  color: "grey.100",
                  p: 2,
                  borderRadius: 3,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle2" sx={{ color: "success.light" }}>
                    Runtime debug
                  </Typography>
                  <Chip
                    size="small"
                    label="Browser-only"
                    sx={{ bgcolor: "grey.800", color: "grey.200" }}
                  />
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      variant="overline"
                      sx={{ color: "grey.400", display: "block" }}
                    >
                      Evonet environment
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "success.light", wordBreak: "break-all" }}
                    >
                      {environment}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      variant="overline"
                      sx={{ color: "grey.400", display: "block" }}
                    >
                      Drop-in mode
                    </Typography>
                    <Typography variant="body2" sx={{ color: "success.light" }}>
                      {mode}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      variant="overline"
                      sx={{ color: "grey.400", display: "block" }}
                    >
                      locale (SDK)
                    </Typography>
                    <Typography variant="body2" sx={{ color: "success.light" }}>
                      {locale}
                    </Typography>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="overline"
                    sx={{ color: "grey.400", display: "block" }}
                  >
                    navigator.userAgent
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "grey.100",
                      display: "block",
                      wordBreak: "break-all",
                    }}
                  >
                    {userAgent}
                  </Typography>
                </Box>
              </Paper>
            </Stack>
          </Grid>

          {/* Center: Drop-in only */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={2} sx={{ height: "100%" }}>
              <Paper
                variant="outlined"
                sx={{
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    px: { xs: 2, lg: 3 },
                    py: 2,
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ sm: "center" }}
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Drop-in preview
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Embedded Evonet Drop-in. Initialize from the control panel
                        (first column).
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={
                        <Box component="span" sx={{ fontSize: 11 }}>
                          sessionID:{" "}
                          <Box
                            component="span"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {sessionId.slice(0, 6) || "N/A"}…
                          </Box>
                        </Box>
                      }
                    />
                  </Stack>
                </Box>
                {binPromoMessage && (
                  <Box sx={{ px: { xs: 2, lg: 3 }, pt: 2 }}>
                    <Alert severity="info" variant="outlined">
                      {binPromoMessage}
                    </Alert>
                  </Box>
                )}
                <Box>
                  <EvonetDropinHost
                    config={config}
                    initGeneration={sdkInitGeneration}
                    onEvent={handleEvent}
                    onSdkInitApplied={setLastSdkInitInfo}
                  />
                </Box>
              </Paper>
            </Stack>
          </Grid>

          {/* Right: developer debug + event logs */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={2} sx={{ height: "100%" }}>
              <Paper
                sx={{
                  p: { xs: 2, lg: 2 },
                  bgcolor: "grey.900",
                  color: "grey.100",
                  borderRadius: 3,
                }}
              >
                <Stack
                  direction="column"
                  spacing={1}
                  sx={{ mb: 1 }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    gap={1}
                  >
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: "grey.100" }}>
                      Developer debug: last options passed to DropInSDK
                    </Typography>
                    <Button
                      type="button"
                      size="small"
                      variant="outlined"
                      sx={{
                        textTransform: "none",
                        color: "grey.100",
                        borderColor: "grey.700",
                        "&.Mui-disabled": {
                          color: "grey.600",
                          borderColor: "grey.800",
                        },
                      }}
                      disabled={!lastSdkInitInfo}
                      onClick={async () => {
                        if (!lastSdkInitInfo) return;
                        try {
                          await navigator.clipboard.writeText(
                            JSON.stringify(
                              lastSdkInitInfo.debugPayload,
                              null,
                              2
                            )
                          );
                          setCopySdkPayloadHint("JSON copied");
                          window.setTimeout(() => setCopySdkPayloadHint(null), 2500);
                        } catch {
                          setCopySdkPayloadHint("Copy failed");
                          window.setTimeout(() => setCopySdkPayloadHint(null), 2500);
                        }
                      }}
                    >
                      Copy JSON
                    </Button>
                  </Stack>
                  {copySdkPayloadHint && (
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          copySdkPayloadHint === "Copy failed"
                            ? "error.light"
                            : "success.light",
                      }}
                    >
                      {copySdkPayloadHint}
                    </Typography>
                  )}
                </Stack>
                {lastSdkInitInfo ? (
                  <>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                      <Chip
                        size="small"
                        label={`#${lastSdkInitInfo.initGeneration}`}
                        sx={{
                          bgcolor: "grey.800",
                          color: "grey.100",
                        }}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={lastSdkInitInfo.appliedAt}
                        sx={{
                          color: "grey.300",
                          borderColor: "grey.700",
                        }}
                      />
                    </Stack>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "rgba(2, 6, 23, 0.7)",
                        border: "1px solid",
                        borderColor: "grey.800",
                        color: "grey.100",
                        fontSize: 10,
                        maxHeight: { xs: 220, lg: 260 },
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {JSON.stringify(lastSdkInitInfo.debugPayload, null, 2)}
                    </Box>
                    <Typography variant="caption" sx={{ display: "block", mt: 1, color: "grey.400" }}>
                      Excludes payment_* callbacks; other fields match the constructor. With auto-apply on, control panel changes re-init after ~0.5s and refresh this panel.
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: "grey.500" }}>
                    Not initialized yet. Use “Initialize / Re-init Drop-in” in the control panel first; full JSON appears after the SDK instance is created.
                  </Typography>
                )}
              </Paper>

              <Paper
                sx={{
                  flex: 1,
                  bgcolor: "grey.900",
                  color: "grey.100",
                  p: { xs: 2, lg: 2 },
                  borderRadius: 3,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 320,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle2" sx={{ color: "grey.100" }}>
                    Drop-in events
                  </Typography>
                  <Button
                    type="button"
                    onClick={() => setEvents([])}
                    size="small"
                    variant="outlined"
                    sx={{
                      color: "grey.100",
                      borderColor: "grey.700",
                      textTransform: "none",
                    }}
                  >
                    Clear
                  </Button>
                </Stack>

                <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                  <Grid item xs={12} sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
                    <Typography
                      variant="overline"
                      sx={{ color: "grey.400", display: "block", mb: 0.5, lineHeight: 1.8 }}
                    >
                      Recognised events
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: "rgba(2, 6, 23, 0.7)",
                        border: "1px solid",
                        borderColor: "grey.800",
                        borderRadius: 2,
                        p: 2,
                        flex: 1,
                        minHeight: 200,
                        overflow: "auto",
                      }}
                    >
                      {events.filter((e) => e.type !== "sdk_message").length === 0 ? (
                        <Typography variant="caption" color="grey.500">
                          No recognised events yet. payment_success, payment_fail,
                          payment_method_selected etc. will appear here.
                        </Typography>
                      ) : (
                        <Stack spacing={1} component="ul" sx={{ m: 0, p: 0 }}>
                          {events
                            .filter((e) => e.type !== "sdk_message")
                            .map((event, index) => (
                              <Box
                                key={index}
                                component="li"
                                sx={{
                                  listStyle: "none",
                                  bgcolor: "grey.900",
                                  borderRadius: 1.5,
                                  px: 1.5,
                                  py: 1,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ fontFamily: "monospace", color: "success.light" }}
                                >
                                  {event.type}
                                </Typography>
                                {event.payload != null && (
                                  <Box
                                    component="pre"
                                    sx={{
                                      mt: 1,
                                      mb: 0,
                                      whiteSpace: "pre-wrap",
                                      wordBreak: "break-word",
                                      fontSize: 10,
                                      color: "grey.200",
                                    }}
                                  >
                                    {JSON.stringify(event.payload, null, 2)}
                                  </Box>
                                )}
                              </Box>
                            ))}
                        </Stack>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
                    <Typography
                      variant="overline"
                      sx={{ color: "grey.400", display: "block", mb: 0.5, lineHeight: 1.8 }}
                    >
                      Raw SDK messages
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: "rgba(2, 6, 23, 0.7)",
                        border: "1px solid",
                        borderColor: "grey.800",
                        borderRadius: 2,
                        p: 2,
                        flex: 1,
                        minHeight: 200,
                        overflow: "auto",
                      }}
                    >
                      {events.filter((e) => e.type === "sdk_message").length === 0 ? (
                        <Typography variant="caption" color="grey.500">
                          No raw SDK messages yet. postMessage frames from the
                          Drop-in iframe will appear here.
                        </Typography>
                      ) : (
                        <Stack spacing={1} component="ul" sx={{ m: 0, p: 0 }}>
                          {events
                            .filter((e) => e.type === "sdk_message")
                            .map((event, index) => (
                              <Box
                                key={index}
                                component="li"
                                sx={{
                                  listStyle: "none",
                                  bgcolor: "grey.900",
                                  borderRadius: 1.5,
                                  px: 1.5,
                                  py: 1,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ fontFamily: "monospace", color: "info.light" }}
                                >
                                  sdk_message
                                </Typography>
                                {event.payload != null && (
                                  <Box
                                    component="pre"
                                    sx={{
                                      mt: 1,
                                      mb: 0,
                                      whiteSpace: "pre-wrap",
                                      wordBreak: "break-word",
                                      fontSize: 10,
                                      color: "grey.200",
                                    }}
                                  >
                                    {JSON.stringify(event.payload, null, 2)}
                                  </Box>
                                )}
                              </Box>
                            ))}
                        </Stack>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
