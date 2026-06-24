import { Alert, type AlertProps } from "@mui/material";

export function DemoTransactionWarning(props: AlertProps) {
  return (
    <Alert severity="error" variant="outlined" {...props}>
      <strong>Demo only — do not complete real payments.</strong> This site uses live
      production credentials for integration testing. Any payment you complete is a real
      charge and <strong>cannot be refunded</strong> through this demo.
    </Alert>
  );
}
