"use client";

/**
 * The supplier's side of the questionnaire, one portal page at a time. Every question shows its
 * "tick yes if" help underneath (most people need it to answer correctly, so it is not hidden
 * behind an icon) and the provision it rests on. A yes/no question starts unanswered: an
 * untouched box used to read as "no" to every customer.
 *
 * A question that depends on another answer (`conditions`, from the questionnaire package)
 * appears and disappears as that answer changes. Saving writes only this page's questions;
 * answers on other pages are passed in so the conditions can be read.
 */
import { conditionsHold } from "@nisd2/nis2-supply-chain-questionnaire-schema/schema";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import type { QuestionnaireField } from "@/lib/forms/supplier-portal-sections";
import { normalizeDomain } from "@/lib/supplier-portal/domain";
import type { GroupView, QuestionView } from "@/lib/supplier-portal/questionnaire-view";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { securityProfileUpdateSchema } from "@/schema/validators";
import { BasisLine, isAnswered, YesNoValue } from "./parts";

type Answers = Partial<Record<QuestionnaireField, unknown>>;

/** What the form holds for each kind of question: text as typed, yes/no as a boolean or null. */
const editable = (question: QuestionView, value: unknown): unknown => {
  if (question.type === "boolean") return typeof value === "boolean" ? value : null;
  if (question.type === "integer") return typeof value === "number" ? String(value) : "";
  return typeof value === "string" ? value : "";
};

/** What is saved: a blank text or number is no answer, so it is stored as none. */
const stored = (question: QuestionView, value: unknown): unknown => {
  if (question.type === "boolean") return value;
  const text = typeof value === "string" ? value.trim() : "";
  if (text === "") return null;
  if (question.type === "integer") return Number.parseInt(text, 10);
  if (question.type === "country") return text.toUpperCase();
  if (question.type === "domain") return normalizeDomain(text) ?? text;
  return text;
};

/** The message shown when the save schema rejects an answer, by kind of question. */
const invalidKey = (type: QuestionView["type"]) =>
  type === "domain" || type === "email" || type === "country" ? type : "other";

const INPUT_TYPES: Partial<Record<QuestionView["type"], string>> = {
  email: "email",
  url: "url",
  phone: "tel",
};

export function QuestionnaireForm({
  groups,
  answers,
  lastSavedAt,
}: {
  readonly groups: readonly GroupView[];
  /** Every questionnaire answer the company has, so conditions across pages can be read. */
  readonly answers: Answers;
  readonly lastSavedAt: string | null;
}) {
  const t = useTranslations("supplierPortal.questionnaire");
  const format = useFormatter();
  const router = useRouter();
  const questions = useMemo(() => groups.flatMap((group) => group.questions), [groups]);
  const initial = useMemo(
    () =>
      Object.fromEntries(
        questions.map((q) => [q.id, editable(q, answers[q.id])]),
      ) as Answers,
    [questions, answers],
  );
  const [values, setValues] = useState<Answers>(initial);
  const [saved, setSaved] = useState<Answers>(initial);
  const [errors, setErrors] = useState<Partial<Record<QuestionnaireField, string>>>({});

  const current: Answers = { ...answers, ...values };
  const shows = (q: QuestionView) => conditionsHold(q.conditions, current);
  const shown = questions.filter(shows);
  const dirty = questions.some((q) => values[q.id] !== saved[q.id]);

  const save = trpc.supplierPortal.profile.save.useMutation({
    onSuccess: () => {
      setSaved(values);
      toast.success(t("saved"));
      router.refresh();
    },
    onError: () => toast.error(t("saveError")),
  });

  const submit = () => {
    const payload = Object.fromEntries(
      questions.map((q) => [q.id, stored(q, values[q.id])]),
    );
    const parsed = securityProfileUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      const typeOf = new Map(questions.map((q) => [q.id as string, q.type]));
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => {
            const id = String(issue.path[0]);
            const type = typeOf.get(id);
            return [id, t(`invalid.${type ? invalidKey(type) : "other"}`)];
          }),
        ),
      );
      return;
    }
    setErrors({});
    save.mutate(parsed.data);
  };

  const set = (id: QuestionnaireField, value: unknown) =>
    setValues((previous) => ({ ...previous, [id]: value }));

  return (
    // The save schema decides what is valid. The browser's own check would block a submit
    // silently, with no message in the form and no request sent.
    <form
      noValidate
      className="space-y-10"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {groups.map((group) => {
        const visible = group.questions.filter(shows);
        if (visible.length === 0) return null;
        return (
          <section
            key={group.key}
            aria-labelledby={`group-${group.key}`}
            className="space-y-4"
          >
            <header className="max-w-2xl space-y-1">
              <h2
                id={`group-${group.key}`}
                className="text-lg font-semibold tracking-tight"
              >
                {group.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{group.why}</p>
            </header>
            <div className="divide-y divide-border/70 rounded-xl border border-border/70 bg-card">
              {visible.map((question) => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  value={values[question.id]}
                  error={errors[question.id]}
                  onChange={(value) => set(question.id, value)}
                />
              ))}
            </div>
          </section>
        );
      })}

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-medium text-foreground tabular-nums">
            {t("answered", {
              answered: shown.filter((q) => isAnswered(values[q.id])).length,
              total: shown.length,
            })}
          </span>
          <span aria-hidden> · </span>
          {dirty
            ? t("unsaved")
            : lastSavedAt
              ? t("savedAt", {
                  time: format.dateTime(new Date(lastSavedAt), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                })
              : t("notSavedYet")}
        </p>
        <Button type="submit" disabled={!dirty || save.isPending} className="h-10 px-5">
          {save.isPending ? t("submitting") : t("save")}
        </Button>
      </div>
    </form>
  );
}

