"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
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
import { StorefrontDropinLoader } from "./StorefrontDropinLoader";

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

function panelHasDropinUi(root: HTMLElement): boolean {
  const mount = root.querySelector<HTMLElement>('[id^="evonet-dropin"]');
  if (mount && mount.childElementCount > 0) return true;
  if (root.querySelector("iframe")) return true;
  if (root.querySelector("cil-dropin-components, [class*='dropin']")) return true;
  return false;
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
  const dropinPanelRef = useRef<HTMLDivElement>(null);
  const [dropinUiReady, setDropinUiReady] = useState(false);
  const [sdkConstructed, setSdkConstructed] = useState(false);

  useEffect(() => {
    if (!open) {
      setDropinUiReady(false);
      setSdkConstructed(false);
      return;
    }
    setDropinUiReady(false);
    setSdkConstructed(false);
  }, [open, sdkInitGeneration, isCreatingSession]);

  useEffect(() => {
    if (!open || isCreatingSession || !dropinConfig || dropinUiReady) {
      return;
    }

    const root = dropinPanelRef.current;
    if (!root) return;

    const markReady = () => setDropinUiReady(true);

    if (panelHasDropinUi(root)) {
      markReady();
      return;
    }

    const observer = new MutationObserver(() => {
      if (panelHasDropinUi(root)) {
        observer.disconnect();
        // Let paint settle so the loader doesn't vanish on an empty frame.
        window.requestAnimationFrame(() => {
          window.setTimeout(markReady, 120);
        });
      }
    });
    observer.observe(root, { childList: true, subtree: true });

    // After SDK construct, give UI a beat even if the observer misses custom elements.
    let constructFallback: number | undefined;
    if (sdkConstructed) {
      constructFallback = window.setTimeout(markReady, 1800);
    }

    const hardFallback = window.setTimeout(markReady, 8000);

    return () => {
      observer.disconnect();
      if (constructFallback) window.clearTimeout(constructFallback);
      window.clearTimeout(hardFallback);
    };
  }, [
    open,
    isCreatingSession,
    dropinConfig,
    sdkInitGeneration,
    sdkConstructed,
    dropinUiReady,
  ]);

  const showLoader =
    !sessionError &&
    (isCreatingSession ||
      Boolean(dropinConfig && sdkInitGeneration > 0 && !dropinUiReady));

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      // Above storefront fade overlay (modal + 4) so Buy now / bag checkout is visible.
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

        <Divider sx={{ borderColor: "var(--shop-border)" }} />

        <Box
          ref={dropinPanelRef}
          sx={{
            position: "relative",
            flex: 1,
            minHeight: 380,
            border: "1px solid var(--shop-border)",
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
          {showLoader ? (
            <StorefrontDropinLoader isCreatingSession={isCreatingSession} />
          ) : null}

          {dropinConfig && sdkInitGeneration > 0 ? (
            <Box
              sx={{
                opacity: dropinUiReady ? 1 : 0,
                transition: "opacity 280ms ease",
                minHeight: 380,
                pointerEvents: dropinUiReady ? "auto" : "none",
              }}
            >
              <EvonetDropinHost
                config={dropinConfig}
                initGeneration={sdkInitGeneration}
                onEvent={onEvent}
                onSdkInitApplied={() => setSdkConstructed(true)}
              />
            </Box>
          ) : !isCreatingSession && !sessionError ? (
            <Box sx={{ p: 2.5 }}>
              <Typography variant="body2" sx={{ color: "var(--shop-muted)" }}>
                Buy now or checkout from your bag to load Drop-in here.
              </Typography>
            </Box>
          ) : null}
        </Box>

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
