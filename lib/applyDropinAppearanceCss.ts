import type { EvonetSdkAppearance, EvonetSdkFontObject } from "../types/evonet";

const DEFAULT_FONT = '"DM Sans", sans-serif';
const DEFAULT_BORDER_RADIUS = ["10px", "2px", "50px"] as const;

/**
 * Evonet Drop-in construct-time appearance defaults (from SDK).
 * Empty Builder fields must restore these — `removeProperty` would wipe the
 * vars the SDK wrote at init and make Pay / checked radios invisible.
 */
const SDK_COLOR_DEFAULTS = {
  colorAction: "#326AEB",
  colorBackground: "#ffffff",
  colorFormBackground: "#FFFFFF",
  colorBoxStroke: "#EEEEEE",
  colorBoxFillingOutline: "#94B4FF",
  colorDisabled: "#C3C3C3",
  colorInverse: "#FFFFFF",
  colorPlaceholder: "rgba(195, 195, 195, 0.8)",
  colorError: "#C90E14",
  colorPrimary: "#000000",
  colorSecondary: "#212121",
} as const;

function setVar(name: string, value: string): void {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.style.setProperty(name, value);
}

function colorOrDefault(
  value: string | undefined | null,
  fallback: string
): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || fallback;
}

function fontFamilyWithFallback(
  groupFamily: string | undefined,
  multiKey: string | undefined
): string {
  return groupFamily?.trim() || multiKey?.trim() || DEFAULT_FONT;
}

function applyTypedFont(
  cssName: string,
  font: EvonetSdkFontObject | undefined,
  multiKey: string | undefined,
  withFamilyFallback: boolean
): void {
  if (withFamilyFallback) {
    setVar(
      `--cil-dropIn-font-family-${cssName}`,
      fontFamilyWithFallback(font?.fontFamily, multiKey)
    );
  } else {
    const family = font?.fontFamily?.trim();
    if (family) {
      setVar(`--cil-dropIn-font-family-${cssName}`, family);
    }
  }

  // Only write defined fields — never removeProperty, or we wipe SDK init fonts.
  const size = font?.fontSize?.trim();
  const weight = font?.fontWeight?.trim();
  const letter = font?.letterSpacing?.trim();
  const line = font?.lineHeight?.trim();
  if (size) setVar(`--cil-dropIn-font-size-${cssName}`, size);
  if (weight) setVar(`--cil-dropIn-font-weight-${cssName}`, weight);
  if (letter) setVar(`--cil-dropIn-letter-spacing-${cssName}`, letter);
  if (line) setVar(`--cil-dropIn-line-height-${cssName}`, line);
}

/**
 * Mirror Evonet Drop-in SDK appearance → `:root` CSS vars without remounting.
 * Colors always resolve to an explicit value (Builder empty → SDK default) so
 * live updates / Reset never leave Pay CTA or radios without `--cil-dropIn-color-*`.
 */
