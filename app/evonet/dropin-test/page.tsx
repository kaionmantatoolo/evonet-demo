"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
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
import { EvonetDropinHost } from "../../../components/EvonetDropinHost";
import type {
  BinRule,
  EvonetDropinConfig,
  EvonetDropinEvent,
} from "../../../types/evonet";

const DEFAULT_ENVIRONMENT =
  (process.env.NEXT_PUBLIC_EVONET_ENVIRONMENT as string | undefined) ??
  "HKG_prod";

const DEFAULT_SESSION_ID =
  process.env.NEXT_PUBLIC_EVONET_SESSION_ID ?? "REPLACE_WITH_REAL_SESSION_ID";

const DEFAULT_CURRENCY =
  process.env.NEXT_PUBLIC_EVONET_DEFAULT_CURRENCY ?? "HKD";

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
  const [language, setLanguage] = useState<string>("en");
  const [verifyPaymentBrand, setVerifyPaymentBrand] = useState<boolean>(true);
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

  // Drop-in should only initialize when user explicitly clicks Initialize.
  const [configVersion, setConfigVersion] = useState<number>(0);
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
      language,
      isVerifyPaymentBrand: verifyPaymentBrand,
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
      language,
      mode,
      orderId,
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
    setEvents([]);
    setConfigVersion((v) => v + 1);
  };

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

    if (!orderId) {
      setSessionError("Order ID is required.");
      return;
    }

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
          orderId,
          description,
          environment,
          locale: language,
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, lg: 5 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={5}>
            <Stack spacing={2}>
              <Alert severity="error" variant="outlined">
                You are configuring a PROD-like Evonet Drop-in test page. Ensure
                you use sandbox credentials or very small live amounts.
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
                      Environment & basics
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
                          direction="column"
                          spacing={0.75}
                          sx={{ mt: 1.5 }}
                          alignItems="flex-start"
                        >
                          <Button
                            type="button"
                            onClick={handleCreateSession}
                            disabled={isCreatingSession}
                            variant="contained"
                            size="small"
                            sx={{ textTransform: "none" }}
                          >
                            {isCreatingSession ? "Creating session ID…" : "Create session ID"}
                          </Button>
                          <Typography variant="caption" color="text.secondary">
                            Uses your server-side credentials to call Evonet&apos;s
                            interaction API and return a session ID. If you see
                            &quot;store not found&quot;, add EVONET_STORE_ID to
                            .env.local (from Evonet Portal) or contact Evonet.
                          </Typography>
                        </Stack>
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
                          helperText="Example: HKG_prod, UAT, TEST."
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl size="small" fullWidth>
                          <InputLabel id="mode-label">Mode</InputLabel>
                          <Select
                            labelId="mode-label"
                            label="Mode"
                            value={mode}
                            onChange={(e) =>
                              setMode(
                                e.target.value as EvonetDropinConfig["mode"]
                              )
                            }
                          >
                            <MenuItem value="embedded">embedded</MenuItem>
                            <MenuItem value="fullPage">fullPage</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl size="small" fullWidth>
                          <InputLabel id="language-label">Language</InputLabel>
                          <Select
                            labelId="language-label"
                            label="Language"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                          >
                            <MenuItem value="en">en</MenuItem>
                            <MenuItem value="zh-Hant">zh-Hant</MenuItem>
                            <MenuItem value="zh-Hans">zh-Hans</MenuItem>
                            <MenuItem value="ja">ja</MenuItem>
                            <MenuItem value="ko">ko</MenuItem>
                            <MenuItem value="th">th</MenuItem>
                            <MenuItem value="vi">vi</MenuItem>
                            <MenuItem value="id">id</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 2, fontWeight: 600 }}
                    >
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
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 2, fontWeight: 600 }}
                    >
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
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 2, fontWeight: 600 }}
                    >
                      Billing & Shipping
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

                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 2, fontWeight: 600 }}
                    >
                      Options
                    </Typography>

                    {/* BIN verification toggle */}
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Verify payment brand (BIN)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          When enabled, each card BIN is checked against the
                          rules below. Click outside the card number field to
                          trigger verification.
                        </Typography>
                      </Box>
                      <Switch
                        checked={verifyPaymentBrand}
                        onChange={() => setVerifyPaymentBrand((v) => !v)}
                        inputProps={{ "aria-label": "Verify payment brand" }}
                      />
                    </Stack>

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
                  </Box>

                  <Divider />

                  <Box>
                    <Button
                      type="button"
                      onClick={handleInitialize}
                      variant="contained"
                    >
                      Initialize / Re-initialize Drop-in
                    </Button>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      Initialization always runs in the browser, using your real
                      navigator.userAgent. No Node/cURL calls are used for Drop-in
                      itself.
                    </Typography>
                  </Box>
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
                  <Grid item xs={12} sm={6}>
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
                  <Grid item xs={12} sm={6}>
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

          <Grid item xs={12} lg={7}>
            <Stack spacing={2} sx={{ height: "100%" }}>
              <Paper variant="outlined" sx={{ overflow: "hidden" }}>
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
                        This is the embedded Evonet Drop-in container. After you
                        initialize, it should render the hosted payment UI here.
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
                    configVersion={configVersion}
                    onEvent={handleEvent}
                  />
                </Box>
              </Paper>

              <Paper
                sx={{
                  flex: 1,
                  bgcolor: "grey.900",
                  color: "grey.100",
                  p: { xs: 2, lg: 3 },
                  borderRadius: 3,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Header */}
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

                {/* Two-column log area */}
                <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                  {/* Left: recognised high-level events */}
                  <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
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

                  {/* Right: raw SDK / postMessage traffic */}
                  <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
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
