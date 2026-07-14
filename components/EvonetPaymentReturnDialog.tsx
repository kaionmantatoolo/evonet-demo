"use client";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import type { EvonetReturnParams } from "../lib/evonetReturnParams";
import { getEvonetReturnDialogCopy } from "../lib/evonetReturnParams";

interface EvonetPaymentReturnDialogProps {
  open: boolean;
  params: EvonetReturnParams | null;
  onStartNewPayment: () => void;
  onDismiss: () => void;
}

export function EvonetPaymentReturnDialog({
  open,
  params,
  onStartNewPayment,
  onDismiss,
}: EvonetPaymentReturnDialogProps) {
  if (!params) {
    return null;
  }

  const copy = getEvonetReturnDialogCopy(params.status);

  const rows: { label: string; value: string }[] = [];
  if (params.merchantOrderID) {
    rows.push({ label: "merchantOrderID", value: params.merchantOrderID });
  }
  if (params.merchantTransID) {
    rows.push({ label: "merchantTransID", value: params.merchantTransID });
  }
  if (params.sessionID) {
    rows.push({ label: "sessionID", value: params.sessionID });
  }
  if (params.result) {
    rows.push({ label: "result", value: params.result });
  }
  if (params.code) {
    rows.push({ label: "code", value: params.code });
  }
  if (params.message) {
    rows.push({ label: "message", value: params.message });
  }

  return (
    <Dialog open={open} onClose={onDismiss} maxWidth="sm" fullWidth>
      <DialogTitle>{copy.title}</DialogTitle>
      <DialogContent>
        <Alert severity={copy.severity} variant="outlined" sx={{ mb: 2 }}>
          {params.source === "sdk_event"
            ? "Drop-in reported this result via SDK payment callback."
            : "Wallet / new-tab payment returned to this page via Evonet returnURL."}
        </Alert>
        {rows.length > 0 ? (
          <Box
            component="dl"
            sx={{
              m: 0,
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: 1,
            }}
          >
            {rows.map((row) => (
              <Box key={row.label} sx={{ display: "contents" }}>
                <Typography component="dt" variant="caption" color="text.secondary">
                  {row.label}
                </Typography>
                <Typography
                  component="dd"
                  variant="caption"
                  sx={{ m: 0, fontFamily: "monospace", wordBreak: "break-all" }}
                >
                  {row.value}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No transaction identifiers were included in the return URL.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onDismiss} color="inherit">
          Dismiss
        </Button>
        <Button onClick={onStartNewPayment} variant="contained">
          Start new payment
        </Button>
      </DialogActions>
    </Dialog>
  );
}
