"use client";

import { useEffect, useState } from "react";
import {
  MERCHANT_SNIFF_SNIPPET,
  maskPan,
  sniffPciDom,
  type PciSniffSnapshot,
} from "../../lib/pciDomSniff";
import { copyTextToClipboard } from "../../lib/copyTextToClipboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SiteMessages } from "@/lib/i18n";

type PciSniffCopy = SiteMessages["pciSniff"];

interface PciMerchantSnifferProps {
  copy: PciSniffCopy;
  commonCopy: { copy: string };
  pollMs?: number;
  /** When true, show full PAN digits (for internal team demos). */
  revealFullValues?: boolean;
}

function FieldRow({
  label,
  value,
  exposed,
  emptyHint,
  readableLabel,
  notSetLabel,
}: {
  label: string;
  value: string;
  exposed: boolean;
  emptyHint: string;
  readableLabel: string;
  notSetLabel: string;
}) {
  return (
    <div
      className={[
        "rounded-lg border px-3 py-2.5 transition-colors duration-300",
        exposed
          ? "border-red-500/50 bg-red-500/10"
          : "border-border/80 bg-muted/40 dark:border-white/10 dark:bg-black/25",
      ].join(" ")}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        <span
          className={[
            "text-[10px] font-semibold uppercase tracking-wider",
            exposed ? "text-red-600 dark:text-red-300" : "text-emerald-600 dark:text-emerald-400/80",
          ].join(" ")}
        >
          {exposed ? readableLabel : notSetLabel}
        </span>
      </div>
      <div
        className={[
          "font-mono text-[15px] leading-snug break-all",
          exposed ? "text-red-700 dark:text-red-100" : "text-muted-foreground/70",
        ].join(" ")}
      >
        {value || emptyHint}
      </div>
    </div>
  );
}

