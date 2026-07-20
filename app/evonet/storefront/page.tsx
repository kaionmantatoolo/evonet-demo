"use client";

import { Suspense, useEffect, useState } from "react";
import { Box } from "@mui/material";
import {
  StorefrontEmptyState,
  StorefrontExperience,
} from "../../../components/storefront/StorefrontExperience";
import {
  readStorefrontSnapshot,
  type StorefrontSnapshot,
} from "../../../lib/storefrontSnapshot";

function StorefrontPage() {
  const [snapshot, setSnapshot] = useState<StorefrontSnapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSnapshot(readStorefrontSnapshot());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <Box sx={{ minHeight: "100dvh", bgcolor: "#f4f1ec" }} />;
  }

  if (!snapshot) {
    return <StorefrontEmptyState />;
  }

  return <StorefrontExperience config={snapshot} />;
}

export default function StorefrontPageRoute() {
  return (
    <Suspense fallback={null}>
      <StorefrontPage />
    </Suspense>
  );
}
