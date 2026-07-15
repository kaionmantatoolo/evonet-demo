"use client";

import type { CSSProperties } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { DemoProduct } from "./demoProduct";
import { productThumbForColor } from "./demoProduct";
import type { StorefrontCssVars } from "../../lib/storefrontSnapshot";
import {
  cartLineCount,
  formatCartLineLabel,
  type StorefrontCartLine,
} from "./cartTypes";

interface StorefrontBagDrawerProps {
  open: boolean;
  onClose: () => void;
  product: DemoProduct;
  lines: StorefrontCartLine[];
  currency: string;
  onIncrement: (lineId: string) => void;
  onDecrement: (lineId: string) => void;
  onCheckout: () => void;
  themeVars?: StorefrontCssVars;
}

export function StorefrontBagDrawer({
  open,
  onClose,
  product,
  lines,
  currency,
  onIncrement,
  onDecrement,
  onCheckout,
  themeVars,
}: StorefrontBagDrawerProps) {
  const quantity = cartLineCount(lines);
  const total = product.price * quantity;
  const panelBg = themeVars?.["--shop-bg"] || "#ffffff";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 10 }}
      ModalProps={{
        BackdropProps: {
          sx: {
            bgcolor: "rgba(28, 25, 23, 0.08)",
          },
        },
      }}
      PaperProps={{
        style: {
          ...(themeVars as CSSProperties | undefined),
          backgroundColor: panelBg,
          backgroundImage: "none",
        },
        sx: {
          width: { xs: "100%", sm: 400 },
          color: "var(--shop-text, #1c1917)",
          boxShadow: "-12px 0 40px rgba(28, 25, 23, 0.12)",
        },
      }}
    >
      <Stack spacing={2.5} sx={{ p: 2.5, height: "100%", bgcolor: panelBg }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            sx={{
              fontFamily: "var(--shop-font-display)",
              fontWeight: 600,
              fontSize: "1.35rem",
              letterSpacing: "-0.02em",
            }}
          >
            Your bag
          </Typography>
          <IconButton onClick={onClose} aria-label="Close bag">
            <CloseIcon />
          </IconButton>
        </Stack>

        {quantity < 1 ? (
          <Stack spacing={2} sx={{ flex: 1, justifyContent: "center", py: 6 }}>
            <Typography sx={{ color: "var(--shop-muted)" }}>
              Your bag is empty. Add the Studio Hoodie to continue.
            </Typography>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                borderColor: "var(--shop-border, #e7e5e4)",
                color: "var(--shop-text, #1c1917)",
              }}
            >
              Keep browsing
            </Button>
          </Stack>
        ) : (
          <>
            <Stack
              spacing={2}
              sx={{ flex: 1, overflowY: "auto", pr: 0.5, minHeight: 0 }}
            >
              {lines.map((line) => {
                const thumb = productThumbForColor(product, line.colorId);
                return (
                <Box
                  key={line.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "88px 1fr",
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 88,
                      height: 110,
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
                  <Stack spacing={0.75} justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {product.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--shop-muted)" }}
                      >
                        {formatCartLineLabel(line)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ mt: 0.75, fontWeight: 650 }}
                      >
                        {currency} {product.price.toFixed(2)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        size="small"
                        onClick={() => onDecrement(line.id)}
                        aria-label={`Decrease ${formatCartLineLabel(line)}`}
                        sx={{
                          minWidth: 36,
                          border: "1px solid var(--shop-border, #e7e5e4)",
                          color: "var(--shop-text, #1c1917)",
                        }}
                      >
                        −
                      </Button>
                      <Typography
                        sx={{
                          minWidth: 24,
                          textAlign: "center",
                          fontWeight: 650,
                        }}
                      >
                        {line.quantity}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => onIncrement(line.id)}
                        aria-label={`Increase ${formatCartLineLabel(line)}`}
                        sx={{
                          minWidth: 36,
                          border: "1px solid var(--shop-border, #e7e5e4)",
                          color: "var(--shop-text, #1c1917)",
                        }}
                      >
                        +
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              );
              })}
            </Stack>

            <Divider sx={{ borderColor: "var(--shop-border, #e7e5e4)" }} />

            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: "var(--shop-muted)" }}>
                  Subtotal
                </Typography>
                <Typography fontWeight={700}>
                  {currency} {total.toFixed(2)}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: "var(--shop-muted)" }}>
                Shipping calculated at checkout.
              </Typography>
              <Button
                fullWidth
                size="large"
                variant="contained"
                onClick={onCheckout}
                sx={{
                  mt: 1,
                  py: 1.4,
                  textTransform: "none",
                  fontWeight: 650,
                  borderRadius: 2,
                  bgcolor: "var(--shop-action, #1c1917)",
                  color: "var(--shop-action-text, #ffffff)",
                  "&:hover": {
                    bgcolor: "var(--shop-action, #1c1917)",
                    filter: "brightness(1.05)",
                  },
                }}
              >
                Checkout
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </Drawer>
  );
}
