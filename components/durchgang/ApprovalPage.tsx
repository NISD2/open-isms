"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Approval } from "./ApproveScreen";
import { Heading, Lead } from "./ExplainScreens";
import type { ItemView } from "./view";

/** The page management is invited to: the walk's documents and the approval, nothing else. */
export function ApprovalPage({
  viewer,
  locale,
}: {
  viewer: ItemView["viewer"];
  locale: ItemView["locale"];
}) {
  const t = useTranslations("durchgang.ui.approve");
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4 sm:px-6">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{t("pageTitle")}</p>
          <Button variant="ghost" size="icon" aria-label={t("close")} asChild>
            <Link href="/durchgang">
              <X className="size-5" />
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pt-8 pb-24 sm:px-6 lg:pt-14">
        <Heading>{t("pageHeading")}</Heading>
        <Lead>{viewer.management ? t("pageLead") : t("pageLeadOthers")}</Lead>
        <Approval viewer={viewer} locale={locale} />
      </main>
    </div>
  );
}
