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

export type CustomDescriptionInput = {
  includeFreeTrial: boolean;
  includePayment: boolean;
  includeSaveCard: boolean;
  includeSubscribe: boolean;
  freeTrialDescription: string;
  freeTrialBtnText: string;
  payBtnText: string;
  /** `null` = omit; `true` hides the pay CTA amount (`hidePayAmount`). */
  hidePayAmount: boolean | null;
  saveCardDescription: string;
  subscribeBtnText: string;
  /** `null` = omit; `true` hides the subscribe CTA amount (`hideSubscribeAmount`). */
  hideSubscribeAmount: boolean | null;
  subscribeDescription: string;
};

function putTrimmed(
  target: NonNullable<EvonetSdkUiOption["customDescription"]>,
  key: "freeTrialDescription" | "freeTrialBtnText" | "payBtnText" | "saveCardDescription" | "subscribeBtnText" | "subscribeDescription",
  raw: string
): void {
  const trimmed = raw.trim();
  if (trimmed) {
    target[key] = trimmed;
  }
}

/**
 * Merge scene-specific `uiOption.customDescription` keys. Empty strings and
 * unset booleans (`null`) are omitted so SDK defaults stay intact.
 */
export function buildCustomDescriptionUiOption(
  input: CustomDescriptionInput
): EvonetSdkUiOption["customDescription"] | undefined {
  const next: NonNullable<EvonetSdkUiOption["customDescription"]> = {};

  if (input.includeFreeTrial) {
    putTrimmed(next, "freeTrialDescription", input.freeTrialDescription);
    putTrimmed(next, "freeTrialBtnText", input.freeTrialBtnText);
  }

  if (input.includePayment) {
    putTrimmed(next, "payBtnText", input.payBtnText);
    if (input.hidePayAmount !== null) {
      next.hidePayAmount = input.hidePayAmount;
    }
  }

  if (input.includeSaveCard) {
    putTrimmed(next, "saveCardDescription", input.saveCardDescription);
  }

  if (input.includeSubscribe) {
    putTrimmed(next, "subscribeBtnText", input.subscribeBtnText);
    if (input.hideSubscribeAmount !== null) {
      next.hideSubscribeAmount = input.hideSubscribeAmount;
    }
    putTrimmed(next, "subscribeDescription", input.subscribeDescription);
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

/**
 * Drop-in reads `customDescription` from its Vuex store at render time, so
 * copy edits can be patched onto a live instance. Strip them from remount
 * fingerprints so pay/subscribe/save-card text does not destroy the iframe.
 */
export function withoutCustomDescription(
  uiOption: EvonetSdkUiOption
): EvonetSdkUiOption {
  const { customDescription: _omit, ...rest } = uiOption;
  return rest;
}

export function isZeroOrderAmount(raw: string): boolean {
  const n = Number.parseFloat(raw.trim());
  return Number.isFinite(n) && n === 0;
}

export type AmountDisplayChoice = "default" | "show" | "hide";

/** Map SDK `hide*` (`true` = hide amount) onto the Builder select. */
export function amountDisplayChoice(hide: boolean | null): AmountDisplayChoice {
  if (hide === null) return "default";
  return hide ? "hide" : "show";
}

export function amountDisplayFromChoice(choice: string): boolean | null {
  if (choice === "hide") return true;
  if (choice === "show") return false;
  return null;
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
