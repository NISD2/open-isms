"use client";

/**
 * The opening of the Durchgang: the journey's own first items, one question per screen.
 *
 * There is no interview in front of this and there will not be one. The version deleted on
 * 25.09.2026 asked twenty-one options across three screens to move four of fifty-three items, which
 * is the proportionality engine's own failure ratio in new clothes.
 *
 * Every screen validates against the slice of `REG_SCHEMA` it collects. That is the gap this
 * closes: the existing requirement step runs a bare `useForm` with `Controller` and no resolver, so
 * a field there can be empty but never wrong, on a screen whose output is a legal record.
 *
 * The schema is the source for what a field is and whether it is required. Nothing about the fields
 * is restated here, so adding one to `REG_SCHEMA` reaches these screens without an edit.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { REG_SCHEMA } from "@/lib/compliance/category-schemas";
import { FIELD_LABEL, STEP_COPY, UI } from "@/lib/compliance/guided-form/content.de";
import {
  type Answers,
  canWait,
  hasValue,
  NOTHING_ANSWERED,
  STEPS,
  type Step,
  type StepId,
  stepAfter,
  stepBefore,
  stepState,
} from "@/lib/compliance/guided-form/steps";
import { renderFieldInput } from "@/lib/forms/field-renderer";
import { introspectSchema } from "@/lib/forms/schema-introspect";
import { StepShell } from "./StepShell";

export interface DurchgangFlowProps {
  /** The verbatim statute text per step, sliced server side so the whole law is not shipped. */
  readonly statutes: Readonly<Partial<Record<StepId, string>>>;
}

const choiceCard =
  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/40 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5";

/** What one screen collects: a bag of fields the category schema validates. */
type StepValues = Record<string, unknown>;

/**
 * The category's shape, read by key.
 *
 * Widened rather than cast: a step names its fields as data, so the lookup is by string and an
 * unknown key reads as undefined, which the caller already handles. The test asserts every key a
 * step names exists here, so a typo fails a test rather than silently skipping validation.
 */
const REG_SHAPE: Readonly<Record<string, z.ZodType>> = REG_SCHEMA.shape;

/** Every field the registration category defines, by key. The one source for type and requiredness. */
const REG_FIELDS = introspectSchema(REG_SCHEMA, []);
const metaOf = (key: string) => REG_FIELDS.find((f) => f.key === key);
const REQUIRED = new Set(REG_FIELDS.filter((f) => f.required).map((f) => f.key));

export function DurchgangFlow({ statutes }: DurchgangFlowProps) {
  const [current, setCurrent] = useState<StepId>("welcome");
  const [answers, setAnswers] = useState<Answers>(NOTHING_ANSWERED);

  const step = STEPS.find((s) => s.id === current) ?? STEPS[0];
  const index = STEPS.findIndex((s) => s.id === step.id);
  const copy = STEP_COPY[step.id];

  const goto = (id: StepId | null) => id && setCurrent(id);
  const forward = () => goto(stepAfter(step.id)?.id ?? null);

  /** Record a wait and move on. The wait carries its reason, so it is never a silent skip. */
  const leaveOpen = () => {
    if (!copy.wait) return;
    setAnswers((a) => ({
      ...a,
      waiting: { ...a.waiting, [step.id]: { reason: copy.wait ?? "" } },
    }));
    forward();
  };

  /** An answer clears any wait on the same step, so a step is never both. */
  const save = (values: Record<string, unknown>) => {
    setAnswers((a) => {
      const waiting = { ...a.waiting };
      delete waiting[step.id];
      return { values: { ...a.values, ...values }, waiting };
    });
    forward();
  };

  const shell = {
    question: copy.question,
    subline: copy.subline,
    sidebar: copy.sidebar,
    statute: statutes[step.id] ?? null,
    stepNumber: index + 1,
    stepCount: STEPS.length,
    item: step.kind === "question" ? UI.item(step.item) : null,
    onBack: index > 0 ? () => goto(stepBefore(step.id)?.id ?? null) : null,
    waitLabel: canWait(step) ? (copy.wait ?? null) : null,
    onWait: canWait(step) ? leaveOpen : null,
    isWaiting: stepState(step, answers, REQUIRED) === "blocked",
  };

  if (step.kind === "provision") {
    return (
      <StepShell {...shell} onNext={forward} nextLabel={UI.start}>
        <WelcomeBody />
      </StepShell>
    );
  }

  return (
    <QuestionStep
      key={step.id}
      shell={shell}
      step={step}
      values={answers.values}
      onSave={save}
      isLast={stepAfter(step.id) === null}
    />
  );
}

