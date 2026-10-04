/**
 * One page of the supplier questionnaire in the portal: heading, the page's one-line intro, and the
 * form for its groups. The profile, practices and service-type pages and the design preview all
 * render through here.
 */
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { QuestionnairePage as Page } from "@/lib/forms/supplier-portal-sections";
import {
  answersOf,
  loadQuestionnaireGroups,
} from "@/lib/supplier-portal/questionnaire-view";
import { QuestionnaireForm } from "./QuestionnaireForm";

export async function QuestionnairePage({
  page,
  title,
  intro,
  row,
  lastSavedAt,
  empty,
}: {
  readonly page: Page;
  readonly title: string;
  readonly intro: string;
  /** The company row; only its questionnaire answers reach the browser. */
  readonly row: Partial<Record<string, unknown>>;
  readonly lastSavedAt: Date | null;
  /** Shown instead of the form when none of the page's questions applies yet. */
  readonly empty?: ReactNode;
}) {
  const [nav, groups] = await Promise.all([
    getTranslations("supplierPortal.nav"),
    loadQuestionnaireGroups([page]),
  ]);
  const answers = answersOf(row);
  return (
    <div className="max-w-4xl space-y-8">
      <header className="max-w-2xl space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {nav("portalName")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-base leading-relaxed text-muted-foreground">{intro}</p>
      </header>
      {empty ?? (
        <QuestionnaireForm
          groups={groups}
          answers={answers}
          lastSavedAt={lastSavedAt ? lastSavedAt.toISOString() : null}
        />
      )}
    </div>
  );
}
