"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EvonetDropinHost } from "../../../components/EvonetDropinHost";
import { PciMerchantSniffer } from "../../../components/pci-sniff/PciMerchantSniffer";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { LocaleSwitcher } from "../../../components/LocaleSwitcher";
import { DropinSdkVersionBadge } from "../../../components/DropinSdkVersionBadge";
import { useSiteLocale } from "../../../components/SiteLocaleProvider";
import { DemoTransactionWarning } from "../../../components/DemoTransactionWarning";
import { getEvonetEnvironment } from "../../../lib/evonetEnvironment";
import {
  readStoredTargetOverride,
  sdkEnvironmentForTarget,
  targetFromSdkEnvironment,
  writeStoredTargetOverride,
  type EvonetTarget,
} from "../../../lib/evonetTarget";
import type { EvonetDropinConfig, EvonetDropinEvent } from "../../../types/evonet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DEFAULT_ENVIRONMENT = getEvonetEnvironment();
const ENV_CHIP_TAP_WINDOW_MS = 2000;
const ENV_CHIP_TAPS_REQUIRED = 5;
const DEMO_PAN = "4895330111111119";
const DEMO_EXP = "12/31";
const DEMO_CVV = "123";

function generateOrderId(): string {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `PCI-${Date.now()}-${suffix}`;
}

function formatTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

