"use client";

import { useSiteLocale } from "@/components/SiteLocaleProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SITE_LOCALES, type SiteLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LocaleSwitcherProps {
  className?: string;
  /** Compact trigger for header toolbars. */
  size?: "default" | "sm";
  /**
   * Short trigger labels (EN / 繁 / 简 / 日 / 한) for tight chrome such as
   * the mobile landing glass pill. Menu items stay full native names.
   */
  compact?: boolean;
}

export function LocaleSwitcher({
  className,
  size = "sm",
  compact = false,
}: LocaleSwitcherProps) {
  const { locale, setLocale, messages, ready } = useSiteLocale();
  const selected =
    SITE_LOCALES.find((item) => item.value === locale) ?? SITE_LOCALES[0];

  return (
    <Select
      value={locale}
      onValueChange={(value) => setLocale(value as SiteLocale)}
      disabled={!ready}
    >
      <SelectTrigger
        className={cn(
          compact
            ? "h-8 w-auto min-w-0 gap-1 rounded-full border-0 bg-transparent px-2.5 text-xs font-semibold text-current! shadow-none hover:bg-black/[0.06] focus-visible:border-transparent focus-visible:ring-0 disabled:opacity-100 dark:border-transparent dark:bg-transparent dark:hover:bg-white/[0.12] dark:focus-visible:border-transparent [&_svg]:text-current!"
            : size === "sm"
              ? "h-8 w-[128px] text-xs"
              : "w-[160px]",
          className
        )}
        aria-label={messages.common.language}
        title={messages.common.language}
      >
        <SelectValue>{compact ? selected.shortLabel : selected.nativeLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {SITE_LOCALES.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.nativeLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
