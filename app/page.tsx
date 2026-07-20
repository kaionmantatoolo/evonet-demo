"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { isEvonetProductionEnvironment } from "../lib/evonetEnvironment";
import { pageEnter, sectionEnter } from "../lib/pageMotion";
import { VIEWPORT_HEIGHT } from "../lib/responsiveLayout";

export default function HomePage() {
  const isProd = isEvonetProductionEnvironment();

  return (
    <Box
      component="main"
      sx={{
        minHeight: VIEWPORT_HEIGHT,
        bgcolor: "background.default",
        ...pageEnter(),
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5, md: 10 } }}>
        <Stack spacing={{ xs: 3, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5, md: 5 },
              borderRadius: { xs: 3, md: 4 },
              border: "1px solid",
              borderColor: "divider",
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(255,255,255,1) 50%)",
              ...sectionEnter(40),
            }}
          >
            <Stack spacing={{ xs: 2, md: 2.5 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" color="primary" label="Client Experience Site" />
                <Chip size="small" variant="outlined" label="Evonet Checkout Demo" />
              </Stack>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.15,
                  fontSize: { xs: "1.75rem", sm: "2.25rem", md: "3rem" },
                  letterSpacing: "-0.02em",
                }}
              >
                Experience a Smoother Checkout
                <Box component="br" sx={{ display: { xs: "none", sm: "block" } }} />
                {" "}
                with Evonet
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  maxWidth: 760,
                  fontSize: { xs: "0.95rem", md: "1rem" },
                  lineHeight: 1.65,
                }}
              >
                This demo is designed for customer showcase. In just a few steps, you
                can preview the checkout look and feel, explore payment journey options,
                and see how the experience can fit your business before launch.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  component={Link}
                  href="/evonet/dropin-builder"
                  size="large"
                  variant="contained"
                  fullWidth
                  sx={{
                    textTransform: "none",
                    fontWeight: 650,
                    py: 1.35,
                    borderRadius: 2.5,
                    maxWidth: { sm: 280 },
                  }}
                >
                  Start Interactive Demo
                </Button>
                <Button
                  component={Link}
                  href="/evonet/dropin-test"
                  size="large"
                  variant="outlined"
                  fullWidth
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    py: 1.35,
                    borderRadius: 2.5,
                    maxWidth: { sm: 300 },
                  }}
                >
                  Explore Validation Workspace
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Grid container spacing={{ xs: 1.5, md: 2 }}>
            {[
              {
                title: "1) Quick Experience Setup",
                body: "Choose your preferred checkout style and interaction options with a guided flow, then instantly preview the customer journey.",
                delay: 80,
              },
              {
                title: "2) Real Journey Preview",
                body: "Experience the checkout in a real browser context to better understand how customers will move from payment selection to completion.",
                delay: 140,
              },
              {
                title: "3) Better Go-Live Confidence",
                body: "Align business, product, and implementation teams around one clear checkout experience before moving into production.",
                delay: 200,
              },
            ].map((card) => (
              <Grid item xs={12} md={4} key={card.title}>
                <Paper
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: 3,
                    height: "100%",
                    ...sectionEnter(card.delay),
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.body}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              ...sectionEnter(240),
            }}
          >
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Choose Your Demo Path
              </Typography>
              <Divider />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper
                    variant="outlined"
                    sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2.5, height: "100%" }}
                  >
                    <Stack spacing={1.25}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Guided Experience
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Best for customer meetings and business walkthroughs. Quickly
                        shape the checkout experience and share a clear visual outcome.
                      </Typography>
                      <Box>
                        <Button
                          component={Link}
                          href="/evonet/dropin-builder"
                          variant="contained"
                          fullWidth
                          sx={{
                            textTransform: "none",
                            fontWeight: 650,
                            borderRadius: 2,
                            maxWidth: { sm: 240 },
                          }}
                        >
                          Open Guided Experience
                        </Button>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper
                    variant="outlined"
                    sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2.5, height: "100%" }}
                  >
                    <Stack spacing={1.25}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {isProd ? "Production Validation" : "Validation Workspace"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {isProd
                          ? "Full configuration surface for internal QA against live credentials. Inspect SDK options, events, and payment outcomes."
                          : "Full configuration surface for internal QA. Inspect SDK options, events, and payment outcomes."}
                      </Typography>
                      <Box>
                        <Button
                          component={Link}
                          href="/evonet/dropin-test"
                          variant="outlined"
                          fullWidth
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                            maxWidth: { sm: 260 },
                          }}
                        >
                          Open Validation Workspace
                        </Button>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
