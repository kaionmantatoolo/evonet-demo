import { googlePayEnvFromEvonet } from "./googlePayProbe";
import type { EvonetOneTapPayBrand } from "../types/evonet";

const PAY_JS_SRC = "https://pay.google.com/gp/p/js/pay.js";

interface ApplePaySessionCtor {
  canMakePayments?: () => boolean;
}

interface IsReadyToPayResponse {
  result?: boolean;
}

interface PaymentsClient {
  isReadyToPay: (
    request: Record<string, unknown>
  ) => Promise<IsReadyToPayResponse>;
}

const IS_READY_REQUEST: Record<string, unknown> = {
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

function applePayAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const ApplePaySession = (
    window as Window & { ApplePaySession?: ApplePaySessionCtor }
  ).ApplePaySession;
  try {
    return Boolean(ApplePaySession?.canMakePayments?.());
  } catch {
    return false;
  }
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

async function googlePayAvailable(environment: string): Promise<boolean> {
  if (typeof window === "undefined" || !window.isSecureContext) return false;
  try {
    await loadGooglePayScript();
    const PaymentsClient = window.google?.payments?.api?.PaymentsClient;
    if (!PaymentsClient) return false;
    const client = new PaymentsClient({
      environment: googlePayEnvFromEvonet(environment),
    });
    const response = await client.isReadyToPay(IS_READY_REQUEST);
    return Boolean(response?.result);
  } catch {
    return false;
  }
}

/** True when this browser can pay with the selected One Tap brand. */
export async function oneTapBrandReady(
  brand: EvonetOneTapPayBrand,
  environment: string
): Promise<boolean> {
  if (brand === "ApplePay") return applePayAvailable();
  return googlePayAvailable(environment);
}
