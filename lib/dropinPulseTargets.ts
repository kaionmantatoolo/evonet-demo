/**
 * Maps Builder appearance parameter keys to Drop-in DOM selectors
 * (relative to `#evonet-dropin-* .cil-dropIn-container`).
 *
 * Used for the Builder “Highlight UI Controls” pulse. Prefer outline pulses
 * over mutating `--cil-dropIn-*` CSS vars.
 */

export type DropinPulseKey =
  | "colorAction"
  | "colorBackground"
  | "colorFormBackground"
  | "colorDisabled"
  | "colorPrimary"
  | "colorSecondary"
  | "colorPlaceholder"
  | "colorError"
  | "colorInverse"
  | "colorBoxStroke"
  | "colorFormBorder"
  | "colorBoxFillingOutline"
  | "borderRadius0"
  | "borderRadius1"
  | "borderRadius2"
  | "borderRadius3"
  | "logoPosition"
  | "multiKey"
  | "button"
  | "heading"
  | "subHeading"
  | "label"
  | "labelInfo"
  | "inputField"
  | "paragraph"
  | "placeholder";

/** Comma-joined selector list scoped under the Drop-in container. */
export const DROPIN_PULSE_TARGETS: Record<DropinPulseKey, string[]> = {
  colorAction: [
    ".base-button-primary",
    ".primary-btn",
    ".cil-main-color",
    ".see-more-wrap",
    ".channel-checked",
    ".extra-form-box",
    ".custom-checkbox-checked .base-checkbox-inner",
    ".cil-custom-radio.checked",
    "label.custom-checkbox .base-checkbox-inner",
  ],
  colorBackground: [".custom-bg", ".cil-dropIn-container", ".mixin-payment-info-wrap"],
  colorFormBackground: [
    ".custom-input",
    ".select-input",
    ".select-wrapper",
    ".mobile-card-form-wrap",
    ".extra-form-box",
  ],
  colorDisabled: [".base-button-primary[disabled]", "[disabled]", ".custom-input:disabled"],
  colorPrimary: [
    ".cil-payment-method-name",
    ".cil-channel-title",
    ".custom-input-label",
    ".cil-payment-method-conatiner",
  ],
  colorSecondary: [
    ".sub-heading",
    ".custom-paragraph",
    ".custom-paragraph .custom-checkbox-text",
    ".more-payment-method-title",
  ],
  colorPlaceholder: [
    "input.custom-input",
    "textarea.custom-input",
    ".custom-input",
    ".select-input",
  ],
  colorError: [".error-message", ".cil-error", ".van-field__error-message", "[class*='error']"],
  colorInverse: [".base-button-primary", ".primary-btn"],
  colorBoxStroke: [
    ".cil-payment-method-conatiner",
    ".extra-form-box",
    ".mobile-card-form-wrap",
    ".custom-form-border",
  ],
  colorFormBorder: [
    ".custom-input",
    ".select-input",
    ".select-wrapper",
    ".mobile-card-form-wrap",
  ],
  colorBoxFillingOutline: [
    ".channel-checked",
    ".extra-form-box",
    ".custom-checkbox-checked .base-checkbox-inner",
    ".cil-custom-radio.checked",
  ],
  // SDK: A[0] → input + dialog
  borderRadius0: [
    ".custom-input",
    ".select-input",
    ".select-wrapper",
    ".cil-payment-method-conatiner",
    ".mobile-card-form-wrap",
  ],
  // SDK: A[1] → checkbox
  borderRadius1: [
    "label.custom-checkbox .base-checkbox-inner",
    ".custom-checkbox-checked .base-checkbox-inner",
    ".cil-custom-radio",
  ],
  // SDK: A[2] → button
  borderRadius2: [".base-button-primary", ".primary-btn"],
  // No dedicated A[3] in SDK; highlight chip-like / logo-preview surfaces
  borderRadius3: [
    ".cil-logo-preview__item",
    ".logo-preview",
    ".cil-logo-preview",
    ".see-more-wrap",
  ],
  logoPosition: [".cil-logo-preview", ".logo-preview", ".cil-channel-wrap"],
  multiKey: [
    ".cil-dropIn-container",
    ".cil-channel-title",
    ".base-button-primary",
    ".custom-input",
  ],
  button: [".base-button-primary", ".primary-btn"],
  heading: [".cil-channel-title", ".more-payment-method-title"],
  subHeading: [".more-payment-method-title", ".see-more-wrap"],
  label: [".custom-input-label", ".cil-channel-title"],
  labelInfo: [".custom-input-label", "[class*='label-info']"],
  inputField: [".custom-input", ".select-input", ".select-wrapper"],
  paragraph: [".cil-payment-method-footer", ".mixin-payment-info-wrap p", ".TnC", "[class*='tnc']"],
  placeholder: ["input.custom-input", "textarea.custom-input", ".custom-input"],
};

export function isDropinPulseKey(value: string): value is DropinPulseKey {
  return Object.prototype.hasOwnProperty.call(DROPIN_PULSE_TARGETS, value);
}

/** Build CSS rules for all pulse keys scoped under `#containerId`. */
export function buildDropinPulseCss(containerId: string): string {
  const root = `#${CSS.escape(containerId)}`;
  const blocks: string[] = [
    `@keyframes dropin-param-pulse {
  0%, 100% { outline-color: rgba(34, 211, 238, 0); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }
  35% { outline-color: rgba(34, 211, 238, 0.95); box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.35); }
  70% { outline-color: rgba(34, 211, 238, 0.55); box-shadow: 0 0 0 6px rgba(34, 211, 238, 0.12); }
}`,
  ];

  for (const [key, selectors] of Object.entries(DROPIN_PULSE_TARGETS)) {
    if (selectors.length === 0) continue;
    const joined = selectors
      .map((sel) => `${root}[data-pulse="${key}"] ${sel}`)
      .join(",\n");
    blocks.push(`${joined} {
  outline: 2px solid rgba(34, 211, 238, 0.85);
  outline-offset: 2px;
  animation: dropin-param-pulse 0.9s ease-in-out 3;
}`);
  }

  return blocks.join("\n\n");
}
