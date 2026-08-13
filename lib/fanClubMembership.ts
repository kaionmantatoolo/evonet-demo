export const FAN_CLUB_MEMBERSHIP_KEY = "anon-fan-club-membership";

export type FanClubMembershipStatus = "active" | "cancelled";

export interface FanClubCharge {
  id: string;
  type: "cit" | "mit";
  orderId: string;
  amount: number;
  currency: string;
  at: string;
  status: "success" | "failed";
  message?: string;
}

export interface FanClubMembership {
  status: FanClubMembershipStatus;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  userInfoReference: string;
  token: string;
  recurringReference?: string;
  joinedAt: string;
  nextBillAt: string;
  cancelledAt?: string;
  charges: FanClubCharge[];
}

export function addMonthsIso(iso: string, months = 1): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date();
    fallback.setMonth(fallback.getMonth() + months);
    return fallback.toISOString();
  }
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

export function maskPaymentToken(token: string): string {
  const trimmed = token.trim();
  if (trimmed.length <= 8) return trimmed;
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

export function readFanClubMembership(): FanClubMembership | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FAN_CLUB_MEMBERSHIP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FanClubMembership;
    if (!parsed || typeof parsed !== "object" || !parsed.userInfoReference) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeFanClubMembership(membership: FanClubMembership): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    FAN_CLUB_MEMBERSHIP_KEY,
    JSON.stringify(membership)
  );
}

export function clearFanClubMembership(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(FAN_CLUB_MEMBERSHIP_KEY);
}

export function cancelFanClubMembership(
  membership: FanClubMembership
): FanClubMembership {
  return {
    ...membership,
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    token: "",
  };
}
