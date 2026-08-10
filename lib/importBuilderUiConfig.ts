import type { EvonetSdkFontObject } from "../types/evonet";
import { normalizeTnCUrl, type TnCMode } from "./evonetUiOption";

const COLOR_KEYS = [
  "colorAction",
  "colorBackground",
  "colorBoxStroke",
  "colorDisabled",
  "colorError",
  "colorFormBackground",
  "colorFormBorder",
  "colorInverse",
  "colorBoxFillingOutline",
  "colorPlaceholder",
  "colorPrimary",
  "colorSecondary",
] as const;

const TYPOGRAPHY_GROUPS = [
  "button",
  "heading",
  "subHeading",
  "label",
  "labelInfo",
  "inputField",
  "paragraph",
  "placeholder",
] as const;

const FONT_FIELDS = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
] as const;

export type ImportedColorKey = (typeof COLOR_KEYS)[number];
export type ImportedTypographyGroup = (typeof TYPOGRAPHY_GROUPS)[number];

export interface ImportedBuilderUiConfig {
  uiOption: {
    showSaveImage: boolean;
    columns: boolean;
    showCardHolderName: boolean;
    cvvForSavedCard: boolean;
    showScanCardButton: boolean;
    autoInvokeCardScanner: boolean;
    showTnC: boolean;
    tncMode: TnCMode;
    tncUrl: string;
  };
  appearance: {
    colors: Record<ImportedColorKey, string>;
    logoPosition: "left" | "middle" | "right";
    borderRadius: [number, number, number, number] | null;
    typography: Record<ImportedTypographyGroup, EvonetSdkFontObject>;
  };
}

export type ParseBuilderUiConfigResult =
  | { ok: true; value: ImportedBuilderUiConfig }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeHexColor(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const candidate = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9a-fA-F]{6}$/.test(candidate)) return candidate.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(candidate)) return candidate.toLowerCase();
  return raw;
}

function emptyFontObject(): EvonetSdkFontObject {
  return {
    fontFamily: "",
    fontSize: "",
    fontWeight: "",
    letterSpacing: "",
    lineHeight: "",
  };
}

function emptyTypography(): Record<
  ImportedTypographyGroup,
  EvonetSdkFontObject
> {
  return {
    button: emptyFontObject(),
    heading: emptyFontObject(),
    subHeading: emptyFontObject(),
    label: emptyFontObject(),
    labelInfo: emptyFontObject(),
    inputField: emptyFontObject(),
    paragraph: emptyFontObject(),
    placeholder: emptyFontObject(),
  };
}

function emptyColors(): Record<ImportedColorKey, string> {
  return {
    colorAction: "",
    colorBackground: "",
    colorBoxStroke: "",
    colorDisabled: "",
    colorError: "",
    colorFormBackground: "",
    colorFormBorder: "",
    colorInverse: "",
    colorBoxFillingOutline: "",
    colorPlaceholder: "",
    colorPrimary: "",
    colorSecondary: "",
  };
}

function parseBorderRadius(
  value: unknown
): [number, number, number, number] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const parsed = value.slice(0, 4).map((entry) => {
    if (typeof entry === "number" && Number.isFinite(entry)) return entry;
    if (typeof entry === "string") {
      const match = entry.trim().match(/^(\d+(?:\.\d+)?)(px|pt|rem|em)?$/i);
      if (match) return Number(match[1]);
    }
    return NaN;
  });
  while (parsed.length < 4) parsed.push(0);
  if (parsed.some((n) => !Number.isFinite(n) || n < 0 || n > 100)) return null;
  return [parsed[0], parsed[1], parsed[2], parsed[3]];
}

function normalizeFontObject(value: unknown): EvonetSdkFontObject {
  const next = emptyFontObject();
  if (!isRecord(value)) return next;
  for (const field of FONT_FIELDS) {
    const raw = value[field];
    if (typeof raw === "string" && raw.trim()) {
      next[field] = raw.trim();
    }
  }
  return next;
}

function normalizeAppearance(
  appearance: unknown
): ImportedBuilderUiConfig["appearance"] {
  const colors = emptyColors();
  const typography = emptyTypography();
  let logoPosition: "left" | "middle" | "right" = "left";
  let borderRadius: [number, number, number, number] | null = null;

  if (!isRecord(appearance)) {
    return { colors, logoPosition, borderRadius, typography };
  }

  for (const key of COLOR_KEYS) {
    const raw = appearance[key];
    if (typeof raw === "string" && raw.trim()) {
      colors[key] = normalizeHexColor(raw);
    }
  }

  const logo = appearance.logoPosition;
  if (logo === "left" || logo === "middle" || logo === "right") {
    logoPosition = logo;
  }

  borderRadius = parseBorderRadius(appearance.borderRadius);

  for (const group of TYPOGRAPHY_GROUPS) {
    typography[group] = normalizeFontObject(appearance[group]);
  }

  return { colors, logoPosition, borderRadius, typography };
}

function normalizeUiOption(
  uiOption: unknown
): ImportedBuilderUiConfig["uiOption"] {
  const base = {
    showSaveImage: false,
    columns: false,
    showCardHolderName: true,
    cvvForSavedCard: true,
    showScanCardButton: false,
    autoInvokeCardScanner: false,
    showTnC: false,
    tncMode: "click2accept" as TnCMode,
    tncUrl: "",
  };

  if (!isRecord(uiOption)) return base;

  base.showSaveImage = asBoolean(uiOption.showSaveImage, base.showSaveImage);
  base.columns = asBoolean(uiOption.columns, base.columns);

  const card = isRecord(uiOption.card) ? uiOption.card : null;
  if (card) {
    base.showCardHolderName = asBoolean(
      card.showCardHolderName,
      base.showCardHolderName
    );
    base.cvvForSavedCard = asBoolean(
      card.CVVForSavedCard,
      base.cvvForSavedCard
    );
    base.showScanCardButton = asBoolean(
      card.showScanCardButton,
      base.showScanCardButton
    );
    base.autoInvokeCardScanner = asBoolean(
      card.autoInvokeCardScanner,
      base.autoInvokeCardScanner
    );
  }

  const tnc = isRecord(uiOption.TnC) ? uiOption.TnC : null;
  if (tnc) {
    base.showTnC = asBoolean(tnc.showTnC, base.showTnC);
    if (tnc.mode === "checkbox" || tnc.mode === "click2accept") {
      base.tncMode = tnc.mode;
    }
    if (typeof tnc.url === "string") {
      base.tncUrl = normalizeTnCUrl(tnc.url);
    }
  }

  return base;
}

/**
 * Parse pasted Builder / SDK JSON into normalized uiOption + appearance
 * controls. Accepts `{ uiOption, appearance }` or a fuller payload containing
 * those keys.
 */
export function parseBuilderUiConfigJson(
  text: string
): ParseBuilderUiConfigResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste JSON to import." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: "JSON must be an object." };
  }

  const hasUiOption = "uiOption" in parsed;
  const hasAppearance = "appearance" in parsed;
  if (!hasUiOption && !hasAppearance) {
    return {
      ok: false,
      error: "JSON must include uiOption and/or appearance.",
    };
  }

  return {
    ok: true,
    value: {
      uiOption: normalizeUiOption(parsed.uiOption),
      appearance: normalizeAppearance(parsed.appearance),
    },
  };
}
