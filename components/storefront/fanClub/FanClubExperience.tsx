"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Bebas_Neue, Manrope } from "next/font/google";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { ThemeToggle } from "../../ThemeToggle";
import { DropinModePreviewShell } from "../../DropinModePreviewShell";
import { StorefrontDropinOverlayStage } from "../StorefrontDropinOverlayStage";
import { FanClubCheckoutDrawer } from "./FanClubCheckoutDrawer";
import { FanClubHeroVisual } from "./FanClubHeroVisual";
import { FanClubModelStrip } from "./FanClubModelStrip";
import {
  shopPrimaryButtonSx,
  shopSecondaryButtonSx,
} from "../storefrontButtons";
import { enterUp } from "../storefrontMotion";
import {
  appearanceToStorefrontCssVars,
  resolveStorefrontUnitPrice,
  type StorefrontSnapshot,
} from "../../../lib/storefrontSnapshot";
import {
  getFanClubCopy,
  getLocalizedFanClubPlan,
} from "../../../lib/fanClubCopy";
import { storefrontHtmlLang } from "../../../lib/storefrontCopy";
import {
  addMonthsIso,
  cancelFanClubMembership,
  maskPaymentToken,
  readFanClubMembership,
  writeFanClubMembership,
  type FanClubMembership,
} from "../../../lib/fanClubMembership";
import {
  parseEvonetReturnParams,
  parseEvonetSdkPaymentEvent,
  stripEvonetReturnQuery,
  type EvonetReturnParams,
} from "../../../lib/evonetReturnParams";
import {
  buildClientEvonetReturnUrl,
  clearFanClubCheckoutPending,
  markFanClubCheckoutPending,
} from "../../../lib/evonetReturnUrl";
import { detailDlGridSx } from "../../../lib/responsiveLayout";
import { targetFromSdkEnvironment } from "../../../lib/evonetTarget";
import type {
  EvonetDropinConfig,
  EvonetDropinEvent,
  EvonetSdkUiOption,
} from "../../../types/evonet";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--shop-font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--shop-font-sans",
  display: "swap",
});

export type FanClubStorefrontConfig = Omit<StorefrontSnapshot, "savedAt">;

function generateFanOrderId(): string {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `FAN-${Date.now()}-${suffix}`;
}

function ensureUserReference(existing?: string): string {
  const trimmed = existing?.trim() ?? "";
  if (trimmed) return trimmed;
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `fan-${suffix}`;
}

function withSubscriptionTnC(uiOption?: EvonetSdkUiOption): EvonetSdkUiOption {
  const base = uiOption ?? {};
  // Only pass TnC when Builder already enabled it with a URL — empty TnC can stall Drop-in.
  if (base.TnC?.showTnC && base.TnC.url?.trim()) {
    return base;
  }
  const { TnC: _omit, ...rest } = base;
  return rest;
}

type FanClubView = "landing" | "result" | "membership";

interface FanClubExperienceProps {
  config: FanClubStorefrontConfig;
  onBackToBuilder?: () => void;
}

