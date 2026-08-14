"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { enterScale, pageEnter, sectionEnter } from "../../../../lib/pageMotion";
import {
  detailDlGridSx,
  VIEWPORT_HEIGHT,
} from "../../../../lib/responsiveLayout";
import { CopyableIdValue } from "../../../../components/CopyableIdValue";

const STATUS_CONFIG: Record<
  string,
  { title: string; severity: "success" | "error" | "info" | "warning" }
> = {
  success: { title: "Payment successful", severity: "success" },
  failed: { title: "Payment failed", severity: "error" },
  cancelled: { title: "Payment cancelled", severity: "warning" },
  pending: { title: "Payment pending", severity: "info" },
};

export default function EvonetResultPage() {
  const params = useParams<{ status?: string }>();
  const search = useSearchParams();

  const status = (params?.status ?? "pending").toString();
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  const merchantTransID = search.get("merchantTransID");
  const sessionID = search.get("sessionID");
  const code = search.get("code");
  const message = search.get("message");

  return (
    <Box
      sx={{
        minHeight: VIEWPORT_HEIGHT,
        bgcolor: "background.default",
        py: { xs: 3, sm: 4, md: 8 },
        ...pageEnter(),
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={2}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            ...sectionEnter(40),
          }}
        >
          <Stack spacing={2.25}>
            <Alert
              severity={config.severity}
              variant="outlined"
              sx={enterScale(80)}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                {config.title}
              </Typography>
            </Alert>

            <Box sx={sectionEnter(140)}>
              <Typography variant="body2" color="text.secondary">
                Transaction details
              </Typography>
              <Box component="dl" sx={{ ...detailDlGridSx, mt: 1 }}>
                <Typography component="dt" variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Typography
                  component="dd"
                  variant="caption"
                  sx={{ m: 0, fontFamily: "monospace" }}
                >
                  {status}
                </Typography>

                {sessionID ? (
                  <>
                    <Typography
                      component="dt"
                      variant="caption"
                      color="text.secondary"
                    >
                      sessionID
                    </Typography>
                    <Box component="dd" sx={{ m: 0, minWidth: 0 }}>
                      <CopyableIdValue value={sessionID} label="sessionID" />
                    </Box>
                  </>
                ) : null}

                {merchantTransID ? (
                  <>
                    <Typography
                      component="dt"
                      variant="caption"
                      color="text.secondary"
                    >
                      merchantTransID
                    </Typography>
                    <Box component="dd" sx={{ m: 0, minWidth: 0 }}>
                      <CopyableIdValue
                        value={merchantTransID}
                        label="merchantTransID"
                      />
                    </Box>
                  </>
                ) : null}

                {code ? (
                  <>
                    <Typography
                      component="dt"
                      variant="caption"
                      color="text.secondary"
                    >
                      Code
                    </Typography>
                    <Box component="dd" sx={{ m: 0, minWidth: 0 }}>
                      <CopyableIdValue value={code} label="code" />
                    </Box>
                  </>
                ) : null}

                {message ? (
                  <>
                    <Typography
                      component="dt"
                      variant="caption"
                      color="text.secondary"
                    >
                      Message
                    </Typography>
                    <Typography component="dd" variant="caption" sx={{ m: 0 }}>
                      {message}
                    </Typography>
                  </>
                ) : null}
              </Box>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={sectionEnter(220)}
            >
              <Button
                component={Link}
                href="/"
                variant="contained"
                fullWidth
                sx={{ textTransform: "none", fontWeight: 650, borderRadius: 2 }}
              >
                Back to Home
              </Button>
              <Button
                component={Link}
                href="/evonet/dropin-test"
                variant="outlined"
                fullWidth
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
              >
                Back to Drop-in test
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
