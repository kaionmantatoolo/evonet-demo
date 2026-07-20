/**
 * UAT / PROD target switch via NEXT_PUBLIC_EVONET_TARGET (single Vercel switch).
 * Dual credential sets: EVONET_UAT_* / EVONET_PROD_*; legacy EVONET_* as fallback.
 */

export type EvonetTarget = "UAT" | "PROD";

export interface EvonetServerConfig {
  target: EvonetTarget;
  interactionUrl: string;
  signKey: string;
  keyId: string;
  storeId: string;
  signType: string;
  /** Drop-in SDK environment string (e.g. UAT, HKG_prod). */
  sdkEnvironment: string;
}

const DEFAULT_INTERACTION_URLS: Record<EvonetTarget, string> = {
  UAT: "https://sandbox.evonetonline.com/interaction",
  PROD: "https://api.evonetonline.com/interaction",
};

const DEFAULT_SDK_ENVIRONMENT: Record<EvonetTarget, string> = {
  UAT: "UAT",
  PROD: "HKG_prod",
};

function envTrim(name: string): string {
  return (process.env[name] as string | undefined)?.trim() ?? "";
}

/** Normalize raw target string to UAT | PROD. Defaults to PROD. */
export function parseEvonetTarget(raw: string | undefined | null): EvonetTarget {
  const normalized = (raw ?? "").trim().toLowerCase();
  if (!normalized) return "PROD";
  if (
    normalized === "uat" ||
    normalized === "test" ||
    normalized === "sandbox" ||
    normalized === "hkg_test"
  ) {
    return "UAT";
  }
  if (
    normalized === "prod" ||
    normalized === "production" ||
    normalized === "hkg_prod" ||
    normalized.endsWith("_prod")
  ) {
    return "PROD";
  }
  // Explicit UAT/PROD casing already covered by lowercase; anything else → PROD
  return "PROD";
}

/**
 * Single switch: NEXT_PUBLIC_EVONET_TARGET=UAT|PROD
 * (readable by client UI and server session API).
 * Legacy EVONET_TARGET is still accepted as a fallback.
 */
export function getEvonetTarget(): EvonetTarget {
  return parseEvonetTarget(
    envTrim("NEXT_PUBLIC_EVONET_TARGET") || envTrim("EVONET_TARGET") || undefined
  );
}

function pickPrefixedOrLegacy(
  target: EvonetTarget,
  suffix: string,
  legacyName: string,
  legacyFallback = ""
): string {
  const prefixed = envTrim(`EVONET_${target}_${suffix}`);
  if (prefixed) return prefixed;
  const legacy = envTrim(legacyName);
  return legacy || legacyFallback;
}

/** Resolve Interaction API credentials and URL for the current target. */
export function resolveEvonetServerConfig(): EvonetServerConfig {
  const target = getEvonetTarget();

  const interactionUrl =
    pickPrefixedOrLegacy(target, "INTERACTION_URL", "EVONET_INTERACTION_URL") ||
    DEFAULT_INTERACTION_URLS[target];

  const signKey = pickPrefixedOrLegacy(target, "SIGN_KEY", "EVONET_SIGN_KEY");
  const keyId = pickPrefixedOrLegacy(target, "KEY_ID", "EVONET_KEY_ID");
  const storeId = pickPrefixedOrLegacy(target, "STORE_ID", "EVONET_STORE_ID");
  const signType =
    pickPrefixedOrLegacy(target, "SIGN_TYPE", "EVONET_SIGN_TYPE", "SHA256") ||
    "SHA256";

  return {
    target,
    interactionUrl,
    signKey,
    keyId,
    storeId,
    signType,
    sdkEnvironment: DEFAULT_SDK_ENVIRONMENT[target],
  };
}
