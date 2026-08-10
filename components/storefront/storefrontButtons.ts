import type { SxProps, Theme } from "@mui/material";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Primary CTA — Buy now / Checkout / Continue shopping */
export const shopPrimaryButtonSx: SxProps<Theme> = {
  py: 1.5,
  px: 2.5,
  textTransform: "none",
  fontWeight: 650,
  fontSize: "0.98rem",
  letterSpacing: "-0.01em",
  borderRadius: 2.5,
  bgcolor: "var(--shop-action)",
  color: "var(--shop-action-text)",
  border: "1px solid color-mix(in srgb, var(--shop-action) 82%, #fff)",
  boxShadow: [
    "0 1px 0 color-mix(in srgb, #fff 22%, transparent) inset",
    "0 10px 28px color-mix(in srgb, var(--shop-action) 32%, transparent)",
  ].join(", "),
  transition: `transform 200ms ${EASE}, filter 200ms ease, box-shadow 200ms ease`,
  "&:hover": {
    bgcolor: "var(--shop-action)",
    filter: "brightness(1.08)",
    transform: "translateY(-2px)",
    boxShadow: [
      "0 1px 0 color-mix(in srgb, #fff 28%, transparent) inset",
      "0 16px 36px color-mix(in srgb, var(--shop-action) 40%, transparent)",
    ].join(", "),
  },
  "&:active": {
    transform: "translateY(0)",
    filter: "brightness(0.98)",
  },
};

/** Secondary outline — Add to bag / Back to product */
export const shopSecondaryButtonSx: SxProps<Theme> = {
  py: 1.4,
  px: 2.5,
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.98rem",
  letterSpacing: "-0.01em",
  borderRadius: 2.5,
  border: "1.5px solid var(--shop-action)",
  color: "var(--shop-action)",
  bgcolor: "transparent",
  boxShadow: "none",
  transition: `transform 200ms ${EASE}, background-color 200ms ease, border-color 200ms ease`,
  "&:hover": {
    borderColor: "var(--shop-action)",
    bgcolor: "color-mix(in srgb, var(--shop-action) 12%, var(--shop-surface))",
    transform: "translateY(-1px)",
  },
  "&:active": {
    transform: "translateY(0)",
  },
};

/** Soft ghost / text action */
export const shopGhostButtonSx: SxProps<Theme> = {
  textTransform: "none",
  fontWeight: 550,
  color: "var(--shop-muted)",
  borderRadius: 2,
  px: 1.5,
  transition: "color 160ms ease, background-color 160ms ease",
  "&:hover": {
    color: "var(--shop-text)",
    bgcolor: "color-mix(in srgb, var(--shop-text) 5%, transparent)",
  },
};

/** Size chip selector */
export const shopSizeButtonSx = (selected: boolean): SxProps<Theme> => ({
  minWidth: 52,
  px: 1.5,
  py: 0.95,
  textTransform: "none",
  fontWeight: 650,
  borderRadius: 2,
  border: selected
    ? "1.5px solid var(--shop-action)"
    : "1px solid var(--shop-border)",
  bgcolor: selected ? "var(--shop-action)" : "var(--shop-surface, transparent)",
  color: selected ? "var(--shop-action-text)" : "var(--shop-text)",
  boxShadow: selected
    ? "0 6px 16px color-mix(in srgb, var(--shop-action) 22%, transparent)"
    : "none",
  transition: `transform 160ms ${EASE}, background-color 160ms ease, box-shadow 160ms ease`,
  "&:hover": {
    borderColor: "var(--shop-action)",
    bgcolor: selected
      ? "var(--shop-action)"
      : "color-mix(in srgb, var(--shop-action) 8%, transparent)",
    transform: "translateY(-1px)",
  },
});

/** Compact qty − / + control */
export const shopQtyButtonSx: SxProps<Theme> = {
  minWidth: 36,
  width: 36,
  height: 36,
  p: 0,
  borderRadius: 1.75,
  border: "1px solid var(--shop-border)",
  color: "var(--shop-text)",
  bgcolor: "var(--shop-surface, #fff)",
  fontWeight: 650,
  fontSize: "1.05rem",
  lineHeight: 1,
  transition: `background-color 140ms ease, border-color 140ms ease, transform 140ms ${EASE}`,
  "&:hover": {
    borderColor: "var(--shop-action)",
    bgcolor: "color-mix(in srgb, var(--shop-action) 6%, transparent)",
  },
  "&:active": {
    transform: "scale(0.94)",
  },
};
