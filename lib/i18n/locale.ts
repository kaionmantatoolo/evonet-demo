import type { StorefrontLocale } from "@/lib/storefrontCopy";

export type SiteLocale = StorefrontLocale;

export const SITE_LOCALES: {
  value: SiteLocale;
  label: string;
  nativeLabel: string;
  /** Compact trigger label for tight toolbars (e.g. mobile landing). */
  shortLabel: string;
}[] = [
  { value: "en-US", label: "English", nativeLabel: "English", shortLabel: "EN" },
  {
    value: "zh-TW",
    label: "Traditional Chinese",
    nativeLabel: "繁體中文",
    shortLabel: "繁",
  },
  {
    value: "zh-CN",
    label: "Simplified Chinese",
    nativeLabel: "简体中文",
    shortLabel: "简",
  },
  { value: "ja-JP", label: "Japanese", nativeLabel: "日本語", shortLabel: "日" },
];

export const SITE_LOCALE_STORAGE_KEY = "evonet-demo-site-locale";

/** Map navigator.language / languages to a supported site locale. */
export function detectBrowserSiteLocale(
  languages: readonly string[] | undefined = typeof navigator !== "undefined"
    ? navigator.languages
    : undefined
): SiteLocale {
  const list =
    languages && languages.length > 0
      ? languages
      : typeof navigator !== "undefined"
        ? [navigator.language]
        : ["en-US"];

  for (const raw of list) {
    const tag = (raw || "").trim();
    if (!tag) continue;
    const lower = tag.toLowerCase();
    if (lower === "zh-tw" || lower === "zh-hk" || lower.startsWith("zh-hant")) {
      return "zh-TW";
    }
    if (
      lower === "zh-cn" ||
      lower === "zh-sg" ||
      lower.startsWith("zh-hans") ||
      lower === "zh"
    ) {
      return "zh-CN";
    }
    if (lower.startsWith("ja")) return "ja-JP";
    if (lower.startsWith("en")) return "en-US";
  }
  return "en-US";
}

export function normalizeSiteLocale(value: string | null | undefined): SiteLocale {
  if (value === "en-US" || value === "zh-TW" || value === "zh-CN" || value === "ja-JP") {
    return value;
  }
  return detectBrowserSiteLocale(value ? [value] : undefined);
}

export function readStoredSiteLocale(): SiteLocale | null {
  if (typeof window === "undefined") return null;
  try {
    return normalizeSiteLocale(window.localStorage.getItem(SITE_LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredSiteLocale(locale: SiteLocale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SITE_LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore quota / private mode
  }
}
