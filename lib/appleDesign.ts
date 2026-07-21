import type { Theme } from "@mui/material";
import type { SystemStyleObject } from "@mui/system";

/** Apple HIG / iOS 27 system colors for the demo tool shell (not Storefront). */
export const apple = {
  systemBackground: "#F2F2F7",
  secondaryGroupedBackground: "#FFFFFF",
  tertiaryGroupedBackground: "#F2F2F7",
  label: "#1C1C1E",
  secondaryLabel: "rgba(60, 60, 67, 0.6)",
  tertiaryLabel: "rgba(60, 60, 67, 0.3)",
  separator: "rgba(60, 60, 67, 0.29)",
  opaqueSeparator: "#C6C6C8",
  systemBlue: "#007AFF",
  systemBluePressed: "#0066D6",
  systemGreen: "#34C759",
  systemOrange: "#FF9500",
  systemRed: "#FF3B30",
  fill: "rgba(120, 120, 128, 0.12)",
  fillSecondary: "rgba(120, 120, 128, 0.08)",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif',
} as const;

export const appleHairline = `1px solid ${apple.separator}`;

/** Standard horizontal inset for grouped lists (16pt). */
export const APPLE_INSET_X = 2;

type AppleSx = SystemStyleObject<Theme>;

/** Readable Liquid Glass bar (iOS 27 tinted, dark edge). */
export const appleGlassBarSx: AppleSx = {
  bgcolor: "rgba(255, 255, 255, 0.72)",
  backdropFilter: "blur(28px) saturate(1.45)",
  WebkitBackdropFilter: "blur(28px) saturate(1.45)",
  borderBottom: appleHairline,
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,0.65)",
    "0 1px 0 rgba(0,0,0,0.04)",
  ].join(", "),
};

/** Thin Apple-like scrollbar for tool panes (WebKit + Firefox). */
export const appleScrollbarCss = `
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(60, 60, 67, 0.35) transparent;
  }
  *::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  *::-webkit-scrollbar-track {
    background: transparent;
    margin: 8px;
  }
  *::-webkit-scrollbar-thumb {
    background: rgba(60, 60, 67, 0.28);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  *::-webkit-scrollbar-thumb:hover {
    background: rgba(60, 60, 67, 0.45);
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  *::-webkit-scrollbar-corner {
    background: transparent;
  }
  /* Soften horizontal thumbs inside Evonet Drop-in (More payment methods) */
  [id^="evonet-dropin"] *::-webkit-scrollbar {
    height: 4px;
    width: 4px;
  }
  [id^="evonet-dropin"] *::-webkit-scrollbar-track {
    margin: 4px 8px;
  }
`;

/**
 * Scrollable tool pane — Apple HIG: content stays clear of chrome;
 * scrollbar uses the reserved gutter (not painted over the card border).
 */
export const appleScrollPaneSx: AppleSx = {
  minWidth: 0,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain",
  scrollbarGutter: "stable",
};

/** Consistent outer inset for tool page columns (16pt). */
export const appleToolColumnInsetSx: AppleSx = {
  px: APPLE_INSET_X,
};

/**
 * Outer column scroll for Drop-in preview.
 * - Grouped grey canvas so 24pt inset around the white phone frame is visible
 * - scrollbarGutter reserves the far-right track outside the phone frame
 */
export const applePreviewColumnScrollSx: AppleSx = {
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  width: "100%",
  overflowY: "auto",
  // clip (not hidden) so we don't force a paired overflow-y:auto on children
  overflowX: "clip",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain",
  scrollbarGutter: "stable",
  bgcolor: apple.systemBackground,
  // 16pt inset; extra right for scrollbar gutter outside the phone frame
  pl: APPLE_INSET_X,
  pr: 2.5,
  pt: APPLE_INSET_X,
  pb: APPLE_INSET_X,
  boxSizing: "border-box",
};

/** iPhone logical width for Drop-in preview (pt ≈ px at 1x). */
export const APPLE_PHONE_PREVIEW_WIDTH = 390;

/**
 * @deprecated Prefer DropinPreviewStage component.
 */
export const appleDropinDeviceSx: AppleSx = {
  width: "100%",
  maxWidth: APPLE_PHONE_PREVIEW_WIDTH,
  borderRadius: "20px",
  border: appleHairline,
  bgcolor: apple.secondaryGroupedBackground,
  p: 2,
  overflow: "visible",
  boxSizing: "border-box",
};

/** Tool section — grey page, white grouped cards only (no nested white paper). */
export const appleToolPaperSx: AppleSx = {
  bgcolor: "transparent",
  border: "none",
  boxShadow: "none",
  borderRadius: 0,
  p: 0,
  mb: 2,
  maxWidth: "100%",
  minWidth: 0,
  overflow: "visible",
};

/** Compact vertical rhythm for tool form columns (desktop config density). */
export const appleToolStackSpacing = { xs: 1.75, md: 2 } as const;

