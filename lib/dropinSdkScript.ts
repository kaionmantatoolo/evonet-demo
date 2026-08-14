const DEFAULT_DROPIN_VERSION = "1.2.0";
const VERSION_PATTERN = /^[A-Za-z0-9._-]+$/;

export type DropinCdn = "jsdelivr" | "unpkg";

/** Sanitized `cil-dropin-components` dist-tag or semver from env. */
export function configuredDropinVersion(
  raw: string | undefined = process.env.NEXT_PUBLIC_EVONET_DROPIN_VERSION
): string {
  const value = raw?.trim() ?? "";
  if (!value || !VERSION_PATTERN.test(value)) {
    return DEFAULT_DROPIN_VERSION;
  }
  return value;
}

export function configuredDropinCdn(
  raw: string | undefined = process.env.NEXT_PUBLIC_EVONET_DROPIN_CDN
): DropinCdn {
  return raw?.trim().toLowerCase() === "unpkg" ? "unpkg" : "jsdelivr";
}

export function buildDropinScriptSrc(
  version: string = configuredDropinVersion(),
  cdn: DropinCdn = configuredDropinCdn()
): string {
  if (cdn === "unpkg") {
    return `https://unpkg.com/cil-dropin-components@${version}/dist/index.min.js`;
  }
  return `https://cdn.jsdelivr.net/npm/cil-dropin-components@${version}/dist/index.min.js`;
}

/**
 * Script the host injects.
 * `NEXT_PUBLIC_EVONET_DROPIN_VERSION` is the Vercel control (plus optional CDN).
 * A full `SCRIPT_URL` is honored only for a custom host — npm `@latest` URLs are
 * ignored so leftover env on Vercel cannot override the pinned version.
 */
export function resolveDropinScriptSrc(
  scriptUrl: string | undefined = process.env.NEXT_PUBLIC_EVONET_DROPIN_SCRIPT_URL,
  version: string | undefined = process.env.NEXT_PUBLIC_EVONET_DROPIN_VERSION,
  cdn: string | undefined = process.env.NEXT_PUBLIC_EVONET_DROPIN_CDN
): string {
  const versionRaw = version?.trim();
  const explicit = scriptUrl?.trim();
  const isNpmDropinUrl = Boolean(explicit && /cil-dropin-components@/i.test(explicit));
  if (explicit && !isNpmDropinUrl && !versionRaw) {
    return explicit;
  }
  return buildDropinScriptSrc(
    configuredDropinVersion(versionRaw),
    configuredDropinCdn(cdn)
  );
}

export const DROPIN_SCRIPT_SRC = resolveDropinScriptSrc();

const SEMVER = /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/;

let resolvePromise: Promise<string | null> | null = null;

/** Pinned semver in the script URL (`@1.2.0`), or null for tags like `@latest`. */
export function pinnedVersionFromScriptSrc(
  src: string = DROPIN_SCRIPT_SRC
): string | null {
  const tag = npmTagFromScriptSrc(src);
  return tag && SEMVER.test(tag) ? tag : null;
}

export function npmTagFromScriptSrc(src: string = DROPIN_SCRIPT_SRC): string | null {
  const match = src.match(/cil-dropin-components@([^/]+)/i);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function packageJsonUrlFromScriptSrc(src: string): string | null {
  try {
    const url = new URL(src);
    url.search = "";
    url.hash = "";
    const distIdx = url.pathname.lastIndexOf("/dist/");
    if (distIdx !== -1) {
      url.pathname = `${url.pathname.slice(0, distIdx)}/package.json`;
      return url.toString();
    }
    if (/cil-dropin-components@[^/]+\/?$/i.test(url.pathname)) {
      url.pathname = `${url.pathname.replace(/\/?$/, "")}/package.json`;
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Version actually served for the configured script URL.
 * Pinned URLs resolve immediately; `@latest` fetches sibling `package.json`.
 */
export function resolveDropinSdkVersion(
  src: string = DROPIN_SCRIPT_SRC
): Promise<string | null> {
  const pinned = pinnedVersionFromScriptSrc(src);
  if (pinned) {
    return Promise.resolve(pinned);
  }
  if (!resolvePromise) {
    resolvePromise = fetchResolvedVersion(src);
  }
  return resolvePromise;
}

async function fetchResolvedVersion(src: string): Promise<string | null> {
  const pkgUrl = packageJsonUrlFromScriptSrc(src);
  if (!pkgUrl) {
    return npmTagFromScriptSrc(src);
  }
  try {
    const response = await fetch(pkgUrl, { cache: "no-store" });
    if (!response.ok) {
      return npmTagFromScriptSrc(src);
    }
    const body = (await response.json()) as { version?: unknown };
    return typeof body.version === "string" && body.version.trim()
      ? body.version.trim()
      : npmTagFromScriptSrc(src);
  } catch {
    return npmTagFromScriptSrc(src);
  }
}
