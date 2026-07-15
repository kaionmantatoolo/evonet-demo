"use client";

import {
  Alert,
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { EvonetDropinHost } from "../EvonetDropinHost";
import { DemoTransactionWarning } from "../DemoTransactionWarning";
import type { EvonetDropinConfig, EvonetDropinEvent } from "../../types/evonet";

interface StorefrontCheckoutDrawerProps {
  open: boolean;
  onClose: () => void;
  currency: string;
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
  currency,
  total,
  isCreatingSession,
  sessionError,
  dropinConfig,
  sdkInitGeneration,
  onEvent,
}: StorefrontCheckoutDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 440, md: 480 },
          bgcolor: "var(--shop-bg)",
          color: "var(--shop-text)",
        },
      }}
    >
      <Stack spacing={2} sx={{ p: 2.5, height: "100%" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Checkout
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--shop-muted)" }}>
              {currency} {total.toFixed(2)}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close checkout">
            <CloseIcon />
          </IconButton>
        </Stack>

        <DemoTransactionWarning />

        {sessionError ? (
          <Alert severity="error" variant="outlined">
            {sessionError}
          </Alert>
        ) : null}

        {isCreatingSession ? (
          <Alert severity="info" variant="outlined">
            Creating payment session…
          </Alert>
        ) : null}

        {dropinConfig && sdkInitGeneration > 0 ? (
          <Box
            sx={{
              flex: 1,
              minHeight: 360,
              border: "1px solid var(--shop-border)",
              borderRadius: "var(--shop-radius)",
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
            Start checkout from Buy now or Pay in cart to load Drop-in.
          </Typography>
        ) : null}

        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: "none",
            borderColor: "var(--shop-border)",
            color: "var(--shop-text)",
          }}
        >
          Continue shopping
        </Button>
      </Stack>
    </Drawer>
  );
}
