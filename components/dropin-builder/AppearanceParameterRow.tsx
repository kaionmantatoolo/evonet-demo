"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

function normalizeHexColor(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const candidate = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9a-fA-F]{6}$/.test(candidate)) return candidate.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(candidate)) return candidate.toLowerCase();
  return raw;
}

interface AppearanceColorRowProps {
  label: string;
  caption?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  /** Builder live pulse: fire on focus / change of this parameter. */
  onPulse?: () => void;
}

export function AppearanceColorRow({
  label,
  caption,
  value,
  placeholder = "#212121",
  onChange,
  onPulse,
}: AppearanceColorRowProps) {
  const pickerValue = normalizeHexColor(value) || placeholder;
  const safePicker =
    /^#[0-9a-fA-F]{6}$/.test(pickerValue) || /^#[0-9a-fA-F]{3}$/.test(pickerValue)
      ? pickerValue.length === 4
        ? `#${pickerValue[1]}${pickerValue[1]}${pickerValue[2]}${pickerValue[2]}${pickerValue[3]}${pickerValue[3]}`
        : pickerValue
      : placeholder;

  return (
    <div
      className="flex min-h-[5.75rem] flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
      onFocusCapture={() => onPulse?.()}
    >
      <div className="min-w-0 flex-1 space-y-1 sm:pr-2">
        <Label className="font-mono text-sm font-normal leading-5 text-[#5d5d5d] dark:text-muted-foreground">
          {label}
        </Label>
        {/* Reserve 3 caption lines so every color row shares the same rhythm. */}
        <p className="min-h-[3.75rem] text-xs leading-relaxed text-[#737373] dark:text-muted-foreground">
          {caption ?? ""}
        </p>
      </div>
      <div className="grid w-full grid-cols-[36px_1fr] gap-2 sm:w-[220px] sm:shrink-0 sm:pt-0.5">
        <input
          className="h-8 w-9 cursor-pointer rounded border border-input bg-background p-0.5"
          type="color"
          value={safePicker}
          onChange={(event) => {
            onPulse?.();
            onChange(event.target.value);
          }}
          aria-label={`${label} color picker`}
        />
        <Input
          value={value}
          onChange={(event) => {
            onPulse?.();
            onChange(event.target.value);
          }}
          placeholder={placeholder}
          className="font-mono"
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}

interface AppearanceSliderRowProps {
  label: string;
  caption?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  onPulse?: () => void;
}

export function AppearanceSliderRow({
  label,
  caption,
  value,
  min = 0,
  max = 100,
  onChange,
  onPulse,
}: AppearanceSliderRowProps) {
  return (
    <div className="min-h-[5.5rem] space-y-2.5" onFocusCapture={() => onPulse?.()}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <Label className="font-mono text-sm font-normal leading-5 text-[#5d5d5d] dark:text-muted-foreground">
            {label}
          </Label>
          <p className="min-h-[2.5rem] text-xs leading-relaxed text-[#737373] dark:text-muted-foreground">
            {caption ?? ""}
          </p>
        </div>
        <span className="shrink-0 pt-0.5 font-mono text-sm tabular-nums text-[#5d5d5d] dark:text-muted-foreground">
          {value}pt
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(next) => {
          const first = next[0];
          if (typeof first === "number") {
            onPulse?.();
            onChange(first);
          }
        }}
        onPointerDown={() => onPulse?.()}
        aria-label={label}
      />
    </div>
  );
}

interface AppearanceTextRowProps {
  label: string;
  caption?: string;
  className?: string;
  children: ReactNode;
  onPulse?: () => void;
}

export function AppearanceTextRow({
  label,
  caption,
  className,
  children,
  onPulse,
}: AppearanceTextRowProps) {
  return (
    <div
      className={cn(
        "flex min-h-[4.5rem] flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className
      )}
      onFocusCapture={() => onPulse?.()}
    >
      <div className="min-w-0 flex-1 space-y-1 sm:pr-2">
        <Label className="font-mono text-sm font-normal leading-5 text-[#5d5d5d] dark:text-muted-foreground">
          {label}
        </Label>
        <p className="min-h-[2.5rem] text-xs leading-relaxed text-[#737373] dark:text-muted-foreground">
          {caption ?? ""}
        </p>
      </div>
      <div className="w-full sm:w-[220px] sm:shrink-0 sm:pt-0.5">{children}</div>
    </div>
  );
}
