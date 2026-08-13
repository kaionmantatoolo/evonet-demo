"use client";

import { Suspense, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useTheme } from "next-themes";
import {
  StorefrontEmptyState,
  StorefrontExperience,
} from "../../../components/storefront/StorefrontExperience";
import { FanClubExperience } from "../../../components/storefront/fanClub/FanClubExperience";
import {
  isFanClubStorefront,
  readStorefrontSnapshot,
  type StorefrontSnapshot,
} from "../../../lib/storefrontSnapshot";

function StorefrontHydrateSplash() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: dark ? "#0c0a09" : "#f5f5f5",
      }}
    />
  );
}

function StorefrontPage() {
  const [snapshot, setSnapshot] = useState<StorefrontSnapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSnapshot(readStorefrontSnapshot());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <StorefrontHydrateSplash />;
  }

  if (!snapshot) {
    return <StorefrontEmptyState />;
  }

  if (isFanClubStorefront(snapshot)) {
    return <FanClubExperience config={snapshot} />;
  }

  return <StorefrontExperience config={snapshot} />;
}

export default function StorefrontPageRoute() {
  return (
    <Suspense fallback={<StorefrontHydrateSplash />}>
      <StorefrontPage />
    </Suspense>
  );
}
