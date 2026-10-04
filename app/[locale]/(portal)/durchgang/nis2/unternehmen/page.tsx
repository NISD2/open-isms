import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CompanySetup } from "@/components/organization/CompanySetup";
import { getPathname } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { WALK } from "@/lib/durchgang";
import { walkAccess } from "../../gate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("organization.essentials");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * The walk's first step for a company not set up yet: its three essentials (Simon, 04.10.2026: "a
 * step in the walkthrough to create your organization"). Then on to the walk's first item. Only for
 * an account that may walk; a company already set up has nothing to do here.
 */
export default async function WalkCompanyStep() {
  const [{ mayWalk }, session, locale, t] = await Promise.all([
    walkAccess(),
    getSession(),
    getLocale(),
    getTranslations("durchgang.ui.home"),
  ]);
  if (!mayWalk || session?.companyActivated) {
    redirect(getPathname({ href: "/durchgang/nis2", locale }));
  }
  const first = WALK[0]?.code;
  return (
    <CompanySetup
      eyebrow={t("setupSection")}
      next={
        first
          ? { pathname: "/durchgang/nis2/[code]", params: { code: first } }
          : "/durchgang/nis2"
      }
    />
  );
}
