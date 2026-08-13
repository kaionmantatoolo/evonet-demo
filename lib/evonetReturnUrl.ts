/**
 * Absolute URL Evonet should redirect to after wallet / Apple Pay / new-tab flows.
 * Prefer the page that started checkout so return params land in the right UI.
 */
export function buildClientEvonetReturnUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}${window.location.pathname}`;
}

const FAN_CLUB_CHECKOUT_PENDING_KEY = "evonet-fan-club-checkout-pending";

export interface FanClubCheckoutPending {
  orderId: string;
  startedAt: string;
}

/** Mark Fan Club checkout so Builder can reopen after a wallet returnURL reload. */
export function markFanClubCheckoutPending(orderId: string): void {
  if (typeof window === "undefined") return;
  const payload: FanClubCheckoutPending = {
    orderId,
    startedAt: new Date().toISOString(),
  };
  window.sessionStorage.setItem(
    FAN_CLUB_CHECKOUT_PENDING_KEY,
    JSON.stringify(payload)
  );
}

export function peekFanClubCheckoutPending(): FanClubCheckoutPending | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(FAN_CLUB_CHECKOUT_PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FanClubCheckoutPending;
    if (!parsed?.orderId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearFanClubCheckoutPending(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(FAN_CLUB_CHECKOUT_PENDING_KEY);
}

/** Read and clear pending Fan Club checkout (wallet return → reopen overlay). */
export function consumeFanClubCheckoutPending(): FanClubCheckoutPending | null {
  const pending = peekFanClubCheckoutPending();
  if (pending) clearFanClubCheckoutPending();
  return pending;
}

/** Accept absolute http(s) return URLs from the client; reject everything else. */
export function sanitizeEvonetReturnUrl(
  candidate: unknown,
  fallback: string
): string {
  if (typeof candidate !== "string") return fallback;
  const trimmed = candidate.trim();
  if (!trimmed) return fallback;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}
