"use client";

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
}: StorefrontCheckoutDrawerProps) {
  const thumb = product.images[0];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 460, md: 500 },
          bgcolor: "var(--shop-bg)",
          color: "var(--shop-text)",
          backgroundImage:
            "linear-gradient(180deg, color-mix(in srgb, var(--shop-primary) 4%, var(--shop-bg)), var(--shop-bg) 28%)",
        },
      }}
    >
      <Stack spacing={2} sx={{ p: 2.5, height: "100%" }}>
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
