import Link from "next/link";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";

export default function HomePage() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Paper
        elevation={2}
        sx={{
          maxWidth: 520,
          p: 3,
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
          Evonet Drop-in Demo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This project includes a local PROD-like Evonet Drop-in test page with
          a configurable form and real browser user agent.
        </Typography>
        <Stack spacing={1.5}>
          <Button
            component={Link}
            href="/evonet/dropin-builder"
            variant="contained"
            color="primary"
          >
            Open Drop-in Builder
          </Button>
          <Typography variant="caption" color="text.secondary">
            Best for sales/demo flows. Quickly build a Drop-in SDK JSON config.
          </Typography>

          <Button
            component={Link}
            href="/evonet/dropin-test"
            variant="outlined"
            color="primary"
          >
            Open Drop-in Test Page
          </Button>
          <Typography variant="caption" color="text.secondary">
            Full technical playground with runtime events and host-level debug.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
