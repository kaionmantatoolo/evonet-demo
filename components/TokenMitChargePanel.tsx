"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "@mui/material";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyableIdValue } from "./CopyableIdValue";
import {
  chargeWithToken,
  fetchInteractionToken,
  generateMitOrderId,
  resolveMitAmount,
} from "../lib/evonetTokenPayment";
import type { EvonetRecurringProcessingModel } from "../types/evonet";

export interface TokenMitChargePanelProps {
  environment: string;
  currency: string;
  recurringProcessingModel: EvonetRecurringProcessingModel;
  /** Prefill MIT amount; free-trial (0) falls back via fallbackAmount. */
  defaultAmount: string;
  /** Amount before free trial (or other >0 fallback). */
  fallbackAmount?: string;
  /**
   * After CIT success, set to Interaction merchantOrderID (EVB-… / FAN-…),
   * not Drop-in’s pay_… merchantTransID.
   */
  citOrderId: string | null;
  idPrefix?: string;
  className?: string;
}

export function TokenMitChargePanel({
  environment,
  currency,
  recurringProcessingModel,
  defaultAmount,
  fallbackAmount,
  citOrderId,
  idPrefix = "mit",
  className,
}: TokenMitChargePanelProps) {
  const [queryOrderId, setQueryOrderId] = useState(citOrderId?.trim() ?? "");
  const [token, setToken] = useState("");
  const [recurringReference, setRecurringReference] = useState<string | null>(
    null
  );
  const [amount, setAmount] = useState(() =>
    resolveMitAmount(defaultAmount, fallbackAmount)
  );
  const [description, setDescription] = useState("MIT token charge");
  const [tokenBusy, setTokenBusy] = useState(false);
  const [chargeBusy, setChargeBusy] = useState(false);
  const [tokenHint, setTokenHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    orderId: string;
    resultCode?: string;
    resultMessage?: string;
    ok: boolean;
  } | null>(null);
  const fetchedForOrderRef = useRef<string | null>(null);

  useEffect(() => {
    setAmount(resolveMitAmount(defaultAmount, fallbackAmount));
  }, [defaultAmount, fallbackAmount]);

  useEffect(() => {
    const next = citOrderId?.trim() ?? "";
    if (!next) return;
    setQueryOrderId(next);
  }, [citOrderId]);

  const loadToken = useCallback(
    async (orderId: string) => {
      const trimmed = orderId.trim();
      if (!trimmed) {
        setTokenHint(
          "Enter the Interaction merchantOrderID (EVB-… / FAN-…), not pay_…."
        );
        return;
      }
      if (trimmed.startsWith("pay_")) {
        setTokenHint(
          "That ID is Drop-in’s merchantTransID (pay_…). Token lookup needs the Interaction merchantOrderID from session create (EVB-… / FAN-…)."
        );
        return;
      }
      setTokenBusy(true);
      setTokenHint("Fetching token from interaction…");
      setError(null);
      try {
        const result = await fetchInteractionToken(trimmed, environment);
        if (!result.token) {
          setTokenHint(
            "No pmt_ token on this interaction yet. Paste a token manually or retry."
          );
          return;
        }
        setToken(result.token);
        setRecurringReference(result.recurringReference);
        setTokenHint(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch token.";
        setTokenHint(
          /not found/i.test(message)
            ? `${message} — use merchantOrderID (EVB-…), not pay_….`
            : message
        );
      } finally {
        setTokenBusy(false);
      }
    },
    [environment]
  );

  useEffect(() => {
    const orderId = citOrderId?.trim() ?? "";
    if (!orderId || fetchedForOrderRef.current === orderId) return;
    fetchedForOrderRef.current = orderId;
    void loadToken(orderId);
  }, [citOrderId, loadToken]);

  const handleCharge = async () => {
    setError(null);
    setLastResult(null);
    const tokenTrimmed = token.trim();
    const amountValue = Number.parseFloat(amount);
    if (!tokenTrimmed.startsWith("pmt_")) {
      setError("Token must be an Evonet payment token (pmt_…).");
      return;
    }
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError("MIT amount must be greater than 0.");
      return;
    }
    setChargeBusy(true);
    const orderId = generateMitOrderId();
    try {
      const data = await chargeWithToken({
        amount: amountValue,
        currency,
        orderId,
        token: tokenTrimmed,
        environment,
        recurringProcessingModel,
        description: description.trim() || undefined,
      });
      if (!data.httpOk || !data.ok) {
        setError(data.error ?? data.resultMessage ?? "MIT payment failed.");
        setLastResult({
          orderId: data.orderId ?? orderId,
          resultCode: data.resultCode,
          resultMessage: data.resultMessage,
          ok: false,
        });
        return;
      }
      setLastResult({
        orderId: data.orderId ?? orderId,
        resultCode: data.resultCode,
        resultMessage: data.resultMessage,
        ok: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "MIT payment failed.");
    } finally {
      setChargeBusy(false);
    }
  };

  return (
    <div
      className={
        className ??
        "space-y-4 rounded-none border border-border bg-card p-3 text-card-foreground"
      }
    >
      <div>
        <p className="text-sm font-medium">Charge with token (MIT)</p>
        <p className="mt-1 break-words text-xs text-muted-foreground">
          After a save-card CIT in Builder preview, token loads via Interaction
          merchantOrderID (not storefront). Charge uses recurring model:{" "}
          <span className="font-mono">{recurringProcessingModel}</span>.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-cit-order`}>
          CIT merchantOrderID
        </Label>
        <Input
          id={`${idPrefix}-cit-order`}
          value={queryOrderId}
          onChange={(event) => setQueryOrderId(event.target.value)}
          placeholder="EVB-… or FAN-… (not pay_…)"
          className="font-mono"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={tokenBusy}
            onClick={() => {
              fetchedForOrderRef.current = null;
              void loadToken(queryOrderId);
            }}
          >
            {tokenBusy ? "Fetching…" : "Fetch token"}
          </Button>
        </div>
      </div>

      {tokenHint ? (
        <Alert severity={tokenBusy ? "info" : "warning"} variant="outlined">
          {tokenHint}
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-token`}>Payment token</Label>
        <Input
          id={`${idPrefix}-token`}
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="pmt_…"
          className="font-mono"
        />
      </div>

      {recurringReference ? (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">recurringReference</p>
          <CopyableIdValue
            value={recurringReference}
            label="recurringReference"
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-amount`}>Amount ({currency})</Label>
          <Input
            id={`${idPrefix}-amount`}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-description`}>Description</Label>
          <Input
            id={`${idPrefix}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="MIT token charge"
          />
        </div>
      </div>

      <Button
        type="button"
        disabled={chargeBusy || tokenBusy}
        onClick={() => void handleCharge()}
      >
        {chargeBusy ? "Charging…" : "Charge with token"}
      </Button>

      {error ? (
        <Alert severity="error" variant="outlined" onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {lastResult ? (
        <Alert
          severity={lastResult.ok ? "success" : "error"}
          variant="outlined"
        >
          <div className="space-y-1 text-sm">
            <div>
              {lastResult.ok ? "MIT succeeded" : "MIT failed"}
              {lastResult.resultCode ? ` · ${lastResult.resultCode}` : ""}
            </div>
            {lastResult.resultMessage ? (
              <div>{lastResult.resultMessage}</div>
            ) : null}
            <CopyableIdValue value={lastResult.orderId} label="MIT orderId" />
          </div>
        </Alert>
      ) : null}
    </div>
  );
}
