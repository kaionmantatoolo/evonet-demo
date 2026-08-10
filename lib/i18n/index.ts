import type { SiteLocale } from "./locale";
import type { SiteMessages } from "./messages/en-US";
import { EN_US } from "./messages/en-US";
import { ZH_TW } from "./messages/zh-TW";
import { ZH_CN } from "./messages/zh-CN";
import { JA_JP } from "./messages/ja-JP";

export * from "./locale";
export type { SiteMessages } from "./messages/en-US";

const MESSAGES: Record<SiteLocale, SiteMessages> = {
  "en-US": EN_US,
  "zh-TW": ZH_TW,
  "zh-CN": ZH_CN,
  "ja-JP": JA_JP,
};

export function getSiteMessages(locale: SiteLocale): SiteMessages {
  return MESSAGES[locale] ?? EN_US;
}
