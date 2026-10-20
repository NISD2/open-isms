import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { SetupStep } from "@/components/durchgang/SetupStep";
import { getPathname } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { isFreeStep, itemHref, NIS2_WALK, resumeAt } from "@/lib/durchgang";
import { loadWalk } from "../../_walk/load";
import { walkAccess } from "../../gate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("organization.essentials");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * The walk's step for a company not set up yet: its three essentials (Simon, 04.10.2026: "a step
 * in the walkthrough to create your organization"), right after the registration, which asks for
 * the name and the sector too (Simon, 04.10.2026: "after the registration they will understand and
 * they will actually know what to fill out here"). Then on to the walk's next open item, a free
 * one for an account that has not ordered; a company already set up has nothing to do here.
 */
export default async function WalkCompanyStep() {
  const [{ mayWalk }, session, locale] = await Promise.all([
    walkAccess(),
    getSession(),
    getLocale(),
  ]);
  if (session?.companyActivated) {
    redirect(getPathname({ href: "/durchgang/nis2", locale }));
  }
  const walk = await loadWalk(NIS2_WALK);
  const next = resumeAt(
    mayWalk ? walk : walk.filter((w) => isFreeStep(w.code)),
    (w) => w.state,
  );
  return <SetupStep next={next ? itemHref("nis2", next.code) : "/durchgang/nis2"} />;
}
