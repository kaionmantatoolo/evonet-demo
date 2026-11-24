import type {
  BinRule,
  EvonetDropinMode,
  EvonetOneTapPayBrand,
  EvonetRecurringProcessingModel,
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
  /** Unit price from Drop-in Builder Order Info amount. */
  amount: number;
  uiOption?: EvonetSdkUiOption;
  verifyPaymentBrand?: boolean;
  maxWaitTime?: string;
  binRules?: BinRule[];
  /**
   * From Builder Order Payment Methods → interaction
   * `merchantOrderInfo.enabledPaymentMethod` when storefront creates a session.
   */
  enabledPaymentMethod?: string[];
  /** Save-card / recurring knobs from Builder (Fan Club when Subscription). */
  saveCardForNextPurchase?: boolean;
  userInfoReference?: string;
  /** One Tap brand from Builder. Off when omitted. */
  oneTapPay?: EvonetOneTapPayBrand;
  includeRecurringProcessingModel?: boolean;
  recurringProcessingModel?: EvonetRecurringProcessingModel;
  savedAt: string;
}

/**
 * Fan Club storefront opens only when Builder would send
 * `paymentMethod.recurringProcessingModel: "Subscription"`.
 */
export function isFanClubStorefront(
  snapshot: Pick<
    StorefrontSnapshot,
    | "saveCardForNextPurchase"
    | "includeRecurringProcessingModel"
    | "recurringProcessingModel"
  >
): boolean {
  return (
    snapshot.saveCardForNextPurchase === true &&
    snapshot.includeRecurringProcessingModel !== false &&
    snapshot.recurringProcessingModel === "Subscription"
  );
}

/** One Tap brand for the interaction order. Shopper reference is not part of it. */
export function oneTapSessionFields(
  snapshot: Pick<StorefrontSnapshot, "oneTapPay">
): { oneTapPay: EvonetOneTapPayBrand } | undefined {
  if (!snapshot.oneTapPay) return undefined;
  return { oneTapPay: snapshot.oneTapPay };
}

export type StorefrontCssVars = Record<string, string>;

export type StorefrontColorMode = "light" | "dark";

function asHex(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return trimmed;
  }
  return fallback;
}

function normalizeHex6(hex: string): string | null {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => `${c}${c}`)
          .join("")
      : raw.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return full.toLowerCase();
}

function parseRgb(hex: string): [number, number, number] | null {
  const full = normalizeHex6(hex);
  if (!full) return null;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

/** Approximate relative luminance for hex colors (0–1). */
function hexLuminance(hex: string): number {
  const rgb = parseRgb(hex);
  if (!rgb) return 1;
  const [r8, g8, b8] = rgb;
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r8) + 0.7152 * lin(g8) + 0.0722 * lin(b8);
}

function isLightHex(hex: string): boolean {
  return hexLuminance(hex) > 0.72;
}

const LIGHT_SHELL = {
  surface: "#ffffff",
  mutedSurface: "#f3f4f6",
  textFallback: "#1c1917",
  mutedFallback: "#78716c",
  borderFallback: "#e7e5e4",
} as const;

/**
 * iOS shop dark mode: system black, grouped gray surfaces, Anon Tokyo blush.
 * Matches `Color(.systemBackground)` / `secondarySystemBackground` and
 * `BrandAccent` in the iOS demo.
 */
const IOS_DARK_SHELL = {
  bg: "#000000",
  surface: "#1C1C1E",
  mutedSurface: "#2C2C2E",
  text: "#F5F5F7",
  muted: "#AEAEB2",
  border: "#3A3A3C",
  action: "#F3C2CC",
  actionText: "#9A2744",
} as const;

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

/** Parse Builder order amount into a unit price for the storefront (0 allowed). */
export function resolveStorefrontUnitPrice(
  amount: unknown,
  fallback = 128
): number {
  const parsed =
    typeof amount === "number" ? amount : Number.parseFloat(String(amount ?? ""));
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.round(parsed * 100) / 100;
}

/**
 * Map Drop-in appearance tokens onto shop CSS custom properties.
 * Dark mode follows the iOS shop palette. Light mode uses the merchant
 * appearance. Drop-in payment chrome still uses the snapshot `appearance`.
 */
export function appearanceToStorefrontCssVars(
  appearance: EvonetSdkAppearance | undefined,
  colorMode: StorefrontColorMode = "light"
): StorefrontCssVars {
  const action = asHex(appearance?.colorAction, "#111827");
  const background = asHex(appearance?.colorBackground, "#ffffff");
  const primary = asHex(appearance?.colorPrimary, action);
  const secondary = asHex(appearance?.colorSecondary, "#6b7280");
  const inverse = asHex(appearance?.colorInverse, "#ffffff");
  const radii = Array.isArray(appearance?.borderRadius)
    ? appearance.borderRadius
    : null;
  const firstRadius = radii && radii.length >= 1 ? radii[0] : null;
  const radius =
    typeof firstRadius === "number" && Number.isFinite(firstRadius)
      ? `${firstRadius}px`
      : typeof firstRadius === "string" && firstRadius.trim()
        ? /^\d+(\.\d+)?px$/i.test(firstRadius.trim())
          ? firstRadius.trim()
          : /^\d+(\.\d+)?$/.test(firstRadius.trim())
            ? `${firstRadius.trim()}px`
            : firstRadius.trim()
        : "12px";

  if (colorMode === "dark") {
    return {
      "--shop-bg": IOS_DARK_SHELL.bg,
      "--shop-surface": IOS_DARK_SHELL.surface,
      "--shop-muted-surface": IOS_DARK_SHELL.mutedSurface,
      "--shop-primary": IOS_DARK_SHELL.text,
      "--shop-action": IOS_DARK_SHELL.action,
      "--shop-action-text": IOS_DARK_SHELL.actionText,
      "--shop-text": IOS_DARK_SHELL.text,
      "--shop-muted": IOS_DARK_SHELL.muted,
      "--shop-border": IOS_DARK_SHELL.border,
      "--shop-radius": radius,
    };
  }

  const shopBg = background;
  const shopSurface = LIGHT_SHELL.surface;
  const shopMutedSurface = LIGHT_SHELL.mutedSurface;
  const shopText =
    primary === action || primary === background
      ? LIGHT_SHELL.textFallback
      : primary;
  const shopMuted =
    secondary === action ? LIGHT_SHELL.mutedFallback : secondary;
  const shopBorder = asHex(
    appearance?.colorBoxStroke,
    LIGHT_SHELL.borderFallback
  );
  const shopAction = action;
  const shopActionText =
    isLightHex(action) && isLightHex(inverse)
      ? LIGHT_SHELL.textFallback
      : inverse;
  const shopPrimary = primary;

  return {
    "--shop-bg": shopBg,
    "--shop-surface": shopSurface,
    "--shop-muted-surface": shopMutedSurface,
    "--shop-primary": shopPrimary,
    "--shop-action": shopAction,
    "--shop-action-text": shopActionText,
    "--shop-text": shopText,
    "--shop-muted": shopMuted,
    "--shop-border": shopBorder,
    "--shop-radius": radius,
  };
}
