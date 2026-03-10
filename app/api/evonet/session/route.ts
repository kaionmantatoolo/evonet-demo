import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type {
  EvonetEnvironment,
  EvonetInteractionRequest,
  EvonetInteractionResponse,
} from "../../../../types/evonet";

const EVONET_INTERACTION_URL =
  process.env.EVONET_INTERACTION_URL ?? "https://REPLACE_WITH_INTERACTION_URL";

const EVONET_SIGN_KEY = process.env.EVONET_SIGN_KEY ?? "";
const EVONET_KEY_ID = process.env.EVONET_KEY_ID ?? "";

const EVONET_RETURN_URL =
  process.env.EVONET_RETURN_URL ?? "http://localhost:3000/evonet/dropin-test";
const EVONET_WEBHOOK_URL =
  process.env.EVONET_WEBHOOK_URL ?? "http://localhost:3000/api/evonet/webhook";

const EVONET_STORE_ID = process.env.EVONET_STORE_ID ?? "";
const EVONET_SIGN_TYPE = process.env.EVONET_SIGN_TYPE ?? "SHA256";

export async function POST(req: NextRequest) {
  let body: Partial<EvonetInteractionRequest>;

  try {
    body = (await req.json()) as Partial<EvonetInteractionRequest>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { amount, currency, orderId, description, environment, locale } = body;

  if (
    amount == null ||
    Number.isNaN(amount) ||
    !currency ||
    !orderId ||
    !environment ||
    !locale
  ) {
    return NextResponse.json(
      {
        error:
          "Missing required fields for interaction request (amount, currency, orderId, environment, locale).",
      },
      { status: 400 }
    );
  }

  if (!EVONET_INTERACTION_URL || EVONET_INTERACTION_URL.includes("REPLACE")) {
    return NextResponse.json(
      { error: "EVONET_INTERACTION_URL is not configured on the server." },
      { status: 500 }
    );
  }

  if (!EVONET_SIGN_KEY || !EVONET_KEY_ID) {
    return NextResponse.json(
      {
        error:
          "EVONET_SIGN_KEY / EVONET_KEY_ID are not configured. These are required to call Evonet interaction API.",
      },
      { status: 500 }
    );
  }

  const merchantTransTime = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
  const idempotencyKey = `evonet_${orderId}_${Date.now()}`;

  const payload: Record<string, unknown> = {
    // Interaction API requires merchantOrderID; use orderId as the merchant order reference.
    merchantOrderID: orderId,
    merchantOrderInfo: {
      merchantOrderID: orderId,
      merchantOrderTime: merchantTransTime,
    },
    merchantTransInfo: {
      merchantTransID: orderId,
      merchantTransTime,
    },
    transAmount: {
      currency,
      value: String(amount),
    },
    returnURL: EVONET_RETURN_URL,
    webhook: EVONET_WEBHOOK_URL,
    captureAfterHours: "0",
    allowAuthentication: true,
    locale,
    description: description ?? undefined,
  };

  const interactionUrl = EVONET_INTERACTION_URL;

  try {
    const dateTime = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
    const bodyString = JSON.stringify(payload);

    const isKeyBased =
      EVONET_SIGN_KEY.startsWith("sk_") ||
      EVONET_SIGN_TYPE.toLowerCase().includes("key");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      DateTime: dateTime,
      // Keep KeyID if your Evonet tenant requires it
      ...(EVONET_KEY_ID ? { KeyID: EVONET_KEY_ID } : {}),
      "Idempotency-Key": idempotencyKey,
    };

    if (isKeyBased) {
      headers.SignType = "Key-based";
      headers.Authorization = EVONET_SIGN_KEY;
    } else {
      const msgId = crypto.randomUUID().replace(/-/g, "");
      const url = new URL(interactionUrl);
      const requestPath = `${url.pathname}${url.search}`;

      const stringToSign = [
        "POST",
        requestPath,
        dateTime,
        EVONET_SIGN_KEY,
        msgId,
        bodyString,
      ].join("\n");

      const signType = EVONET_SIGN_TYPE.toUpperCase();
      let authorization: string;
      if (signType === "HMAC-SHA256") {
        authorization = crypto
          .createHmac("sha256", EVONET_SIGN_KEY)
          .update(stringToSign)
          .digest("hex");
      } else if (signType === "SHA512") {
        authorization = crypto
          .createHash("sha512")
          .update(stringToSign)
          .digest("hex");
      } else if (signType === "HMAC-SHA512") {
        authorization = crypto
          .createHmac("sha512", EVONET_SIGN_KEY)
          .update(stringToSign)
          .digest("hex");
      } else {
        // Default to SHA256
        authorization = crypto
          .createHash("sha256")
          .update(stringToSign)
          .digest("hex");
      }

      headers.MsgID = msgId;
      headers.SignType = EVONET_SIGN_TYPE;
      headers.Authorization = authorization;
    }

    if (EVONET_STORE_ID) {
      headers.intStoreCode = EVONET_STORE_ID;
    }

    const response = await fetch(interactionUrl, {
      method: "POST",
      headers,
      body: bodyString,
    });

    const text = await response.text();
    let data: EvonetInteractionResponse;
    try {
      data = JSON.parse(text) as EvonetInteractionResponse;
    } catch {
      return NextResponse.json(
        {
          error: `Evonet returned non-JSON (${response.status}). Check if the URL is correct: ${interactionUrl}`,
          details: { status: response.status, bodyPreview: text.slice(0, 300) },
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const rawMessage =
        (data as { result?: { message?: string } })?.result?.message ??
        (data as { message?: string })?.message ??
        "Evonet interaction API call failed";
      const code = (data as { result?: { code?: string } })?.result?.code;

      let errorMessage = rawMessage;
      if (
        rawMessage.toLowerCase().includes("store") &&
        rawMessage.toLowerCase().includes("not found")
      ) {
        errorMessage =
          "Store not found (B0001). Your KeyID may not be linked to a valid store, or the interaction API may require a store ID in the URL. Add EVONET_STORE_ID to .env.local with your store number (from Evonet Portal), or contact Evonet (contact@evonetglobal.com) to verify your store configuration.";
      } else if (code === "B0001") {
        errorMessage =
          "Store not found (B0001). Add EVONET_STORE_ID to .env.local with your store number from the Evonet Portal, or contact Evonet to verify your store is active.";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          status: response.status,
          details: data,
        },
        { status: 502 }
      );
    }

    const sessionId =
      data.sessionID ??
      data.sessionId ??
      (data as { session?: { id?: string } })?.session?.id;

    if (!sessionId) {
      return NextResponse.json(
        {
          error:
            "Evonet interaction API did not return a sessionID. Check the API Explorer for the correct response shape.",
          details: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      sessionId,
      raw: data,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error occurred";
    const cause =
      error instanceof Error && error.cause instanceof Error
        ? error.cause.message
        : undefined;
    return NextResponse.json(
      {
        error: `Failed to call Evonet interaction API: ${msg}${cause ? ` (${cause})` : ""}`,
        details: {
          url: interactionUrl,
          hint: "Check network, SSL, or try sandbox.evonetonline.com for testing.",
        },
      },
      { status: 500 }
    );
  }
}

