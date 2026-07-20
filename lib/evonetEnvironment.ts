import { getEvonetTarget } from "./evonetTarget";

/**
 * Client-readable Evonet Drop-in environment string.
 * Priority:
 * 1. NEXT_PUBLIC_EVONET_ENVIRONMENT (explicit override)
 * 2. Derived from NEXT_PUBLIC_EVONET_TARGET (UAT → UAT, PROD → HKG_prod)
 */
export function getEvonetEnvironment(): string {
  const explicit = (
    process.env.NEXT_PUBLIC_EVONET_ENVIRONMENT as string | undefined
  )?.trim();
  if (explicit) return explicit;

  return getEvonetTarget() === "UAT" ? "UAT" : "HKG_prod";
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
