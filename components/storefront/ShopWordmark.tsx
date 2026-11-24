"use client";

import { Box } from "@mui/material";

interface ShopWordmarkProps {
  dark?: boolean;
  height?: number;
}

/** Nav mark from the iOS demo. Light fill is burgundy, dark fill is blush. */
export function ShopWordmark({ dark = false, height = 30 }: ShopWordmarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <Box
      component="img"
      src={
        dark
          ? "/storefront/anon-tokyo-wordmark-dark.svg"
          : "/storefront/anon-tokyo-wordmark-light.svg"
      }
      alt="Anon Tokyo"
      sx={{
        height,
        width: "auto",
        maxWidth: 148,
        display: "block",
      }}
    />
  );
}