/** Color swatch size inside Theme rows (compact). */
export const APPLE_COLOR_SWATCH_SIZE = 28;

/** Glass chrome for preview shells / floating panels. */
export const appleGlassPanelSx: AppleSx = {
  bgcolor: "rgba(255, 255, 255, 0.78)",
  backdropFilter: "blur(32px) saturate(1.5)",
  WebkitBackdropFilter: "blur(32px) saturate(1.5)",
  border: "1px solid rgba(0, 0, 0, 0.12)",
  borderRadius: 3,
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,0.7)",
    "0 8px 28px rgba(0,0,0,0.06)",
  ].join(", "),
  overflow: "hidden",
};

/** Settings-style grouped inset section (iOS 12pt corner radius). */
export const appleGroupedSectionSx: AppleSx = {
  bgcolor: apple.secondaryGroupedBackground,
  borderRadius: "12px",
  border: appleHairline,
  overflow: "hidden",
  boxShadow: "none",
};

/** Section title above a grouped card (uppercase caption). */
export const appleToolTitleSx: AppleSx = {
  px: 0,
  pt: 0,
  pb: 0.75,
  mb: 0.25,
  fontSize: "0.75rem",
  fontWeight: 500,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: apple.secondaryLabel,
};

/** Section header above a grouped list (caption style). */
export const appleSectionHeaderSx: AppleSx = {
  px: 0,
  pt: 0,
  pb: 0.75,
  mb: 0.25,
  fontSize: "0.75rem",
  fontWeight: 500,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: apple.secondaryLabel,
};

/** Primary capsule CTA. */
export const appleCapsuleButtonSx: AppleSx = {
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.9375rem",
  letterSpacing: "-0.01em",
  borderRadius: 999,
  px: 2.5,
  py: 1,
  bgcolor: apple.systemBlue,
  color: "#fff",
  boxShadow: "none",
  "&:hover": {
    bgcolor: apple.systemBluePressed,
    boxShadow: "none",
  },
  "&:active": {
    opacity: 0.88,
  },
};

/** Secondary / outline capsule. */
export const appleCapsuleOutlineSx: AppleSx = {
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.9375rem",
  letterSpacing: "-0.01em",
  borderRadius: 999,
  px: 2.5,
  py: 0.95,
  border: `1.5px solid ${apple.systemBlue}`,
  color: apple.systemBlue,
  bgcolor: "transparent",
  "&:hover": {
    borderColor: apple.systemBlue,
    bgcolor: "rgba(0, 122, 255, 0.08)",
  },
};

/** Page shell background for tool / marketing pages. */
export const applePageShellSx: AppleSx = {
  minHeight: "100dvh",
  bgcolor: apple.systemBackground,
  color: apple.label,
  fontFamily: apple.fontFamily,
};

/** Display title (SF Pro Display feel). */
export const appleDisplayTitleSx: AppleSx = {
  fontFamily: apple.fontFamily,
  fontWeight: 700,
  letterSpacing: "-0.035em",
  lineHeight: 1.08,
  color: apple.label,
};

/** Body secondary label. */
export const appleBodySecondarySx: AppleSx = {
  color: apple.secondaryLabel,
  lineHeight: 1.55,
  fontSize: "1.0625rem",
};

/** Desktop tool settings row — compact (36pt), 16pt horizontal inset. */
export const appleSettingsRowSx: AppleSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1.5,
  minHeight: 36,
  px: APPLE_INSET_X,
  py: 0.875,
  bgcolor: apple.secondaryGroupedBackground,
  "&:not(:last-child)": {
    borderBottom: appleHairline,
  },
};

/** Static field label above (standalone / grid cell). */
export const appleFormFieldLabelSx: AppleSx = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 500,
  color: apple.secondaryLabel,
  mb: 0.25,
  lineHeight: 1.2,
};

/** Inline Settings row label (left side). */
export const appleFormFieldInlineLabelSx: AppleSx = {
  flexShrink: 0,
  maxWidth: "46%",
  pr: 1,
  fontSize: "0.875rem",
  fontWeight: 400,
  color: apple.label,
  lineHeight: 1.25,
};

/**
 * Compact inset input — visible fill + hairline edge, no Material notch.
 */
