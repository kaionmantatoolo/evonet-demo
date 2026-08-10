"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Portal,
  Stack,
  Typography,
} from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import type { DemoProduct } from "./demoProduct";
import { productImagesForColor } from "./demoProduct";
import {
  shopPrimaryButtonSx,
  shopSecondaryButtonSx,
  shopSizeButtonSx,
} from "./storefrontButtons";
import { bagBounce, enterUp } from "./storefrontMotion";
import type { StorefrontCssVars } from "../../lib/storefrontSnapshot";
import type { StorefrontCopy } from "../../lib/storefrontCopy";

interface StorefrontProductCardProps {
  product: DemoProduct;
  currency: string;
  selectedSize: string;
  selectedColorId: string;
  onSizeChange: (size: string) => void;
  onColorChange: (colorId: string) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  justAdded: boolean;
  /** Needed when sticky CTA is portaled outside the themed tree. */
  themeVars?: StorefrontCssVars;
  copy: StorefrontCopy;
}

export function StorefrontProductCard({
  product,
  currency,
  selectedSize,
  selectedColorId,
  onSizeChange,
  onColorChange,
  onAddToCart,
  onBuyNow,
  justAdded,
  themeVars,
  copy,
}: StorefrontProductCardProps) {
  const [activeImage, setActiveImage] = useState(0);
  const colorImages = productImagesForColor(product, selectedColorId);
  const selectedColor = product.colors.find((c) => c.id === selectedColorId);

  useEffect(() => {
    setActiveImage(0);
  }, [selectedColorId]);

  const savings =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100
        )
      : null;

  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: 3, lg: 6 },
        gridTemplateColumns: {
          xs: "1fr",
          md: "minmax(0, 1.15fr) minmax(0, 0.85fr)",
        },
        alignItems: "start",
      }}
    >
      <Stack spacing={1.5} sx={enterUp(80)}>
        <Box
          sx={{
            position: "relative",
            borderRadius: { xs: 2, md: 3 },
            overflow: "hidden",
            bgcolor: "var(--shop-muted-surface, #f3f4f6)",
            aspectRatio: "4 / 5",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
            transition: "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
            "&:hover": {
              transform: "translateY(-4px)",
            },
            "@media (prefers-reduced-motion: reduce)": {
              "&:hover": { transform: "none" },
            },
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Box
            component="img"
            key={colorImages[activeImage]?.src}
            src={colorImages[activeImage]?.src}
            alt={colorImages[activeImage]?.alt ?? product.name}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition:
                colorImages[activeImage]?.objectPosition ?? "50% 12%",
              display: "block",
              ...enterUp(0, 480),
            }}
          />
          {savings ? (
            <Chip
              label={`−${savings}%`}
              size="small"
              sx={{
                position: "absolute",
                top: 16,
                left: 16,
                bgcolor: "var(--shop-action)",
                color: "var(--shop-action-text)",
                fontWeight: 700,
                letterSpacing: 0.4,
                ...enterUp(200, 480),
              }}
            />
          ) : null}
        </Box>

        <Stack direction="row" spacing={1.25} sx={{ overflowX: "auto", pb: 0.5 }}>
          {colorImages.map((image, index) => {
            const selected = index === activeImage;
            return (
              <Box
                key={image.src}
                component="button"
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={copy.showImage(index + 1)}
                sx={{
                  p: 0,
                  border: selected
                    ? "2px solid var(--shop-action)"
                    : "1px solid var(--shop-border)",
                  borderRadius: 1.5,
                  overflow: "hidden",
                  width: 76,
                  height: 76,
                  flexShrink: 0,
                  cursor: "pointer",
                  bgcolor: "var(--shop-muted-surface, #f3f4f6)",
                  opacity: selected ? 1 : 0.72,
                  transition:
                    "opacity 160ms ease, border-color 160ms ease, transform 180ms ease",
                  transform: selected ? "scale(1)" : "scale(0.97)",
                  "&:hover": { opacity: 1, transform: "scale(1)" },
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <Box
                  component="img"
                  src={image.src}
                  alt=""
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: image.objectPosition ?? "50% 12%",
                    display: "block",
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      </Stack>

      <Stack spacing={2.75} sx={{ pt: { md: 1 }, pb: { xs: 1, md: 0 }, ...enterUp(160) }}>
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: "var(--shop-muted)",
              letterSpacing: 2.4,
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            {product.brand}
          </Typography>
          <Typography
            component="h1"
            sx={{
              mt: 0.75,
              fontFamily: "var(--shop-font-display)",
              fontWeight: 400,
              fontSize: { xs: "1.85rem", sm: "2.25rem", md: "2.75rem" },
              lineHeight: 1.05,
              letterSpacing: "0.02em",
              color: "var(--shop-text)",
            }}
          >
            {product.name}
          </Typography>
          <Typography
            sx={{
              mt: 1.75,
              color: "var(--shop-muted)",
              fontSize: "1.02rem",
              lineHeight: 1.65,
              maxWidth: 440,
            }}
          >
            {product.description}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="baseline">
          <Typography
            sx={{
              fontFamily: "var(--shop-font-display)",
              fontSize: "1.85rem",
              fontWeight: 400,
              color: "var(--shop-text)",
              letterSpacing: "0.02em",
            }}
          >
            {currency} {product.price.toFixed(2)}
          </Typography>
          {product.compareAtPrice ? (
            <Typography
              sx={{
                color: "var(--shop-muted)",
                textDecoration: "line-through",
                fontSize: "1.05rem",
              }}
            >
              {currency} {product.compareAtPrice.toFixed(2)}
            </Typography>
          ) : null}
        </Stack>

        <Divider sx={{ borderColor: "var(--shop-border)" }} />

        <Box>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1.25, fontWeight: 650, color: "var(--shop-text)" }}
          >
            {copy.colorLabel} —{" "}
            <Box component="span" sx={{ fontWeight: 500, color: "var(--shop-muted)" }}>
              {product.colors.find((c) => c.id === selectedColorId)?.label}
            </Box>
          </Typography>
          <Stack direction="row" spacing={1.25}>
            {product.colors.map((color) => {
              const selected = color.id === selectedColorId;
              return (
                <Box
                  key={color.id}
                  component="button"
                  type="button"
                  aria-label={color.label}
                  onClick={() => onColorChange(color.id)}
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: selected
                      ? "2px solid var(--shop-action)"
                      : "1px solid var(--shop-border)",
                    p: "3px",
                    bgcolor: "transparent",
                    cursor: "pointer",
                    transition: "transform 160ms ease, border-color 160ms ease",
                    transform: selected ? "scale(1.08)" : "scale(1)",
                    "&:hover": { transform: "scale(1.08)" },
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      bgcolor: color.swatch,
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.25 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 650 }}>
              {copy.sizeLabel}
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--shop-muted)" }}>
              {product.fit}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {product.sizes.map((size) => {
              const selected = size === selectedSize;
              return (
                <Button
                  key={size}
                  onClick={() => onSizeChange(size)}
                  variant={selected ? "contained" : "outlined"}
                  sx={shopSizeButtonSx(selected)}
                >
                  {size}
                </Button>
              );
            })}
          </Stack>
        </Box>

        <Stack
          spacing={1.25}
          sx={{ pt: 0.5, display: { xs: "none", md: "flex" } }}
        >
          <Button
            fullWidth
            size="large"
            variant="contained"
            onClick={onBuyNow}
            sx={shopPrimaryButtonSx}
          >
            {copy.buyNow(currency, product.price.toFixed(2))}
          </Button>
          <Button
            fullWidth
            size="large"
            variant="outlined"
            onClick={onAddToCart}
            sx={{
              ...shopSecondaryButtonSx,
              bgcolor: justAdded
                ? "color-mix(in srgb, var(--shop-action) 10%, transparent)"
                : "transparent",
              animation: justAdded
                ? `${bagBounce} 480ms cubic-bezier(0.22, 1, 0.36, 1)`
                : "none",
            }}
          >
            {justAdded ? copy.addedToBag : copy.addToBag}
          </Button>
        </Stack>

        {/* Mobile sticky CTA — portaled so parent enterUp/transform cannot trap fixed */}
        <Portal>
          <Box
            style={themeVars as CSSProperties | undefined}
            sx={{
              display: { xs: "block", md: "none" },
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: (theme) => theme.zIndex.modal + 6,
              px: 1.5,
              pt: 1.1,
              pb: "max(12px, env(safe-area-inset-bottom))",
              bgcolor: "var(--shop-bg, #f5f5f5)",
              borderTop: "1px solid var(--shop-border, #e7e2d9)",
              boxShadow: "0 -8px 24px rgba(28, 25, 23, 0.08)",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="stretch" sx={{ width: "100%" }}>
              <Button
                variant="outlined"
                onClick={onAddToCart}
                aria-label={justAdded ? copy.addedToBag : copy.addToBag}
                sx={{
                  ...shopSecondaryButtonSx,
                  flex: "0 0 auto",
                  minWidth: 52,
                  width: 52,
                  px: 0,
                  py: 1.35,
                  borderRadius: "12px",
                  bgcolor: justAdded
                    ? "color-mix(in srgb, var(--shop-action) 10%, transparent)"
                    : "var(--shop-surface, #fff)",
                  animation: justAdded
                    ? `${bagBounce} 480ms cubic-bezier(0.22, 1, 0.36, 1)`
                    : "none",
                }}
              >
                {justAdded ? (
                  <CheckRoundedIcon fontSize="small" />
                ) : (
                  <ShoppingBagOutlinedIcon fontSize="small" />
                )}
              </Button>
              <Button
                variant="contained"
                onClick={onBuyNow}
                sx={{
                  ...shopPrimaryButtonSx,
                  flex: "1 1 auto",
                  minWidth: 0,
                  width: "auto",
                  py: 1.35,
                  px: 1.5,
                  fontSize: "0.92rem",
                  borderRadius: "12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {copy.buyNowShort(currency, product.price.toFixed(2))}
              </Button>
            </Stack>
          </Box>
        </Portal>

        <Stack spacing={1} sx={{ pt: 0.5 }}>
          {product.highlights.map((item, index) => (
            <Typography
              key={item}
              variant="body2"
              sx={{
                color: "var(--shop-muted)",
                display: "flex",
                gap: 1,
                ...enterUp(280 + index * 60, 480),
              }}
            >
              <Box
                component="span"
                sx={{ color: "var(--shop-action)", fontWeight: 700 }}
              >
                ·
              </Box>
              {item}
            </Typography>
          ))}
        </Stack>

        <Box
          sx={{
            mt: 0.5,
            p: 2,
            borderRadius: 2,
            border: "1px solid var(--shop-border)",
            bgcolor: "color-mix(in srgb, var(--shop-bg) 88%, var(--shop-primary))",
            ...enterUp(460),
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "var(--shop-muted)", display: "block" }}
          >
            {copy.fabric}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.25 }}>
            {product.fabric}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "var(--shop-muted)", display: "block" }}
          >
            {copy.sku}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontFamily: "ui-monospace, monospace" }}
          >
            {selectedColor?.sku ?? product.colors[0]?.sku}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
