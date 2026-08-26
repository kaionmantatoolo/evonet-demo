import {
  getEvonetEnvironment,
  isEvonetProductionEnvironment,
} from "./evonetEnvironment";

const LOG_PREFIX = "[Evonet GPay probe]";
const PAY_JS_SRC = "https://pay.google.com/gp/p/js/pay.js";

type GooglePayPaymentsEnv = "TEST" | "PRODUCTION";

interface IsReadyToPayResponse {
  result?: boolean;
}

interface PaymentsClient {
  isReadyToPay: (
    request: Record<string, unknown>
  ) => Promise<IsReadyToPayResponse>;
}

interface GooglePaymentsApi {
  PaymentsClient: new (opts: {
    environment: GooglePayPaymentsEnv;
  }) => PaymentsClient;
}

declare global {
  interface Window {
    google?: { payments?: { api?: GooglePaymentsApi } };
    /** Manual console re-run: `__evonetProbeGooglePay()` or `__evonetProbeGooglePay("UAT")`. */
    __evonetProbeGooglePay?: (environment?: string) => Promise<boolean | null>;
  }
}

const MINIMAL_IS_READY_REQUEST: Record<string, unknown> = {
  apiVersion: 2,
  apiVersionMinor: 0,
  allowedPaymentMethods: [
    {
      type: "CARD",
      parameters: {
        allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
        allowedCardNetworks: ["MASTERCARD", "VISA"],
      },
    },
  ],
};

export function googlePayEnvFromEvonet(
  environment: string
): GooglePayPaymentsEnv {
  return isEvonetProductionEnvironment(environment) ? "PRODUCTION" : "TEST";
}

function loadGooglePayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window is unavailable"));
  }
  if (window.google?.payments?.api?.PaymentsClient) {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${PAY_JS_SRC}"]`
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.google?.payments?.api?.PaymentsClient) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(`Failed to load ${PAY_JS_SRC}`)),
        { once: true }
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PAY_JS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${PAY_JS_SRC}`));
    document.head.appendChild(script);
  });
}

/**
 * Console-only diagnostic: load pay.js and call isReadyToPay.
 * Does not render a Google Pay button or change Drop-in UI.
 */
export async function probeGooglePayIsReadyToPay(
  environment: string = getEvonetEnvironment()
): Promise<boolean | null> {
  const gpayEnv = googlePayEnvFromEvonet(environment);
  try {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      console.error(
        `${LOG_PREFIX} failed: insecure context (Google Pay requires HTTPS or localhost)`
      );
      return null;
    }

    await loadGooglePayScript();
    const PaymentsClient = window.google?.payments?.api?.PaymentsClient;
    if (!PaymentsClient) {
      console.error(
        `${LOG_PREFIX} failed: pay.js loaded but google.payments.api.PaymentsClient is missing`
      );
      return null;
    }

    const client = new PaymentsClient({ environment: gpayEnv });
    const response = await client.isReadyToPay(MINIMAL_IS_READY_REQUEST);
    const ready = Boolean(response?.result);

    if (ready) {
      console.log(
        `${LOG_PREFIX} isReadyToPay: true (PaymentsClient env=${gpayEnv}, Evonet env=${environment})`
      );
    } else {
      console.warn(
        `${LOG_PREFIX} isReadyToPay: false — browser/env or no usable payment method (PaymentsClient env=${gpayEnv}, Evonet env=${environment})`
      );
    }
    return ready;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `${LOG_PREFIX} failed: ${message} (PaymentsClient env=${gpayEnv}, Evonet env=${environment}). Check adblock / pay.js Network, not only play.google.com/log.`,
      error
    );
    return null;
  }
}

/** Fire-and-forget after Drop-in init; never throws to callers. */
export function runGooglePayProbeAfterInit(environment: string): void {
  void probeGooglePayIsReadyToPay(environment);
}

export function installGooglePayProbeGlobal(): void {
  if (typeof window === "undefined") return;
  window.__evonetProbeGooglePay = (environment?: string) =>
    probeGooglePayIsReadyToPay(environment ?? getEvonetEnvironment());
}
