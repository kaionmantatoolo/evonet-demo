import { keyframes, type SxProps, type Theme } from "@mui/material";

export const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
    transform: scale(1);
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
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
`;

export const bagBounce = keyframes`
  0% { transform: scale(1); }
  35% { transform: scale(1.22); }
  65% { transform: scale(0.94); }
  100% { transform: scale(1); }
`;

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Staggered fade-up entrance used across storefront surfaces. */
export function enterUp(delayMs = 0, durationMs = 560): SxProps<Theme> {
  return {
    opacity: 0,
    animation: `${fadeUp} ${durationMs}ms ${EASE} ${delayMs}ms both`,
    "@media (prefers-reduced-motion: reduce)": {
      opacity: 1,
      animation: "none",
    },
  };
}

export function enterFade(delayMs = 0, durationMs = 480): SxProps<Theme> {
  return {
    opacity: 0,
    animation: `${fadeIn} ${durationMs}ms ease ${delayMs}ms both`,
    "@media (prefers-reduced-motion: reduce)": {
      opacity: 1,
      animation: "none",
    },
  };
}

export function enterScale(delayMs = 0, durationMs = 520): SxProps<Theme> {
  return {
    opacity: 0,
    animation: `${scaleIn} ${durationMs}ms ${EASE} ${delayMs}ms both`,
    "@media (prefers-reduced-motion: reduce)": {
      opacity: 1,
      animation: "none",
    },
  };
}
