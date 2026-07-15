"use client";

import type { CSSProperties } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { EvonetDropinHost } from "../EvonetDropinHost";
import { DemoTransactionWarning } from "../DemoTransactionWarning";
import type { EvonetDropinConfig, EvonetDropinEvent } from "../../types/evonet";
import type { DemoProduct } from "./demoProduct";
import type { StorefrontCssVars } from "../../lib/storefrontSnapshot";

interface StorefrontCheckoutDrawerProps {
  open: boolean;
  onClose: () => void;
  product: DemoProduct;
  currency: string;
  quantity: number;
  size: string;
  colorLabel: string;
  total: number;
  isCreatingSession: boolean;
  sessionError: string | null;
  dropinConfig: EvonetDropinConfig | null;
  sdkInitGeneration: number;
  onEvent: (event: EvonetDropinEvent) => void;
  /** CSS vars must be set on the portal Paper — Drawer leaves the themed page tree. */
  themeVars?: StorefrontCssVars;
}

export function StorefrontCheckoutDrawer({
  open,
  onClose,
  product,
  currency,
  quantity,
  size,
  colorLabel,
  total,
  isCreatingSession,
  sessionError,
  dropinConfig,
  sdkInitGeneration,
  onEvent,
  themeVars,
}: StorefrontCheckoutDrawerProps) {
  const thumb = product.images[0];
  const panelBg = themeVars?.["--shop-bg"] || "#ffffff";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      // Above StorefrontMorphOverlay (modal + 4) so Buy now / bag checkout is visible.
      sx={{ zIndex: (theme) => theme.zIndex.modal + 10 }}
      ModalProps={{
        // Keep the shop page readable — avoid the default heavy dim overlay.
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
          width: { xs: "100%", sm: 460, md: 500 },
          color: "var(--shop-text, #1c1917)",
          boxShadow: "-12px 0 40px rgba(28, 25, 23, 0.12)",
        },
      }}
    >
      <Stack spacing={2} sx={{ p: 2.5, height: "100%", bgcolor: panelBg }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography
              sx={{
                fontFamily: "var(--shop-font-display)",
                fontWeight: 600,
                fontSize: "1.35rem",
                letterSpacing: "-0.02em",
              }}
            >
              Secure checkout
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--shop-muted)" }}>
              Powered by Evonet Drop-in
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close checkout">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "72px 1fr",
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            border: "1px solid var(--shop-border)",
            bgcolor: "var(--shop-surface)",
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: 1.5,
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
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {product.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--shop-muted)", display: "block" }}>
              {colorLabel} · Size {size} · Qty {quantity}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 650 }}>
              {currency} {total.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        <DemoTransactionWarning />

        {sessionError ? (
          <Alert severity="error" variant="outlined">
            {sessionError}
          </Alert>
        ) : null}

        {isCreatingSession ? (
          <Alert severity="info" variant="outlined">
            Preparing secure payment session…
          </Alert>
        ) : null}

        <Divider sx={{ borderColor: "var(--shop-border)" }} />

        {dropinConfig && sdkInitGeneration > 0 ? (
          <Box
            sx={{
              flex: 1,
              minHeight: 380,
              border: "1px solid var(--shop-border)",
              borderRadius: 2,
              overflow: "auto",
              bgcolor: "#fff",
            }}
          >
            <EvonetDropinHost
              config={dropinConfig}
              initGeneration={sdkInitGeneration}
              onEvent={onEvent}
            />
          </Box>
        ) : !isCreatingSession && !sessionError ? (
          <Typography variant="body2" sx={{ color: "var(--shop-muted)" }}>
            Buy now or checkout from your bag to load Drop-in here.
          </Typography>
        ) : null}

        <Button
          onClick={onClose}
          variant="text"
          sx={{ textTransform: "none", color: "var(--shop-muted)" }}
        >
          Continue shopping
        </Button>
      </Stack>
    </Drawer>
  );
}
