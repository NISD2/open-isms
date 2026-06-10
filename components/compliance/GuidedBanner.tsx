"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuidedBannerProps {
  currentIndex: number;
  totalCategories: number;
}

export function GuidedBanner({ currentIndex, totalCategories }: GuidedBannerProps) {
  const t = useTranslations("compliance");

  return (
    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Compass className="h-4 w-4" />
        {t("guided.banner")}
      </div>
      <span className="text-sm text-muted-foreground">
        {t("guided.progress", { current: currentIndex + 1, total: totalCategories })}
      </span>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard">{t("guided.skipToDashboard")}</Link>
      </Button>
    </div>
  );
}
