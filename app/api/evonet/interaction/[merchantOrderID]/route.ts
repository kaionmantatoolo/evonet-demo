import { NextRequest, NextResponse } from "next/server";
import { resolveEvonetServerConfig } from "../../../../../lib/evonetTarget";
import { evonetSignedFetch } from "../../../../../lib/evonetSignedFetch";

function digToken(data: unknown): {
  token?: string;
  recurringReference?: string;
} {
  if (!data || typeof data !== "object") return {};
  const root = data as Record<string, unknown>;
  const paymentMethod =
    (root.paymentMethod as Record<string, unknown> | undefined) ??
    ((root.payment as Record<string, unknown> | undefined)?.paymentMethod as
      | Record<string, unknown>
      | undefined);

  const tokenObj = paymentMethod?.token as Record<string, unknown> | undefined;
  const token =
    (typeof tokenObj?.value === "string" && tokenObj.value) ||
    (typeof paymentMethod?.tokenValue === "string" &&
      paymentMethod.tokenValue) ||
    undefined;

  const recurringReference =
    typeof paymentMethod?.recurringReference === "string"
      ? paymentMethod.recurringReference
      : undefined;

  return { token, recurringReference };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ merchantOrderID: string }> }
) {
  const { merchantOrderID: rawId } = await context.params;
  const merchantOrderID = decodeURIComponent(rawId ?? "").trim();
  if (!merchantOrderID) {
    return NextResponse.json(
      { error: "merchantOrderID is required." },
      { status: 400 }
    );
  }

  const targetParam = req.nextUrl.searchParams.get("target");
  const environment = req.nextUrl.searchParams.get("environment");
  const {
    target,
    interactionUrl,
    signKey,
    keyId,
    storeId,
    signType,
  } = resolveEvonetServerConfig(targetParam ?? environment ?? undefined);

  if (!interactionUrl || interactionUrl.includes("REPLACE")) {
    return NextResponse.json(
      {
        error: `Evonet interaction URL is not configured for target ${target}.`,
      },
      { status: 500 }
    );
  }
  if (!signKey || !keyId) {
    return NextResponse.json(
      {
        error: `EVONET_${target}_SIGN_KEY / EVONET_${target}_KEY_ID are not configured.`,
      },
      { status: 500 }
    );
  }

  const url = `${interactionUrl.replace(/\/$/, "")}/${encodeURIComponent(merchantOrderID)}`;

  try {
    const { response, text, data } = await evonetSignedFetch("GET", url, {
      signKey,
      keyId,
      storeId,
      signType,
    });

    if (data == null) {
      return NextResponse.json(
        {
          error: `Evonet returned non-JSON (${response.status}).`,
          details: { status: response.status, bodyPreview: text.slice(0, 300) },
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const message =
        (data as { result?: { message?: string } })?.result?.message ??
        (data as { message?: string })?.message ??
        "Failed to query Evonet interaction.";
      return NextResponse.json(
        { error: message, status: response.status, details: data },
        { status: 502 }
      );
    }

    const extracted = digToken(data);
    return NextResponse.json({
      merchantOrderID,
      token: extracted.token ?? null,
      recurringReference: extracted.recurringReference ?? null,
      raw: data,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to query Evonet interaction: ${msg}` },
      { status: 500 }
    );
  }
}
