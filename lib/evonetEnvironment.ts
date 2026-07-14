/**
 * Client-readable Evonet environment from NEXT_PUBLIC_EVONET_ENVIRONMENT.
 * Used for UI defaults and gated production safety notes.
 */
export function getEvonetEnvironment(): string {
  return (
    (process.env.NEXT_PUBLIC_EVONET_ENVIRONMENT as string | undefined)?.trim() ||
    "HKG_prod"
  );
}

/** True for values like HKG_prod, BKK_prod, TYO_prod, or plain "prod". */
export function isEvonetProductionEnvironment(
  environment: string = getEvonetEnvironment()
): boolean {
  const normalized = environment.trim();
  if (!normalized) return true;
  if (/_prod$/i.test(normalized)) return true;
  if (/^prod$/i.test(normalized)) return true;
  return false;
}
