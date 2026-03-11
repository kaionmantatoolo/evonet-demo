"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Alert, Box, Button, Container, Paper, Stack, Typography } from "@mui/material";

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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="sm">
        <Paper elevation={2} sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Alert severity={config.severity} variant="outlined">
              <Typography variant="subtitle1" fontWeight={700}>
                {config.title}
              </Typography>
            </Alert>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Transaction details
              </Typography>
              <Box
                component="dl"
                sx={{
                  mt: 1,
                  mb: 0,
                  display: "grid",
                  gridTemplateColumns: "140px 1fr",
                  gap: 1,
                }}
              >
                <Typography component="dt" variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Typography component="dd" variant="caption" sx={{ m: 0, fontFamily: "monospace" }}>
                  {status}
                </Typography>

                {sessionID && (
                  <>
                    <Typography component="dt" variant="caption" color="text.secondary">
                      sessionID
                    </Typography>
                    <Typography component="dd" variant="caption" sx={{ m: 0, fontFamily: "monospace", wordBreak: "break-all" }}>
                      {sessionID}
                    </Typography>
                  </>
                )}

                {merchantTransID && (
                  <>
                    <Typography component="dt" variant="caption" color="text.secondary">
                      merchantTransID
                    </Typography>
                    <Typography component="dd" variant="caption" sx={{ m: 0, fontFamily: "monospace", wordBreak: "break-all" }}>
                      {merchantTransID}
                    </Typography>
                  </>
                )}

                {code && (
                  <>
                    <Typography component="dt" variant="caption" color="text.secondary">
                      Code
                    </Typography>
                    <Typography component="dd" variant="caption" sx={{ m: 0, fontFamily: "monospace" }}>
                      {code}
                    </Typography>
                  </>
                )}

                {message && (
                  <>
                    <Typography component="dt" variant="caption" color="text.secondary">
                      Message
                    </Typography>
                    <Typography component="dd" variant="caption" sx={{ m: 0 }}>
                      {message}
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button component={Link} href="/" variant="contained">
                Back to Home
              </Button>
              <Button component={Link} href="/evonet/dropin-test" variant="outlined">
                Back to Drop-in test
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

