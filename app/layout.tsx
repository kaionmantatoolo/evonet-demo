import type { ReactNode } from "react";
import type { Viewport } from "next";
import ThemeRegistry from "../components/ThemeRegistry";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: "Evonet Drop-in Demo",
  description: "Local PROD-like Evonet Drop-in test page with Material UI.",
};

/** iPhone notch / home indicator — required for env(safe-area-inset-*). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
