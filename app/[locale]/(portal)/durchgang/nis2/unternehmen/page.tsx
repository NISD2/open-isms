import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { SETUP_STEP } from "@/components/durchgang/setup";
import { CompanySetup } from "@/components/organization/CompanySetup";
import { getPathname } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { resumeAt } from "@/lib/durchgang";
import { walkAccess } from "../../gate";
import { loadWalk } from "../load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("organization.essentials");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * The walk's step for a company not set up yet: its three essentials (Simon, 04.10.2026: "a step
 * in the walkthrough to create your organization"), right after the registration, which asks for
 * the name and the sector too (Simon, 04.10.2026: "after the registration they will understand and
 * they will actually know what to fill out here"). Then on to the walk's next open item. Only for
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
  const next = resumeAt(await loadWalk({ locked: false }), (w) => w.state);
  return (
    <div data-dg-item={SETUP_STEP}>
      <CompanySetup
        eyebrow={t("setupSection")}
        lead={t("setupLead")}
        hints={{
          name: t("setupNameHint"),
          sector: t("setupSectorHint"),
          entityType: t("setupEntityTypeHint"),
          entityTypes: {
            essential: t("setupEntityTypes.essential"),
            important: t("setupEntityTypes.important"),
            kritis: t("setupEntityTypes.kritis"),
          },
        }}
        next={
          next
            ? { pathname: "/durchgang/nis2/[code]", params: { code: next.code } }
            : "/durchgang/nis2"
        }
      />
    </div>
  );
}
