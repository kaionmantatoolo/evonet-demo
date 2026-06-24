export const CODE_PANEL_FONT =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" as const;

export const CODE_PANEL_PRE_SX = {
  m: 0,
  minWidth: 0,
  width: "100%",
  p: 2,
  borderRadius: 2,
  border: "1px solid #E5E7EB",
  bgcolor: "#0B1220",
  color: "#E5E7EB",
  fontSize: 12,
  lineHeight: 1.5,
  fontFamily: CODE_PANEL_FONT,
  overflowX: "auto",
  overflowY: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
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
  borderRadius: 3,
  border: "1px solid",
  borderColor: "#E5E7EB",
  bgcolor: "#FFFFFF",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
} as const;

export const DEV_CONSOLE_SECTION_TITLE_SX = {
  fontWeight: 600,
  mb: 1.5,
  color: "#1F2937",
} as const;
