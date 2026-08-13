/**
 * UAT / PROD target switch via NEXT_PUBLIC_EVONET_TARGET (single Vercel switch).
 * Dual credential sets: EVONET_UAT_* / EVONET_PROD_*; legacy EVONET_* as fallback.
 * Session API may pass a runtime override (e.g. Dev Console five-tap toggle).
 */

export type EvonetTarget = "UAT" | "PROD";

/** sessionStorage key for Dev Console / Builder five-tap runtime override. */
export const EVONET_TARGET_OVERRIDE_STORAGE_KEY = "evonet-demo-target-override";

export function readStoredTargetOverride(): EvonetTarget | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(EVONET_TARGET_OVERRIDE_STORAGE_KEY);
    if (raw === "UAT" || raw === "PROD") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredTargetOverride(target: EvonetTarget): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(EVONET_TARGET_OVERRIDE_STORAGE_KEY, target);
  } catch {
    /* ignore */
  }
}

export interface EvonetServerConfig {
  target: EvonetTarget;
  interactionUrl: string;
  paymentUrl: string;
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

const DEFAULT_PAYMENT_URLS: Record<EvonetTarget, string> = {
  UAT: "https://sandbox.evonetonline.com/payment",
  PROD: "https://api.evonetonline.com/payment",
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

/** Drop-in SDK environment string for a target. */
export function sdkEnvironmentForTarget(target: EvonetTarget): string {
  return DEFAULT_SDK_ENVIRONMENT[target];
}

/** Map Drop-in environment (e.g. HKG_prod, UAT) to credential target. */
export function targetFromSdkEnvironment(
  environment: string | undefined | null
): EvonetTarget {
  return parseEvonetTarget(environment);
}

/**
 * Single switch: NEXT_PUBLIC_EVONET_TARGET=UAT|PROD
 * (readable by client UI and server session API).
 * Legacy EVONET_TARGET is still accepted as a fallback.
 *
 * IMPORTANT: use static `process.env.NEXT_PUBLIC_*` access so Next.js inlines
 * the value into the client bundle. Dynamic `process.env[name]` is empty in
 * the browser and would always fall back to PROD.
 */
export function getEvonetTarget(): EvonetTarget {
  const fromPublic = process.env.NEXT_PUBLIC_EVONET_TARGET?.trim();
  const fromServer = process.env.EVONET_TARGET?.trim();
  return parseEvonetTarget(fromPublic || fromServer || undefined);
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

/**
 * Resolve Interaction API credentials and URL.
 * @param override — runtime target (session body / five-tap); falls back to env.
 */
export function resolveEvonetServerConfig(
  override?: EvonetTarget | string | null
): EvonetServerConfig {
  const target =
    override != null && String(override).trim() !== ""
      ? parseEvonetTarget(override)
      : getEvonetTarget();

  const interactionUrl =
    pickPrefixedOrLegacy(target, "INTERACTION_URL", "EVONET_INTERACTION_URL") ||
    DEFAULT_INTERACTION_URLS[target];

  const paymentUrl =
    pickPrefixedOrLegacy(target, "PAYMENT_URL", "EVONET_PAYMENT_URL") ||
    DEFAULT_PAYMENT_URLS[target];

  const signKey = pickPrefixedOrLegacy(target, "SIGN_KEY", "EVONET_SIGN_KEY");
  const keyId = pickPrefixedOrLegacy(target, "KEY_ID", "EVONET_KEY_ID");
  const storeId = pickPrefixedOrLegacy(target, "STORE_ID", "EVONET_STORE_ID");
  const signType =
    pickPrefixedOrLegacy(target, "SIGN_TYPE", "EVONET_SIGN_TYPE", "SHA256") ||
    "SHA256";

  return {
    target,
    interactionUrl,
    paymentUrl,
    signKey,
    keyId,
    storeId,
    signType,
    sdkEnvironment: DEFAULT_SDK_ENVIRONMENT[target],
  };
}
