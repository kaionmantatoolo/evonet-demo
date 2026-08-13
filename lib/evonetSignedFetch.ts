import crypto from "crypto";

export interface EvonetAuthConfig {
  signKey: string;
  keyId: string;
  storeId: string;
  signType: string;
}

export function buildEvonetAuthHeaders(
  method: "GET" | "POST" | "DELETE",
  url: string,
  bodyString: string,
  auth: EvonetAuthConfig,
  idempotencyKey?: string
): Record<string, string> {
  const dateTime = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
  const isKeyBased =
    auth.signKey.startsWith("sk_") ||
    auth.signType.toLowerCase().includes("key");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    DateTime: dateTime,
    ...(auth.keyId ? { KeyID: auth.keyId } : {}),
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
  };

  if (isKeyBased) {
    headers.SignType = "Key-based";
    headers.Authorization = auth.signKey;
  } else {
    const msgId = crypto.randomUUID().replace(/-/g, "");
    const parsed = new URL(url);
    const requestPath = `${parsed.pathname}${parsed.search}`;
    const stringToSign = [
      method,
      requestPath,
      dateTime,
      auth.signKey,
      msgId,
      bodyString,
    ].join("\n");

    const signType = auth.signType.toUpperCase();
    let authorization: string;
    if (signType === "HMAC-SHA256") {
      authorization = crypto
        .createHmac("sha256", auth.signKey)
        .update(stringToSign)
        .digest("hex");
    } else if (signType === "SHA512") {
      authorization = crypto
        .createHash("sha512")
        .update(stringToSign)
        .digest("hex");
    } else if (signType === "HMAC-SHA512") {
      authorization = crypto
        .createHmac("sha512", auth.signKey)
        .update(stringToSign)
        .digest("hex");
    } else {
      authorization = crypto
        .createHash("sha256")
        .update(stringToSign)
        .digest("hex");
    }

    headers.MsgID = msgId;
    headers.SignType = auth.signType;
    headers.Authorization = authorization;
  }

  if (auth.storeId) {
    headers.intStoreCode = auth.storeId;
  }

  return headers;
}

export async function evonetSignedFetch(
  method: "GET" | "POST" | "DELETE",
  url: string,
  auth: EvonetAuthConfig,
  options?: { body?: unknown; idempotencyKey?: string }
): Promise<{ response: Response; text: string; data: unknown }> {
  const bodyString =
    options?.body !== undefined ? JSON.stringify(options.body) : "";
  const headers = buildEvonetAuthHeaders(
    method,
    url,
    bodyString,
    auth,
    options?.idempotencyKey
  );

  const response = await fetch(url, {
    method,
    headers,
    ...(bodyString ? { body: bodyString } : {}),
  });
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { response, text, data };
}
