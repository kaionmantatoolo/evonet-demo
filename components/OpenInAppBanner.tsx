"use client";

import { useEffect, useState } from "react";
import { useSiteLocale } from "./SiteLocaleProvider";

const DISMISS_KEY = "evonet-open-app-banner-dismissed";
const BANNER_HEIGHT = "calc(58px + env(safe-area-inset-top, 0px))";

const COPY = {
  "en-US": { title: "Evonet Drop-in Demo", subtitle: "Open in the iOS app", action: "Open", close: "Close" },
  "zh-TW": { title: "Evonet Drop-in Demo", subtitle: "用 iOS App 打開", action: "打開", close: "關閉" },
  "zh-CN": { title: "Evonet Drop-in Demo", subtitle: "用 iOS App 打开", action: "打开", close: "关闭" },
  "ja-JP": { title: "Evonet Drop-in Demo", subtitle: "iOSアプリで開く", action: "開く", close: "閉じる" },
  "ko-KR": { title: "Evonet Drop-in Demo", subtitle: "iOS 앱에서 열기", action: "열기", close: "닫기" },
} as const;

function isIosBrowser() {
  const ua = navigator.userAgent || "";
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const inAppWebView = Boolean(
    (window as Window & { webkit?: { messageHandlers?: { evonet?: unknown } } }).webkit?.messageHandlers?.evonet
  );
  return ios && !inAppWebView;
}

function isWalletReturn() {
  const params = new URLSearchParams(window.location.search);
  for (const key of params.keys()) {
    const name = key.toLowerCase();
    if (name === "returnfrompsp" || name === "trade_status" || name === "out_trade_no") return true;
  }
  return false;
}

export function OpenInAppBanner() {
  const { locale } = useSiteLocale();
  const copy = COPY[locale] ?? COPY["en-US"];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    if (!isIosBrowser() || isWalletReturn()) return;
    setVisible(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (visible) root.style.setProperty("--evonet-open-banner", BANNER_HEIGHT);
    else root.style.removeProperty("--evonet-open-banner");
    return () => root.style.removeProperty("--evonet-open-banner");
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-30 flex items-center gap-3 border-b border-black/10 bg-[#f2f2f7]/95 px-3 pt-[env(safe-area-inset-top,0px)] text-[#1c1c1e] backdrop-blur-xl dark:border-white/10 dark:bg-[#1c1c1e]/95 dark:text-white"
      style={{ minHeight: BANNER_HEIGHT }}
    >
      <button
        type="button"
        className="grid size-7 shrink-0 place-items-center rounded-full text-[18px] leading-none text-[#8e8e93]"
        aria-label={copy.close}
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, "1");
          setVisible(false);
        }}
      >
        ×
      </button>
      <img src="/app-icon.png" alt="" width={40} height={40} className="size-10 shrink-0 rounded-[10px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-tight">{copy.title}</p>
        <p className="truncate text-[12px] leading-tight text-[#8e8e93]">{copy.subtitle}</p>
      </div>
      <a
        href="evonetdemo://"
        className="shrink-0 rounded-full bg-[#007aff] px-3.5 py-1.5 text-[15px] font-semibold text-white no-underline"
      >
        {copy.action}
      </a>
    </div>
  );
}
