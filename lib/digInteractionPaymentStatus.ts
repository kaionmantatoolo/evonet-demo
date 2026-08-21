import type { EvonetReturnStatus } from "./evonetReturnParams";
import { mapEvonetResultToStatus } from "./evonetReturnParams";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(
  record: Record<string, unknown> | null,
  ...keys: string[]
): string | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/**
 * Best-effort payment status from Interaction GET `raw` (or nested result).
 */
export function digInteractionPaymentStatus(raw: unknown): {
  status: EvonetReturnStatus;
  merchantTransID: string | null;
  merchantOrderID: string | null;
  message: string | null;
  code: string | null;
} | null {
  const root = asRecord(raw);
  if (!root) return null;

  const result =
    asRecord(root.result) ||
    asRecord(asRecord(root.payment)?.result) ||
    asRecord(asRecord(root.transaction)?.result);

  const statusRaw =
    pickString(result, "status") ||
    pickString(root, "status") ||
    pickString(asRecord(root.payment), "status");

  if (!statusRaw) return null;

  const merchantOrderInfo = asRecord(root.merchantOrderInfo);
  return {
    status: mapEvonetResultToStatus(statusRaw),
    merchantTransID:
      pickString(merchantOrderInfo, "merchantTransID", "merchantTransId") ||
      pickString(root, "merchantTransID", "merchantTransId"),
    merchantOrderID:
      pickString(merchantOrderInfo, "merchantOrderID", "merchantOrderId") ||
      pickString(root, "merchantOrderID", "merchantOrderId"),
    message: pickString(result, "message") || pickString(root, "message"),
    code: pickString(result, "code") || pickString(root, "code"),
  };
}
