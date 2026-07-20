"use client";

import {
  Box,
  Button,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { EvonetReturnParams } from "../../lib/evonetReturnParams";
import type { DemoProduct } from "./demoProduct";
import { productThumbForColor } from "./demoProduct";
import {
  cartLineCount,
  formatCartLineLabel,
  type StorefrontCartLine,
} from "./cartTypes";
import {
  enterFade,
  enterScale,
  enterUp,
  ringPulse,
  softShake,
} from "./storefrontMotion";
import {
  shopPrimaryButtonSx,
  shopSecondaryButtonSx,
} from "./storefrontButtons";

export interface StorefrontCheckoutSummary {
  orderId: string;
  lines: StorefrontCartLine[];
  total: number;
  currency: string;
}

interface StorefrontOrderResultProps {
  product: DemoProduct;
  summary: StorefrontCheckoutSummary;
  result: EvonetReturnParams;
  onContinueShopping: () => void;
  onTryAgain?: () => void;
}

function statusChrome(status: EvonetReturnParams["status"]) {
  switch (status) {
    case "success":
      return {
        Icon: CheckCircleOutlineIcon,
        tone: "var(--shop-action, #1c1917)",
        eyebrow: "Order confirmed",
        title: "Thank you — your order is placed",
        body: "We’ve emailed a receipt and started packing. You’ll get tracking updates as soon as it ships.",
      };
    case "failed":
      return {
        Icon: ErrorOutlineIcon,
        tone: "#b91c1c",
        eyebrow: "Payment unsuccessful",
        title: "We couldn’t complete your payment",
        body: "Nothing was charged. You can try checkout again with the same bag, or continue shopping.",
      };
    case "cancelled":
      return {
        Icon: WarningAmberOutlinedIcon,
        tone: "#b45309",
        eyebrow: "Payment cancelled",
        title: "Checkout was cancelled",
        body: "Your bag is still here. Resume when you’re ready — no charge was made.",
      };
    default:
      return {
        Icon: InfoOutlinedIcon,
        tone: "#0369a1",
        eyebrow: "Payment pending",
        title: "We’re confirming your payment",
        body: "This can take a moment for some payment methods. Hang tight — we’ll update this page when it’s ready.",
      };
  }
}

export function StorefrontOrderResult({
  product,
  summary,
  result,
  onContinueShopping,
  onTryAgain,
}: StorefrontOrderResultProps) {
  const chrome = statusChrome(result.status);
  const Icon = chrome.Icon;
  const isSuccess = result.status === "success";
  const isNegative =
    result.status === "failed" || result.status === "cancelled";

  const detailRows: { label: string; value: string }[] = [
    { label: "Order number", value: summary.orderId },
  ];
  const paymentRef =
    result.merchantTransID || result.merchantOrderID || null;
  if (paymentRef) {
    detailRows.push({ label: "Payment reference", value: paymentRef });
  }
  if (result.message && !isSuccess) {
    detailRows.push({ label: "Note", value: result.message });
  }

  return (
    <Box
      sx={{
        minHeight: "100%",
        bgcolor: "var(--shop-bg, #faf8f5)",
        color: "var(--shop-text, #1c1917)",
        pb: 8,
        ...enterFade(0, 360),
      }}
    >
      <Box
        sx={{
          borderBottom: "1px solid var(--shop-border, #e7e2d9)",
          bgcolor: "color-mix(in srgb, var(--shop-bg) 92%, #ffffff)",
          ...enterUp(40, 500),
        }}
      >
        <Container maxWidth="sm" sx={{ py: 1.6 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography
              sx={{
                fontFamily: "var(--shop-font-display)",
                fontWeight: 650,
                fontSize: "1.1rem",
                letterSpacing: "-0.03em",
              }}
            >
              {product.brand}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "var(--shop-muted)",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Order status
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ pt: { xs: 4, md: 6 } }}>
        <Stack spacing={3.5}>
          <Box sx={enterUp(90)}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.75 }}>
              <Box
                sx={{
                  position: "relative",
                  width: 44,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  ...enterScale(120, 560),
                }}
              >
                {isSuccess ? (
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: "1.5px solid",
                      borderColor: chrome.tone,
                      animation: `${ringPulse} 1.1s ease-out 280ms both`,
                      "@media (prefers-reduced-motion: reduce)": {
                        animation: "none",
                        opacity: 0,
                      },
                    }}
                  />
                ) : null}
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "color-mix(in srgb, currentColor 10%, transparent)",
                    color: chrome.tone,
                    ...(isNegative
                      ? {
                          animation: `${softShake} 520ms ease 280ms both`,
                          "@media (prefers-reduced-motion: reduce)": {
                            animation: "none",
                          },
                        }
                      : {}),
                  }}
                >
                  <Icon sx={{ fontSize: 26 }} />
                </Box>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: chrome.tone,
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                  fontWeight: 650,
                }}
              >
                {chrome.eyebrow}
              </Typography>
            </Stack>
            <Typography
              sx={{
                fontFamily: "var(--shop-font-display)",
                fontSize: { xs: "1.85rem", md: "2.25rem" },
                fontWeight: 550,
                letterSpacing: "-0.035em",
                lineHeight: 1.15,
                mb: 1.25,
              }}
            >
              {chrome.title}
            </Typography>
            <Typography sx={{ color: "var(--shop-muted)", lineHeight: 1.65 }}>
              {chrome.body}
            </Typography>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: "1px solid var(--shop-border)",
              bgcolor: "var(--shop-surface, #fff)",
              ...enterUp(180),
            }}
          >
            <Stack spacing={1.75}>
              {summary.lines.map((line) => {
                const thumb = productThumbForColor(product, line.colorId);
                return (
                <Box
                  key={line.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "72px 1fr",
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: 2,
                      overflow: "hidden",
                      bgcolor: "#ece8e1",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <Box
                      component="img"
                      src={thumb?.src}
                      alt={thumb?.alt ?? product.name}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.35 }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "var(--shop-muted)" }}>
                      {formatCartLineLabel(line)} · Qty {line.quantity}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 650 }}>
                      {summary.currency}{" "}
                      {(product.price * line.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              );
              })}
              <Divider sx={{ borderColor: "var(--shop-border)" }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: "var(--shop-muted)" }}>
                  {cartLineCount(summary.lines)} item
                  {cartLineCount(summary.lines) === 1 ? "" : "s"}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {summary.currency} {summary.total.toFixed(2)}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {isSuccess ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: "color-mix(in srgb, var(--shop-action) 8%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--shop-action) 22%, transparent)",
                ...enterUp(260),
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 650, mb: 0.75 }}>
                Estimated delivery
              </Typography>
              <Typography variant="body2" sx={{ color: "var(--shop-muted)" }}>
                1–2 business days · Free returns within 30 days
              </Typography>
            </Box>
          ) : null}

          <Box sx={enterUp(isSuccess ? 340 : 260)}>
            <Typography
              variant="overline"
              sx={{ color: "var(--shop-muted)", letterSpacing: 1.2 }}
            >
              Order details
            </Typography>
            <Divider sx={{ my: 1.25, borderColor: "var(--shop-border)" }} />
            <Box
              component="dl"
              sx={{
                m: 0,
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                gap: 1,
              }}
            >
              {detailRows.map((row) => (
                <Box key={row.label} sx={{ display: "contents" }}>
                  <Typography
                    component="dt"
                    variant="caption"
                    sx={{ color: "var(--shop-muted)" }}
                  >
                    {row.label}
                  </Typography>
                  <Typography
                    component="dd"
                    variant="caption"
                    sx={{
                      m: 0,
                      fontFamily: "ui-monospace, monospace",
                      wordBreak: "break-all",
                    }}
                  >
                    {row.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={enterUp(isSuccess ? 480 : 400)}
          >
            {isSuccess ? (
              <Button
                fullWidth
                variant="contained"
                onClick={onContinueShopping}
                sx={shopPrimaryButtonSx}
              >
                Continue shopping
              </Button>
            ) : (
              <>
                {onTryAgain ? (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={onTryAgain}
                    sx={shopPrimaryButtonSx}
                  >
                    Try checkout again
                  </Button>
                ) : null}
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onContinueShopping}
                  sx={shopSecondaryButtonSx}
                >
                  Back to product
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
