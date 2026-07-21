import { keyframes, type SxProps, type Theme } from "@mui/material";

export const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`;

export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.72);
  }
  to {
    opacity: 1;
    transform: none;
  }
`;

export const slideUpSheet = keyframes`
  from {
    opacity: 0.6;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`;

export const ringPulse = keyframes`
  0% {
    transform: scale(0.6);
    opacity: 0.55;
  }
  70% {
    transform: scale(1.35);
    opacity: 0;
  }
  100% {
    transform: scale(1.35);
    opacity: 0;
  }
`;

export const softShake = keyframes`
  0%, 100% { transform: none; }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
`;

export const bagBounce = keyframes`
  0% { transform: none; }
  35% { transform: scale(1.22); }
  65% { transform: scale(0.94); }
  100% { transform: none; }
`;

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const reducedMotion = {
  "@media (prefers-reduced-motion: reduce)": {
    opacity: 1,
    animation: "none",
    transform: "none",
  },
} as const;

/** Page shell fade-in (use once on the outermost content wrapper). */
export function pageEnter(delayMs = 0, durationMs = 420): SxProps<Theme> {
  return {
    opacity: 0,
    animation: `${fadeIn} ${durationMs}ms ease ${delayMs}ms both`,
    ...reducedMotion,
  };
}

/** Staggered section fade-up used across Evonet surfaces. */
export function sectionEnter(delayMs = 0, durationMs = 560): SxProps<Theme> {
  return {
    opacity: 0,
    animation: `${fadeUp} ${durationMs}ms ${EASE} ${delayMs}ms both`,
    ...reducedMotion,
  };
}

/** Alias kept for storefront call sites. */
export const enterUp = sectionEnter;

export function enterFade(delayMs = 0, durationMs = 480): SxProps<Theme> {
  return {
    opacity: 0,
    animation: `${fadeIn} ${durationMs}ms ease ${delayMs}ms both`,
    ...reducedMotion,
  };
}

export function enterScale(delayMs = 0, durationMs = 520): SxProps<Theme> {
  return {
    opacity: 0,
    animation: `${scaleIn} ${durationMs}ms ${EASE} ${delayMs}ms both`,
    ...reducedMotion,
  };
}

/** Subtle sheet content settle when a bottom drawer opens. */
export function sheetSlide(delayMs = 40, durationMs = 380): SxProps<Theme> {
  return {
    opacity: 0,
    animation: `${slideUpSheet} ${durationMs}ms ${EASE} ${delayMs}ms both`,
    ...reducedMotion,
  };
}
