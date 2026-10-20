"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { WALK_ROUTES, type WalkFramework } from "@/lib/durchgang";
import { Approval } from "./ApproveScreen";
import { Heading, Lead } from "./ExplainScreens";
import type { ItemView } from "./view";

/** The page management is invited to: a walk's documents and the approval, nothing else. */
export function ApprovalPage({
  framework,
  viewer,
  locale,
}: {
  framework: WalkFramework;
  viewer: ItemView["viewer"];
  locale: ItemView["locale"];
}) {
  const t = useTranslations("durchgang");
  return (
    <div className="mx-auto max-w-3xl pb-12">
      <div className="flex h-12 items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
          {t("ui.approve.pageTitle")}
        </p>
        <Button variant="ghost" size="icon" aria-label={t("ui.approve.close")} asChild>
          <Link href={WALK_ROUTES[framework].home}>
            <X className="size-5" />
          </Link>
        </Button>
      </div>
      <div className="pt-4 lg:pt-8">
        <Heading>{t("ui.approve.pageHeading")}</Heading>
        <Lead>
          {viewer.management
            ? t(`walks.${framework}.approvalLead`)
            : t(`walks.${framework}.approvalLeadOthers`)}
        </Lead>
        <Approval framework={framework} viewer={viewer} locale={locale} />
      </div>
    </div>
  );
}