export const appleFormInputSx: AppleSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    bgcolor: "rgba(120, 120, 128, 0.18)",
    fontSize: "0.875rem",
    lineHeight: 1.3,
    letterSpacing: "-0.01em",
    boxShadow: `inset 0 0 0 1px ${apple.separator}`,
    transition: "background-color 120ms ease, box-shadow 120ms ease",
    "& fieldset": { border: "none" },
    "&:hover fieldset": { border: "none" },
    "&.Mui-focused fieldset": { border: "none" },
    "&:hover": {
      bgcolor: "rgba(120, 120, 128, 0.22)",
    },
    "&.Mui-focused": {
      bgcolor: "#FFFFFF",
      boxShadow: `inset 0 0 0 1.5px ${apple.systemBlue}`,
    },
    "&.Mui-disabled": {
      bgcolor: apple.fillSecondary,
      opacity: 0.65,
    },
    "&.Mui-error": {
      boxShadow: `inset 0 0 0 1.5px ${apple.systemRed}`,
    },
  },
  "& .MuiOutlinedInput-input": {
    padding: "5px 8px",
    height: "auto",
    color: apple.label,
    "&::placeholder": {
      color: apple.secondaryLabel,
      opacity: 1,
    },
  },
  "& .MuiSelect-select": {
    padding: "5px 8px !important",
    paddingRight: "28px !important",
    minHeight: "auto !important",
    color: apple.label,
  },
  "& .MuiSelect-icon": {
    right: 6,
    color: apple.secondaryLabel,
  },
};

/** Trailing value input in an inline Settings row (right-aligned). */
export const appleFormInputTrailingSx: AppleSx = {
  ...appleFormInputSx,
  "& .MuiOutlinedInput-input": {
    padding: "5px 8px",
    textAlign: "right",
    height: "auto",
    color: apple.label,
    "&::placeholder": {
      color: apple.secondaryLabel,
      opacity: 1,
      textAlign: "right",
    },
  },
  "& .MuiSelect-select": {
    padding: "5px 8px !important",
    paddingRight: "28px !important",
    minHeight: "auto !important",
    textAlign: "right",
    color: apple.label,
  },
};

/** Inline Settings row — label left, control right (~36–40px). */
export const appleFormFieldGroupedRowSx: AppleSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  minHeight: 36,
  px: APPLE_INSET_X,
  py: 0.5,
  bgcolor: apple.secondaryGroupedBackground,
  "&:not(:last-child)": {
    borderBottom: appleHairline,
  },
};

/** Multi-column cell inside a grouped card (label above, tight). */
export const appleFormFieldGridCellSx: AppleSx = {
  px: 1.5,
  py: 0.75,
  bgcolor: apple.secondaryGroupedBackground,
  minWidth: 0,
};

/** Standalone field block (label above, optional on grey canvas). */
export const appleFormFieldStandaloneSx: AppleSx = {
  width: "100%",
};

/** @deprecated Use appleFormInputSx */
export const appleInsetFieldSx: AppleSx = appleFormInputSx;

/** iOS-style switch sizing (use with MuiSwitch overrides). */
export const appleIosSwitchSx: AppleSx = {
  width: 51,
  height: 31,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: 0,
    margin: "2px",
    transitionDuration: "200ms",
    "&.Mui-checked": {
      transform: "translateX(20px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        bgcolor: apple.systemBlue,
        opacity: 1,
      },
    },
  },
  "& .MuiSwitch-thumb": {
    width: 27,
    height: 27,
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  "& .MuiSwitch-track": {
    borderRadius: 16,
    bgcolor: "#E9E9EA",
    opacity: 1,
  },
};

/** Error / demo banner (replaces Material Alert chrome). */
export const appleBannerErrorSx: AppleSx = {
  borderRadius: 1.5,
  border: "1px solid rgba(255, 59, 48, 0.35)",
  bgcolor: "rgba(255, 59, 48, 0.06)",
  color: apple.label,
  px: 1.5,
  py: 0.75,
  fontSize: "0.75rem",
  lineHeight: 1.35,
};

export const appleBannerInfoSx: AppleSx = {
  borderRadius: 1.5,
  border: `1px solid rgba(0, 122, 255, 0.25)`,
  bgcolor: "rgba(0, 122, 255, 0.06)",
  color: apple.label,
  px: 1.5,
  py: 0.75,
  fontSize: "0.75rem",
  lineHeight: 1.35,
};

export const appleBannerSuccessSx: AppleSx = {
  borderRadius: 1.5,
  border: "1px solid rgba(52, 199, 89, 0.35)",
  bgcolor: "rgba(52, 199, 89, 0.08)",
  color: apple.label,
  px: 1.5,
  py: 0.75,
  fontSize: "0.75rem",
  lineHeight: 1.35,
};

export const appleBannerWarningSx: AppleSx = {
  borderRadius: 1.5,
  border: "1px solid rgba(255, 149, 0, 0.35)",
  bgcolor: "rgba(255, 149, 0, 0.08)",
  color: apple.label,
  px: 1.5,
  py: 0.75,
  fontSize: "0.75rem",
  lineHeight: 1.35,
};

/** Preview shell outer paper chrome. */
export const applePreviewShellPaperSx: AppleSx = {
  bgcolor: "rgba(255, 255, 255, 0.92)",
  border: appleHairline,
  borderRadius: 3,
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,0.7)",
    "0 8px 28px rgba(0,0,0,0.06)",
  ].join(", "),
  height: { md: "100%" },
  minHeight: 0,
  minWidth: 0,
  maxWidth: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};
