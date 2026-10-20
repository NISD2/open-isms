"use client";

import { Check, Copy, GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InlineInvite } from "@/components/team/InlineInvite";
import { Button } from "@/components/ui/button";
import { getPathname } from "@/i18n/navigation";
import type { WalkLocale } from "@/lib/durchgang";

/**
 * Under 1.1's list: someone from management is invited to the platform's course for management,
 * and lands in it after signing in. Joining the team is what puts their progress on the list
 * above. Anyone may copy the course's link for a colleague already in the team; only an admin
 * invites someone new, as on the team page.
 */
export function CourseInvite({
  admin,
  locale,
  course,
}: {
  admin: boolean;
  locale: WalkLocale;
  course: string;
}) {
  const t = useTranslations("durchgang.ui.training.invite");
  const [copied, setCopied] = useState(false);
  const path = getPathname({
    href: { pathname: "/training/courses/[courseId]", params: { courseId: "nis2-ceo" } },
    locale,
  });
  const copy = () => {
    navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-4 border-t px-5 py-5">
      <div className="flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <GraduationCap className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">{t("title", { course })}</p>
          <p className="mt-0.5 max-w-[60ch] text-sm leading-6 text-muted-foreground">
            {t("lead")}
          </p>
        </div>
      </div>
      {admin ? (
        <InlineInvite
          label={t("label")}
          sendLabel={t("send")}
          sentText={(email) => t("invited", { email })}
          placeholder={t("placeholder")}
          redirectPath={path}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{t("askAdmin")}</p>
      )}
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? <Check /> : <Copy />}
        {t("copyLink")}
      </Button>
    </section>
  );
}
