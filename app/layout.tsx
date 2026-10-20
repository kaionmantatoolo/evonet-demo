import type { ReactNode } from "react";
import type { Viewport } from "next";
import { OpenInAppBanner } from "../components/OpenInAppBanner";
import ThemeRegistry from "../components/ThemeRegistry";
import { AppThemeProvider } from "../components/AppThemeProvider";
import { SiteLocaleProvider } from "../components/SiteLocaleProvider";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: "Evonet Drop-in Demo",
  description: "Local PROD-like Evonet Drop-in test page with Material UI.",
  // Favicon: app/icon.png + app/apple-icon.png (square E mark from wordmark).
  // Do not point icons at /evonet-logo.png — it is a wide wordmark and looks squashed in tabs.
};

/** Fixed mobile scale — lock zoom so form focus (amount, etc.) cannot enlarge the page. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // Hint UA chrome; actual light/dark follows next-themes + .dark class.
  colorScheme: "light dark",
};

/**
 * AlipayHK WAP finishes by loading this https return URL in Safari.
 * Universal Links do not run on that redirect. Hand the same query to the app scheme.
 */
const iosWalletReturnHandoff = `
(function () {
  try {
    var ua = navigator.userAgent || "";
    var ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!ios) return;
    var params = new URLSearchParams(location.search);
    var hit = false;
    params.forEach(function (_, key) {
      var name = String(key).toLowerCase();
      if (name === "returnfrompsp" || name === "trade_status" || name === "out_trade_no") hit = true;
    });
    if (!hit) return;
    var scheme = "evonetdemo://evonet/return" + location.search;
    var link = document.createElement("a");
    link.href = scheme;
    link.textContent = "返回 Evonet Demo App";
    link.setAttribute("style", "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;background:#0a0b19;color:#fff;font:600 17px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;text-align:center;text-decoration:none;");
    function mount() {
      if (document.body && !link.isConnected) document.body.appendChild(link);
    }
    if (document.body) mount();
    else document.addEventListener("DOMContentLoaded", mount);
    window.location.href = scheme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: iosWalletReturnHandoff }} />
        <AppThemeProvider>
          <ThemeRegistry>
            <SiteLocaleProvider>
              <OpenInAppBanner />
              {children}
            </SiteLocaleProvider>
          </ThemeRegistry>
        </AppThemeProvider>
      </body>
    </html>
  );
}
