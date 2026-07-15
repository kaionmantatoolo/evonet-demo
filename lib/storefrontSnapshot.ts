import type {
  EvonetDropinMode,
  EvonetSdkAppearance,
  EvonetSdkUiOption,
} from "../types/evonet";

export const STOREFRONT_SNAPSHOT_KEY = "evonet-storefront-snapshot";

export interface StorefrontSnapshot {
  appearance: EvonetSdkAppearance;
  environment: string;
  locale: string;
  mode: EvonetDropinMode;
  currency: string;
  uiOption?: EvonetSdkUiOption;
  verifyPaymentBrand?: boolean;
  maxWaitTime?: string;
  savedAt: string;
}

export type StorefrontCssVars = Record<string, string>;

function asHex(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return trimmed;
  }
  return fallback;
}

export function writeStorefrontSnapshot(snapshot: Omit<StorefrontSnapshot, "savedAt">): void {
  if (typeof window === "undefined") return;
  const payload: StorefrontSnapshot = {
    ...snapshot,
    savedAt: new Date().toISOString(),
  };
  window.sessionStorage.setItem(STOREFRONT_SNAPSHOT_KEY, JSON.stringify(payload));
}

export function readStorefrontSnapshot(): StorefrontSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STOREFRONT_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StorefrontSnapshot;
    if (!parsed || typeof parsed !== "object" || !parsed.appearance) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearStorefrontSnapshot(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STOREFRONT_SNAPSHOT_KEY);
}

/** Map Drop-in appearance tokens onto shop CSS custom properties. */
export function appearanceToStorefrontCssVars(
  appearance: EvonetSdkAppearance | undefined
): StorefrontCssVars {
  const action = asHex(appearance?.colorAction, "#111827");
  const background = asHex(appearance?.colorBackground, "#ffffff");
  const primary = asHex(appearance?.colorPrimary, action);
  const secondary = asHex(appearance?.colorSecondary, "#6b7280");
  const inverse = asHex(appearance?.colorInverse, "#ffffff");
  const radii = Array.isArray(appearance?.borderRadius)
    ? appearance.borderRadius
    : null;
  const radius = radii && radii.length >= 1 ? `${radii[0]}px` : "12px";

  return {
    "--shop-bg": background,
    "--shop-surface": "#ffffff",
    "--shop-primary": primary,
    "--shop-action": action,
    "--shop-action-text": inverse,
    "--shop-text": primary === action || primary === background ? "#1c1917" : primary,
    "--shop-muted": secondary === action ? "#78716c" : secondary,
    "--shop-border": asHex(appearance?.colorBoxStroke, "#e7e5e4"),
    "--shop-radius": radius,
  };
}