function QuestionRow({
  question,
  value,
  error,
  onChange,
}: {
  readonly question: QuestionView;
  readonly value: unknown;
  readonly error: string | undefined;
  readonly onChange: (value: unknown) => void;
}) {
  const inputId = `q-${question.id}`;
  const labelId = `${inputId}-label`;
  const helpId = `${inputId}-help`;
  const yesNo = question.type === "boolean";
  const labelClass = "block text-[15px] font-medium leading-snug";
  return (
    <div
      className={cn(
        "grid gap-x-8 gap-y-3 px-4 py-4 sm:px-5",
        yesNo ? "sm:grid-cols-[minmax(0,1fr)_auto]" : "",
      )}
    >
      <div className="min-w-0 space-y-1">
        {yesNo ? (
          <p id={labelId} className={labelClass}>
            {question.label}
          </p>
        ) : (
          <label htmlFor={inputId} id={labelId} className={labelClass}>
            {question.label}
          </label>
        )}
        <p
          id={helpId}
          className="max-w-prose text-sm leading-relaxed text-muted-foreground"
        >
          {question.help}
        </p>
        <BasisLine basis={question.basis} />
      </div>
      <div
        className={cn(yesNo ? "sm:pt-0.5" : question.type === "text" ? "" : "max-w-md")}
      >
        {yesNo ? (
          <YesNoValue
            name={inputId}
            labelledBy={labelId}
            value={typeof value === "boolean" ? value : null}
            onChange={onChange}
          />
        ) : (
          <QuestionInput
            question={question}
            inputId={inputId}
            helpId={helpId}
            value={value}
            onChange={onChange}
          />
        )}
        {error ? (
          <p className="mt-1.5 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  inputId,
  helpId,
  value,
  onChange,
}: {
  readonly question: QuestionView;
  readonly inputId: string;
  readonly helpId: string;
  readonly value: unknown;
  readonly onChange: (value: unknown) => void;
}) {
  const t = useTranslations("supplierPortal.questionnaire");
  const text = typeof value === "string" ? value : "";
  if (question.type === "text")
    return (
      <Textarea
        id={inputId}
        aria-describedby={helpId}
        value={text}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 text-base sm:text-sm"
      />
    );
  if (question.type === "integer")
    return (
      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          aria-describedby={helpId}
          inputMode="numeric"
          value={text}
          onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, ""))}
          className="h-10 w-28 text-base tabular-nums sm:text-sm"
        />
        <span className="text-sm text-muted-foreground">{t("hours")}</span>
      </div>
    );
  if (question.type === "country")
    return (
      <Input
        id={inputId}
        aria-describedby={helpId}
        value={text}
        maxLength={2}
        autoCapitalize="characters"
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        className="h-10 w-20 text-base uppercase sm:text-sm"
      />
    );
  return (
    <Input
      id={inputId}
      aria-describedby={helpId}
      type={INPUT_TYPES[question.type] ?? "text"}
      value={text}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 text-base sm:text-sm"
    />
  );
}
