import { NextRequest, NextResponse } from "next/server";
import { resolveEvonetServerConfig } from "../../../../lib/evonetTarget";
import { evonetSignedFetch } from "../../../../lib/evonetSignedFetch";
import type { EvonetRecurringProcessingModel } from "../../../../types/evonet";

const EVONET_RETURN_URL =
  process.env.EVONET_RETURN_URL ?? "http://localhost:3000/evonet/dropin-builder";
const EVONET_WEBHOOK_URL =
  process.env.EVONET_WEBHOOK_URL ?? "http://localhost:3000/api/evonet/webhook";

interface PaymentBody {
  amount?: number;
  currency?: string;
  orderId?: string;
  token?: string;
  environment?: string;
  target?: string;
  recurringProcessingModel?: EvonetRecurringProcessingModel;
  description?: string;
}

export async function POST(req: NextRequest) {
  let body: PaymentBody;
  try {
    body = (await req.json()) as PaymentBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    amount,
    currency,
    orderId,
    token,
    environment,
    target: bodyTarget,
    recurringProcessingModel,
    description,
  } = body;

  const tokenTrimmed = typeof token === "string" ? token.trim() : "";
  const orderIdTrimmed = typeof orderId === "string" ? orderId.trim() : "";
  const currencyTrimmed =
    typeof currency === "string" ? currency.trim() : "";

  if (
    amount == null ||
    Number.isNaN(amount) ||
    amount <= 0 ||
    !currencyTrimmed ||
    !orderIdTrimmed ||
    !tokenTrimmed
  ) {
    return NextResponse.json(
      {
        error:
          "Missing required fields (amount, currency, orderId, token) for MIT payment.",
      },
      { status: 400 }
    );
  }

  if (!tokenTrimmed.startsWith("pmt_")) {
    return NextResponse.json(
      { error: "token must be an Evonet payment token (pmt_…)." },
      { status: 400 }
    );
  }

  const {
    target,
    paymentUrl,
    signKey,
    keyId,
    storeId,
    signType,
  } = resolveEvonetServerConfig(
    bodyTarget ?? (environment != null ? String(environment) : undefined)
  );

  if (!paymentUrl || paymentUrl.includes("REPLACE")) {
    return NextResponse.json(
      {
        error: `Evonet payment URL is not configured for target ${target}. Set EVONET_${target}_PAYMENT_URL or EVONET_PAYMENT_URL.`,
      },
      { status: 500 }
    );
  }
  if (!signKey || !keyId) {
    return NextResponse.json(
      {
        error: `EVONET_${target}_SIGN_KEY / EVONET_${target}_KEY_ID are not configured for target ${target}.`,
      },
      { status: 500 }
    );
  }

  const merchantTransTime = new Date()
    .toISOString()
    .replace(/\.\d{3}Z$/, "+00:00");
  const recurringModel: EvonetRecurringProcessingModel =
    recurringProcessingModel === "Unscheduled" ? "Unscheduled" : "Subscription";

  const payload = {
    merchantTransInfo: {
      merchantTransID: orderIdTrimmed,
      merchantTransTime,
    },
    transAmount: {
      currency: currencyTrimmed,
      value: String(amount),
    },
    paymentMethod: {
      type: "token",
      token: { value: tokenTrimmed },
      recurringProcessingModel: recurringModel,
    },
    captureAfterHours: "0",
    allowAuthentication: false,
    returnURL: EVONET_RETURN_URL,
    webhook: EVONET_WEBHOOK_URL,
    ...(description ? { description } : {}),
  };

  const idempotencyKey = `evonet_pay_${orderIdTrimmed}_${Date.now()}`;

  try {
    const { response, text, data } = await evonetSignedFetch(
      "POST",
      paymentUrl,
      { signKey, keyId, storeId, signType },
      { body: payload, idempotencyKey }
    );

    if (data == null) {
      return NextResponse.json(
        {
          error: `Evonet returned non-JSON (${response.status}). Check payment URL: ${paymentUrl}`,
          details: { status: response.status, bodyPreview: text.slice(0, 300) },
        },
        { status: 502 }
      );
    }

    const resultCode =
      (data as { result?: { code?: string } })?.result?.code ?? "";
    const resultMessage =
      (data as { result?: { message?: string } })?.result?.message ??
      (data as { message?: string })?.message;
    const success =
      response.ok &&
      (resultCode === "" ||
        resultCode.startsWith("S") ||
        /^S0000$/i.test(resultCode));

    if (!success) {
      return NextResponse.json(
        {
          error: resultMessage ?? "Evonet payment API call failed",
          status: response.status,
          details: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      orderId: orderIdTrimmed,
      resultCode: resultCode || "S0000",
      resultMessage: resultMessage ?? "Success",
      raw: data,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: `Failed to call Evonet payment API: ${msg}`,
        details: { url: paymentUrl },
      },
      { status: 500 }
    );
  }
}
