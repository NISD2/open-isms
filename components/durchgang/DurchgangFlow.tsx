"use client";

/**
 * The opening of the Durchgang: journey item 12.1 split across three questions, with the answers
 * shown back.
 *
 * Every screen validates. That is the gap this closes: the existing requirement step runs a bare
 * `useForm` with `Controller` and no resolver, so nothing on it can be wrong, only empty. These
 * answers decide which of the 49 items address the company, so "nobody said" has to be a state the
 * form cannot leave behind by accident. Each screen therefore carries its own small schema and the
 * forward button is disabled until it passes.
 *
 * The state shape is `Answers` from the policy's own module, which is what the server will persist
 * once the procedure exists. Nothing here is a throwaway prototype of a different shape.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Minus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ADDRESSEE_LABEL, STEP_COPY, UI } from "@/lib/compliance/guided-form/content.de";
import {
  type Addressee,
  SERVICE_TYPES,
  type ServiceTypeId,
} from "@/lib/compliance/guided-form/policy";
import {
  type Answers,
  canWait,
  NOTHING_ANSWERED,
  type Removed,
  reduction,
  STEPS,
  type StepId,
  stepAfter,
  stepBefore,
  stepState,
} from "@/lib/compliance/guided-form/steps";
import { StepShell } from "./StepShell";

/** Items the register holds, with who each one addresses. Read server side. */
export interface RegisterItem {
  readonly code: string;
  readonly title: string;
  readonly addressee: Addressee;
}

export interface DurchgangFlowProps {
  readonly register: readonly RegisterItem[];
  /** The verbatim statute text per step, sliced server side so the whole law is not shipped. */
  readonly statutes: Readonly<Partial<Record<StepId, string>>>;
}

const choiceCard =
  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/40 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5";

