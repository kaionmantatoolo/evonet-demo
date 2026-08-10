import { Bebas_Neue, Manrope } from "next/font/google";
import type { ReactNode } from "react";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--shop-font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--shop-font-sans",
  display: "swap",
});

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${display.variable} ${sans.variable}`}>{children}</div>
  );
}