// ---------------------------------------------------------------------------

type Shell = Omit<React.ComponentProps<typeof StepShell>, "children" | "onNext">;

function WelcomeBody() {
  return (
    <Card>
      <CardContent className="space-y-3 py-5 text-sm leading-relaxed">
        <p>
          Wir gehen die Punkte einzeln durch, einen pro Bildschirm. Zu jedem steht
          daneben, woher er kommt und was er verlangt.
        </p>
        <p>
          Wir fangen bei der Einstufung und der Registrierung an, weil das Gesetz dort
          anfängt und alles Weitere daran hängt.
        </p>
        <p className="text-muted-foreground">
          Sie können jede Frage offen lassen und später beantworten. Beim nächsten
          Anmelden landen Sie wieder bei der ersten offenen Frage.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------

/**
 * One journey item's fields on one screen.
 *
 * The Zod schema is sliced to this step's fields, so the resolver enforces exactly what the
 * category schema says about them and nothing is restated. Where the copy supplies German choices
 * for an enum, they replace the raw schema values, which are English identifiers.
 */
function QuestionStep({
  shell,
  step,
  values,
  onSave,
  isLast,
}: {
  readonly shell: Shell;
  readonly step: Step;
  readonly values: Readonly<Record<string, unknown>>;
  readonly onSave: (v: Record<string, unknown>) => void;
  readonly isLast: boolean;
}) {
  const copy = STEP_COPY[step.id];

  /**
   * The step's own schema, built from the category schema's shape rather than restated.
   *
   * `.pick()` is not used because it wants a literal mask and this list is data, which is the
   * whole point: a step names its fields and the validation follows. The keys are checked against
   * the shape in test, so a typo here is a failing test rather than a silently unvalidated field.
   */
  const schema = useMemo(
    () =>
      z.object(
        Object.fromEntries(
          step.fields.flatMap((f) => {
            const member = REG_SHAPE[f];
            return member ? [[f, member] as const] : [];
          }),
        ),
      ),
    [step.fields],
  );
  const metas = step.fields.map(metaOf).filter((m) => m !== undefined);

  // react-hook-form cannot infer a type from a schema assembled at runtime. The values are a bag
  // of schema-validated fields, so that is what the form is typed as, and the resolver is narrowed
  // to match rather than cast to any.
  const form = useForm<StepValues>({
    resolver: zodResolver(schema) as Resolver<StepValues>,
    defaultValues: Object.fromEntries(step.fields.map((f) => [f, values[f] ?? ""])),
  });

  const watched = form.watch();
  const requiredHere = metas.filter((m) => m.required).map((m) => m.key);
  const complete = requiredHere.every((k) => hasValue(watched[k]));

  return (
    <StepShell
      {...shell}
      onNext={form.handleSubmit((v) => onSave(v))}
      nextLabel={isLast ? UI.done : undefined}
      nextDisabled={!complete}
    >
      <Form {...form}>
        <div className="space-y-5">
          {metas.map((meta) => (
            <FormField
              key={meta.key}
              control={form.control}
              name={meta.key}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  {metas.length > 1 ? (
                    <FormLabel>
                      {FIELD_LABEL[meta.key] ?? meta.label}
                      {meta.required ? null : (
                        <span className="ml-1 font-normal text-muted-foreground">
                          ({UI.optional})
                        </span>
                      )}
                    </FormLabel>
                  ) : null}
                  {copy.choices && meta.options ? (
                    <FormControl>
                      <RadioGroup
                        className="gap-2"
                        onValueChange={field.onChange}
                        value={typeof field.value === "string" ? field.value : ""}
                      >
                        {copy.choices.map((c) => (
                          <FormLabel
                            key={c.value}
                            className={choiceCard}
                            htmlFor={`${meta.key}-${c.value}`}
                          >
                            <RadioGroupItem
                              id={`${meta.key}-${c.value}`}
                              value={c.value}
                              className="mt-0.5"
                            />
                            <span className="space-y-0.5">
                              <span className="block font-normal leading-snug">
                                {c.label}
                              </span>
                              {c.hint ? (
                                <span className="block text-muted-foreground text-xs">
                                  {c.hint}
                                </span>
                              ) : null}
                            </span>
                          </FormLabel>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  ) : (
                    <FormControl>{renderFieldInput(meta, field)}</FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </Form>
    </StepShell>
  );
}
