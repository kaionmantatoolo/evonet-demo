"use client";

import type { ReactNode } from "react";
import { useSiteLocale } from "@/components/SiteLocaleProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AppearanceSectionCardProps {
  title: string;
  onReset?: () => void;
  contentClassName?: string;
  children: ReactNode;
}

export function AppearanceSectionCard({
  title,
  onReset,
  contentClassName,
  children,
}: AppearanceSectionCardProps) {
  const { messages } = useSiteLocale();

  return (
    <Card className="gap-0 rounded-none border border-border py-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 border-b px-4 py-3.5 [.border-b]:pb-3.5">
        <CardTitle className="min-w-0 flex-1 text-base font-medium text-[#0a0a0a] dark:text-foreground">
          {title}
        </CardTitle>
        {onReset ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-[26px] shrink-0 rounded-full border-[#e5e5e5] bg-white px-2.5 text-sm font-normal text-[#0a0a0a] shadow-none hover:bg-white dark:border-border dark:bg-card dark:text-foreground"
          >
            {messages.common.reset}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className={cn("space-y-5 px-4 py-5", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
