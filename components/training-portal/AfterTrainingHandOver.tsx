"use client";

import { useTranslations } from "next-intl";
import { InlineInvite } from "@/components/team/InlineInvite";

/**
 * The invite at the end of the management training: whoever will do the work joins the company and
 * lands in the walkthrough after signing in. Only an admin invites, as on the team page.
 */
export function AfterTrainingHandOver({ redirectPath }: { redirectPath: string }) {
  const t = useTranslations("trainingPortal.coursePage.afterTraining.other");
  return (
    <InlineInvite
      label={t("label")}
      placeholder={t("placeholder")}
      sendLabel={t("send")}
      sentText={(email) => t("invited", { email })}
      redirectPath={redirectPath}
    />
  );
}
