import type {
  EvonetRecurringProcessingModel,
  EvonetTokenPaymentRequest,
  EvonetTokenPaymentResponse,
} from "../types/evonet";

export interface InteractionTokenResult {
  merchantOrderID: string;
  token: string | null;
  recurringReference: string | null;
  raw?: unknown;
}

export function generateMitOrderId(prefix = "MIT"): string {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${suffix}`;
}

/**
 * Interaction GET must use merchantOrderID (e.g. EVB-… / FAN-…), not Drop-in's
 * generated merchantTransID (pay_…). Prefer order id, then the session order id
 * we minted when creating the Interaction.
 */
export function resolveInteractionQueryId(options: {
  merchantOrderID?: string | null;
  merchantTransID?: string | null;
  sessionOrderId?: string | null;
}): string | null {
  const isPayTransId = (value: string) => value.startsWith("pay_");
  const order = options.merchantOrderID?.trim() || "";
  if (order && !isPayTransId(order)) return order;
  const session = options.sessionOrderId?.trim() || "";
  if (session) return session;
  if (order) return order;
  const trans = options.merchantTransID?.trim() || "";
  if (trans && !isPayTransId(trans)) return trans;
  return null;
}

/** Resolve a >0 MIT amount when CIT may have been free-trial (0). */
export function resolveMitAmount(
  currentAmount: string,
  fallbackAmount?: string
): string {
  const parsed = Number.parseFloat(currentAmount);
  if (Number.isFinite(parsed) && parsed > 0) {
    return currentAmount.trim();
  }
  const fallback = fallbackAmount?.trim() ?? "";
  const fallbackParsed = Number.parseFloat(fallback);
  if (Number.isFinite(fallbackParsed) && fallbackParsed > 0) {
    return fallback;
  }
  return "10.00";
}

export async function fetchInteractionToken(
  orderId: string,
  environment: string
): Promise<InteractionTokenResult> {
  const orderIdTrimmed = orderId.trim();
  if (!orderIdTrimmed) {
    throw new Error("orderId is required to fetch a payment token.");
  }
  const qs = new URLSearchParams({ environment });
  const response = await fetch(
    `/api/evonet/interaction/${encodeURIComponent(orderIdTrimmed)}?${qs}`
  );
  const data = (await response.json()) as {
    merchantOrderID?: string;
    token?: string | null;
    recurringReference?: string | null;
    error?: string;
    raw?: unknown;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to query interaction for token.");
  }
  return {
    merchantOrderID: data.merchantOrderID ?? orderIdTrimmed,
    token: typeof data.token === "string" ? data.token : null,
    recurringReference:
      typeof data.recurringReference === "string"
        ? data.recurringReference
        : null,
    raw: data.raw,
  };
}

export async function chargeWithToken(
  request: EvonetTokenPaymentRequest
): Promise<EvonetTokenPaymentResponse & { httpOk: boolean }> {
  const response = await fetch("/api/evonet/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const data = (await response.json()) as EvonetTokenPaymentResponse;
  return { ...data, httpOk: response.ok };
}

export function normalizeRecurringProcessingModel(
  value: EvonetRecurringProcessingModel | string | undefined | null
): EvonetRecurringProcessingModel {
  return value === "Unscheduled" ? "Unscheduled" : "Subscription";
}
