import { Alert, type AlertProps } from "@mui/material";
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
  if (!isEvonetProductionEnvironment(environment)) {
    return null;
  }

  return (
    <Alert severity="error" variant="outlined" {...props}>
      <strong>Demo only — do not complete real payments.</strong> This site uses live
      production credentials for integration testing. Any payment you complete is a real
      charge and <strong>cannot be refunded</strong> through this demo.
    </Alert>
  );
}
