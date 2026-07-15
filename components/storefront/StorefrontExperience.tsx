"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fraunces, Manrope } from "next/font/google";
import {
  Badge,
  Box,
  Button,
  Container,
  IconButton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import { DEMO_PRODUCT, type DemoProduct } from "./demoProduct";
import { StorefrontBagDrawer } from "./StorefrontBagDrawer";
import { StorefrontCheckoutDrawer } from "./StorefrontCheckoutDrawer";
import {
  StorefrontOrderResult,
  type StorefrontCheckoutSummary,
} from "./StorefrontOrderResult";
import { StorefrontProductCard } from "./StorefrontProductCard";
import { bagBounce, enterUp } from "./storefrontMotion";
import {
  cartLineCount,
  cartLineId,
  formatCartLineLabel,
  type StorefrontCartLine,
} from "./cartTypes";
import {
  parseEvonetReturnParams,
  parseEvonetSdkPaymentEvent,
  stripEvonetReturnQuery,
  type EvonetReturnParams,
} from "../../lib/evonetReturnParams";
import {
  appearanceToStorefrontCssVars,
  resolveStorefrontUnitPrice,
  type StorefrontSnapshot,
} from "../../lib/storefrontSnapshot";
import type { EvonetDropinConfig, EvonetDropinEvent } from "../../types/evonet";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--shop-font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--shop-font-sans",
  display: "swap",
});

export type StorefrontConfig = Omit<StorefrontSnapshot, "savedAt">;

function generateOrderId(): string {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `SHOP-${Date.now()}-${suffix}`;
}

interface StorefrontExperienceProps {
  config: StorefrontConfig;
  /** When set, "Back to Builder" closes overlay instead of navigating away. */
  onBackToBuilder?: () => void;
}

