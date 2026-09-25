import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RequirementDetail } from "@/components/compliance/RequirementDetail";
import type { NavHref, NavLink } from "@/components/compliance/RequirementFooterNav";
import { StepNotes } from "@/components/durchgang/StepNotes";
import { Link } from "@/i18n/navigation";
import { durchgangStep } from "@/lib/compliance/durchgang";
import { loadRequirementDetail } from "@/lib/compliance/requirement-detail-data";

/**
 * One requirement per screen, walked in journey order. The body is the
 * requirement page's own: same editors, same register, same evidence and
 * sign-off, same save on the way out. Only the neighbours differ, and the
 * explanation sits beside the input instead of above it.
 */
export default async function DurchgangStepPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const step = durchgangStep(code);
  if (!step) notFound();

  const [data, t] = await Promise.all([
    loadRequirementDetail(code),
    getTranslations("durchgang"),
  ]);
  if (!data) notFound();

  const overview: NavHref = "/journey";
  const stepHref = (to: string): NavHref => ({
    pathname: "/durchgang/[code]",
    params: { code: to },
  });
  const prev: NavLink = step.prevCode
    ? { href: stepHref(step.prevCode), label: t("back") }
    : { href: overview, label: t("overview") };
  const next: NavLink = step.nextCode
    ? { href: stepHref(step.nextCode), label: t("next") }
    : { href: overview, label: t("finish") };

  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">{t("title")}</span>
          <span className="mx-1.5 text-muted-foreground/50">/</span>
          {t("stepOf", { step: step.number, total: step.total })}
        </p>
        <Link href="/journey" className="transition-colors hover:text-foreground">
          {t("overview")}
        </Link>
      </div>
      <RequirementDetail
        {...data}
        prev={prev}
        next={next}
        stepNotes={<StepNotes code={code} />}
      />
    </main>
  );
}
