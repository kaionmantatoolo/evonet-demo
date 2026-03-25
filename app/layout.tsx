import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import ThemeRegistry from "../components/ThemeRegistry";

export const metadata = {
  title: "Evonet Drop-in Demo",
  description: "Local PROD-like Evonet Drop-in test page with Material UI.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
        <Analytics />
      </body>
    </html>
  );
}
