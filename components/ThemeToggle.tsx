"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useSiteLocale } from "@/components/SiteLocaleProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  /** Compact icon-only control (default). */
  size?: "icon" | "sm";
  /** Button chrome — use ghost inside glass pills. */
  variant?: "outline" | "ghost";
}

type ViewTransitionLike = {
  ready: Promise<void>;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Circular reveal from the toggle — new theme expands from (x, y).
 * Falls back to an instant switch when View Transitions / motion are unavailable.
 */
function setThemeFromPoint(
  next: "light" | "dark",
  setTheme: (theme: string) => void,
  x: number,
  y: number
) {
  const doc = document as Document & {
    startViewTransition?: (update: () => void) => ViewTransitionLike;
  };

  if (!doc.startViewTransition || prefersReducedMotion()) {
    setTheme(next);
    return;
  }

  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  document.documentElement.dataset.themeTransition = "running";

  const transition = doc.startViewTransition(() => {
    flushSync(() => {
      setTheme(next);
    });
  });

  void transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 560,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    })
    .finally(() => {
      // Clear after the reveal window; VT cleans itself up.
      window.setTimeout(() => {
        delete document.documentElement.dataset.themeTransition;
      }, 600);
    });
}

/**
 * Toggles Light ↔ Dark with a circular reveal from the control.
 * Initial theme follows the device preference (see AppThemeProvider).
 */
export function ThemeToggle({
  className,
  size = "icon",
  variant = "outline",
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { messages } = useSiteLocale();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";
  const lightLabel = messages.common.light;
  const darkLabel = messages.common.dark;

  if (!mounted) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size === "icon" ? "icon" : "sm"}
        className={cn(size === "icon" ? "size-8" : undefined, className)}
        aria-label={messages.common.theme}
        disabled
      >
        <Sun className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant={variant}
      size={size === "icon" ? "icon" : "sm"}
      className={cn(size === "icon" ? "size-8 shrink-0" : "gap-1.5", className)}
      onClick={() => {
        const next = isDark ? "light" : "dark";
        const rect = buttonRef.current?.getBoundingClientRect();
        const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
        const y = rect ? rect.top + rect.height / 2 : 0;
        setThemeFromPoint(next, setTheme, x, y);
      }}
      aria-label={isDark ? lightLabel : darkLabel}
      title={isDark ? darkLabel : lightLabel}
    >
      {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      {size === "sm" ? (
        <span className="text-xs font-medium">{isDark ? darkLabel : lightLabel}</span>
      ) : null}
    </Button>
  );
}
