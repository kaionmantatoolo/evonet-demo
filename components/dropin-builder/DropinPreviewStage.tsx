"use client";

import type { ReactNode } from "react";
import { useSiteLocale } from "@/components/SiteLocaleProvider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { APPLE_PHONE_PREVIEW_WIDTH } from "@/lib/appleDesign";
import { cn } from "@/lib/utils";

interface DropinPreviewStageProps {
  pulsesEnabled: boolean;
  onPulsesChange: (enabled: boolean) => void;
  className?: string;
  children: ReactNode;
}

/**
 * Figma nested Drop-in stage (Frame 1073713220):
 * toolbar (title + Highlight UI Controls) → grey canvas → centered 390px white card.
 */
export function DropinPreviewStage({
  pulsesEnabled,
  onPulsesChange,
  className,
  children,
}: DropinPreviewStageProps) {
  const { messages } = useSiteLocale();
  const t = messages.builder;

  return (
    <div
      className={cn(
        "overflow-visible rounded-none border border-border bg-card",
        className
      )}
    >
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border px-3 py-2 sm:px-5">
        <span className="min-w-0 text-sm font-medium text-[#0a0a0a] dark:text-foreground">
          {t.dropinPreview}
        </span>
        <div className="flex min-w-0 max-w-full shrink-0 items-center gap-2">
          <Label
            htmlFor="preview-pulses"
            className="max-w-[11rem] text-right text-xs font-normal leading-snug text-[#737373] sm:max-w-none dark:text-muted-foreground"
          >
            {t.highlightUiControls}
          </Label>
          <Switch
            id="preview-pulses"
            checked={pulsesEnabled}
            onCheckedChange={onPulsesChange}
          />
        </div>
      </div>
      <div className="bg-[#F5F5F5] px-4 pb-8 pt-[30px] dark:bg-muted/50">
        <div
          className="mx-auto w-full overflow-visible rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
          style={{ maxWidth: APPLE_PHONE_PREVIEW_WIDTH }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
