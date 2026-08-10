export const CODE_PANEL_FONT =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" as const;

export const CODE_PANEL_PRE_SX = {
  m: 0,
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  p: 2,
  pr: 1.5,
  borderRadius: 0,
  border: "1px solid #E5E7EB",
  bgcolor: "#0B1220",
  color: "#E5E7EB",
  fontSize: 12,
  lineHeight: 1.5,
  fontFamily: CODE_PANEL_FONT,
  overflowX: "auto",
  overflowY: "auto",
  overscrollBehavior: "contain",
  scrollbarGutter: "stable",
  direction: "ltr",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  "&::-webkit-scrollbar": {
    width: 8,
    height: 8,
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(148, 163, 184, 0.45)",
    borderRadius: 0,
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "rgba(148, 163, 184, 0.7)",
  },
} as const;

export const CODE_PANEL_SCROLL_SX = {
  ...CODE_PANEL_PRE_SX,
  minHeight: 300,
  maxHeight: 360,
} as const;

export const CODE_PANEL_EMPTY_SX = {
  color: "#94A3B8",
  fontSize: 12,
  lineHeight: 1.5,
  fontFamily: CODE_PANEL_FONT,
} as const;

export const DEV_CONSOLE_PAPER_SX = {
  p: 3,
  borderRadius: 0,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  boxShadow: "none",
} as const;

/** Prefer Tailwind `text-foreground` — avoid hardcoded light-theme gray. */
export const DEV_CONSOLE_SECTION_TITLE_SX = {
  fontWeight: 600,
  mb: 1.5,
  color: "inherit",
} as const;
