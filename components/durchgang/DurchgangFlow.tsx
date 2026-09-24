"use client";

/**
 * The Durchgang: the journey, one question per screen.
 *
 * No interview in front of it. Two earlier versions built one and both were deleted; the standing
 * rule is that the BSI portal already makes a company classify itself in order to register, so
 * asking again is re-doing their homework.
 *
 * Three kinds of screen, and which one you get is decided by data that already existed rather than
 * by anything authored here:
 *
 *   fields    one or more intake fields of the item, validated by its category schema
 *   row       the same, about ONE row of a register, repeated per row. This is why an item can be
 *             two hundred screens for one company and one screen for another.
 *   register  the item is satisfied by the register existing, not by answering per entry
 *
 * Every screen validates. That is the gap this closes: the existing requirement step runs a bare
 * `useForm` with `Controller` and no resolver, so a field there can be empty but never wrong, on a
 * screen whose output is a legal record.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Boxes, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
import { FIELD_LABEL, UI } from "@/lib/compliance/guided-form/content.de";
import type { ItemContent } from "@/lib/compliance/guided-form/journey";
import {
  type Answers,
  answerKey,
  fieldsOf,
  hasValue,
  NOTHING_ANSWERED,
  type Screen,
  screenAfter,
  screenBefore,
  screenIndex,
  screenState,
} from "@/lib/compliance/guided-form/steps";
import { ROW_SCHEMA } from "@/lib/compliance/requirement-rows";
import { renderFieldInput } from "@/lib/forms/field-renderer";
import { type FieldMeta, introspectSchema } from "@/lib/forms/schema-introspect";
import { StepShell } from "./StepShell";

export interface DurchgangFlowProps {
  readonly screens: readonly Screen[];
  /** Keyed by item code. Titles, descriptions and guidance from the existing message files. */
  readonly content: Readonly<Record<string, ItemContent>>;
  /** Verbatim statute per item, sliced server side so the whole law is not shipped. */
  readonly statutes: Readonly<Record<string, string>>;
  /**
   * Per-field explanation for the info icon, keyed by field name.
   *
   * Follows the `fieldDescriptions.<key>` convention the house form already uses. Empty today for
   * the intake fields, which is why most icons do not appear: filling those message files lights
   * them up with no change here. Nothing English is shown on a German screen in the meantime.
   */
  readonly fieldHelp: Readonly<Record<string, string>>;
  /** Screen to open on. Ignored when it names nothing, so a stale link lands at the start. */
  readonly startAt?: string;
}

/**
 * Field metadata for every schema a screen can draw on, introspected once.
 *
 * Category schemas for intake fields, the drizzle-zod entity schemas for row fields. Both come from
 * the schema that owns the column, so nothing about a field is restated here.
 */
const META: ReadonlyMap<string, readonly FieldMeta[]> = new Map([
  ...Object.entries(CATEGORY_SCHEMAS).map(
    ([code, schema]) => [`category:${code}`, introspectSchema(schema, [])] as const,
  ),
  ...Object.entries(ROW_SCHEMA).map(
    ([module, schema]) => [`row:${module}`, introspectSchema(schema, [])] as const,
  ),
]);

const metaKey = (screen: Screen): string =>
  screen.ask.kind === "row"
    ? `row:${screen.ask.module}`
    : `category:${screen.categoryCode}`;

const metasFor = (screen: Screen): readonly FieldMeta[] => {
  const all = META.get(metaKey(screen)) ?? [];
  return fieldsOf(screen)
    .map((f) => all.find((m) => m.key === f))
    .filter((m) => m !== undefined);
};

const REQUIRED: ReadonlySet<string> = new Set(
  [...META.values()].flatMap((metas) =>
    metas.filter((m) => m.required).map((m) => m.key),
  ),
);

const labelOf = (meta: FieldMeta): string => FIELD_LABEL[meta.key] ?? meta.label;

export function DurchgangFlow({
  screens,
  content,
  statutes,
  fieldHelp,
  startAt,
}: DurchgangFlowProps) {
  const [current, setCurrent] = useState<string>(
    (startAt && screens.some((s) => s.id === startAt) ? startAt : screens[0]?.id) ?? "",
  );
  const [answers, setAnswers] = useState<Answers>(NOTHING_ANSWERED);

  const screen = screens.find((s) => s.id === current) ?? screens[0];
  if (!screen) return null;

  const index = screenIndex(screens, screen.id);
  const item = content[screen.item];
  const goto = (id: string | null) => id && setCurrent(id);
  const forward = () => goto(screenAfter(screens, screen.id)?.id ?? null);

  /** Record a wait and move on. The wait carries its reason, so it is never a silent skip. */
  const leaveOpen = () => {
    setAnswers((a) => ({
      ...a,
      waiting: { ...a.waiting, [screen.id]: { reason: UI.leftOpen } },
    }));
    forward();
  };

  /** An answer clears any wait on the same screen, so a screen is never both. */
  const save = (values: Readonly<Record<string, unknown>>) => {
    setAnswers((a) => {
      const waiting = { ...a.waiting };
      delete waiting[screen.id];
      return { values: { ...a.values, ...values }, waiting };
    });
    forward();
  };

  const shell = {
    question: questionFor(screen, item),
    subline: sublineFor(screen, item),
    sidebar: item
      ? { explains: item.summary ?? item.description, cite: item.legalRef ?? "" }
      : null,
    statute: statutes[screen.item] ?? null,
    stepNumber: index + 1,
    stepCount: screens.length,
    item: UI.item(screen.item),
    onBack: index > 0 ? () => goto(screenBefore(screens, screen.id)?.id ?? null) : null,
    waitLabel: UI.leaveOpen,
    onWait: leaveOpen,
    isWaiting: screenState(screen, answers, REQUIRED) === "blocked",
  };

  if (screen.ask.kind === "register") {
    return (
      <StepShell
        {...shell}
        onNext={() => save({ [screen.id]: true })}
        nextLabel={UI.confirmed}
      >
        <RegisterBody module={screen.ask.module} item={item} />
      </StepShell>
    );
  }

  return (
    <FieldsScreen
      key={screen.id}
      shell={shell}
      screen={screen}
      values={answers.values}
      fieldHelp={fieldHelp}
      onSave={save}
    />
  );
}

