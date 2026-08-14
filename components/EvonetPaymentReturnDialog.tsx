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
import { CopyableIdValue, isCopyableIdLabel } from "./CopyableIdValue";

interface EvonetPaymentReturnDialogProps {
  open: boolean;
  params: EvonetReturnParams | null;
  onStartNewPayment: () => void;
  onDismiss: () => void;
}

function isTerminalStatus(status: EvonetReturnParams["status"]): boolean {
  return status === "success" || status === "failed" || status === "cancelled";
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
  const terminal = isTerminalStatus(params.status);

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
        {terminal ? (
          <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
            This session ID is spent and cannot power another Drop-in init. Use{" "}
            <strong>Start new payment</strong> to mint a fresh session (or use
            Refresh session &amp; Re-init on the preview after dismissing).
          </Alert>
        ) : null}
        {rows.length > 0 ? (
          <Box
            component="dl"
            sx={{
              m: 0,
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: 1,
              alignItems: "start",
            }}
          >
            {rows.map((row) => (
              <Box key={row.label} sx={{ display: "contents" }}>
                <Typography component="dt" variant="caption" color="text.secondary">
                  {row.label}
                </Typography>
                <Box component="dd" sx={{ m: 0, minWidth: 0 }}>
                  {isCopyableIdLabel(row.label) ? (
                    <CopyableIdValue value={row.value} label={row.label} />
                  ) : (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                    >
                      {row.value}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No transaction identifiers were included in the return URL.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onDismiss} color="inherit">
          Dismiss
        </Button>
        <Button onClick={onStartNewPayment} variant="contained">
          {terminal ? "Start new payment" : "Continue"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