export function StorefrontExperience({
  config,
  onBackToBuilder,
}: StorefrontExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [cartLines, setCartLines] = useState<StorefrontCartLine[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [sessionID, setSessionID] = useState("");
  const [sdkInitGeneration, setSdkInitGeneration] = useState(0);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState(DEMO_PRODUCT.sizes[2] ?? "M");
  const [selectedColorId, setSelectedColorId] = useState(
    DEMO_PRODUCT.colors[0]?.id ?? "charcoal"
  );
  const [justAdded, setJustAdded] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [checkoutSummary, setCheckoutSummary] =
    useState<StorefrontCheckoutSummary | null>(null);
  const [orderResult, setOrderResult] = useState<EvonetReturnParams | null>(
    null
  );
  const [shopViewKey, setShopViewKey] = useState(0);

  const paymentReturnFromUrl = useMemo(
    () => parseEvonetReturnParams(searchParams),
    [searchParams]
  );

  const applyPaymentResult = useCallback((result: EvonetReturnParams) => {
    setOrderResult(result);
    setCheckoutOpen(false);
    setBagOpen(false);
    setSessionID("");
    setSdkInitGeneration(0);
    if (result.status === "success") {
      setCartLines([]);
    }
  }, []);

  useEffect(() => {
    if (!paymentReturnFromUrl) return;
    applyPaymentResult(paymentReturnFromUrl);
  }, [paymentReturnFromUrl, applyPaymentResult]);

  const cssVars = useMemo(
    () => appearanceToStorefrontCssVars(config.appearance),
    [config.appearance]
  );

  const currency = config.currency?.trim() || "HKD";
  const unitPrice = resolveStorefrontUnitPrice(config.amount);
  const product: DemoProduct = useMemo(
    () => ({
      ...DEMO_PRODUCT,
      price: unitPrice,
      compareAtPrice: undefined,
    }),
    [unitPrice]
  );
  const cartQty = cartLineCount(cartLines);
  const cartTotal = product.price * Math.max(cartQty, 0);
  const colorLabel =
    product.colors.find((c) => c.id === selectedColorId)?.label ?? "Charcoal";

  const makeLine = useCallback(
    (quantity: number): StorefrontCartLine => ({
      id: cartLineId(selectedColorId, selectedSize),
      size: selectedSize,
      colorId: selectedColorId,
      colorLabel,
      quantity: Math.max(1, quantity),
    }),
    [colorLabel, selectedColorId, selectedSize]
  );

  const dropinConfig: EvonetDropinConfig | null = useMemo(() => {
    if (!sessionID.trim()) return null;
    return {
      type: "payment",
      sessionID: sessionID.trim(),
      environment: config.environment,
      // Drawer checkout must stay embedded — fullPage/bottomUp fight the sheet layout.
      mode: "embedded",
      language: config.locale || "en-US",
      isVerifyPaymentBrand: Boolean(config.verifyPaymentBrand),
      verifyOption: config.verifyPaymentBrand
        ? { maxWaitTime: config.maxWaitTime || "10" }
        : undefined,
      uiOption: config.uiOption,
      appearance: config.appearance,
    };
  }, [config, sessionID]);

  const clearPaymentReturnQuery = useCallback(() => {
    const next = stripEvonetReturnQuery(
      new URLSearchParams(searchParams.toString())
    );
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, searchParams]);

  const startCheckout = useCallback(
    async (lines: StorefrontCartLine[]) => {
      const checkoutLines = lines
        .filter((line) => line.quantity > 0)
        .map((line) => ({ ...line }));
      if (checkoutLines.length === 0) return;

      const qty = cartLineCount(checkoutLines);
      const amount = product.price * qty;
      const orderId = generateOrderId();
      const description = `${product.name} · ${checkoutLines
        .map((line) => `${formatCartLineLabel(line)} × ${line.quantity}`)
        .join("; ")}`;

      setBagOpen(false);
      setOrderResult(null);
      setCheckoutSummary({
        orderId,
        lines: checkoutLines,
        total: amount,
        currency,
      });
      setCheckoutOpen(true);
      setSessionError(null);
      setIsCreatingSession(true);

      try {
        const response = await fetch("/api/evonet/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            currency,
            orderId,
            description,
            environment: config.environment,
            locale: config.locale || "en-US",
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
    [config.environment, config.locale, currency, product.name, product.price]
  );

  const handleAddToCart = () => {
    const id = cartLineId(selectedColorId, selectedSize);
    setCartLines((prev) => {
      const existing = prev.find((line) => line.id === id);
      if (existing) {
        return prev.map((line) =>
          line.id === id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      return [...prev, makeLine(1)];
    });
    setJustAdded(true);
    setToastOpen(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  const handleBuyNow = () => {
    void startCheckout([makeLine(1)]);
  };

  const handlePayFromCart = () => {
    if (cartLines.length < 1) {
      void startCheckout([makeLine(1)]);
      return;
    }
    void startCheckout(cartLines);
  };

  const handleIncrementLine = (lineId: string) => {
    setCartLines((prev) =>
      prev.map((line) =>
        line.id === lineId ? { ...line, quantity: line.quantity + 1 } : line
      )
    );
  };

  const handleDecrementLine = (lineId: string) => {
    setCartLines((prev) =>
      prev
        .map((line) =>
          line.id === lineId
            ? { ...line, quantity: line.quantity - 1 }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  };

  const handleDropinEvent = useCallback(
    (event: EvonetDropinEvent) => {
      if (
        event.type === "payment_success" ||
        event.type === "payment_fail" ||
        event.type === "payment_cancelled"
      ) {
        const fromSdk = parseEvonetSdkPaymentEvent(event.type, event.payload);
        if (fromSdk) {
          applyPaymentResult(fromSdk);
        }
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

  const handleContinueShopping = () => {
    setOrderResult(null);
    setCheckoutSummary(null);
    setShopViewKey((k) => k + 1);
    clearPaymentReturnQuery();
  };

  const handleTryCheckoutAgain = () => {
    setOrderResult(null);
    clearPaymentReturnQuery();
    const lines =
      checkoutSummary?.lines?.length
        ? checkoutSummary.lines
        : cartLines.length > 0
          ? cartLines
          : [makeLine(1)];
    void startCheckout(lines);
  };

  const showOrderResult = Boolean(orderResult);

  const fallbackSummary: StorefrontCheckoutSummary = {
    orderId:
      orderResult?.merchantOrderID ||
      checkoutSummary?.orderId ||
      "SHOP-DEMO",
    lines:
      checkoutSummary?.lines?.length
        ? checkoutSummary.lines
        : cartLines.length > 0
          ? cartLines
          : [makeLine(1)],
    total:
      checkoutSummary?.total ??
      (cartQty > 0 ? cartTotal : product.price),
    currency,
  };

  return (
    <Box
      className={`${display.variable} ${sans.variable}`}
      component="main"
      sx={{
        minHeight: "100vh",
        fontFamily: "var(--shop-font-sans), system-ui, sans-serif",
        bgcolor: "var(--shop-bg)",
        color: "var(--shop-text)",
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--shop-primary) 10%, transparent), transparent 70%)",
        ...cssVars,
      }}
    >
      {showOrderResult && orderResult ? (
        <StorefrontOrderResult
          key={`${orderResult.status}-${orderResult.merchantTransID ?? orderResult.sessionID ?? "result"}`}
          product={product}
          summary={checkoutSummary ?? fallbackSummary}
          result={orderResult}
          onContinueShopping={handleContinueShopping}
          onTryAgain={
            orderResult.status === "success" ? undefined : handleTryCheckoutAgain
          }
        />
      ) : (
        <Box key={shopViewKey} sx={enterUp(0, 420)}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom:
            "1px solid color-mix(in srgb, var(--shop-border) 80%, transparent)",
          bgcolor: "color-mix(in srgb, var(--shop-bg) 92%, #ffffff)",
          backdropFilter: "blur(14px)",
          ...enterUp(40, 500),
        }}
      >
        <Container maxWidth="lg" sx={{ py: 1.6 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={3} alignItems="center">
              <Typography
                sx={{
                  fontFamily: "var(--shop-font-display)",
                  fontWeight: 650,
                  fontSize: "1.2rem",
                  letterSpacing: "-0.03em",
                }}
              >
                {product.brand}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: { xs: "none", sm: "block" },
                  color: "var(--shop-muted)",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                New season
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.5} alignItems="center">
              <Button
                size="small"
                onClick={handleBack}
                sx={{
                  textTransform: "none",
                  color: "var(--shop-muted)",
                  fontWeight: 500,
                }}
              >
                Back to Builder
              </Button>
              <IconButton
                aria-label="Open bag"
                onClick={() => setBagOpen(true)}
                sx={{
                  color: "var(--shop-text)",
                  transition: "transform 180ms ease",
                  "&:hover": { transform: "scale(1.06)" },
                }}
              >
                <Badge
                  key={cartQty}
                  badgeContent={cartQty}
                  sx={{
                    "& .MuiBadge-badge": {
                      bgcolor: "var(--shop-action)",
                      color: "var(--shop-action-text)",
                      animation:
                        cartQty > 0
                          ? `${bagBounce} 480ms cubic-bezier(0.22, 1, 0.36, 1)`
                          : "none",
                    },
                  }}
                >
                  <ShoppingBagOutlinedIcon />
                </Badge>
              </IconButton>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box
        sx={{
          borderBottom: "1px solid var(--shop-border)",
          bgcolor: "color-mix(in srgb, var(--shop-action) 6%, var(--shop-bg))",
          ...enterUp(90, 500),
        }}
      >
        <Container maxWidth="lg" sx={{ py: 1 }}>
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              color: "var(--shop-muted)",
              letterSpacing: 0.2,
            }}
          >
            Complimentary shipping on orders over {currency} 500 · Easy 30-day
            returns
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3.5, md: 6 } }}>
        <StorefrontProductCard
          product={product}
          currency={currency}
          selectedSize={selectedSize}
          selectedColorId={selectedColorId}
          onSizeChange={setSelectedSize}
          onColorChange={setSelectedColorId}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          justAdded={justAdded}
        />
      </Container>

      <Box
        component="section"
        sx={{
          mt: { xs: 2, md: 4 },
          py: { xs: 5, md: 7 },
          borderTop: "1px solid var(--shop-border)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--shop-primary) 5%, var(--shop-bg)), var(--shop-bg))",
          ...enterUp(240, 620),
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "grid",
              gap: { xs: 3, md: 5 },
              gridTemplateColumns: { xs: "1fr", md: "1fr 1.2fr" },
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                aspectRatio: "4 / 5",
                bgcolor: "#ece8e1",
                boxShadow: "0 28px 70px rgba(15, 23, 42, 0.1)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Box
                component="img"
                src={product.images[1]?.src}
                alt={product.images[1]?.alt ?? ""}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
            <Box sx={{ maxWidth: 480 }}>
              <Typography
                sx={{
                  fontFamily: "var(--shop-font-display)",
                  fontSize: { xs: "1.85rem", md: "2.35rem" },
                  fontWeight: 550,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.15,
                  mb: 2,
                }}
              >
                Built for everyday motion. Styled for a clean checkout.
              </Typography>
              <Typography
                sx={{ color: "var(--shop-muted)", lineHeight: 1.7, mb: 3 }}
              >
                This storefront inherits your Drop-in Builder palette—CTAs,
                accents, and the payment panel all speak the same visual language
                when you pay with Evonet.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setBagOpen(true)}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "var(--shop-action)",
                  color: "var(--shop-action)",
                  borderRadius: 2,
                  px: 2.5,
                  py: 1.1,
                }}
              >
                View bag
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          borderTop: "1px solid var(--shop-border)",
          py: 3.5,
          mt: 2,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Typography
              sx={{
                fontFamily: "var(--shop-font-display)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {product.brand}
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--shop-muted)" }}>
              Demo storefront · Theme from Builder · {config.environment} ·{" "}
              {config.locale}
            </Typography>
          </Stack>
        </Container>
      </Box>

      <StorefrontBagDrawer
        open={bagOpen}
        onClose={() => setBagOpen(false)}
        product={product}
        lines={cartLines}
        currency={currency}
        onIncrement={handleIncrementLine}
        onDecrement={handleDecrementLine}
        onCheckout={handlePayFromCart}
        themeVars={cssVars}
      />

      <StorefrontCheckoutDrawer
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        product={product}
        currency={currency}
        lines={
          checkoutSummary?.lines?.length
            ? checkoutSummary.lines
            : cartLines.length > 0
              ? cartLines
              : [makeLine(1)]
        }
        total={
          checkoutSummary?.total ??
          (cartQty > 0 ? cartTotal : product.price)
        }
        isCreatingSession={isCreatingSession}
        sessionError={sessionError}
        dropinConfig={dropinConfig}
        sdkInitGeneration={sdkInitGeneration}
        onEvent={handleDropinEvent}
        themeVars={cssVars}
      />

      <Snackbar
        open={toastOpen}
        autoHideDuration={2200}
        onClose={() => setToastOpen(false)}
        message="Added to bag"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              setToastOpen(false);
              setBagOpen(true);
            }}
          >
            View
          </Button>
        }
      />
        </Box>
      )}
    </Box>
  );
}

/** Empty state when no Builder config / snapshot is available. */
export function StorefrontEmptyState() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f1ec",
        display: "grid",
        placeItems: "center",
        px: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 440,
          p: 4,
          borderRadius: 3,
          bgcolor: "#fff",
          border: "1px solid #e7e2d9",
          boxShadow: "0 20px 50px rgba(28, 25, 23, 0.06)",
        }}
      >
        <Typography
          sx={{
            fontFamily: "Georgia, serif",
            fontSize: "1.75rem",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            mb: 1.25,
          }}
        >
          Open from Builder first
        </Typography>
        <Typography sx={{ color: "#78716c", mb: 2.5, lineHeight: 1.6 }}>
          Configure appearance and order amount in Drop-in Builder, then click{" "}
          <strong>Open as storefront</strong>. Your Builder settings stay in place
          when you return.
        </Typography>
        <Button
          component={Link}
          href="/evonet/dropin-builder"
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 650,
            bgcolor: "#1c1917",
            "&:hover": { bgcolor: "#292524" },
          }}
        >
          Back to Builder
        </Button>
      </Box>
    </Box>
  );
}
