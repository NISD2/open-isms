"use client";

/**
 * A supplier's questionnaire as their customer reads it: the same groups and questions as the
 * supplier's form, each with its answer, as a sheet to read rather than a form to fill.
 * Questions that do not apply to the supplier are left out (`shownToReader`); one that applies
 * and was left open says so.
 */
import { useTranslations } from "next-intl";
import type { QuestionnaireField } from "@/lib/forms/supplier-portal-sections";
import { isAnswered, shownToReader } from "@/lib/supplier-portal/answered";
import type { GroupView, QuestionView } from "@/lib/supplier-portal/questionnaire-view";
import { cn } from "@/lib/utils";
import { BasisLine, YesNoAnswer } from "./parts";

type Answers = Partial<Record<QuestionnaireField, unknown>>;

export function QuestionnaireAnswers({
  groups,
  answers,
}: {
  readonly groups: readonly GroupView[];
  readonly answers: Answers;
}) {
  return (
    <div className="space-y-10">
      {groups.map((group) => {
        const asked = group.questions.filter((q) => shownToReader(q, answers));
        if (asked.length === 0) return null;
        return (
          <section
            key={group.key}
            aria-labelledby={`answers-${group.key}`}
            className="space-y-3"
          >
            <header className="max-w-2xl space-y-1">
              <h2
                id={`answers-${group.key}`}
                className="text-lg font-semibold tracking-tight"
              >
                {group.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{group.why}</p>
            </header>
            <dl className="divide-y divide-border/70 rounded-xl border border-border/70 bg-card">
              {asked.map((question) => (
                <AnswerRow
                  key={question.id}
                  question={question}
                  value={answers[question.id]}
                />
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

function AnswerRow({
  question,
  value,
}: {
  readonly question: QuestionView;
  readonly value: unknown;
}) {
  const long = question.type === "text";
  return (
    <div
      className={cn(
        "grid gap-x-8 gap-y-1.5 px-4 py-3.5 sm:px-5",
        long ? "" : "sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] sm:items-start",
      )}
    >
      <dt className="min-w-0 space-y-0.5">
        <p className="text-[15px] font-medium leading-snug">{question.label}</p>
        <BasisLine question={question} />
      </dt>
      <dd className={cn("min-w-0", long ? "" : "sm:text-right")}>
        <Answer question={question} value={value} />
      </dd>
    </div>
  );
}

function Answer({
  question,
  value,
}: {
  readonly question: QuestionView;
  readonly value: unknown;
}) {
  const t = useTranslations("supplierPortal.questionnaire");
  if (question.type === "boolean") return <YesNoAnswer value={value} />;
  if (!isAnswered(value))
    return (
      <span className="text-sm italic text-muted-foreground">{t("unanswered")}</span>
    );
  if (question.type === "integer")
    return (
      <span className="text-sm font-medium tabular-nums">
        {String(value)} {t("hours")}
      </span>
    );
  if (question.type === "enum")
    return (
      <span className="text-sm font-medium text-foreground">
        {question.options.find((option) => option.value === value)?.label ??
          String(value)}
      </span>
    );
  return (
    <span className="whitespace-pre-line break-words text-sm text-foreground">
      {String(value)}
    </span>
  );
}