export function FanClubExperience({
  config,
  onBackToBuilder,
}: FanClubExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const colorMode = resolvedTheme === "dark" ? "dark" : "light";
  const storefrontLocale = config.locale?.trim() || "en-US";
  const copy = useMemo(
    () => getFanClubCopy(storefrontLocale),
    [storefrontLocale]
  );
  const currency = config.currency?.trim() || "HKD";
  const unitPrice = resolveStorefrontUnitPrice(config.amount, 48);
  const plan = useMemo(
    () => getLocalizedFanClubPlan(storefrontLocale, unitPrice),
    [storefrontLocale, unitPrice]
  );
  const cssVars = useMemo(
    () => appearanceToStorefrontCssVars(config.appearance, colorMode),
    [config.appearance, colorMode]
  );
  const checkoutMode = config.mode ?? "embedded";
  const isSdkOverlayMode =
    checkoutMode === "fullPage" || checkoutMode === "bottomUp";

  const [view, setView] = useState<FanClubView>("landing");
  const [membership, setMembership] = useState<FanClubMembership | null>(null);
  const [userInfoReference] = useState(() =>
    ensureUserReference(config.userInfoReference)
  );

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionID, setSessionID] = useState<string | null>(null);
  const [sdkInitGeneration, setSdkInitGeneration] = useState(0);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<EvonetReturnParams | null>(
    null
  );
  const [tokenBusy, setTokenBusy] = useState(false);
  const [tokenHint, setTokenHint] = useState<string | null>(null);
  const [billBusy, setBillBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [shopViewKey, setShopViewKey] = useState(0);

  useEffect(() => {
    document.documentElement.lang = storefrontHtmlLang(storefrontLocale);
  }, [storefrontLocale]);

  useEffect(() => {
    setMembership(readFanClubMembership());
  }, []);

  const clearPaymentReturnQuery = useCallback(() => {
    const next = stripEvonetReturnQuery(
      new URLSearchParams(searchParams.toString())
    );
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, searchParams]);

  const persistMembership = useCallback((next: FanClubMembership) => {
    writeFanClubMembership(next);
    setMembership(next);
  }, []);

  const fetchAndAttachToken = useCallback(
    async (orderId: string, base: FanClubMembership) => {
      setTokenBusy(true);
      setTokenHint(copy.tokenPending);
      try {
        const target = targetFromSdkEnvironment(config.environment);
        const qs = new URLSearchParams({
          target,
          environment: config.environment,
        });
        const response = await fetch(
          `/api/evonet/interaction/${encodeURIComponent(orderId)}?${qs}`
        );
        const data = (await response.json()) as {
          token?: string | null;
          recurringReference?: string | null;
          error?: string;
        };
        if (!response.ok) {
          setTokenHint(data.error ?? copy.tokenMissing);
          persistMembership(base);
          return;
        }
        if (!data.token) {
          setTokenHint(copy.tokenMissing);
          persistMembership(base);
          return;
        }
        const withToken: FanClubMembership = {
          ...base,
          token: data.token,
          recurringReference: data.recurringReference ?? base.recurringReference,
        };
        persistMembership(withToken);
        setTokenHint(null);
      } catch {
        setTokenHint(copy.tokenMissing);
        persistMembership(base);
      } finally {
        setTokenBusy(false);
      }
    },
    [config.environment, copy.tokenMissing, copy.tokenPending, persistMembership]
  );

  const paymentReturnFromUrl = useMemo(
    () => parseEvonetReturnParams(searchParams),
    [searchParams]
  );
  const handledReturnKeyRef = useRef<string | null>(null);

  const applyPaymentResult = useCallback(
    (result: EvonetReturnParams) => {
      clearFanClubCheckoutPending();
      setOrderResult(result);
      setCheckoutOpen(false);
      setView("result");
      if (result.status !== "success") return;

      const orderId =
        result.merchantOrderID || pendingOrderId || generateFanOrderId();
      const joinedAt = new Date().toISOString();
      const previous = readFanClubMembership();
      const base: FanClubMembership = {
        status: "active",
        planId: plan.id,
        planName: plan.name,
        amount: unitPrice,
        currency,
        userInfoReference,
        token: previous?.token ?? "",
        recurringReference: previous?.recurringReference,
        joinedAt,
        nextBillAt: addMonthsIso(joinedAt, 1),
        charges: [
          ...(previous?.charges ?? []).filter((c) => c.orderId !== orderId),
          {
            id: `cit-${orderId}`,
            type: "cit",
            orderId,
            amount: unitPrice,
            currency,
            at: joinedAt,
            status: "success",
          },
        ],
      };
      void fetchAndAttachToken(orderId, base);
    },
    [
      currency,
      fetchAndAttachToken,
      pendingOrderId,
      plan.id,
      plan.name,
      unitPrice,
      userInfoReference,
    ]
  );

  useEffect(() => {
    if (!paymentReturnFromUrl) return;
    const key = [
      paymentReturnFromUrl.merchantOrderID,
      paymentReturnFromUrl.status,
      paymentReturnFromUrl.source,
    ].join("|");
    if (handledReturnKeyRef.current === key) return;
    handledReturnKeyRef.current = key;
    applyPaymentResult(paymentReturnFromUrl);
    clearPaymentReturnQuery();
  }, [applyPaymentResult, clearPaymentReturnQuery, paymentReturnFromUrl]);

  const startCheckout = useCallback(async () => {
    const orderId = generateFanOrderId();
    setPendingOrderId(orderId);
    setOrderResult(null);
    setSessionError(null);
    setCheckoutOpen(true);
    setIsCreatingSession(true);
    setSessionID(null);
    markFanClubCheckoutPending(orderId);

    try {
      const returnURL = buildClientEvonetReturnUrl();
      const response = await fetch("/api/evonet/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: unitPrice,
          currency,
          orderId,
          description: `${plan.brand} Fan Club · ${plan.name}`,
          environment: config.environment,
          locale: storefrontLocale,
          saveCardForNextPurchase: true,
          userInfoReference,
          includeRecurringProcessingModel: true,
          recurringProcessingModel: "Subscription",
          ...(returnURL ? { returnURL } : {}),
          ...(config.enabledPaymentMethod?.length
            ? { enabledPaymentMethod: config.enabledPaymentMethod }
            : {}),
        }),
      });
      const data = (await response.json()) as {
        sessionId?: string;
        error?: string;
      };
      if (!response.ok || !data.sessionId) {
        clearFanClubCheckoutPending();
        throw new Error(data.error ?? copy.sessionFailed);
      }
      setSessionID(data.sessionId);
      setSdkInitGeneration((value) => value + 1);
    } catch (error) {
      clearFanClubCheckoutPending();
      setSessionError(
        error instanceof Error ? error.message : copy.sessionUnexpected
      );
    } finally {
      setIsCreatingSession(false);
    }
  }, [
    config.enabledPaymentMethod,
    config.environment,
    copy.sessionFailed,
    copy.sessionUnexpected,
    currency,
    plan.brand,
    plan.name,
    storefrontLocale,
    unitPrice,
    userInfoReference,
  ]);

  const handleJoin = () => {
    if (membership?.status === "active" && membership.token) {
      setView("membership");
      setActionMessage(copy.rejoinedHint);
      return;
    }
    void startCheckout();
  };

  const handleDropinEvent = useCallback(
    (event: EvonetDropinEvent) => {
      if (
        event.type === "payment_success" ||
        event.type === "payment_fail" ||
        event.type === "payment_cancelled"
      ) {
        const fromSdk = parseEvonetSdkPaymentEvent(event.type, event.payload);
        if (fromSdk) applyPaymentResult(fromSdk);
      }
    },
    [applyPaymentResult]
  );

  const handleBack = () => {
    if (onBackToBuilder) {
      onBackToBuilder();
      return;
    }
    router.push("/evonet/dropin-builder");
  };

  const dropinConfig: EvonetDropinConfig | null = sessionID
    ? {
        type: "payment",
        sessionID,
        environment: config.environment as EvonetDropinConfig["environment"],
        mode: checkoutMode,
        amount: unitPrice,
        currency,
        orderId: pendingOrderId ?? undefined,
        language: storefrontLocale,
        uiOption: withSubscriptionTnC(config.uiOption),
        appearance: config.appearance,
        isVerifyPaymentBrand: config.verifyPaymentBrand,
        verifyOption: config.verifyPaymentBrand
          ? {
              isVerifyPaymentBrand: true,
              maxWaitTime: config.maxWaitTime ?? "10",
            }
          : undefined,
        binRules: config.binRules,
      }
    : null;

  const handleBillNow = async () => {
    if (!membership || membership.status !== "active" || !membership.token) {
      setActionError(copy.noTokenHint);
      return;
    }
    setBillBusy(true);
    setActionError(null);
    setActionMessage(null);
    const orderId = generateFanOrderId();
    try {
      const response = await fetch("/api/evonet/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: membership.amount,
          currency: membership.currency,
          orderId,
          token: membership.token,
          environment: config.environment,
          recurringProcessingModel: "Subscription",
          description: `${plan.brand} Fan Club renewal`,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        resultMessage?: string;
      };
      const at = new Date().toISOString();
      if (!response.ok || !data.ok) {
        const failed: FanClubMembership = {
          ...membership,
          charges: [
            {
              id: `mit-${orderId}`,
              type: "mit",
              orderId,
              amount: membership.amount,
              currency: membership.currency,
              at,
              status: "failed",
              message: data.error ?? copy.billFailed,
            },
            ...membership.charges,
          ],
        };
        persistMembership(failed);
        setActionError(data.error ?? copy.billFailed);
        return;
      }
      const next: FanClubMembership = {
        ...membership,
        nextBillAt: addMonthsIso(at, 1),
        charges: [
          {
            id: `mit-${orderId}`,
            type: "mit",
            orderId,
            amount: membership.amount,
            currency: membership.currency,
            at,
            status: "success",
            message: data.resultMessage,
          },
          ...membership.charges,
        ],
      };
      persistMembership(next);
      setActionMessage(copy.billSuccess);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : copy.billFailed
      );
    } finally {
      setBillBusy(false);
    }
  };

  const handleCancel = () => {
    if (!membership) return;
    const cancelled = cancelFanClubMembership(membership);
    persistMembership(cancelled);
    setActionMessage(copy.cancelledNote);
    setActionError(null);
  };

  const priceLabel = unitPrice.toFixed(2);
  const statusChrome =
    orderResult?.status === "success"
      ? copy.status.success
      : orderResult?.status === "failed"
        ? copy.status.failed
        : orderResult?.status === "cancelled"
          ? copy.status.cancelled
          : copy.status.pending;

  return (
    <Box
      className={`${display.variable} ${sans.variable}`}
      component="main"
      sx={{
        minHeight: "100dvh",
        fontFamily: "var(--shop-font-sans), system-ui, sans-serif",
        bgcolor: "var(--shop-bg)",
        color: "var(--shop-text)",
        backgroundImage:
          "radial-gradient(ellipse 90% 55% at 10% -10%, color-mix(in srgb, var(--shop-primary) 16%, transparent), transparent 65%), radial-gradient(ellipse 70% 40% at 90% 0%, color-mix(in srgb, var(--shop-action) 12%, transparent), transparent 60%)",
        ...cssVars,
      }}
    >
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom:
            "1px solid color-mix(in srgb, var(--shop-border) 80%, transparent)",
          bgcolor: "color-mix(in srgb, var(--shop-bg) 92%, var(--shop-surface))",
          backdropFilter: "blur(14px)",
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 1.1, sm: 1.6 }, px: { xs: 1.75, sm: 3 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="baseline" minWidth={0}>
              <Typography
                sx={{
                  fontFamily: "var(--shop-font-display)",
                  fontSize: { xs: "1.2rem", sm: "1.45rem" },
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                {plan.brand}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--shop-muted)",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  display: { xs: "none", sm: "block" },
                }}
              >
                Fan Club · {copy.navTagline}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.25} alignItems="center" flexShrink={0}>
              <ThemeToggle />
              {membership ? (
                <Button
                  size="small"
                  onClick={() => {
                    setView("membership");
                    setActionMessage(null);
                    setActionError(null);
                  }}
                  sx={{
                    textTransform: "none",
                    color: "var(--shop-muted)",
                    minWidth: 0,
                    px: { xs: 0.75, sm: 1.5 },
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  }}
                >
                  {copy.myMembership}
                </Button>
              ) : null}
              <Button
                size="small"
                onClick={handleBack}
                sx={{
                  textTransform: "none",
                  color: "var(--shop-muted)",
                  minWidth: 0,
                  px: { xs: 0.75, sm: 1.5 },
                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                }}
              >
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  {copy.backToBuilder}
                </Box>
                <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                  {copy.builderShort}
                </Box>
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {view === "result" && orderResult ? (
        <Container maxWidth="sm" sx={{ py: { xs: 3, md: 8 }, px: { xs: 2, sm: 3 }, ...enterUp(0, 420) }}>
          <Typography
            variant="overline"
            sx={{ color: "var(--shop-muted)", letterSpacing: 1.5 }}
          >
            {statusChrome.eyebrow}
          </Typography>
          <Typography
            sx={{
              fontFamily: "var(--shop-font-display)",
              fontSize: { xs: "2rem", md: "2.6rem" },
              lineHeight: 1.1,
              mb: 1.5,
            }}
          >
            {statusChrome.title}
          </Typography>
          <Typography sx={{ color: "var(--shop-muted)", mb: 3, lineHeight: 1.7 }}>
            {statusChrome.body}
          </Typography>
          {tokenBusy || tokenHint ? (
            <Alert severity={tokenBusy ? "info" : "warning"} sx={{ mb: 2 }}>
              {tokenHint ?? copy.tokenPending}
            </Alert>
          ) : null}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant="contained"
              onClick={() => {
                setView(membership ? "membership" : "landing");
                setShopViewKey((k) => k + 1);
                clearPaymentReturnQuery();
              }}
              sx={shopPrimaryButtonSx}
            >
              {membership ? copy.viewMembership : copy.continueBrowsing}
            </Button>
            {orderResult.status !== "success" ? (
              <Button
                variant="outlined"
                onClick={() => {
                  setView("landing");
                  void startCheckout();
                }}
                sx={shopSecondaryButtonSx}
              >
                {copy.joinShort(currency, priceLabel)}
              </Button>
            ) : null}
          </Stack>
        </Container>
      ) : null}

      {view === "membership" && membership ? (
        <Container maxWidth="sm" sx={{ py: { xs: 3, md: 7 }, px: { xs: 2, sm: 3 }, ...enterUp(0, 420) }}>
          <Typography
            sx={{
              fontFamily: "var(--shop-font-display)",
              fontSize: { xs: "2rem", md: "2.4rem" },
              mb: 2,
            }}
          >
            {copy.membershipTitle}
          </Typography>

          {actionMessage ? (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionMessage(null)}>
              {actionMessage}
            </Alert>
          ) : null}
          {actionError ? (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
              {actionError}
            </Alert>
          ) : null}
          {tokenBusy || tokenHint ? (
            <Alert severity={tokenBusy ? "info" : "warning"} sx={{ mb: 2 }}>
              {tokenHint ?? copy.tokenPending}
            </Alert>
          ) : null}

          <Box
            sx={{
              borderRadius: 2,
              border: "1px solid var(--shop-border)",
              bgcolor: "color-mix(in srgb, var(--shop-surface, #fff) 88%, transparent)",
              p: 2.5,
              mb: 3,
            }}
          >
            <Box component="dl" sx={detailDlGridSx}>
              <Typography component="dt" variant="caption" sx={{ color: "var(--shop-muted)" }}>
                Status
              </Typography>
              <Typography component="dd" sx={{ fontWeight: 600, m: 0 }}>
                {membership.status === "active"
                  ? copy.statusActive
                  : copy.statusCancelled}
              </Typography>
              <Typography component="dt" variant="caption" sx={{ color: "var(--shop-muted)" }}>
                {copy.planLabel}
              </Typography>
              <Typography component="dd" sx={{ m: 0 }}>
                {membership.planName} · {membership.currency}{" "}
                {membership.amount.toFixed(2)}
                {copy.perMonth}
              </Typography>
              <Typography component="dt" variant="caption" sx={{ color: "var(--shop-muted)" }}>
                {copy.nextBill}
              </Typography>
              <Typography component="dd" sx={{ m: 0 }}>
                {membership.status === "active"
                  ? new Date(membership.nextBillAt).toLocaleString()
                  : "—"}
              </Typography>
              <Typography component="dt" variant="caption" sx={{ color: "var(--shop-muted)" }}>
                {copy.tokenLabel}
              </Typography>
              <Typography component="dd" sx={{ m: 0, fontFamily: "ui-monospace, monospace" }}>
                {membership.token
                  ? maskPaymentToken(membership.token)
                  : "—"}
              </Typography>
              <Typography component="dt" variant="caption" sx={{ color: "var(--shop-muted)" }}>
                userInfo.reference
              </Typography>
              <Typography component="dd" sx={{ m: 0, fontFamily: "ui-monospace, monospace" }}>
                {membership.userInfoReference}
              </Typography>
            </Box>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mb={3}>
            <Button
              variant="contained"
              disabled={
                membership.status !== "active" ||
                !membership.token ||
                billBusy ||
                tokenBusy
              }
              onClick={() => void handleBillNow()}
              sx={shopPrimaryButtonSx}
            >
              {billBusy ? copy.billing : copy.billNow}
            </Button>
            <Button
              variant="outlined"
              disabled={membership.status !== "active"}
              onClick={handleCancel}
              sx={shopSecondaryButtonSx}
            >
              {copy.cancelMembership}
            </Button>
            <Button
              onClick={() => {
                setView("landing");
                setShopViewKey((k) => k + 1);
              }}
              sx={{ textTransform: "none", color: "var(--shop-muted)" }}
            >
              {copy.continueBrowsing}
            </Button>
          </Stack>

          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>
            {copy.chargeHistory}
          </Typography>
          {membership.charges.length === 0 ? (
            <Typography variant="body2" sx={{ color: "var(--shop-muted)" }}>
              {copy.emptyChargeHistory}
            </Typography>
          ) : (
            <Stack spacing={1.25} divider={<Divider sx={{ borderColor: "var(--shop-border)" }} />}>
              {membership.charges.map((charge) => (
                <Stack
                  key={charge.id}
                  direction="row"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
                      {charge.type.toUpperCase()} · {charge.orderId}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--shop-muted)" }}>
                      {new Date(charge.at).toLocaleString()}
                      {charge.message ? ` · ${charge.message}` : ""}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color:
                        charge.status === "success"
                          ? "var(--shop-text)"
                          : "#b91c1c",
                    }}
                  >
                    {charge.currency} {charge.amount.toFixed(2)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Container>
      ) : null}

      {view === "landing" ? (
        <Box key={shopViewKey} sx={enterUp(0, 420)}>
          <Container
            maxWidth="lg"
            sx={{
              pt: { xs: 0, md: 6 },
              pb: { xs: 12, md: 6 },
              px: { xs: 2, sm: 3 },
            }}
          >
            <Box
              sx={{
                display: "grid",
                gap: { xs: 2.5, md: 6 },
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(0, 1.15fr) minmax(0, 0.9fr)",
                },
                alignItems: "center",
              }}
            >
              <FanClubHeroVisual />

              <Box sx={{ ...enterUp(120, 560), px: { xs: 0.25, sm: 0 } }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: "var(--shop-muted)",
                    letterSpacing: { xs: 1.4, md: 2 },
                    fontSize: { xs: "0.65rem", md: "0.75rem" },
                  }}
                >
                  {plan.tagline}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "var(--shop-font-display)",
                    fontSize: { xs: "2.05rem", sm: "2.4rem", md: "3.35rem" },
                    lineHeight: 0.95,
                    letterSpacing: "0.02em",
                    mt: { xs: 0.75, md: 1 },
                    mb: { xs: 1.25, md: 2 },
                  }}
                >
                  {plan.brand}
                  <Box
                    component="span"
                    sx={{
                      display: "block",
                      fontSize: "0.42em",
                      letterSpacing: "0.14em",
                      mt: 0.75,
                      color: "var(--shop-primary)",
                    }}
                  >
                    FAN CLUB
                  </Box>
                </Typography>
                <Typography
                  sx={{
                    color: "var(--shop-muted)",
                    lineHeight: 1.65,
                    maxWidth: 480,
                    mb: { xs: 2, md: 3 },
                    fontSize: { xs: "0.92rem", md: "1rem" },
                  }}
                >
                  {plan.description}
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={1} mb={1}>
                  <Typography
                    sx={{
                      fontFamily: "var(--shop-font-display)",
                      fontSize: { xs: "1.85rem", md: "2.2rem" },
                      lineHeight: 1,
                    }}
                  >
                    {currency} {priceLabel}
                  </Typography>
                  <Typography sx={{ color: "var(--shop-muted)", fontSize: { xs: "0.9rem", md: "1rem" } }}>
                    {copy.perMonth}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  sx={{ color: "var(--shop-muted)", mb: { xs: 1.75, md: 2.5 } }}
                >
                  {plan.billingNote}
                </Typography>
                {/* Desktop / tablet CTAs — mobile uses sticky bar */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ display: { xs: "none", sm: "flex" } }}
                >
                  <Button
                    variant="contained"
                    onClick={handleJoin}
                    sx={shopPrimaryButtonSx}
                  >
                    {copy.joinCta(currency, priceLabel)}
                  </Button>
                  {membership ? (
                    <Button
                      variant="outlined"
                      onClick={() => setView("membership")}
                      sx={shopSecondaryButtonSx}
                    >
                      {copy.myMembership}
                    </Button>
                  ) : null}
                </Stack>
                <Typography
                  variant="caption"
                  sx={{
                    display: { xs: "none", sm: "block" },
                    mt: 2.25,
                    color: "var(--shop-muted)",
                    maxWidth: 440,
                    lineHeight: 1.6,
                  }}
                >
                  {copy.billingConsent}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: { xs: 3, md: 7 } }}>
              <FanClubModelStrip title={copy.lookbookTitle} />
            </Box>

            <Box
              sx={{
                mt: { xs: 2.75, md: 5 },
                borderRadius: { xs: 2, md: 3 },
                border: "1px solid var(--shop-border)",
                bgcolor:
                  "color-mix(in srgb, var(--shop-surface, #fff) 78%, color-mix(in srgb, var(--shop-primary) 6%, transparent))",
                p: { xs: 2, md: 3.25 },
                maxWidth: 720,
                ...enterUp(260, 640),
              }}
            >
              <Typography sx={{ fontWeight: 700, mb: { xs: 1.5, md: 2 }, fontSize: { xs: "0.95rem", md: "1rem" } }}>
                {copy.benefitsTitle}
              </Typography>
              <Stack
                spacing={{ xs: 1.25, md: 1.6 }}
                component="ul"
                sx={{ m: 0, pl: 0, listStyle: "none" }}
              >
                {plan.benefits.map((benefit) => (
                  <Box
                    key={benefit}
                    component="li"
                    sx={{
                      display: "flex",
                      gap: 1.25,
                      alignItems: "flex-start",
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        mt: 0.85,
                        borderRadius: "50%",
                        bgcolor: "var(--shop-action)",
                        flexShrink: 0,
                      }}
                    />
                    <Typography sx={{ lineHeight: 1.5, fontSize: { xs: "0.92rem", md: "1rem" } }}>
                      {benefit}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Container>

          <Box
            component="footer"
            sx={{
              borderTop: "1px solid var(--shop-border)",
              py: { xs: 2.25, md: 3 },
              pb: {
                xs: "calc(20px + 88px + env(safe-area-inset-bottom, 0px))",
                md: 3,
              },
            }}
          >
            <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={0.75}
              >
                <Typography
                  sx={{
                    fontFamily: "var(--shop-font-display)",
                    fontSize: { xs: "1.05rem", md: "1.2rem" },
                    letterSpacing: "0.04em",
                  }}
                >
                  {plan.brand} FAN CLUB
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--shop-muted)",
                    wordBreak: "break-word",
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  }}
                >
                  {copy.footerMeta} · {config.environment} · {storefrontLocale} ·{" "}
                  {checkoutMode}
                </Typography>
              </Stack>
            </Container>
          </Box>

          <Box
            sx={{
              display: { xs: "block", sm: "none" },
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 30,
              borderTop: "1px solid var(--shop-border)",
              bgcolor: "color-mix(in srgb, var(--shop-bg) 94%, transparent)",
              backdropFilter: "blur(12px)",
              px: 2,
              pt: 1.25,
              pb: "calc(10px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ minWidth: 0, flex: "0 1 auto" }}>
                <Typography
                  sx={{
                    fontFamily: "var(--shop-font-display)",
                    fontSize: "1.15rem",
                    lineHeight: 1,
                  }}
                >
                  {currency} {priceLabel}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "var(--shop-muted)", display: "block", mt: 0.25 }}
                >
                  {copy.perMonth}
                </Typography>
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={handleJoin}
                sx={{ ...shopPrimaryButtonSx, flex: 1, py: 1.35 }}
              >
                {copy.joinShort(currency, priceLabel)}
              </Button>
            </Stack>
          </Box>
        </Box>
      ) : null}

      {!isSdkOverlayMode ? (
        <FanClubCheckoutDrawer
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          plan={plan}
          currency={currency}
          total={unitPrice}
          isCreatingSession={isCreatingSession}
          sessionError={sessionError}
          dropinConfig={dropinConfig}
          sdkInitGeneration={sdkInitGeneration}
          onEvent={handleDropinEvent}
          themeVars={cssVars}
          copy={copy}
          environment={config.environment}
        />
      ) : (
        <DropinModePreviewShell
          mode={checkoutMode}
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          closeHint={copy.closeCheckout}
        >
          <StorefrontDropinOverlayStage
            sessionError={sessionError}
            isCreatingSession={isCreatingSession}
            dropinConfig={dropinConfig}
            sdkInitGeneration={sdkInitGeneration}
            onEvent={handleDropinEvent}
            loadingLabel={copy.loadingPayment}
          />
        </DropinModePreviewShell>
      )}
    </Box>
  );
}
