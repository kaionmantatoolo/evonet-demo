"use client";

import { useState } from "react";
import { IconButton, Stack, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { Copy, Check } from "lucide-react";
import { copyTextToClipboard } from "../lib/copyTextToClipboard";
import { cn } from "@/lib/utils";

async function copyWithFeedback(
  value: string,
  setCopied: (v: boolean) => void
): Promise<void> {
  const ok = await copyTextToClipboard(value);
  if (!ok) return;
  setCopied(true);
  window.setTimeout(() => setCopied(false), 1600);
}

/** MUI-friendly monospace value + copy icon (dialogs, storefront, result page). */
export function CopyableIdValue({
  value,
  label,
  copyValue,
}: {
  value: string;
  /** Accessible name; defaults to "Copy value". */
  label?: string;
  /** Optional different string to put on the clipboard (e.g. unmasked token). */
  copyValue?: string;
}) {
  const [copied, setCopied] = useState(false);
  const payload = (copyValue ?? value).trim();
  if (!payload) {
    return (
      <Typography
        component="span"
        variant="caption"
        sx={{ fontFamily: "ui-monospace, monospace", wordBreak: "break-all" }}
      >
        {value || "—"}
      </Typography>
    );
  }

  return (
    <Stack
      component="span"
      direction="row"
      alignItems="flex-start"
      spacing={0.25}
      sx={{ minWidth: 0 }}
    >
      <Typography
        component="span"
        variant="caption"
        sx={{
          m: 0,
          fontFamily: "ui-monospace, monospace",
          wordBreak: "break-all",
          flex: 1,
          minWidth: 0,
          pt: 0.35,
        }}
      >
        {value}
      </Typography>
      <IconButton
        size="small"
        onClick={() => void copyWithFeedback(payload, setCopied)}
        aria-label={copied ? "Copied" : `Copy ${label ?? "value"}`}
        sx={{
          mt: -0.25,
          color: copied ? "success.main" : "text.secondary",
          flexShrink: 0,
        }}
      >
        {copied ? (
          <CheckIcon sx={{ fontSize: 14 }} />
        ) : (
          <ContentCopyIcon sx={{ fontSize: 14 }} />
        )}
      </IconButton>
    </Stack>
  );
}

/** Tailwind / shadcn-friendly inline copy for Builder / Dev Console. */
export function CopyableIdInline({
  value,
  className,
  label,
  iconOnly = false,
}: {
  value: string;
  className?: string;
  label?: string;
  /** When true, only render the copy control (value already shown elsewhere). */
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const trimmed = value.trim();
  if (!trimmed || trimmed === "N/A") {
    if (iconOnly) return null;
    return (
      <span className={cn("break-all font-mono text-xs", className)}>
        {value || "N/A"}
      </span>
    );
  }

  const button = (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
        !iconOnly && "mt-0.5 h-5 w-5 rounded-sm border-0",
        copied && "text-emerald-600 dark:text-emerald-400"
      )}
      aria-label={copied ? "Copied" : `Copy ${label ?? "value"}`}
      onClick={() => void copyWithFeedback(trimmed, setCopied)}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );

  if (iconOnly) {
    return button;
  }

  return (
    <span className={cn("inline-flex max-w-full items-start gap-1", className)}>
      <span className="min-w-0 break-all font-mono text-xs">{value}</span>
      {button}
    </span>
  );
}

/** Labels that should get a copy control in payment/return detail rows. */
export function isCopyableIdLabel(label: string): boolean {
  const key = label.trim().toLowerCase();
  return (
    key.includes("id") ||
    key.includes("reference") ||
    key.includes("order") ||
    key.includes("token") ||
    key === "code" ||
    key === "sessionid" ||
    key === "merchanttransid" ||
    key === "merchantorderid"
  );
}
