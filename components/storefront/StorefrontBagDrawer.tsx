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
  useMediaQuery,
  useTheme,
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
import {
  shopPrimaryButtonSx,
  shopQtyButtonSx,
  shopSecondaryButtonSx,
} from "./storefrontButtons";
import { sheetSlide } from "../../lib/pageMotion";
import { BAG_SHEET_MAX_HEIGHT } from "../../lib/responsiveLayout";

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const quantity = cartLineCount(lines);
  const total = product.price * quantity;
  const panelBg = themeVars?.["--shop-bg"] || "#ffffff";

  return (
    <Drawer
      anchor={isMobile ? "bottom" : "right"}
      open={open}
      onClose={onClose}
      sx={{ zIndex: (t) => t.zIndex.modal + 10 }}
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
          height: { xs: "auto", sm: "100%" },
          maxHeight: { xs: BAG_SHEET_MAX_HEIGHT, sm: "100%" },
          borderTopLeftRadius: { xs: 18, sm: 0 },
          borderTopRightRadius: { xs: 18, sm: 0 },
          color: "var(--shop-text, #1c1917)",
          boxShadow: {
            xs: "0 -12px 40px rgba(28, 25, 23, 0.14)",
            sm: "-12px 0 40px rgba(28, 25, 23, 0.12)",
          },
          overflow: "hidden",
        },
      }}
    >
      <Stack
        spacing={2}
        sx={{
          p: { xs: 2, sm: 2.5 },
          pb: {
            xs: "max(16px, env(safe-area-inset-bottom))",
            sm: 2.5,
          },
          height: { sm: "100%" },
          maxHeight: { xs: BAG_SHEET_MAX_HEIGHT, sm: "100%" },
          bgcolor: panelBg,
          ...sheetSlide(),
        }}
      >
        {isMobile ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: -0.5 }}>
            <Box
              sx={{
                width: 36,
                height: 4,
                borderRadius: 999,
                bgcolor: "color-mix(in srgb, var(--shop-muted) 35%, transparent)",
              }}
            />
          </Box>
        ) : null}

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            sx={{
              fontFamily: "var(--shop-font-display)",
              fontWeight: 600,
              fontSize: { xs: "1.2rem", sm: "1.35rem" },
              letterSpacing: "-0.02em",
            }}
          >
            Your bag
          </Typography>
          <IconButton onClick={onClose} aria-label="Close bag" size="small">
            <CloseIcon />
          </IconButton>
        </Stack>

        {quantity < 1 ? (
          <Stack spacing={2} sx={{ flex: 1, justifyContent: "center", py: 4 }}>
            <Typography sx={{ color: "var(--shop-muted)" }}>
              Your bag is empty. Add the Studio Hoodie to continue.
            </Typography>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{ ...shopSecondaryButtonSx, alignSelf: "flex-start" }}
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
                      gridTemplateColumns: "72px 1fr",
                      gap: 1.35,
                    }}
                  >
                    <Box
                      sx={{
                        width: 72,
                        height: 90,
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
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
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
                          sx={{ mt: 0.5, fontWeight: 650 }}
                        >
                          {currency} {product.price.toFixed(2)}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button
                          size="small"
                          onClick={() => onDecrement(line.id)}
                          aria-label={`Decrease ${formatCartLineLabel(line)}`}
                          sx={shopQtyButtonSx}
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
                          sx={shopQtyButtonSx}
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
                sx={{ ...shopPrimaryButtonSx, mt: 0.5 }}
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
