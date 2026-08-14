/** Stable shopper ID for Interaction `userInfo.reference` when save-card is on. */
export function generateUserInfoReference(prefix = "shopper"): string {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}-${suffix}`;
}

/** Keep existing non-empty reference; otherwise mint a new one. */
export function ensureUserInfoReference(
  existing?: string | null,
  prefix = "shopper"
): string {
  const trimmed = existing?.trim() ?? "";
  return trimmed || generateUserInfoReference(prefix);
}
