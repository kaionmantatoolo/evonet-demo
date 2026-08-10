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
import type { StorefrontCopy } from "../../lib/storefrontCopy";
import type { DemoProduct } from "./demoProduct";
import { productThumbForColor } from "./demoProduct";
import {
  cartLineCount,
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
import { detailDlGridSx } from "../../lib/responsiveLayout";

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
  copy: StorefrontCopy;
}

function statusChrome(
  status: EvonetReturnParams["status"],
  copy: StorefrontCopy
) {
  const s = copy.status;
  switch (status) {
    case "success":
      return {
        Icon: CheckCircleOutlineIcon,
        tone: "var(--shop-action, #1c1917)",
        ...s.success,
      };
    case "failed":
      return {
        Icon: ErrorOutlineIcon,
        tone: "#b91c1c",
        ...s.failed,
      };
    case "cancelled":
      return {
        Icon: WarningAmberOutlinedIcon,
        tone: "#b45309",
        ...s.cancelled,
      };
    default:
      return {
        Icon: InfoOutlinedIcon,
        tone: "#0369a1",
        ...s.pending,
      };
  }
}

export function StorefrontOrderResult({
  product,
  summary,
  result,
  onContinueShopping,
  onTryAgain,
  copy,
}: StorefrontOrderResultProps) {
  const chrome = statusChrome(result.status, copy);
  const Icon = chrome.Icon;
  const isSuccess = result.status === "success";
  const isNegative =
    result.status === "failed" || result.status === "cancelled";

  const detailRows: { label: string; value: string }[] = [
    { label: copy.orderNumber, value: summary.orderId },
  ];
  const paymentRef =
    result.merchantTransID || result.merchantOrderID || null;
  if (paymentRef) {
    detailRows.push({ label: copy.paymentReference, value: paymentRef });
  }
  if (result.message && !isSuccess) {
    detailRows.push({ label: copy.note, value: result.message });
  }

  const itemCount = cartLineCount(summary.lines);

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
          bgcolor: "color-mix(in srgb, var(--shop-bg) 92%, var(--shop-surface))",
          ...enterUp(40, 500),
        }}
      >
        <Container maxWidth="sm" sx={{ py: 1.6 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography
              sx={{
                fontFamily: "var(--shop-font-display)",
                fontWeight: 400,
                fontSize: "1.35rem",
                letterSpacing: "0.04em",
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
              {copy.orderStatus}
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
                      bgcolor: "var(--shop-muted-surface, #f3f4f6)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <Box
                      component="img"
                      src={thumb?.src}
                      alt={thumb?.alt ?? product.name}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: thumb?.objectPosition ?? "50% 12%",
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.35 }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "var(--shop-muted)" }}>
                      {copy.sizeLine(line.colorLabel, line.size)} ·{" "}
                      {copy.qty(line.quantity)}
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
                  {copy.itemsCount(itemCount)}
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
                {copy.estimatedDelivery}
              </Typography>
              <Typography variant="body2" sx={{ color: "var(--shop-muted)" }}>
                {copy.deliveryNote}
              </Typography>
            </Box>
          ) : null}

          <Box sx={enterUp(isSuccess ? 340 : 260)}>
            <Typography
              variant="overline"
              sx={{ color: "var(--shop-muted)", letterSpacing: 1.2 }}
            >
              {copy.orderDetails}
            </Typography>
            <Divider sx={{ my: 1.25, borderColor: "var(--shop-border)" }} />
            <Box
              component="dl"
              sx={detailDlGridSx}
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
                {copy.continueShopping}
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
                    {copy.tryCheckoutAgain}
                  </Button>
                ) : null}
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onContinueShopping}
                  sx={shopSecondaryButtonSx}
                >
                  {copy.backToProduct}
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
