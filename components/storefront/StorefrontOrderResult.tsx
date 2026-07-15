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

export interface StorefrontCheckoutSummary {
  orderId: string;
  quantity: number;
  size: string;
  colorLabel: string;
  total: number;
  currency: string;
}

interface StorefrontOrderResultProps {
  product: DemoProduct;
  summary: StorefrontCheckoutSummary;
  result: EvonetReturnParams;
  onContinueShopping: () => void;
  onTryAgain?: () => void;
  onBackToBuilder?: () => void;
}

function statusChrome(status: EvonetReturnParams["status"]) {
  switch (status) {
    case "success":
      return {
        Icon: CheckCircleOutlineIcon,
        tone: "var(--shop-action, #1c1917)",
        eyebrow: "Order confirmed",
        title: "Thank you — your order is placed",
        body: "We’ve emailed a receipt and started packing. You can keep exploring the demo or jump back to Drop-in Builder.",
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
        body: "This can take a moment for some wallets. Refresh status from the return details below if needed.",
      };
  }
}

export function StorefrontOrderResult({
  product,
  summary,
  result,
  onContinueShopping,
  onTryAgain,
  onBackToBuilder,
}: StorefrontOrderResultProps) {
  const chrome = statusChrome(result.status);
  const Icon = chrome.Icon;
  const thumb = product.images[0];
  const isSuccess = result.status === "success";

  const detailRows: { label: string; value: string }[] = [
    { label: "Order", value: summary.orderId },
  ];
  if (result.merchantOrderID) {
    detailRows.push({ label: "Merchant order", value: result.merchantOrderID });
  }
  if (result.merchantTransID) {
    detailRows.push({ label: "Transaction", value: result.merchantTransID });
  }
  if (result.sessionID) {
    detailRows.push({ label: "Session", value: result.sessionID });
  }
  if (result.result) {
    detailRows.push({ label: "Result", value: result.result });
  }
  if (result.code) {
    detailRows.push({ label: "Code", value: result.code });
  }
  if (result.message) {
    detailRows.push({ label: "Message", value: result.message });
  }

  return (
    <Box
      sx={{
        minHeight: "100%",
        bgcolor: "var(--shop-bg, #faf8f5)",
        color: "var(--shop-text, #1c1917)",
        pb: 8,
      }}
    >
      <Box
        sx={{
          borderBottom: "1px solid var(--shop-border, #e7e2d9)",
          bgcolor: "color-mix(in srgb, var(--shop-bg) 92%, #ffffff)",
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
              sx={{ color: "var(--shop-muted)", letterSpacing: 1.2, textTransform: "uppercase" }}
            >
              Checkout
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ pt: { xs: 4, md: 6 } }}>
        <Stack spacing={3.5}>
          <Box>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
              <Icon sx={{ fontSize: 28, color: chrome.tone }} />
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
              display: "grid",
              gridTemplateColumns: "88px 1fr",
              gap: 2,
              p: 2,
              borderRadius: 2.5,
              border: "1px solid var(--shop-border)",
              bgcolor: "var(--shop-surface, #fff)",
            }}
          >
            <Box
              sx={{
                width: 88,
                height: 88,
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
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                {product.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "var(--shop-muted)" }}>
                {summary.colorLabel} · Size {summary.size} · Qty {summary.quantity}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1.25, fontWeight: 650 }}>
                {summary.currency} {summary.total.toFixed(2)}
              </Typography>
            </Box>
          </Box>

          {isSuccess ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: "color-mix(in srgb, var(--shop-action) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--shop-action) 22%, transparent)",
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

          <Box>
            <Typography
              variant="overline"
              sx={{ color: "var(--shop-muted)", letterSpacing: 1.2 }}
            >
              Payment details
            </Typography>
            <Divider sx={{ my: 1.25, borderColor: "var(--shop-border)" }} />
            <Box
              component="dl"
              sx={{
                m: 0,
                display: "grid",
                gridTemplateColumns: "120px 1fr",
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
                    sx={{ m: 0, fontFamily: "ui-monospace, monospace", wordBreak: "break-all" }}
                  >
                    {row.value}
                  </Typography>
                </Box>
              ))}
              <Box sx={{ display: "contents" }}>
                <Typography
                  component="dt"
                  variant="caption"
                  sx={{ color: "var(--shop-muted)" }}
                >
                  Source
                </Typography>
                <Typography component="dd" variant="caption" sx={{ m: 0 }}>
                  {result.source === "sdk_event"
                    ? "Drop-in SDK callback"
                    : "Evonet returnURL"}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            {isSuccess ? (
              <Button
                fullWidth
                variant="contained"
                onClick={onContinueShopping}
                sx={{
                  textTransform: "none",
                  fontWeight: 650,
                  py: 1.35,
                  borderRadius: 2,
                  bgcolor: "var(--shop-action)",
                  color: "var(--shop-action-text)",
                  "&:hover": {
                    bgcolor: "color-mix(in srgb, var(--shop-action) 88%, #000)",
                  },
                }}
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
                    sx={{
                      textTransform: "none",
                      fontWeight: 650,
                      py: 1.35,
                      borderRadius: 2,
                      bgcolor: "var(--shop-action)",
                      color: "var(--shop-action-text)",
                      "&:hover": {
                        bgcolor: "color-mix(in srgb, var(--shop-action) 88%, #000)",
                      },
                    }}
                  >
                    Try checkout again
                  </Button>
                ) : null}
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onContinueShopping}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    py: 1.35,
                    borderRadius: 2,
                    borderColor: "var(--shop-border)",
                    color: "var(--shop-text)",
                  }}
                >
                  Back to product
                </Button>
              </>
            )}
            {onBackToBuilder ? (
              <Button
                fullWidth
                variant="text"
                onClick={onBackToBuilder}
                sx={{
                  textTransform: "none",
                  color: "var(--shop-muted)",
                  fontWeight: 500,
                }}
              >
                Back to Builder
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
