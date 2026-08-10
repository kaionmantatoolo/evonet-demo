import type { ReactNode } from "react";
import type { Viewport } from "next";
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

/** iPhone notch / home indicator — required for env(safe-area-inset-*). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Hint UA chrome; actual light/dark follows next-themes + .dark class.
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <AppThemeProvider>
          <ThemeRegistry>
            <SiteLocaleProvider>{children}</SiteLocaleProvider>
          </ThemeRegistry>
        </AppThemeProvider>
      </body>
    </html>
  );
}
