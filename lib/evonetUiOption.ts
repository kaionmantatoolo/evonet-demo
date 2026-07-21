import type { EvonetSdkUiOption } from "../types/evonet";

export type TnCMode = "checkbox" | "click2accept";

/** Trim and ensure an absolute http(s) URL for Evonet Drop-in `uiOption.TnC.url`. */
export function normalizeTnCUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function isValidTnCUrl(url: string): boolean {
  if (!url.trim()) {
    return false;
  }
  try {
    const parsed = new URL(normalizeTnCUrl(url));
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Build `uiOption.TnC` for DropInSDK.
 * Omit the block when TnC is disabled so the SDK does not cache an empty url.
 */
export function buildTnCUiOption(
  showTnC: boolean,
  mode: TnCMode,
  rawUrl: string
): EvonetSdkUiOption["TnC"] | undefined {
  if (!showTnC) {
    return undefined;
  }
  return {
    showTnC: true,
    mode,
    url: normalizeTnCUrl(rawUrl),
  };
}
