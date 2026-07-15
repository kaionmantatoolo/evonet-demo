"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { EvonetPaymentReturnDialog } from "../../../components/EvonetPaymentReturnDialog";
import { DEMO_PRODUCT } from "../../../components/storefront/demoProduct";
import { StorefrontCheckoutDrawer } from "../../../components/storefront/StorefrontCheckoutDrawer";
import { StorefrontProductCard } from "../../../components/storefront/StorefrontProductCard";
import {
  parseEvonetReturnParams,
  parseEvonetSdkPaymentEvent,
  stripEvonetReturnQuery,
  type EvonetReturnParams,
} from "../../../lib/evonetReturnParams";
import {
  appearanceToStorefrontCssVars,
  readStorefrontSnapshot,
  type StorefrontSnapshot,
} from "../../../lib/storefrontSnapshot";
import type { EvonetDropinConfig, EvonetDropinEvent } from "../../../types/evonet";

function generateOrderId(): string {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `SHOP-${Date.now()}-${suffix}`;
}

function StorefrontPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [snapshot, setSnapshot] = useState<StorefrontSnapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [cartQty, setCartQty] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [sessionID, setSessionID] = useState("");
  const [sdkInitGeneration, setSdkInitGeneration] = useState(0);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const paymentReturnFromUrl = useMemo(
    () => parseEvonetReturnParams(searchParams),
    [searchParams]
  );
  const [paymentReturnPrompt, setPaymentReturnPrompt] =
    useState<EvonetReturnParams | null>(null);
  const [returnDialogDismissed, setReturnDialogDismissed] = useState(false);
  const showReturnDialog =
    Boolean(paymentReturnPrompt) && !returnDialogDismissed;

  useEffect(() => {
    setSnapshot(readStorefrontSnapshot());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (paymentReturnFromUrl) {
      setPaymentReturnPrompt(paymentReturnFromUrl);
      setReturnDialogDismissed(false);
    }
  }, [paymentReturnFromUrl]);

  const cssVars = useMemo(
    () => appearanceToStorefrontCssVars(snapshot?.appearance),
    [snapshot?.appearance]
  );

  const currency = snapshot?.currency?.trim() || "HKD";
  const cartTotal = DEMO_PRODUCT.price * Math.max(cartQty, 0);

  const dropinConfig: EvonetDropinConfig | null = useMemo(() => {
    if (!snapshot || !sessionID.trim()) return null;
    return {
      type: "payment",
      sessionID: sessionID.trim(),
      environment: snapshot.environment,
      mode: snapshot.mode,
      language: snapshot.locale || "en-US",
      isVerifyPaymentBrand: Boolean(snapshot.verifyPaymentBrand),
      verifyOption: snapshot.verifyPaymentBrand
        ? { maxWaitTime: snapshot.maxWaitTime || "10" }
        : undefined,
      uiOption: snapshot.uiOption,
      appearance: snapshot.appearance,
    };
  }, [sessionID, snapshot]);

  const clearPaymentReturnQuery = useCallback(() => {
    const next = stripEvonetReturnQuery(
      new URLSearchParams(searchParams.toString())
    );
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, searchParams]);

  const startCheckout = useCallback(
    async (quantity: number) => {
      if (!snapshot) return;
      const qty = Math.max(1, quantity);
      setCartQty((prev) => Math.max(prev, qty));
      setCheckoutOpen(true);
      setSessionError(null);
      setIsCreatingSession(true);

      const amount = DEMO_PRODUCT.price * qty;

      try {
        const response = await fetch("/api/evonet/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            currency,
            orderId: generateOrderId(),
            description: `${DEMO_PRODUCT.name} × ${qty}`,
            environment: snapshot.environment,
            locale: snapshot.locale || "en-US",
          }),
        });
        const data = (await response.json()) as {
          sessionId?: string;
          error?: string;
        };
        if (!response.ok || !data.sessionId) {
          throw new Error(
            data.error ?? "Failed to create session via Evonet interaction API."
          );
        }
        setSessionID(data.sessionId);
        setSdkInitGeneration((value) => value + 1);
      } catch (error) {
        setSessionError(
          error instanceof Error ? error.message : "Unexpected session error."
        );
      } finally {
        setIsCreatingSession(false);
      }
    },
    [currency, snapshot]
  );

  const handleAddToCart = () => {
    setCartQty((prev) => prev + 1);
  };

  const handleBuyNow = () => {
    setCartQty(1);
    void startCheckout(1);
  };

  const handlePayFromCart = () => {
    if (cartQty < 1) {
      setCartQty(1);
      void startCheckout(1);
      return;
    }
    void startCheckout(cartQty);
  };

  const handleDropinEvent = useCallback((event: EvonetDropinEvent) => {
    if (
      event.type === "payment_success" ||
      event.type === "payment_fail" ||
      event.type === "payment_cancelled"
    ) {
      const fromSdk = parseEvonetSdkPaymentEvent(event.type, event.payload);
      if (fromSdk) {
        setPaymentReturnPrompt(fromSdk);
        setReturnDialogDismissed(false);
      }
    }
  }, []);

  if (!hydrated) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }} />
    );
  }

  if (!snapshot) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", py: 8 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={700}>
                No storefront theme yet
              </Typography>
              <Typography color="text.secondary">
                Open Drop-in Builder, adjust appearance colors, then click{" "}
                <strong>Open as storefront</strong> to bring the theme here.
              </Typography>
              <Button
                component={Link}
                href="/evonet/dropin-builder"
                variant="contained"
                sx={{ alignSelf: "flex-start", textTransform: "none" }}
              >
                Back to Builder
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        bgcolor: "var(--shop-bg)",
        color: "var(--shop-text)",
        ...cssVars,
      }}
    >
      <Box
        component="header"
        sx={{
          borderBottom: "1px solid var(--shop-border)",
          bgcolor: "color-mix(in srgb, var(--shop-bg) 92%, var(--shop-primary))",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(8px)",
        }}
      >
        <Container maxWidth="lg" sx={{ py: 1.75 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.3 }}>
                Evonet Demo Store
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--shop-muted)" }}>
                Themed from Drop-in Builder · {snapshot.environment} ·{" "}
                {snapshot.locale}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                component={Link}
                href="/evonet/dropin-builder"
                size="small"
                sx={{ textTransform: "none", color: "var(--shop-text)" }}
              >
                Back to Builder
              </Button>
              <IconButton
                aria-label="Open cart"
                onClick={() => setCheckoutOpen(true)}
                sx={{ color: "var(--shop-action)" }}
              >
                <Badge badgeContent={cartQty} color="error">
                  <ShoppingCartOutlinedIcon />
                </Badge>
              </IconButton>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                letterSpacing: -0.8,
                color: "var(--shop-text)",
                mb: 1,
              }}
            >
              Shop
            </Typography>
            <Typography sx={{ color: "var(--shop-muted)", maxWidth: 560 }}>
              Listing preview wired to your Builder appearance. Add to cart or buy
              now to create a session and open Drop-in checkout.
            </Typography>
          </Box>

          <StorefrontProductCard
            product={DEMO_PRODUCT}
            currency={currency}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />

          {cartQty > 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "var(--shop-radius)",
                border: "1px solid var(--shop-border)",
                bgcolor: "var(--shop-surface)",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ sm: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  <Typography fontWeight={700}>
                    Cart · {DEMO_PRODUCT.name} × {cartQty}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "var(--shop-muted)" }}>
                    Subtotal {currency} {cartTotal.toFixed(2)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={() => setCartQty((q) => Math.max(0, q - 1))}
                    sx={{ textTransform: "none", color: "var(--shop-muted)" }}
                  >
                    −
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setCartQty((q) => q + 1)}
                    sx={{ textTransform: "none", color: "var(--shop-muted)" }}
                  >
                    +
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handlePayFromCart}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      bgcolor: "var(--shop-action)",
                      color: "var(--shop-action-text)",
                      "&:hover": {
                        bgcolor: "var(--shop-action)",
                        filter: "brightness(1.05)",
                      },
                    }}
                  >
                    Pay with Drop-in
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ) : (
            <Alert
              severity="info"
              variant="outlined"
              sx={{
                borderColor: "var(--shop-border)",
                color: "var(--shop-text)",
                bgcolor: "transparent",
              }}
            >
              Cart is empty. Use Add to cart or Buy now to start checkout.
            </Alert>
          )}
        </Stack>
      </Container>

      <StorefrontCheckoutDrawer
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        currency={currency}
        total={cartQty > 0 ? cartTotal : DEMO_PRODUCT.price}
        isCreatingSession={isCreatingSession}
        sessionError={sessionError}
        dropinConfig={dropinConfig}
        sdkInitGeneration={sdkInitGeneration}
        onEvent={handleDropinEvent}
      />

      <EvonetPaymentReturnDialog
        open={showReturnDialog}
        params={paymentReturnPrompt}
        onDismiss={() => setReturnDialogDismissed(true)}
        onStartNewPayment={() => {
          setReturnDialogDismissed(true);
          setPaymentReturnPrompt(null);
          clearPaymentReturnQuery();
          setCheckoutOpen(false);
          setSessionID("");
          setSdkInitGeneration(0);
          setCartQty(0);
        }}
      />
    </Box>
  );
}

export default function StorefrontPageRoute() {
  return (
    <Suspense fallback={null}>
      <StorefrontPage />
    </Suspense>
  );
}
