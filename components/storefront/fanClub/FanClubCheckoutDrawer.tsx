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
import { EvonetDropinHost } from "../../EvonetDropinHost";
import { DemoTransactionWarning } from "../../DemoTransactionWarning";
import type { EvonetDropinConfig, EvonetDropinEvent } from "../../../types/evonet";
import type { StorefrontCssVars } from "../../../lib/storefrontSnapshot";
import type { FanClubCopy, FanClubPlan } from "../../../lib/fanClubCopy";
import { StorefrontDropinLoader } from "../StorefrontDropinLoader";
import { shopGhostButtonSx } from "../storefrontButtons";
import { enterFade } from "../../../lib/pageMotion";
import { SHEET_MAX_HEIGHT } from "../../../lib/responsiveLayout";
import { APPLE_PHONE_PREVIEW_WIDTH } from "../../../lib/appleDesign";

/** Match apparel storefront Drop-in drawer content width. */
const STOREFRONT_DROPIN_MAX_WIDTH = APPLE_PHONE_PREVIEW_WIDTH;

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

interface FanClubCheckoutDrawerProps {
  open: boolean;
  onClose: () => void;
  plan: FanClubPlan;
  currency: string;
  total: number;
  isCreatingSession: boolean;
  sessionError: string | null;
  dropinConfig: EvonetDropinConfig | null;
  sdkInitGeneration: number;
  onEvent: (event: EvonetDropinEvent) => void;
  themeVars?: StorefrontCssVars;
  copy: FanClubCopy;
  environment?: string;
}

function panelHasDropinUi(root: HTMLElement): boolean {
  const mount = root.querySelector<HTMLElement>('[id^="evonet-dropin"]');
  if (mount && mount.childElementCount > 0) return true;
  if (root.querySelector("iframe")) return true;
  if (root.querySelector("cil-dropin-components, [class*='dropin']")) return true;
  return false;
}

export function FanClubCheckoutDrawer({
  open,
  onClose,
  plan,
  currency,
  total,
  isCreatingSession,
  sessionError,
  dropinConfig,
  sdkInitGeneration,
  onEvent,
  themeVars,
  copy,
  environment,
}: FanClubCheckoutDrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const dropinPanelRef = useRef<HTMLDivElement | null>(null);
  const [dropinUiReady, setDropinUiReady] = useState(false);
  const [sdkConstructed, setSdkConstructed] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const drawerConfig = dropinConfig
    ? dropinConfigForNarrowDrawer(dropinConfig)
    : null;
  const panelBg = themeVars?.["--shop-bg"] || "#ffffff";

  useEffect(() => {
    if (!open) {
      setDropinUiReady(false);
      setSdkConstructed(false);
      return;
    }
    setDropinUiReady(false);
    setSdkConstructed(false);
    setSummaryOpen(false);
  }, [open, sdkInitGeneration, isCreatingSession]);

  useEffect(() => {
    if (!open || isCreatingSession || !drawerConfig || dropinUiReady) {
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
    drawerConfig,
    sdkInitGeneration,
    sdkConstructed,
    dropinUiReady,
  ]);

  const showLoader =
    !sessionError &&
    (isCreatingSession ||
      Boolean(drawerConfig && sdkInitGeneration > 0 && !dropinUiReady));

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
          width: { xs: "100%", sm: STOREFRONT_DROPIN_MAX_WIDTH + 48 },
          height: { xs: SHEET_MAX_HEIGHT, sm: "100%" },
          maxHeight: { xs: SHEET_MAX_HEIGHT, sm: "100%" },
          borderTopLeftRadius: { xs: 18, sm: 0 },
          borderTopRightRadius: { xs: 18, sm: 0 },
          color: "var(--shop-text, #1c1917)",
          boxShadow: {
            xs: "0 -12px 40px rgba(28, 25, 23, 0.14)",
            sm: "-12px 0 40px rgba(28, 25, 23, 0.12)",
          },
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
          sx={{
            px: { xs: 2, sm: 2.5 },
            pt: { xs: 0.5, sm: 2.5 },
            pb: 1.25,
            flexShrink: 0,
          }}
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
              sx={{
                color: "var(--shop-muted)",
                display: { xs: "none", sm: "block" },
              }}
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
              {copy.checkoutTitle}
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
              <Box
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
                    bgcolor: "#0c0a09",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <Box
                    component="img"
                    src="/storefront/fan-club-hero-concert-card.png?v=2"
                    alt={plan.name}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "50% 55%",
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
                    {plan.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--shop-muted)", display: "block" }}
                  >
                    {plan.billingNote}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 650, fontSize: "0.85rem" }}
                >
                  {currency} {total.toFixed(2)}
                </Typography>
              </Box>
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
            bgcolor: "#fff",
            overscrollBehavior: "contain",
            boxSizing: "border-box",
            boxShadow: "0 8px 28px rgba(0,0,0,0.06)",
          }}
        >
          {(isCreatingSession ||
            (drawerConfig && sdkInitGeneration > 0) ||
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

          {drawerConfig && sdkInitGeneration > 0 ? (
            <Box
              sx={{
                opacity: dropinUiReady ? 1 : 0,
                transition: "opacity 420ms ease",
                pointerEvents: dropinUiReady ? "auto" : "none",
                p: 2.5,
                maxWidth: "100%",
                boxSizing: "border-box",
                "& iframe": { maxWidth: "100%" },
              }}
            >
              <EvonetDropinHost
                key={`fan-club-drawer-${sdkInitGeneration}`}
                config={drawerConfig}
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
            {copy.continueBrowsing}
          </Button>
        </Box>
      </Stack>
    </Drawer>
  );
}
