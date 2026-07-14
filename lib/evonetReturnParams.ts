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
  /** How the result was detected (URL redirect vs Drop-in SDK callback). */
  source: "return_url" | "sdk_event";
}

const RETURN_QUERY_KEYS = [
  "result",
  "merchantOrderID",
  "merchantOrderId",
  "merchantTransID",
  "merchantTransId",
  "sessionID",
  "sessionId",
  "code",
  "message",
] as const;

function getParamCi(
  searchParams: { get(name: string): string | null; entries?: () => IterableIterator<[string, string]> },
  ...names: string[]
): string | null {
  for (const name of names) {
    const value = searchParams.get(name);
    if (value?.trim()) return value.trim();
  }

  if (typeof searchParams.entries === "function") {
    const wanted = new Set(names.map((n) => n.toLowerCase()));
    for (const [key, value] of searchParams.entries()) {
      if (wanted.has(key.toLowerCase()) && value.trim()) {
        return value.trim();
      }
    }
  }

  return null;
}

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
  searchParams: URLSearchParams | { get(name: string): string | null; entries?: () => IterableIterator<[string, string]> }
): EvonetReturnParams | null {
  const result = getParamCi(searchParams, "result");
  const merchantOrderID = getParamCi(
    searchParams,
    "merchantOrderID",
    "merchantOrderId"
  );
  const merchantTransID = getParamCi(
    searchParams,
    "merchantTransID",
    "merchantTransId"
  );
  const sessionID = getParamCi(searchParams, "sessionID", "sessionId");
  const code = getParamCi(searchParams, "code");
  const message = getParamCi(searchParams, "message");

  const hasReturnSignal =
    Boolean(result) ||
    Boolean(merchantOrderID) ||
    Boolean(merchantTransID) ||
    Boolean(sessionID);

  if (!hasReturnSignal) {
    return null;
  }

  return {
    status: mapEvonetResultToStatus(result),
    result: result,
    merchantOrderID,
    merchantTransID,
    sessionID,
    code,
    message,
    source: "return_url",
  };
}

/** Map Drop-in host events (payment_success / fail / cancelled) into return dialog params. */
export function parseEvonetSdkPaymentEvent(
  eventType: string,
  payload: unknown
): EvonetReturnParams | null {
  let status: EvonetReturnStatus | null = null;
  if (eventType === "payment_success") status = "success";
  else if (eventType === "payment_fail") status = "failed";
  else if (eventType === "payment_cancelled") status = "cancelled";
  else if (eventType === "payment_pending") status = "pending";

  if (!status) return null;

  const data =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  const pick = (...keys: string[]): string | null => {
    for (const key of keys) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
  };

  return {
    status,
    result: status === "success" ? "success" : status,
    merchantOrderID: pick("merchantOrderID", "merchantOrderId"),
    merchantTransID: pick("merchantTransID", "merchantTransId"),
    sessionID: pick("sessionID", "sessionId"),
    code: pick("code"),
    message: pick("message"),
    source: "sdk_event",
  };
}

/** Keys Evonet (or SDK-style) may append; used when clearing return query. */
export function stripEvonetReturnQuery(
  searchParams: URLSearchParams
): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString());
  const remove = new Set(
    RETURN_QUERY_KEYS.map((key) => key.toLowerCase())
  );
  for (const key of [...next.keys()]) {
    if (remove.has(key.toLowerCase())) {
      next.delete(key);
    }
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
