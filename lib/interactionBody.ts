export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Order id stamped on an interaction body, for session lookup after create. */
export function orderIdFromInteractionBody(
  body: Record<string, unknown>
): string | null {
  if (typeof body.merchantOrderID === "string" && body.merchantOrderID.trim()) {
    return body.merchantOrderID.trim();
  }
  const trans = body.merchantTransInfo;
  if (!isJsonObject(trans)) return null;
  const transId = trans.merchantTransID;
  if (typeof transId === "string" && transId.trim()) return transId.trim();
  return null;
}

/** New order id for a custom body, keeping every other field. */
export function withFreshOrderId(
  body: Record<string, unknown>,
  orderId: string
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...body, merchantOrderID: orderId };
  if (isJsonObject(body.merchantOrderInfo)) {
    next.merchantOrderInfo = {
      ...body.merchantOrderInfo,
      merchantOrderID: orderId,
    };
  }
  if (isJsonObject(body.merchantTransInfo)) {
    next.merchantTransInfo = {
      ...body.merchantTransInfo,
      merchantTransID: orderId,
    };
  }
  return next;
}
