import { Alert, type AlertProps } from "@mui/material";
import { isEvonetProductionEnvironment } from "../lib/evonetEnvironment";

/**
 * Shown only when NEXT_PUBLIC_EVONET_ENVIRONMENT looks like production
 * (e.g. HKG_prod). Hidden on UAT / test environments.
 */
export function DemoTransactionWarning(props: AlertProps) {
  if (!isEvonetProductionEnvironment()) {
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
