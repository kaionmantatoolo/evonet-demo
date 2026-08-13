import type {
  BinRule,
  EvonetDropinMode,
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

function toHex(r: number, g: number, b: number): string {
  const clamp = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`;
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

function mixHex(a: string, b: string, t: number): string {
  const rgbA = parseRgb(a);
  const rgbB = parseRgb(b);
  if (!rgbA || !rgbB) return a;
  const u = Math.max(0, Math.min(1, t));
  return toHex(
    rgbA[0] + (rgbB[0] - rgbA[0]) * u,
    rgbA[1] + (rgbB[1] - rgbA[1]) * u,
    rgbA[2] + (rgbB[2] - rgbA[2]) * u
  );
}

function contrastRatio(a: string, b: string): number {
  const l1 = hexLuminance(a);
  const l2 = hexLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Lift a color toward white until it contrasts enough with a dark background. */
function ensureContrastOnBg(
  foreground: string,
  background: string,
  minRatio = 3
): string {
  if (contrastRatio(foreground, background) >= minRatio) return foreground;
  let out = foreground;
  for (let i = 1; i <= 8; i += 1) {
    out = mixHex(foreground, "#ffffff", i / 8);
    if (contrastRatio(out, background) >= minRatio) return out;
  }
  return "#fafaf9";
}

function actionLabelOn(fill: string, inverse: string): string {
  if (contrastRatio(inverse, fill) >= 3) return inverse;
  return isLightHex(fill) ? "#1c1917" : "#fafaf9";
}

/**
 * Dark shell tinted by merchant action/primary so storefront dark mode
 * still reads as the Builder theme — not a generic stone palette.
 */
function themeTintedDarkShell(tint: string): {
  bg: string;
  surface: string;
  mutedSurface: string;
  text: string;
  muted: string;
  border: string;
} {
  const seed = isLightHex(tint) ? mixHex(tint, "#0c0a09", 0.55) : tint;
  return {
    bg: mixHex("#0c0a09", seed, 0.1),
    surface: mixHex("#1c1917", seed, 0.14),
    mutedSurface: mixHex("#292524", seed, 0.16),
    text: "#fafaf9",
    muted: mixHex("#a8a29e", seed, 0.18),
    border: mixHex("#44403c", seed, 0.22),
  };
}

const LIGHT_SHELL = {
  surface: "#ffffff",
  mutedSurface: "#f3f4f6",
  textFallback: "#1c1917",
  mutedFallback: "#78716c",
  borderFallback: "#e7e5e4",
} as const;

/** Builder default action when colorAction is empty. */
const DEFAULT_ACTION = "#111827";
/** Evonet blue — used for dark-shell CTAs when the theme action is near-black. */
const EVONET_CTA_BLUE = "#1a86e8";

/** Dark, low-chroma fills look disabled on a dark storefront shell. */
function isNearBlackNeutral(hex: string): boolean {
  const rgb = parseRgb(hex);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return hexLuminance(hex) < 0.14 && chroma < 48;
}

function resolveDarkShellAction(action: string, shopBg: string): string {
  if (
    action.toLowerCase() === DEFAULT_ACTION ||
    isNearBlackNeutral(action)
  ) {
    return EVONET_CTA_BLUE;
  }
  return ensureContrastOnBg(action, shopBg, 4.5);
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
 * When `colorMode` is dark and the merchant background is light, shell
 * surfaces darken but stay tinted by action/primary so the storefront still
 * reads as the Builder theme. Brand CTAs are kept and only lifted for contrast.
 * Drop-in payment chrome still uses the snapshot `appearance` as-is.
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

  const useDarkShell = colorMode === "dark" && isLightHex(background);
  const tintSeed =
    !isLightHex(action) &&
    action.toLowerCase() !== DEFAULT_ACTION &&
    !isNearBlackNeutral(action)
      ? action
      : !isLightHex(primary) && !isNearBlackNeutral(primary)
        ? primary
        : EVONET_CTA_BLUE;
  const darkShell = useDarkShell ? themeTintedDarkShell(tintSeed) : null;

  const shopBg = darkShell ? darkShell.bg : background;
  const shopSurface = darkShell ? darkShell.surface : LIGHT_SHELL.surface;
  const shopMutedSurface = darkShell
    ? darkShell.mutedSurface
    : LIGHT_SHELL.mutedSurface;
  const shopText = darkShell
    ? darkShell.text
    : primary === action || primary === background
      ? LIGHT_SHELL.textFallback
      : primary;
  const shopMuted = darkShell
    ? isLightHex(secondary)
      ? mixHex(darkShell.muted, secondary, 0.35)
      : darkShell.muted
    : secondary === action
      ? LIGHT_SHELL.mutedFallback
      : secondary;
  const shopBorder = darkShell
    ? darkShell.border
    : asHex(appearance?.colorBoxStroke, LIGHT_SHELL.borderFallback);

  // Default near-black action → Evonet blue on dark shell (gray lift looks disabled).
  const shopAction = darkShell
    ? resolveDarkShellAction(action, shopBg)
    : action;
  const shopActionText = darkShell
    ? actionLabelOn(shopAction, inverse)
    : isLightHex(action) && isLightHex(inverse)
      ? LIGHT_SHELL.textFallback
      : inverse;

  const shopPrimary = darkShell
    ? ensureContrastOnBg(
        isLightHex(primary) ? mixHex(primary, darkShell.text, 0.55) : primary,
        shopBg,
        3
      )
    : primary;

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