// ---------------------------------------------------------------------------

type Shell = Omit<React.ComponentProps<typeof StepShell>, "children" | "onNext">;

/**
 * The heading.
 *
 * A single field asks itself, which is what makes one question per screen read as a question rather
 * than a form. A grouped screen asks the item, because the individual ticks are the answer.
 */
const questionFor = (screen: Screen, item: ItemContent | undefined): string => {
  const metas = metasFor(screen);
  const single = metas.length === 1 ? metas[0] : undefined;
  return single ? labelOf(single) : (item?.title ?? screen.item);
};

/**
 * A row screen has to say WHICH supplier or asset it is asking about, or the question cannot be
 * answered. It goes here rather than in a caption so it is read before the input.
 */
const sublineFor = (screen: Screen, item: ItemContent | undefined): string => {
  if (screen.row) return `${item?.title ?? screen.item} · ${screen.row.label}`;
  return item?.title ?? "";
};

function RegisterBody({
  module,
  item,
}: {
  readonly module: string;
  readonly item: ItemContent | undefined;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 py-5 text-sm leading-relaxed">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <Badge variant="outline" className="font-normal">
            {module ? UI.register(module) : UI.noRegister}
          </Badge>
        </div>
        <p>{item?.description}</p>
        {item?.applicability ? (
          <p className="text-muted-foreground">{item.applicability}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------

/**
 * The fields of one screen, validated by the schema that owns them.
 *
 * The schema is sliced to exactly these fields, so the resolver enforces what the category or
 * entity schema says and nothing is restated. Answers are keyed per screen as well as per field,
 * because a row screen asks the same field about many rows and those are not the same answer.
 */
function FieldsScreen({
  shell,
  screen,
  values,
  fieldHelp,
  onSave,
}: {
  readonly shell: Shell;
  readonly screen: Screen;
  readonly values: Readonly<Record<string, unknown>>;
  readonly fieldHelp: Readonly<Record<string, string>>;
  readonly onSave: (v: Readonly<Record<string, unknown>>) => void;
}) {
  const metas = metasFor(screen);
  const schema = useMemo(
    () =>
      z.object(
        Object.fromEntries(
          fieldsOf(screen).flatMap((f) => {
            const member = sliceFor(screen, f);
            return member ? [[f, member] as const] : [];
          }),
        ),
      ),
    [screen],
  );

  type Values = Record<string, unknown>;
  const form = useForm<Values>({
    resolver: zodResolver(schema) as Resolver<Values>,
    defaultValues: Object.fromEntries(
      fieldsOf(screen).map((f) => [f, values[answerKey(screen, f)] ?? ""]),
    ),
  });

  const watched = form.watch();
  const complete = metas.filter((m) => m.required).every((m) => hasValue(watched[m.key]));
  const showLabels = metas.length > 1;

  return (
    <StepShell
      {...shell}
      onNext={form.handleSubmit((v) =>
        onSave(
          Object.fromEntries(
            Object.entries(v).map(([k, val]) => [answerKey(screen, k), val]),
          ),
        ),
      )}
      nextDisabled={!complete}
    >
      <TooltipProvider>
        <Form {...form}>
          <div className="space-y-5">
            {metas.map((meta) => (
              <FormField
                key={meta.key}
                control={form.control}
                name={meta.key}
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    {showLabels ? (
                      <FormLabel>
                        {labelOf(meta)}
                        {meta.required ? null : (
                          <span className="ml-1 font-normal text-muted-foreground">
                            ({UI.optional})
                          </span>
                        )}
                        <FieldInfo text={fieldHelp[meta.key]} />
                      </FormLabel>
                    ) : null}
                    <FormControl>{renderFieldInput(meta, field)}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </Form>
      </TooltipProvider>
    </StepShell>
  );
}

/** The info icon. Absent rather than empty when there is nothing to say. */
function FieldInfo({ text }: { readonly text: string | undefined }) {
  if (!text) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="ml-1 inline h-3.5 w-3.5 cursor-help text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The member of the owning schema that validates one field of this screen.
 *
 * Return type inferred rather than annotated: the shape's member type is Zod's own internal one,
 * and naming it here would be restating a library detail that `z.object` already understands.
 */
const sliceFor = (screen: Screen, field: string) => {
  const owner =
    screen.ask.kind === "row"
      ? ROW_SCHEMA[screen.ask.module]
      : CATEGORY_SCHEMAS[screen.categoryCode];
  return owner?.shape[field] ?? null;
};