export function DurchgangFlow({ register, statutes }: DurchgangFlowProps) {
  const [current, setCurrent] = useState<StepId>("welcome");
  const [answers, setAnswers] = useState<Answers>(NOTHING_ANSWERED);

  const step = STEPS.find((s) => s.id === current) ?? STEPS[0];
  const index = STEPS.findIndex((s) => s.id === step.id);
  const copy = STEP_COPY[step.id];
  const counts = useMemo(
    () => reduction(register, answers.facts),
    [register, answers.facts],
  );

  const goto = (id: StepId | null) => id && setCurrent(id);
  const forward = () => goto(stepAfter(step.id)?.id ?? null);

  /** Record a wait and move on. The wait is the reason, so it is never a silent skip. */
  const leaveOpen = () => {
    if (!copy.wait) return;
    setAnswers((a) => ({
      ...a,
      waiting: { ...a.waiting, [step.id]: { reason: copy.wait ?? "" } },
    }));
    forward();
  };

  /** An answer clears any wait on the same step, which is the property the tests pin down. */
  const answer = (patch: Partial<Answers["facts"]>) => {
    setAnswers((a) => {
      const waiting = { ...a.waiting };
      delete waiting[step.id];
      return { facts: { ...a.facts, ...patch }, waiting };
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
    // What could still apply, not what does. It falls as answers of "no" come in, and it never
    // claims an unanswered item is theirs.
    counter:
      step.kind === "fact"
        ? { value: counts.addressed + counts.unsettled, label: UI.inPlay }
        : null,
    onBack: index > 0 ? () => goto(stepBefore(step.id)?.id ?? null) : null,
    waitLabel: canWait(step) ? (copy.wait ?? null) : null,
    onWait: canWait(step) ? leaveOpen : null,
    isWaiting: stepState(step, answers) === "blocked",
  };

  switch (step.id) {
    case "welcome":
      return (
        <StepShell {...shell} onNext={forward} nextLabel={UI.start}>
          <WelcomeBody total={register.length} />
        </StepShell>
      );

    case "sector":
      return (
        <SectorStep
          shell={shell}
          onAnswer={(inList) => answer({ sector35_2: inList ? "yes" : "no" })}
        />
      );

    case "service_types":
      return (
        <ServiceTypesStep
          shell={shell}
          onAnswer={(types) => answer({ serviceTypes: types })}
        />
      );

    case "critical_installation":
      return (
        <CriticalInstallationStep
          shell={shell}
          onAnswer={(yes) => answer({ criticalInstallation: yes ? "yes" : "no" })}
        />
      );

    case "your_number":
      return (
        <StepShell {...shell} onNext={null}>
          <YourNumber counts={counts} register={register} />
        </StepShell>
      );
  }
}

// ---------------------------------------------------------------------------

type Shell = Omit<React.ComponentProps<typeof StepShell>, "children" | "onNext">;

function WelcomeBody({ total }: { readonly total: number }) {
  return (
    <Card>
      <CardContent className="space-y-3 py-5 text-sm leading-relaxed">
        <p>
          Wir gehen {total} Punkte durch, einen pro Bildschirm. Zu jedem steht daneben,
          woher er kommt und was er verlangt.
        </p>
        <p>
          Die nächsten drei Fragen entscheiden, welche dieser Punkte überhaupt für Sie
          gelten. Danach sehen Sie Ihre Liste.
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

const sectorSchema = z.object({ sector: z.string().min(1) });

function SectorStep({
  shell,
  onAnswer,
}: {
  readonly shell: Shell;
  readonly onAnswer: (inList: boolean) => void;
}) {
  const copy = STEP_COPY.sector;
  const form = useForm<z.infer<typeof sectorSchema>>({
    resolver: zodResolver(sectorSchema),
    defaultValues: { sector: "" },
  });
  const chosen = form.watch("sector");

  return (
    <StepShell
      {...shell}
      onNext={form.handleSubmit((v) => onAnswer(v.sector !== "none"))}
      nextDisabled={!chosen}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="sector"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  className="gap-2"
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  {copy.choices?.map((c) => (
                    <FormLabel
                      key={c.value}
                      className={choiceCard}
                      htmlFor={`sector-${c.value}`}
                    >
                      <FormControl>
                        <RadioGroupItem
                          id={`sector-${c.value}`}
                          value={c.value}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <span className="space-y-0.5">
                        <span className="block font-normal leading-snug">{c.label}</span>
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
            </FormItem>
          )}
        />
      </Form>
    </StepShell>
  );
}

// ---------------------------------------------------------------------------

/**
 * The multi-select, and the one place the tri-valued answer is enforced.
 *
 * "None of these" is a box rather than an empty form, because an empty selection is ambiguous: it
 * could mean none apply or it could mean nobody has looked. The schema refuses a submission that
 * says neither, so the ambiguous state cannot be recorded.
 */
const serviceSchema = z
  .object({ types: z.array(z.string()), none: z.boolean() })
  .refine((v) => v.none !== v.types.length > 0, {
    message: "Bitte wählen Sie die zutreffenden Dienste oder ausdrücklich keinen davon.",
  });

function ServiceTypesStep({
  shell,
  onAnswer,
}: {
  readonly shell: Shell;
  readonly onAnswer: (types: readonly ServiceTypeId[]) => void;
}) {
  const form = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { types: [], none: false },
  });
  const types = form.watch("types");
  const none = form.watch("none");

  const toggle = (id: string, on: boolean) => {
    form.setValue("types", on ? [...types, id] : types.filter((t) => t !== id), {
      shouldValidate: true,
    });
    if (on) form.setValue("none", false, { shouldValidate: true });
  };

  return (
    <StepShell
      {...shell}
      onNext={form.handleSubmit((v) => onAnswer(v.types as ServiceTypeId[]))}
      nextDisabled={!none && types.length === 0}
    >
      <Form {...form}>
        <div className="space-y-2">
          {SERVICE_TYPES.map((s) => {
            // Every type is named by at least one of the two lists, which the policy test pins.
            const label = s.phrase60Abs1 ?? s.phrase30Abs3;
            const onlyOnOne = s.phrase60Abs1 === null || s.phrase30Abs3 === null;
            return (
              <FormLabel key={s.id} className={choiceCard} htmlFor={`svc-${s.id}`}>
                <Checkbox
                  id={`svc-${s.id}`}
                  className="mt-0.5"
                  checked={types.includes(s.id)}
                  onCheckedChange={(v) => toggle(s.id, v === true)}
                />
                <span className="space-y-0.5">
                  <span className="block font-normal leading-snug">{label}</span>
                  {onlyOnOne ? (
                    <span className="block text-muted-foreground text-xs">
                      {s.phrase30Abs3 === null
                        ? "Nur in § 60 Abs. 1 Satz 1 genannt"
                        : "Nur in § 30 Abs. 3 genannt"}
                    </span>
                  ) : null}
                </span>
              </FormLabel>
            );
          })}

          <Separator className="my-3" />

          <FormLabel className={choiceCard} htmlFor="svc-none">
            <Checkbox
              id="svc-none"
              className="mt-0.5"
              checked={none}
              onCheckedChange={(v) => {
                form.setValue("none", v === true, { shouldValidate: true });
                if (v === true) form.setValue("types", [], { shouldValidate: true });
              }}
            />
            <span className="space-y-0.5">
              <span className="block font-normal leading-snug">{UI.none}</span>
              <span className="block text-muted-foreground text-xs">
                Das ist eine Antwort, kein Überspringen.
              </span>
            </span>
          </FormLabel>
        </div>
      </Form>
    </StepShell>
  );
}

// ---------------------------------------------------------------------------

const criticalSchema = z.object({ answer: z.enum(["yes", "no"]) });

function CriticalInstallationStep({
  shell,
  onAnswer,
}: {
  readonly shell: Shell;
  readonly onAnswer: (yes: boolean) => void;
}) {
  const copy = STEP_COPY.critical_installation;
  const form = useForm<z.infer<typeof criticalSchema>>({
    resolver: zodResolver(criticalSchema),
  });
  const chosen = form.watch("answer");

  return (
    <StepShell
      {...shell}
      onNext={form.handleSubmit((v) => onAnswer(v.answer === "yes"))}
      nextDisabled={!chosen}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="answer"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  className="gap-2"
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  {copy.choices?.map((c) => (
                    <FormLabel
                      key={c.value}
                      className={choiceCard}
                      htmlFor={`crit-${c.value}`}
                    >
                      <FormControl>
                        <RadioGroupItem
                          id={`crit-${c.value}`}
                          value={c.value}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <span className="font-normal leading-snug">{c.label}</span>
                    </FormLabel>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </Form>
    </StepShell>
  );
}

// ---------------------------------------------------------------------------

function YourNumber({
  counts,
  register,
}: {
  readonly counts: ReturnType<typeof reduction>;
  readonly register: readonly RegisterItem[];
}) {
  const removedTitles = (r: Removed) =>
    register.filter((i) => i.addressee === r.addressee).map((i) => i.title);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <span className="font-semibold text-5xl tabular-nums">{counts.addressed}</span>
        <span className="text-muted-foreground">{UI.addressed(counts.total)}</span>
      </div>

      {counts.removed.length > 0 ? (
        <section className="space-y-2">
          <h2 className="font-medium text-sm">{UI.removedHeading}</h2>
          {counts.removed.map((r) => (
            <Card key={r.addressee}>
              <CardContent className="flex items-start gap-3 py-4">
                <Minus
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <div className="space-y-1">
                  <p className="font-medium text-sm">{UI.removedCount(r.count)}</p>
                  <p className="text-muted-foreground text-xs">
                    {ADDRESSEE_LABEL[r.addressee]}, und das haben Sie verneint.
                  </p>
                  <ul className="list-inside list-disc text-muted-foreground text-xs">
                    {removedTitles(r).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      {counts.unsettled > 0 ? (
        <section className="space-y-2">
          <h2 className="font-medium text-sm">{UI.unsettledHeading}</h2>
          <Card>
            <CardContent className="space-y-1 py-4">
              <p className="text-sm">
                <Badge variant="secondary" className="mr-2 tabular-nums">
                  {counts.unsettled}
                </Badge>
                {UI.unsettledNote}
              </p>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <p className="flex items-start gap-2 text-muted-foreground text-sm">
        <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Jede weggefallene Zeile steht mit Grund und Datum in Ihrem Nachweis.
      </p>
    </div>
  );
}
