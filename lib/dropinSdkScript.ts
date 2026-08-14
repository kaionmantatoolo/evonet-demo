export const DROPIN_SCRIPT_SRC =
  process.env.NEXT_PUBLIC_EVONET_DROPIN_SCRIPT_URL ??
  "https://cdn.evonetonline.com/sdk/evonet-dropin.js";

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
