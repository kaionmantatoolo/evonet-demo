/**
 * Ask the live Drop-in instance to refresh order details.
 * Does not construct a new DropInSDK. Returns false when this SDK build has no `reload()`.
 * Colors and other appearance config are left untouched.
 */
export function reloadDropinOrder(instance: unknown): boolean {
  const target = unwrap(instance);
  const reload =
    target && typeof target === "object"
      ? (target as { reload?: unknown }).reload
      : undefined;
  if (typeof reload !== "function") return false;
  reload.call(target);
  return true;
}

function unwrap(instance: unknown): unknown {
  if (!instance || typeof instance !== "object") return instance;
  const value = (instance as { value?: unknown }).value;
  return value != null && typeof value === "object" ? value : instance;
}
