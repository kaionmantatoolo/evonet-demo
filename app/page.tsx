"use client";

import Image from "next/image";
import Link from "next/link";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { isEvonetProductionEnvironment } from "../lib/evonetEnvironment";
import { pageEnter, sectionEnter } from "../lib/pageMotion";
import {
  apple,
  appleBodySecondarySx,
  appleCapsuleButtonSx,
  appleCapsuleOutlineSx,
  appleDisplayTitleSx,
  appleGlassPanelSx,
  appleGroupedSectionSx,
  applePageShellSx,
  appleSectionHeaderSx,
} from "../lib/appleDesign";

export default function HomePage() {
  const isProd = isEvonetProductionEnvironment();

  return (
    <Box component="main" sx={{ ...applePageShellSx, ...pageEnter() }}>
      {/* Soft atmosphere — not a purple gradient */}
      <Box
        aria-hidden
        sx={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 90% 55% at 50% -15%, rgba(0, 122, 255, 0.14), transparent 58%),
            radial-gradient(ellipse 50% 40% at 100% 20%, rgba(52, 199, 89, 0.06), transparent 50%)
          `,
        }}
      />

      <Container maxWidth="md" sx={{ position: "relative", py: { xs: 5, sm: 8, md: 12 } }}>
        <Stack spacing={{ xs: 4, md: 5 }} alignItems="center" textAlign="center">
          <Stack spacing={1.5} alignItems="center" sx={{ ...sectionEnter(40), maxWidth: 640 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                mb: { xs: 0.5, sm: 1 },
              }}
            >
              <Box
                sx={{
                  width: { xs: 64, sm: 80 },
                  height: { xs: 64, sm: 80 },
                  position: "relative",
                }}
              >
                <Image
                  src="/evonet-logo.png"
                  alt="Evonet"
                  fill
                  priority
                  sizes="80px"
                  style={{ objectFit: "contain" }}
                />
              </Box>
              <Typography
                component="p"
                sx={{
                  fontSize: { xs: "1.35rem", sm: "1.5rem" },
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: apple.label,
                  lineHeight: 1.1,
                }}
              >
                Evonet
              </Typography>
            </Box>
            <Typography
              component="h1"
              sx={{
                ...appleDisplayTitleSx,
                fontSize: { xs: "2.35rem", sm: "3.25rem", md: "3.75rem" },
              }}
            >
              Checkout,
              <Box component="br" sx={{ display: { xs: "none", sm: "block" } }} />
              designed to feel effortless.
            </Typography>
            <Typography sx={{ ...appleBodySecondarySx, maxWidth: 520 }}>
              A client showcase for Drop-in. Shape the look, preview the journey, and
              share a clear checkout experience before go-live.
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
              sx={{ ...appleCapsuleButtonSx, borderRadius: 0 }}
            >
              Start interactive demo
            </Button>
            <Button
              component={Link}
              href="/evonet/dropin-test"
              size="large"
              variant="outlined"
              fullWidth
              sx={appleCapsuleOutlineSx}
            >
              Validation workspace
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
                  sx={{
                    display: { xs: "none", sm: "block" },
                    width: "1px",
                    alignSelf: "stretch",
                    bgcolor: apple.separator,
                    mx: 2,
                  }}
                />
              }
            >
              {[
                {
                  step: "01",
                  title: "Set the experience",
                  body: "Pick style and interaction options, then preview instantly.",
                },
                {
                  step: "02",
                  title: "Walk the journey",
                  body: "See payment selection through completion in a real browser.",
                },
                {
                  step: "03",
                  title: "Align to launch",
                  body: "Give product and engineering one shared checkout reference.",
                },
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
                  <Typography sx={{ fontWeight: 650, mb: 0.5, letterSpacing: "-0.02em" }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: apple.secondaryLabel, lineHeight: 1.5 }}>
                    {item.body}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box sx={{ width: "100%", ...sectionEnter(220) }}>
            <Typography sx={{ ...appleSectionHeaderSx, textAlign: "left", px: 0.5 }}>
              Choose a path
            </Typography>
            <Stack spacing={1.25}>
              <Box sx={{ ...appleGroupedSectionSx, p: { xs: 2, sm: 2.5 }, textAlign: "left" }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ sm: "center" }}
                  justifyContent="space-between"
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 650, letterSpacing: "-0.02em", mb: 0.5 }}>
                      Guided experience
                    </Typography>
                    <Typography variant="body2" sx={{ color: apple.secondaryLabel }}>
                      Best for customer meetings. Shape Drop-in and open a polished
                      storefront preview.
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
                      minWidth: 176,
                      width: 176,
                      px: 2.25,
                      py: 1,
                    }}
                  >
                    Open Builder
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
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 650, letterSpacing: "-0.02em", mb: 0.5 }}>
                      {isProd ? "Production validation" : "Validation workspace"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: apple.secondaryLabel }}>
                      {isProd
                        ? "Full configuration for internal QA against live credentials."
                        : "Inspect SDK options, events, and payment outcomes in detail."}
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
                      minWidth: 176,
                      width: 176,
                      px: 2.25,
                      py: 0.95,
                    }}
                  >
                    Open workspace
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Box>

          <Typography
            variant="caption"
            sx={{ color: apple.tertiaryLabel, ...sectionEnter(280) }}
          >
            Demo environment · Evonet Drop-in
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
