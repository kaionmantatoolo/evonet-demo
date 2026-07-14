export type EvonetReturnStatus =
  | "success"
  | "failed"
  | "cancelled"
  | "pending";

export interface EvonetReturnParams {
  status: EvonetReturnStatus;
  result: string | null;
  merchantOrderID: string | null;
  merchantTransID: string | null;
  sessionID: string | null;
  code: string | null;
  message: string | null;
}

const RETURN_QUERY_KEYS = [
  "result",
  "merchantOrderID",
  "merchantTransID",
  "sessionID",
  "code",
  "message",
] as const;

export function mapEvonetResultToStatus(
  result: string | null | undefined
): EvonetReturnStatus {
  const normalized = (result ?? "").trim().toLowerCase();
  if (!normalized) return "pending";
  if (normalized === "success" || normalized === "succeeded" || normalized === "paid") {
    return "success";
  }
  if (
    normalized === "fail" ||
    normalized === "failed" ||
    normalized === "failure" ||
    normalized === "error"
  ) {
    return "failed";
  }
  if (normalized === "cancel" || normalized === "cancelled" || normalized === "canceled") {
    return "cancelled";
  }
  return "pending";
}

/**
 * Parse Evonet wallet/new-tab returnURL query params
 * (e.g. ?merchantOrderID=…&result=success).
 */
export function parseEvonetReturnParams(
  searchParams: URLSearchParams | { get(name: string): string | null }
): EvonetReturnParams | null {
  const result = searchParams.get("result");
  const merchantOrderID = searchParams.get("merchantOrderID");
  const merchantTransID = searchParams.get("merchantTransID");
  const sessionID = searchParams.get("sessionID");
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  const hasReturnSignal =
    Boolean(result?.trim()) ||
    Boolean(merchantOrderID?.trim()) ||
    Boolean(merchantTransID?.trim());

  if (!hasReturnSignal) {
    return null;
  }

  return {
    status: mapEvonetResultToStatus(result),
    result: result?.trim() || null,
    merchantOrderID: merchantOrderID?.trim() || null,
    merchantTransID: merchantTransID?.trim() || null,
    sessionID: sessionID?.trim() || null,
    code: code?.trim() || null,
    message: message?.trim() || null,
  };
}

/** Keys Evonet (or SDK-style) may append; used when clearing return query. */
export function stripEvonetReturnQuery(
  searchParams: URLSearchParams
): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString());
  for (const key of RETURN_QUERY_KEYS) {
    next.delete(key);
  }
  return next;
}

export function getEvonetReturnDialogCopy(status: EvonetReturnStatus): {
  title: string;
  severity: "success" | "error" | "warning" | "info";
} {
  switch (status) {
    case "success":
      return { title: "Payment successful", severity: "success" };
    case "failed":
      return { title: "Payment failed", severity: "error" };
    case "cancelled":
      return { title: "Payment cancelled", severity: "warning" };
    default:
      return { title: "Payment pending", severity: "info" };
  }
}