export default function PciSniffDemoPage() {
  const { locale, messages } = useSiteLocale();
  const t = messages.pciSniff;

  const [environment, setEnvironment] = useState(DEFAULT_ENVIRONMENT);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sdkInitGeneration, setSdkInitGeneration] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState(t.preparing);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const envChipTapCountRef = useRef(0);
  const envChipTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bootstrappedRef = useRef(false);

  const createSession = useCallback(
    async (options?: { environmentOverride?: string }) => {
      setIsCreating(true);
      setError(null);
      setStatusLine(t.preparing);
      try {
        const envForSession = options?.environmentOverride ?? environment;
        const targetForSession = targetFromSdkEnvironment(envForSession);
        const response = await fetch("/api/evonet/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 1.0,
            currency: "HKD",
            orderId: generateOrderId(),
            description: "PCI DOM sniff demo (do not capture)",
            environment: envForSession,
            target: targetForSession,
            locale,
          }),
        });
        const data = (await response.json()) as {
          sessionId?: string;
          error?: string;
        };
        if (!response.ok || !data.sessionId) {
          throw new Error(data.error ?? "Failed to create session");
        }
        setSessionId(data.sessionId);
        setSdkInitGeneration((n) => n + 1);
        setStatusLine(t.dropinReady);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Session error");
        setStatusLine(t.sessionFailed);
      } finally {
        setIsCreating(false);
      }
    },
    [environment, locale, t.dropinReady, t.preparing, t.sessionFailed]
  );

  // Initial session — honor Builder/Dev Console UAT↔PROD override in sessionStorage
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    const storedTarget = readStoredTargetOverride();
    if (storedTarget) {
      const envForLoad = sdkEnvironmentForTarget(storedTarget);
      setEnvironment(envForLoad);
      void createSession({ environmentOverride: envForLoad });
      return;
    }
    void createSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once
  }, []);

  // Keep status line language in sync when site locale changes
  useEffect(() => {
    if (!sessionId && !error) {
      setStatusLine(isCreating ? t.preparing : t.waitingSession);
    } else if (sessionId && !error) {
      setStatusLine(t.dropinReady);
    } else if (error) {
      setStatusLine(t.sessionFailed);
    }
  }, [locale, t, sessionId, error, isCreating]);

  // Remount Drop-in when site locale changes so SDK language matches chrome
  const prevLocaleRef = useRef(locale);
  useEffect(() => {
    if (prevLocaleRef.current === locale) return;
    prevLocaleRef.current = locale;
    if (sessionId) {
      setSdkInitGeneration((n) => n + 1);
      void createSession();
    }
  }, [locale, sessionId, createSession]);

  const handleEnvironmentChipTap = () => {
    if (envChipTapTimerRef.current) {
      clearTimeout(envChipTapTimerRef.current);
    }
    envChipTapCountRef.current += 1;
    const taps = envChipTapCountRef.current;

    if (taps < ENV_CHIP_TAPS_REQUIRED) {
      envChipTapTimerRef.current = setTimeout(() => {
        envChipTapCountRef.current = 0;
        envChipTapTimerRef.current = null;
      }, ENV_CHIP_TAP_WINDOW_MS);
      return;
    }

    envChipTapCountRef.current = 0;
    envChipTapTimerRef.current = null;

    const nextTarget: EvonetTarget =
      targetFromSdkEnvironment(environment) === "PROD" ? "UAT" : "PROD";
    const nextEnv = sdkEnvironmentForTarget(nextTarget);

    writeStoredTargetOverride(nextTarget);
    setEnvironment(nextEnv);
    setToastMessage(t.switchedTo(nextTarget));
    setSessionId(null);
    setSdkInitGeneration(0);
    setError(null);

    void createSession({ environmentOverride: nextEnv });
  };

  useEffect(() => {
    if (!toastMessage) return;
    const id = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(id);
  }, [toastMessage]);

  const dropinConfig: EvonetDropinConfig | null = useMemo(() => {
    if (!sessionId) return null;
    return {
      type: "payment",
      sessionID: sessionId,
      environment: environment as EvonetDropinConfig["environment"],
      mode: "embedded",
      language: locale,
      uiOption: {
        columns: false,
        card: {
          showCardHolderName: true,
          CVVForSavedCard: true,
        },
      },
      appearance: {
        colorAction: "#0B5FFF",
        colorBackground: "#FFFFFF",
        colorFormBackground: "#FFFFFF",
        colorPrimary: "#0F172A",
        colorSecondary: "#64748B",
        borderRadius: ["8px", "8px", "8px", "8px"],
      },
    };
  }, [sessionId, environment, locale]);

  const onEvent = useCallback(
    (event: EvonetDropinEvent) => {
      if (
        event.type === "payment_method_select" ||
        event.type === "payment_method_selected"
      ) {
        setStatusLine(t.cardFormOpen);
      }
    },
    [t.cardFormOpen]
  );

  const envTarget = targetFromSdkEnvironment(environment);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="text-sm font-semibold tracking-tight text-foreground hover:opacity-80"
              >
                Evonet
              </Link>
              <span className="text-muted-foreground/40">/</span>
              <h1 className="truncate text-sm font-semibold text-foreground">
                {t.title}
              </h1>
              <Badge
                variant={envTarget === "PROD" ? "destructive" : "warning"}
                className="cursor-pointer select-none"
                onClick={handleEnvironmentChipTap}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleEnvironmentChipTap();
                  }
                }}
                title={t.envChipTitle}
                aria-label={t.envChipAria(envTarget)}
              >
                {envTarget}
              </Badge>
              <DropinSdkVersionBadge />
              <Badge
                variant="outline"
                className="rounded-md border-red-200 bg-red-50 text-[10px] font-bold uppercase tracking-wider text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200"
              >
                {t.badge}
              </Badge>
            </div>
            <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
              {t.subtitle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isCreating}
              onClick={() => void createSession()}
            >
              {isCreating ? t.loading : t.newSession}
            </Button>
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-5 lg:py-6">
        <section className="flex min-h-0 flex-col gap-3">
          <DemoTransactionWarning environment={environment} sx={{ mb: 0 }} />

          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t.howToDemo}
            </p>
            <ol className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">1.</span>{" "}
                {formatTemplate(t.step1, { method: t.creditOrDebitCard })}
              </li>
              <li>
                <span className="font-medium text-foreground">2.</span>{" "}
                {formatTemplate(t.step2, {
                  pan: DEMO_PAN,
                  exp: DEMO_EXP,
                  cvv: DEMO_CVV,
                })}
              </li>
              <li>
                <span className="font-medium text-foreground">3.</span> {t.step3}
              </li>
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">{statusLine}</p>
            {toastMessage ? (
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
                {toastMessage}
              </p>
            ) : null}
            {error ? (
              <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </p>
            ) : null}
          </div>

          <div className="min-h-[520px] flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t.merchantCheckout}
                </span>
                {sessionId ? (
                  <span className="truncate font-mono text-[10px] text-muted-foreground">
                    session {sessionId.slice(0, 10)}…
                  </span>
                ) : null}
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 dark:bg-white">
              {dropinConfig ? (
                <EvonetDropinHost
                  config={dropinConfig}
                  initGeneration={sdkInitGeneration}
                  onEvent={onEvent}
                  compact
                />
              ) : (
                <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
                  {isCreating ? t.loadingDropin : t.waitingSession}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="min-h-[560px] lg:sticky lg:top-[72px] lg:max-h-[calc(100dvh-96px)]">
          <PciMerchantSniffer
            copy={t}
            commonCopy={messages.common}
            revealFullValues
          />
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-muted-foreground sm:px-6">
        {t.footer} ·{" "}
        <Link
          href="/evonet/dropin-builder"
          className="text-sky-700 hover:underline dark:text-sky-400"
        >
          {t.builderLink}
        </Link>
        {" · "}
        <a
          href="https://developer.evonetonline.com/docs/test-card-number"
          className="text-sky-700 hover:underline dark:text-sky-400"
          target="_blank"
          rel="noreferrer"
        >
          {t.testCardsLink}
        </a>
      </footer>
    </div>
  );
}
