"use client";

import Image from "next/image";
import Link from "next/link";
import { Box, Button, Container, Stack, Typography, type SxProps, type Theme } from "@mui/material";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { ThemeToggle } from "../components/ThemeToggle";
import { LandingAtmosphere } from "../components/LandingAtmosphere";
import { useSiteLocale } from "../components/SiteLocaleProvider";
import { isEvonetProductionEnvironment } from "../lib/evonetEnvironment";
import { pageEnter, sectionEnter } from "../lib/pageMotion";
import {
  apple,
  appleBodySecondarySx,
  appleCapsuleButtonSx,
  appleCapsuleOutlineSx,
  appleCaptionSx,
  appleDisplayTitleSx,
  appleGlassPanelSx,
  appleGroupedSectionSx,
  appleHairline,
  applePageShellSx,
  appleSectionHeaderSx,
} from "../lib/appleDesign";

export default function HomePage() {
  const isProd = isEvonetProductionEnvironment();
  const { messages } = useSiteLocale();
  const t = messages.home;

  return (
    <Box
      component="main"
      sx={
        [
          applePageShellSx,
          pageEnter(),
          (theme: Theme) =>
            theme.palette.mode === "dark"
              ? {
                  bgcolor: "#07111F",
                  color: "#E8EEF8",
                  backgroundImage: `
                  linear-gradient(180deg, #0A1628 0%, #07111F 42%, #050D18 100%)
                `,
                  backgroundAttachment: "fixed",
                }
              : {},
        ] as SxProps<Theme>
      }
    >
      <Box
        sx={(theme) => ({
          position: "fixed",
          top: {
            xs: "max(10px, env(safe-area-inset-top, 0px))",
            sm: 16,
          },
          right: { xs: 12, sm: 20 },
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          p: 0.45,
          borderRadius: "999px",
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(14, 36, 72, 0.82)"
              : "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(22px) saturate(1.45)",
          WebkitBackdropFilter: "blur(22px) saturate(1.45)",
          border:
            theme.palette.mode === "dark"
              ? "1px solid rgba(96, 165, 250, 0.35)"
              : appleHairline,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 10px 30px rgba(2, 12, 32, 0.45), inset 0 1px 0 rgba(147, 197, 253, 0.16)"
              : "0 6px 20px rgba(15, 23, 42, 0.08)",
          color:
            theme.palette.mode === "dark" ? "#E8EEF8" : apple.label,
        })}
      >
        <LocaleSwitcher compact />
        <Box
          aria-hidden
          sx={(theme) => ({
            width: "1px",
            height: 16,
            flexShrink: 0,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(147, 197, 253, 0.28)"
                : apple.separator,
          })}
        />
        <ThemeToggle
          variant="ghost"
          className="size-8 rounded-full bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent dark:hover:bg-white/[0.12] hover:bg-black/[0.06]"
        />
      </Box>
      <LandingAtmosphere />

      <Container
        maxWidth="md"
        sx={{
          position: "relative",
          zIndex: 1,
          pt: { xs: 7.5, sm: 8, md: 12 },
          pb: { xs: 5, sm: 8, md: 12 },
        }}
      >
        <Stack spacing={{ xs: 4, md: 5 }} alignItems="center" textAlign="center">
          <Stack spacing={1.5} alignItems="center" sx={{ ...sectionEnter(40), maxWidth: 640 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: { xs: 0.5, sm: 1 },
                width: { xs: 168, sm: 220 },
                height: { xs: 42, sm: 54 },
                position: "relative",
              }}
            >
              <Image
                src="/evonet-logo.png"
                alt="Evonet"
                fill
                priority
                sizes="220px"
                style={{ objectFit: "contain" }}
              />
            </Box>
            <Typography
              component="h1"
              sx={{
                ...appleDisplayTitleSx,
                fontSize: { xs: "2rem", sm: "3.25rem", md: "3.75rem" },
                px: { xs: 0.5, sm: 0 },
                maxWidth: "100%",
                overflowWrap: "anywhere",
                wordBreak: "keep-all",
              }}
            >
              {t.titleLine1}
              <Box component="br" sx={{ display: { xs: "none", sm: "block" } }} />
              {t.titleLine2}
            </Typography>
            <Typography
              sx={{
                ...appleBodySecondarySx,
                maxWidth: 520,
                px: { xs: 0.5, sm: 0 },
                overflowWrap: "anywhere",
              }}
            >
              {t.subtitle}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            sx={{ ...sectionEnter(100), width: "100%", maxWidth: 420 }}
            justifyContent="center"
          >
            <Button
              component={Link}
              href="/evonet/dropin-builder"
              size="large"
              variant="contained"
              fullWidth
              className="storefront-cta"
              sx={{
                ...appleCapsuleButtonSx,
                borderRadius: 0,
                whiteSpace: "normal",
                lineHeight: 1.25,
                py: 1.15,
              }}
            >
              {t.startDemo}
            </Button>
            <Button
              component={Link}
              href="/evonet/dropin-test"
              size="large"
              variant="outlined"
              fullWidth
              sx={{
                ...appleCapsuleOutlineSx,
                whiteSpace: "normal",
                lineHeight: 1.25,
                py: 1.1,
              }}
            >
              {t.validationWorkspace}
            </Button>
          </Stack>

          <Box
            sx={{
              ...appleGlassPanelSx,
              ...sectionEnter(160),
              width: "100%",
              p: { xs: 2, sm: 2.5 },
              textAlign: "left",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 2.5, sm: 0 }}
              divider={
                <Box
                  sx={(theme) => ({
                    display: { xs: "none", sm: "block" },
                    width: "1px",
                    alignSelf: "stretch",
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(147, 197, 253, 0.2)"
                        : apple.separator,
                    mx: 2,
                  })}
                />
              }
            >
              {[
                { step: "01", title: t.step1Title, body: t.step1Body },
                { step: "02", title: t.step2Title, body: t.step2Body },
                { step: "03", title: t.step3Title, body: t.step3Body },
              ].map((item) => (
                <Box key={item.step} sx={{ flex: 1, px: { sm: 0.5 } }}>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 650,
                      color: apple.systemBlue,
                      mb: 0.5,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {item.step}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 650,
                      mb: 0.5,
                      letterSpacing: "-0.02em",
                      color: "inherit",
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      ...appleBodySecondarySx,
                      fontSize: "0.875rem",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {item.body}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box sx={{ width: "100%", ...sectionEnter(220) }}>
            <Typography sx={{ ...appleSectionHeaderSx, textAlign: "left", px: 0.5 }}>
              {t.choosePath}
            </Typography>
            <Stack spacing={1.25}>
              <Box sx={{ ...appleGroupedSectionSx, p: { xs: 2, sm: 2.5 }, textAlign: "left" }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ sm: "center" }}
                  justifyContent="space-between"
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 650,
                        letterSpacing: "-0.02em",
                        mb: 0.5,
                        color: "inherit",
                      }}
                    >
                      {t.guidedTitle}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        ...appleBodySecondarySx,
                        fontSize: "0.875rem",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {t.guidedBody}
                    </Typography>
                  </Box>
                  <Button
                    component={Link}
                    href="/evonet/dropin-builder"
                    variant="contained"
                    className="storefront-cta"
                    sx={{
                      ...appleCapsuleButtonSx,
                      flexShrink: 0,
                      borderRadius: 0,
                      width: { xs: "100%", sm: 176 },
                      minWidth: { xs: 0, sm: 176 },
                      px: 2.25,
                      py: 1,
                      whiteSpace: "normal",
                      lineHeight: 1.25,
                    }}
                  >
                    {t.openBuilder}
                  </Button>
                </Stack>
              </Box>

              <Box sx={{ ...appleGroupedSectionSx, p: { xs: 2, sm: 2.5 }, textAlign: "left" }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ sm: "center" }}
                  justifyContent="space-between"
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 650,
                        letterSpacing: "-0.02em",
                        mb: 0.5,
                        color: "inherit",
                      }}
                    >
                      {isProd ? t.validationTitleProd : t.validationTitle}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        ...appleBodySecondarySx,
                        fontSize: "0.875rem",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {isProd ? t.validationBodyProd : t.validationBody}
                    </Typography>
                  </Box>
                  <Button
                    component={Link}
                    href="/evonet/dropin-test"
                    variant="outlined"
                    sx={{
                      ...appleCapsuleOutlineSx,
                      flexShrink: 0,
                      borderRadius: 0,
                      width: { xs: "100%", sm: 176 },
                      minWidth: { xs: 0, sm: 176 },
                      px: 2.25,
                      py: 0.95,
                      whiteSpace: "normal",
                      lineHeight: 1.25,
                    }}
                  >
                    {t.openWorkspace}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Box>

          <Typography
            variant="caption"
            sx={{ ...appleCaptionSx, ...sectionEnter(280) }}
          >
            {t.footer}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
