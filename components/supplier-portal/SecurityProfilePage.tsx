/**
 * SecurityProfilePage — a supplier's security profile as their customer reads it: the
 * questionnaire answers as a sheet (`QuestionnaireAnswers`) and the active certificates. Shown on
 * the token view (/supplier-access/[token]) and in the app (/suppliers/[id]).
 *
 * Server component — receives the data already loaded by the route.
 */
import { getFormatter, getTranslations } from "next-intl/server";
import {
  answersOf,
  loadQuestionnaireGroups,
} from "@/lib/supplier-portal/questionnaire-view";
import { CertificationsSection, type CertRow } from "./CertificationsSection";
import { QuestionnaireAnswers } from "./questionnaire/QuestionnaireAnswers";

interface SecurityProfilePageProps {
  /** The supplier-portal subset of the company row. */
  profile: Partial<Record<string, unknown>> & {
    practicesLastSavedAt?: Date | null;
  };
  certifications: CertRow[];
  /** Optional title shown in the page header (e.g. supplier company name). */
  supplierName?: string | null;
}

export async function SecurityProfilePage({
  profile,
  certifications,
  supplierName,
}: SecurityProfilePageProps) {
  const [t, tq, format, groups] = await Promise.all([
    getTranslations("supplierPortal.customerView"),
    getTranslations("supplierPortal.questionnaire"),
    getFormatter(),
    loadQuestionnaireGroups(["profile", "practices", "serviceType"], "customer"),
  ]);
  const savedAt = profile.practicesLastSavedAt ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {supplierName && (
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("securityProfile")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{supplierName}</h1>
          <p className="text-sm text-muted-foreground">
            {savedAt
              ? tq("savedAt", { time: format.dateTime(savedAt, { dateStyle: "medium" }) })
              : tq("notSavedYet")}
          </p>
        </header>
      )}

      <QuestionnaireAnswers groups={groups} answers={answersOf(profile)} />

      <hr className="border-muted" />

      <CertificationsSection certifications={certifications} readOnly />
    </div>
  );
}
