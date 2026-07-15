"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import type { DemoProduct } from "./demoProduct";

interface StorefrontProductCardProps {
  product: DemoProduct;
  currency: string;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

export function StorefrontProductCard({
  product,
  currency,
  onAddToCart,
  onBuyNow,
}: StorefrontProductCardProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: 2.5, md: 4 },
        gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.1fr) minmax(0, 1fr)" },
        alignItems: "stretch",
        p: { xs: 2, md: 3 },
        borderRadius: "var(--shop-radius)",
        border: "1px solid var(--shop-border)",
        bgcolor: "var(--shop-surface)",
      }}
    >
      <Box
        sx={{
          minHeight: { xs: 220, md: 360 },
          borderRadius: "calc(var(--shop-radius) - 2px)",
          background:
            "linear-gradient(145deg, color-mix(in srgb, var(--shop-action) 18%, var(--shop-bg)), color-mix(in srgb, var(--shop-primary) 12%, var(--shop-bg)))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--shop-border)",
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "var(--shop-text)", opacity: 0.85 }}
        >
          {product.imageLabel}
        </Typography>
      </Box>

      <Stack spacing={2} justifyContent="center">
        <Box>
          <Typography
            variant="overline"
            sx={{ color: "var(--shop-muted)", letterSpacing: 1.2 }}
          >
            Featured
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, letterSpacing: -0.4, color: "var(--shop-text)" }}
          >
            {product.name}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: "var(--shop-muted)", maxWidth: 420 }}>
          {product.description}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--shop-text)" }}>
          {currency} {product.price.toFixed(2)}
        </Typography>
        <Typography variant="caption" sx={{ color: "var(--shop-muted)" }}>
          {product.currencyHint}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
          <Button
            variant="outlined"
            onClick={onAddToCart}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderColor: "var(--shop-action)",
              color: "var(--shop-action)",
              "&:hover": {
                borderColor: "var(--shop-action)",
                bgcolor: "color-mix(in srgb, var(--shop-action) 8%, transparent)",
              },
            }}
          >
            Add to cart
          </Button>
          <Button
            variant="contained"
            onClick={onBuyNow}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "var(--shop-action)",
              color: "var(--shop-action-text)",
              "&:hover": {
                bgcolor: "var(--shop-action)",
                filter: "brightness(1.05)",
              },
            }}
          >
            Buy now
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
