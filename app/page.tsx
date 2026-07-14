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

export default function HomePage() {
  const isProd = isEvonetProductionEnvironment();

  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Stack spacing={4}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(255,255,255,1) 50%)",
            }}
          >
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" color="primary" label="Client Experience Site" />
                <Chip size="small" variant="outlined" label="Evonet Checkout Demo" />
              </Stack>

              <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
                Experience a Smoother Checkout
                <br />
                with Evonet
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 760 }}
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
                >
                  Start Interactive Demo
                </Button>
                <Button
                  component={Link}
                  href="/evonet/dropin-test"
                  size="large"
                  variant="outlined"
                >
                  Explore Validation Workspace
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  1) Quick Experience Setup
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose your preferred checkout style and interaction options with a
                  guided flow, then instantly preview the customer journey.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  2) Real Journey Preview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Experience the checkout in a real browser context to better understand
                  how customers will move from payment selection to completion.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  3) Better Go-Live Confidence
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Align business, product, and implementation teams around one clear
                  checkout experience before moving into production.
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Choose Your Demo Path
              </Typography>
              <Divider />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2.5, borderRadius: 2.5, height: "100%" }}
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
                    sx={{ p: 2.5, borderRadius: 2.5, height: "100%" }}
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
