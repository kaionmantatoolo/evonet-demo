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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { EvonetDropinHost } from "../EvonetDropinHost";
import { DemoTransactionWarning } from "../DemoTransactionWarning";
import type { EvonetDropinConfig, EvonetDropinEvent } from "../../types/evonet";
import type { DemoProduct } from "./demoProduct";
import { productThumbForColor } from "./demoProduct";
import type { StorefrontCssVars } from "../../lib/storefrontSnapshot";
import { StorefrontDropinLoader } from "./StorefrontDropinLoader";
import {
  formatCartLineLabel,
  type StorefrontCartLine,
} from "./cartTypes";
import { shopGhostButtonSx } from "./storefrontButtons";
import { sheetSlide } from "../../lib/pageMotion";
import { SHEET_MAX_HEIGHT } from "../../lib/responsiveLayout";

interface StorefrontCheckoutDrawerProps {
  open: boolean;
  onClose: () => void;
  product: DemoProduct;
  currency: string;
  lines: StorefrontCartLine[];
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
  lines,
  total,
  isCreatingSession,
  sessionError,
  dropinConfig,
  sdkInitGeneration,
  onEvent,
  themeVars,
}: StorefrontCheckoutDrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const panelBg = themeVars?.["--shop-bg"] || "#ffffff";
  const dropinPanelRef = useRef<HTMLDivElement>(null);
  const [dropinUiReady, setDropinUiReady] = useState(false);
  const [sdkConstructed, setSdkConstructed] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      setDropinUiReady(false);
      setSdkConstructed(false);
      return;
    }
    setDropinUiReady(false);
    setSdkConstructed(false);
    // On mobile, start compact so Drop-in gets vertical room immediately.
    setSummaryOpen(!isMobile);
  }, [open, sdkInitGeneration, isCreatingSession, isMobile]);

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
        window.requestAnimationFrame(() => {
          window.setTimeout(markReady, 120);
        });
      }
    });
    observer.observe(root, { childList: true, subtree: true });

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

  const lineCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <Drawer
      anchor={isMobile ? "bottom" : "right"}
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
          width: { xs: "100%", sm: 460, md: 500 },
          // iPhone: full usable height; avoid nested maxHeight that clips Drop-in.
          height: { xs: SHEET_MAX_HEIGHT, sm: "100%" },
          maxHeight: { xs: SHEET_MAX_HEIGHT, sm: "100%" },
          borderTopLeftRadius: { xs: 18, sm: 0 },
          borderTopRightRadius: { xs: 18, sm: 0 },
          color: "var(--shop-text, #1c1917)",
          boxShadow: {
            xs: "0 -12px 40px rgba(28, 25, 23, 0.14)",
            sm: "-12px 0 40px rgba(28, 25, 23, 0.12)",
          },
          // Mobile: scroll the whole sheet (iframe-friendly on iOS Safari).
          // Desktop: clip and scroll only the Drop-in pane.
          overflow: { xs: "auto", sm: "hidden" },
          WebkitOverflowScrolling: "touch",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Stack
        spacing={0}
        sx={{
          height: { xs: "auto", sm: "100%" },
          minHeight: { xs: "100%", sm: 0 },
          maxHeight: { sm: "100%" },
          bgcolor: panelBg,
          overflow: { xs: "visible", sm: "hidden" },
          ...sheetSlide(),
        }}
      >
        {isMobile ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              pt: 1,
              pb: 0.5,
              flexShrink: 0,
            }}
          >
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

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: { xs: 2, sm: 2.5 }, pt: { xs: 0.5, sm: 2.5 }, pb: 1.25, flexShrink: 0 }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: "var(--shop-font-display)",
                fontWeight: 600,
                fontSize: { xs: "1.2rem", sm: "1.35rem" },
                letterSpacing: "-0.02em",
              }}
            >
              Secure checkout
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "var(--shop-muted)", display: { xs: "none", sm: "block" } }}
            >
              Powered by Evonet Drop-in
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close checkout" size="small">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Box
          sx={{
            mx: { xs: 2, sm: 2.5 },
            mb: 1.25,
            borderRadius: 2,
            border: "1px solid var(--shop-border)",
            bgcolor: "var(--shop-surface)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={() => setSummaryOpen((v) => !v)}
            aria-expanded={summaryOpen}
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              px: 1.5,
              py: 1.15,
              border: 0,
              bgcolor: "transparent",
              cursor: "pointer",
              color: "inherit",
              textAlign: "left",
              font: "inherit",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 650 }}>
              Order · {lineCount} item{lineCount === 1 ? "" : "s"}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {currency} {total.toFixed(2)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "var(--shop-muted)", minWidth: 14 }}
              >
                {summaryOpen ? "−" : "+"}
              </Typography>
            </Stack>
          </Box>

          {summaryOpen ? (
            <Box sx={{ px: 1.5, pb: 1.35 }}>
              <Divider sx={{ borderColor: "var(--shop-border)", mb: 1.25 }} />
              <Stack spacing={1.1}>
                {lines.map((line) => {
                  const thumb = productThumbForColor(product, line.colorId);
                  return (
                    <Box
                      key={line.id}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "48px 1fr auto",
                        gap: 1.1,
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1.25,
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
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            lineHeight: 1.25,
                          }}
                        >
                          {product.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "var(--shop-muted)", display: "block" }}
                        >
                          {formatCartLineLabel(line)} · Qty {line.quantity}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 650, fontSize: "0.85rem" }}
                      >
                        {currency} {(product.price * line.quantity).toFixed(2)}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          ) : null}
        </Box>

        {!isMobile ? (
          <Box sx={{ px: { sm: 2.5 }, mb: 1.25, flexShrink: 0 }}>
            <DemoTransactionWarning />
          </Box>
        ) : null}

        {sessionError ? (
          <Box sx={{ px: { xs: 2, sm: 2.5 }, mb: 1, flexShrink: 0 }}>
            <Alert severity="error" variant="outlined">
              {sessionError}
            </Alert>
          </Box>
        ) : null}

        <Box
          ref={dropinPanelRef}
          sx={{
            position: "relative",
            // Mobile: grow with Drop-in content (parent sheet scrolls).
            // Desktop: fill remaining drawer height and scroll inside.
            flex: { xs: "0 0 auto", sm: "1 1 auto" },
            minHeight: { xs: 280, sm: 0 },
            mx: { xs: 2, sm: 2.5 },
            mb: { xs: 1, sm: 1.5 },
            border: "1px solid var(--shop-border)",
            borderRadius: 2,
            overflow: { xs: "visible", sm: "auto" },
            WebkitOverflowScrolling: "touch",
            bgcolor: "#fff",
            overscrollBehavior: "contain",
          }}
        >
          {(isCreatingSession ||
            (dropinConfig && sdkInitGeneration > 0) ||
            showLoader) &&
          !sessionError ? (
            <Box
              sx={{
                position: showLoader ? "relative" : "absolute",
                inset: showLoader ? undefined : 0,
                zIndex: 2,
                opacity: showLoader ? 1 : 0,
                transition: "opacity 360ms ease",
                pointerEvents: showLoader ? "auto" : "none",
                minHeight: showLoader ? 200 : undefined,
              }}
            >
              <StorefrontDropinLoader isCreatingSession={isCreatingSession} />
            </Box>
          ) : null}

          {dropinConfig && sdkInitGeneration > 0 ? (
            <Box
              sx={{
                opacity: dropinUiReady ? 1 : 0,
                transition: "opacity 420ms ease",
                pointerEvents: dropinUiReady ? "auto" : "none",
                // Content-sized frame — avoid a tall empty Drop-in shell.
                "& iframe": {
                  maxWidth: "100%",
                },
              }}
            >
              <EvonetDropinHost
                config={dropinConfig}
                initGeneration={sdkInitGeneration}
                onEvent={onEvent}
                onSdkInitApplied={() => setSdkConstructed(true)}
                compact
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

        <Box
          sx={{
            px: { xs: 2, sm: 2.5 },
            pb: { xs: "max(12px, env(safe-area-inset-bottom))", sm: 2.5 },
            pt: 0.5,
            flexShrink: 0,
          }}
        >
          <Button fullWidth onClick={onClose} sx={shopGhostButtonSx}>
            Continue shopping
          </Button>
        </Box>
      </Stack>
    </Drawer>
  );
}
