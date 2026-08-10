"use client";

import { useState } from "react";
import { useSiteLocale } from "@/components/SiteLocaleProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface UiConfigImportPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (text: string) => string | null;
  onNotify?: (message: string) => void;
}

export function UiConfigImportPanel({
  open,
  onOpenChange,
  onApply,
  onNotify,
}: UiConfigImportPanelProps) {
  const { messages } = useSiteLocale();
  const tc = messages.common;
  const [draft, setDraft] = useState("");

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setDraft(text);
      onNotify?.(tc.pasted);
    } catch {
      onNotify?.(tc.pasteFailed);
    }
  };

  const handleApply = () => {
    const error = onApply(draft);
    if (error) {
      onNotify?.(error);
      return;
    }
    setDraft("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setDraft("");
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="space-y-3 rounded-none border border-border bg-muted/30 p-3">
      <p className="text-xs text-[#737373] dark:text-muted-foreground">
        {messages.builder.importPanelHint}
      </p>
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder='{ "uiOption": { ... }, "appearance": { ... } }'
        className="min-h-[140px] font-mono text-xs"
        aria-label="Import UI config JSON"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void handlePaste()}>
          {tc.paste}
        </Button>
        <Button type="button" size="sm" onClick={handleApply}>
          {tc.apply}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
          {tc.cancel}
        </Button>
      </div>
    </div>
  );
}
