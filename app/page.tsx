import Link from "next/link";
import { Box, Button, Paper, Typography } from "@mui/material";

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
          maxWidth: 420,
          p: 3,
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
          Evonet Drop-in Demo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This project includes a local PROD-like Evonet Drop-in test page with
          a configurable form and real browser user agent.
        </Typography>
        <Button
          component={Link}
          href="/evonet/dropin-test"
          variant="contained"
          color="primary"
        >
          Go to Drop-in test page
        </Button>
      </Paper>
    </Box>
  );
}