export function applyDropinAppearanceCss(
  appearance: EvonetSdkAppearance | null | undefined
): void {
  if (typeof document === "undefined") {
    return;
  }

  const a = appearance ?? {};
  // SDK typo `mutilKey`; also accept `multiKey` if ever present.
  const multiKey =
    (typeof a.mutilKey === "string" ? a.mutilKey : undefined) ||
    (typeof a.multiKey === "string" ? a.multiKey : undefined);

  const button = a.button;
  const heading = a.heading;
  const subHeading = a.subHeading;
  const label = a.label;
  const labelInfo = a.labelInfo;
  const inputField = a.inputField;
  const paragraph = a.paragraph;
  const placeholder = a.placeholder;

  const labelFamily = fontFamilyWithFallback(label?.fontFamily, multiKey);
  setVar("--van-base-font", labelFamily);
  setVar("--van-price-font", labelFamily);

  const colorAction = colorOrDefault(
    a.colorAction,
    SDK_COLOR_DEFAULTS.colorAction
  );
  const colorBoxStroke = colorOrDefault(
    a.colorBoxStroke,
    SDK_COLOR_DEFAULTS.colorBoxStroke
  );
  const colorBoxFillingOutline = colorOrDefault(
    a.colorBoxFillingOutline,
    SDK_COLOR_DEFAULTS.colorBoxFillingOutline
  );

  setVar(
    "--cil-dropIn-color-background",
    colorOrDefault(a.colorBackground, SDK_COLOR_DEFAULTS.colorBackground)
  );
  setVar(
    "--cil-dropIn-color-form-background",
    colorOrDefault(
      a.colorFormBackground,
      SDK_COLOR_DEFAULTS.colorFormBackground
    )
  );
  setVar("--cil-dropIn-color-box-border", colorBoxStroke);
  setVar("--cil-dropIn-color-box-border-checked", colorBoxFillingOutline);
  setVar(
    "--cil-dropIn-color-disabled",
    colorOrDefault(a.colorDisabled, SDK_COLOR_DEFAULTS.colorDisabled)
  );
  setVar(
    "--cil-dropIn-color-inverse",
    colorOrDefault(a.colorInverse, SDK_COLOR_DEFAULTS.colorInverse)
  );
  setVar("--cil-dropIn-color-action", colorAction);
  // SDK maps input border from colorBoxStroke (colorFormBorder is validated only).
  setVar("--cil-dropIn-color-input-border", colorBoxStroke);
  setVar(
    "--cil-dropIn-color-input-placeholder",
    colorOrDefault(a.colorPlaceholder, SDK_COLOR_DEFAULTS.colorPlaceholder)
  );
  setVar(
    "--cil-dropIn-color-error",
    colorOrDefault(a.colorError, SDK_COLOR_DEFAULTS.colorError)
  );
  setVar("--cil-dropIn-color-input-focus", colorBoxFillingOutline);
  setVar(
    "--cil-dropIn-color-primary",
    colorOrDefault(a.colorPrimary, SDK_COLOR_DEFAULTS.colorPrimary)
  );
  setVar(
    "--cil-dropIn-color-secondary",
    colorOrDefault(a.colorSecondary, SDK_COLOR_DEFAULTS.colorSecondary)
  );

  applyTypedFont("button", button, multiKey, true);
  applyTypedFont("input-field", inputField, multiKey, true);
  applyTypedFont("input-field-info", labelInfo, multiKey, true);
  applyTypedFont("label-info", labelInfo, multiKey, true);
  applyTypedFont("label-popup", labelInfo, multiKey, true);
  applyTypedFont("input-field-popup", labelInfo, multiKey, true);
  applyTypedFont("heading", heading, multiKey, true);
  applyTypedFont("heading-popup", heading, multiKey, true);
  // SDK passes subHeading.fontFamily through without the multiKey fallback helper.
  applyTypedFont("sub-heading", subHeading, multiKey, false);
  applyTypedFont("label", label, multiKey, true);
  applyTypedFont("paragraph", paragraph, multiKey, true);
  applyTypedFont("placeholder", placeholder, multiKey, true);

  setVar("--cil-dropIn-logo-position", a.logoPosition ?? "left");

  if (multiKey?.trim()) {
    setVar("--cil-dropIn-font-family-error", multiKey.trim());
  } else {
    document.documentElement.style.removeProperty(
      "--cil-dropIn-font-family-error"
    );
  }

  const radii = Array.isArray(a.borderRadius) ? a.borderRadius : [];
  const r0 = String(radii[0] || DEFAULT_BORDER_RADIUS[0]);
  const r1 = String(radii[1] || DEFAULT_BORDER_RADIUS[1]);
  const r2 = String(radii[2] || DEFAULT_BORDER_RADIUS[2]);
  setVar("--cil-dropIn-border-radius-input", r0);
  setVar("--cil-dropIn-border-radius-checkbox", r1);
  setVar("--cil-dropIn-border-radius-button", r2);
  setVar("--cil-dropIn-border-radius-dialog", r0);
}

export { SDK_COLOR_DEFAULTS };
