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
import type { StorefrontCopy } from "../../lib/storefrontCopy";
import { StorefrontDropinLoader } from "./StorefrontDropinLoader";
import { type StorefrontCartLine } from "./cartTypes";
import { shopGhostButtonSx } from "./storefrontButtons";
import { enterFade } from "../../lib/pageMotion";
import { SHEET_MAX_HEIGHT } from "../../lib/responsiveLayout";
import { APPLE_PHONE_PREVIEW_WIDTH } from "../../lib/appleDesign";

/** Match Builder Drop-in stage content width (Figma phone frame). */
const STOREFRONT_DROPIN_MAX_WIDTH = APPLE_PHONE_PREVIEW_WIDTH;
/** Drawer is ~phone + chrome; SDK columns layout needs ~950px and parks Pay off-screen. */
function dropinConfigForNarrowDrawer(
  config: EvonetDropinConfig
): EvonetDropinConfig {
  if (!config.uiOption?.columns && !config.Columns) {
    return config;
  }
  const { Columns: _columnsFlag, ...rest } = config;
  return {
    ...rest,
    uiOption: {
      ...config.uiOption,
      columns: false,
    },
  };
}

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
  copy: StorefrontCopy;
  /** Runtime Evonet environment from Builder (gates prod-only demo warning). */
  environment?: string;
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
  copy,
  environment,
}: StorefrontCheckoutDrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const panelBg = themeVars?.["--shop-bg"] || "#ffffff";
  const dropinPanelRef = useRef<HTMLDivElement>(null);
  const [dropinUiReady, setDropinUiReady] = useState(false);
  const [sdkConstructed, setSdkConstructed] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setDropinUiReady(false);
      setSdkConstructed(false);
      return;
    }
    setDropinUiReady(false);
    setSdkConstructed(false);
    // Keep order summary collapsed so Drop-in's pay CTA stays in the first screen.
    setSummaryOpen(false);
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
          // Phone-width Drop-in + side inset (~16–20px) + hairline border.
          width: { xs: "100%", sm: STOREFRONT_DROPIN_MAX_WIDTH + 48 },
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
          ...enterFade(40, 320),
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
              {copy.secureCheckout}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "var(--shop-muted)", display: { xs: "none", sm: "block" } }}
            >
              {copy.poweredByEvonet}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label={copy.closeCheckout} size="small">
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
              {copy.orderItems(lineCount)}
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
                          {copy.sizeLine(line.colorLabel, line.size)} ·{" "}
                          {copy.qty(line.quantity)}
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
            <DemoTransactionWarning environment={environment} />
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
            // Content-sized: growing to fill the drawer left a tall empty shell
            // with sticky Pay parked at the bottom (weird gap + shadow band).
            flex: { xs: "0 0 auto", sm: "0 1 auto" },
            minHeight: 0,
            maxHeight: { sm: "100%" },
            mx: { xs: 2, sm: "auto" },
            mb: { xs: 0.75, sm: 1 },
            width: { xs: "calc(100% - 32px)", sm: "100%" },
            maxWidth: STOREFRONT_DROPIN_MAX_WIDTH,
            border: "1px solid var(--shop-border)",
            borderRadius: "20px",
            overflow: { xs: "visible", sm: "auto" },
            WebkitOverflowScrolling: "touch",
            // Drop-in keeps merchant/default light appearance for readability.
            bgcolor: "#fff",
            overscrollBehavior: "contain",
            boxSizing: "border-box",
            boxShadow: "0 8px 28px rgba(0,0,0,0.06)",
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
                minHeight: showLoader ? 160 : undefined,
              }}
            >
              <StorefrontDropinLoader
                isCreatingSession={isCreatingSession}
                loadingLabel={copy.loadingPayment}
              />
            </Box>
          ) : null}

          {dropinConfig && sdkInitGeneration > 0 ? (
            <Box
              sx={{
                opacity: dropinUiReady ? 1 : 0,
                transition: "opacity 420ms ease",
                pointerEvents: dropinUiReady ? "auto" : "none",
                // Match Builder stage inset (Figma 20px).
                p: 2.5,
                maxWidth: "100%",
                boxSizing: "border-box",
                "& iframe": {
                  maxWidth: "100%",
                },
              }}
            >
              <EvonetDropinHost
                config={dropinConfigForNarrowDrawer(dropinConfig)}
                initGeneration={sdkInitGeneration}
                onEvent={onEvent}
                onSdkInitApplied={() => setSdkConstructed(true)}
                compact
                stickyPayButton
              />
            </Box>
          ) : !isCreatingSession && !sessionError ? (
            <Box sx={{ p: 2.5 }}>
              <Typography variant="body2" sx={{ color: "var(--shop-muted)" }}>
                  {copy.checkoutEmpty}
              </Typography>
            </Box>
          ) : null}
        </Box>

        <Box
          sx={{
            px: { xs: 2, sm: 2.5 },
            pb: { xs: "max(8px, env(safe-area-inset-bottom))", sm: 1.5 },
            pt: 0.25,
            mt: "auto",
            flexShrink: 0,
          }}
        >
          <Button fullWidth onClick={onClose} sx={shopGhostButtonSx} size="small">
            {copy.continueShopping}
          </Button>
        </Box>
      </Stack>
    </Drawer>
  );
}
