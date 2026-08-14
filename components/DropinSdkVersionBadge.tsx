"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DROPIN_SCRIPT_SRC,
  npmTagFromScriptSrc,
  pinnedVersionFromScriptSrc,
  resolveDropinSdkVersion,
} from "../lib/dropinSdkScript";

/**
 * Shows the loaded `cil-dropin-components` version next to page chrome.
 * `@latest` is resolved from the CDN package.json so the chip matches what the browser will fetch.
 */
export function DropinSdkVersionBadge() {
  const pinned = pinnedVersionFromScriptSrc();
  const tag = npmTagFromScriptSrc();
  const [version, setVersion] = useState<string | null>(pinned);

  useEffect(() => {
    if (pinned) {
      return;
    }
    let cancelled = false;
    void resolveDropinSdkVersion().then((resolved) => {
      if (!cancelled && resolved) {
        setVersion(resolved);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pinned]);

  const label = version ?? tag ?? "…";
  const title = tag && tag !== version
    ? `cil-dropin-components@${tag} → ${version ?? "resolving"}\n${DROPIN_SCRIPT_SRC}`
    : `cil-dropin-components@${label}\n${DROPIN_SCRIPT_SRC}`;

  return (
    <Badge
      variant="outline"
      className="font-mono"
      title={title}
      aria-label={`Drop-in SDK ${label}`}
    >
      SDK {label}
    </Badge>
  );
}