export function PciMerchantSniffer({
  copy: t,
  commonCopy,
  pollMs = 200,
  revealFullValues = true,
}: PciMerchantSnifferProps) {
  const [snap, setSnap] = useState<PciSniffSnapshot | null>(null);
  const [copied, setCopied] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let alive = true;
    let lastSig = "";

    const tick = () => {
      if (!alive) return;
      const next = sniffPciDom();
      const sig = JSON.stringify({
        pan: next.fields.find((f) => f.kind === "pan")?.digits ?? "",
        exp: next.fields.find((f) => f.kind === "expiry")?.digits ?? "",
        cvc: next.fields.find((f) => f.kind === "cvv")?.digits ?? "",
        arch: next.architectureFail,
      });
      if (sig !== lastSig) {
        lastSig = sig;
        setSnap(next);
        setPulse((n) => n + 1);
      } else {
        setSnap(next);
      }
    };

    tick();
    const id = window.setInterval(tick, pollMs);

    const onAny = () => tick();
    document.addEventListener("input", onAny, true);
    document.addEventListener("change", onAny, true);
    document.addEventListener("keyup", onAny, true);

    return () => {
      alive = false;
      window.clearInterval(id);
      document.removeEventListener("input", onAny, true);
      document.removeEventListener("change", onAny, true);
      document.removeEventListener("keyup", onAny, true);
    };
  }, [pollMs]);

  const panField = snap?.fields.find((f) => f.kind === "pan");
  const expField = snap?.fields.find((f) => f.kind === "expiry");
  const cvvField = snap?.fields.find((f) => f.kind === "cvv");

  const cvvPresent = Boolean(cvvField?.inTopDocument);
  const cvvHasDigits = Boolean(cvvField && cvvField.digits.length >= 3);

  const panDisplay = panField?.digits
    ? revealFullValues
      ? panField.value || panField.digits
      : maskPan(panField.digits)
    : "";
  const expDisplay = expField?.value || expField?.digits || "";
  const cvvDisplay = cvvField?.digits
    ? revealFullValues
      ? cvvField.value || cvvField.digits
      : "•".repeat(cvvField.digits.length)
    : "";

  const exposed = Boolean(snap?.overallFail);
  const liveValues =
    Boolean(snap?.panExposed) ||
    Boolean(snap?.expiryExposed) ||
    Boolean(snap?.cvvExposed);

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(MERCHANT_SNIFF_SNIPPET);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <aside
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm dark:border-white/10 dark:bg-[#0B1220] dark:text-white dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      data-pulse={pulse}
    >
      <div
        className={[
          "relative overflow-hidden border-b px-4 py-3 transition-colors duration-500",
          exposed
            ? "border-red-500/40 bg-red-50 dark:bg-red-950/40"
            : "border-border bg-emerald-50/80 dark:border-white/10 dark:bg-emerald-950/30",
        ].join(" ")}
      >
        <div
          aria-hidden
          className={[
            "pointer-events-none absolute inset-0 opacity-40 transition-opacity",
            liveValues
              ? "animate-pulse bg-[radial-gradient(circle_at_20%_0%,rgba(239,68,68,0.35),transparent_55%)]"
              : "",
          ].join(" ")}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:text-white/50">
              {t.snifferTitle}
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              {exposed ? t.snifferExposed : t.snifferListening}
            </h2>
            <p className="mt-1 max-w-[36ch] text-xs leading-relaxed text-muted-foreground dark:text-white/55">
              {t.snifferHint}
            </p>
          </div>
          <Badge
            variant="outline"
            className={[
              "shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
              exposed
                ? "border-red-400/60 bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-100"
                : "border-emerald-400/50 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-100",
            ].join(" ")}
          >
            {exposed ? t.snifferFail : t.snifferWaiting}
          </Badge>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <div className="grid gap-2">
          <FieldRow
            label={t.fieldPan}
            value={panDisplay}
            exposed={Boolean(
              snap?.panExposed ||
                (panField?.inTopDocument && panField.digits.length > 0)
            )}
            emptyHint={t.panEmptyHint}
            readableLabel={t.readable}
            notSetLabel={t.notSet}
          />
          <FieldRow
            label={t.fieldExpiry}
            value={expDisplay}
            exposed={Boolean(
              snap?.expiryExposed ||
                (expField?.inTopDocument && expField.digits.length > 0)
            )}
            emptyHint={t.expiryEmptyHint}
            readableLabel={t.readable}
            notSetLabel={t.notSet}
          />
          <FieldRow
            label={t.fieldCvv}
            value={cvvDisplay}
            exposed={Boolean(snap?.cvvExposed || (cvvPresent && cvvHasDigits))}
            emptyHint={cvvPresent ? t.cvvPresentHint : t.cvvEmptyHint}
            readableLabel={t.readable}
            notSetLabel={t.notSet}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 dark:border-white/10 dark:bg-black/20">
            <div className="text-muted-foreground dark:text-white/45">{t.architecture}</div>
            <div
              className={
                snap?.architectureFail
                  ? "mt-0.5 font-medium text-red-600 dark:text-red-300"
                  : "mt-0.5 font-medium text-emerald-700 dark:text-emerald-300"
              }
            >
              {snap?.architectureFail ? t.architectureFail : t.architectureWait}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 dark:border-white/10 dark:bg-black/20">
            <div className="text-muted-foreground dark:text-white/45">{t.hostedIframes}</div>
            <div className="mt-0.5 font-medium">
              {snap?.hostedCardIframeCount ?? 0}
              <span className="ml-1 font-normal text-muted-foreground dark:text-white/40">
                / {snap?.iframeCount ?? 0} total
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-3 dark:border-white/10 dark:bg-black/30">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground dark:text-white/45">
              {t.merchantSnippet}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => void handleCopy()}
            >
              {copied ? t.copied : commonCopy.copy}
            </Button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-amber-800 dark:text-amber-100/90">
            {MERCHANT_SNIFF_SNIPPET}
          </pre>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-white/40">
          {t.demoCardsPrefix}{" "}
          <a
            className="text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href="https://developer.evonetonline.com/docs/test-card-number"
            target="_blank"
            rel="noreferrer"
          >
            developer.evonetonline.com/docs/test-card-number
          </a>
          {" · "}Visa{" "}
          <span className="font-mono text-foreground/70 dark:text-white/55">
            4895330111111119
          </span>
        </p>
      </div>
    </aside>
  );
}
