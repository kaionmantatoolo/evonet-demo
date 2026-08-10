"use client";

import { Alert, type AlertProps } from "@mui/material";
import { useSiteLocale } from "@/components/SiteLocaleProvider";
import { isEvonetProductionEnvironment } from "../lib/evonetEnvironment";

type DemoTransactionWarningProps = AlertProps & {
  /** When set, gates visibility from this value instead of build-time env. */
  environment?: string;
};

/**
 * Shown when the active environment looks like production (e.g. HKG_prod).
 * Pass `environment` for runtime toggles; otherwise uses NEXT_PUBLIC defaults.
 */
export function DemoTransactionWarning({
  environment,
  ...props
}: DemoTransactionWarningProps) {
  const { messages } = useSiteLocale();
  const tc = messages.common;

  if (!isEvonetProductionEnvironment(environment)) {
    return null;
  }

  return (
    <Alert
      severity="error"
      variant="outlined"
      {...props}
      sx={{
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        "& .MuiAlert-message": { overflowWrap: "anywhere" },
        ...((props.sx as object) ?? {}),
      }}
    >
      <strong>{tc.prodDemoWarningTitle}</strong> {tc.prodDemoWarningBody}{" "}
      <strong>{tc.prodDemoWarningNoRefund}</strong>
      {tc.prodDemoWarningSuffix}
    </Alert>
  );
}
