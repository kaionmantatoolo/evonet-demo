"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  detectBrowserSiteLocale,
  getSiteMessages,
  normalizeSiteLocale,
  readStoredSiteLocale,
  writeStoredSiteLocale,
  type SiteLocale,
  type SiteMessages,
} from "@/lib/i18n";

interface SiteLocaleContextValue {
  locale: SiteLocale;
  messages: SiteMessages;
  setLocale: (locale: SiteLocale) => void;
  /** True after client has resolved browser / storage locale (avoids hydration flash). */
  ready: boolean;
}

const SiteLocaleContext = createContext<SiteLocaleContextValue | null>(null);

export function SiteLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SiteLocale>("en-US");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredSiteLocale();
    const next = stored ?? detectBrowserSiteLocale();
    setLocaleState(next);
    document.documentElement.lang = next;
    setReady(true);
  }, []);

  const setLocale = useCallback((next: SiteLocale) => {
    const normalized = normalizeSiteLocale(next);
    setLocaleState(normalized);
    writeStoredSiteLocale(normalized);
    document.documentElement.lang = normalized;
  }, []);

  const value = useMemo<SiteLocaleContextValue>(
    () => ({
      locale,
      messages: getSiteMessages(locale),
      setLocale,
      ready,
    }),
    [locale, ready, setLocale]
  );

  return (
    <SiteLocaleContext.Provider value={value}>{children}</SiteLocaleContext.Provider>
  );
}

export function useSiteLocale(): SiteLocaleContextValue {
  const ctx = useContext(SiteLocaleContext);
  if (!ctx) {
    throw new Error("useSiteLocale must be used within SiteLocaleProvider");
  }
  return ctx;
}
