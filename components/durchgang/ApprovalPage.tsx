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
    <div className="mx-auto max-w-3xl pb-12">
      <div className="flex h-12 items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{t("pageTitle")}</p>
        <Button variant="ghost" size="icon" aria-label={t("close")} asChild>
          <Link href="/durchgang/nis2">
            <X className="size-5" />
          </Link>
        </Button>
      </div>
      <div className="pt-4 lg:pt-8">
        <Heading>{t("pageHeading")}</Heading>
        <Lead>{viewer.management ? t("pageLead") : t("pageLeadOthers")}</Lead>
        <Approval viewer={viewer} locale={locale} />
      </div>
    </div>
  );
}
