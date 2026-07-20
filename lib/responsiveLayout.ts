import type { SxProps, Theme } from "@mui/material";

/**
 * Complex two-pane tools (Builder) stack until `md` (900px)
 * so phones / narrow tablets stay single-column.
 */
export const TWO_PANE_SPLIT_BP = "md" as const;

/** Full viewport height that respects mobile browser chrome. */
export const VIEWPORT_HEIGHT = "100dvh";

/**
 * Checkout bottom sheet — nearly full screen on iPhone.
 * Uses dvh + safe-area so Safari chrome / home indicator do not clip Drop-in.
 */
export const SHEET_MAX_HEIGHT =
  "calc(100dvh - env(safe-area-inset-top, 0px))";

/** Bag sheet — slightly shorter so checkout sheet feels primary. */
export const BAG_SHEET_MAX_HEIGHT =
  "min(calc(100dvh - env(safe-area-inset-top, 0px) - 48px), 820px)";

/** Sticky mobile CTA clearance under page content. */
export const STICKY_CTA_CLEARANCE = { xs: 12, md: 0 } as const;

/** Standard page vertical padding. */
export const pagePaddingY: SxProps<Theme> = {
  py: { xs: 3, sm: 4, md: 8 },
};

/** Tighter padding for tool consoles. */
export const toolPaddingY: SxProps<Theme> = {
  py: { xs: 2, sm: 2.5, md: 3 },
};

/** Drop-in preview panel — allow scroll, never trap with fixed overflow hidden. */
export const dropinPreviewPanelSx: SxProps<Theme> = {
  minHeight: 0,
  overflow: "auto",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain",
};

/** Detail definition lists: stack on xs, label|value from sm. */
export const detailDlGridSx: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "minmax(120px, 140px) 1fr" },
  gap: { xs: 0.35, sm: 1 },
  m: 0,
};

/** Independent scroll pane for split desktop layouts. */
export function splitPaneScrollSx(maxHeight?: string): SxProps<Theme> {
  return {
    minHeight: 0,
    height: { [TWO_PANE_SPLIT_BP]: "100%" },
    maxHeight: maxHeight
      ? { [TWO_PANE_SPLIT_BP]: maxHeight }
      : { [TWO_PANE_SPLIT_BP]: `calc(${VIEWPORT_HEIGHT} - 32px)` },
    overflowY: { [TWO_PANE_SPLIT_BP]: "auto" },
    WebkitOverflowScrolling: "touch",
  };
}
