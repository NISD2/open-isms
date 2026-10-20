"use client";

import { Check, ListChecks, Plus, X } from "lucide-react";
import { useMessages, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nameKey } from "@/lib/asset-inventory/catalog-labels";
import {
  type ActivityFact,
  isYesNoFact,
  LEGAL_BASES,
  type LegalBasis,
} from "@/lib/durchgang";
import { ACTIVITY_BY_ID, ACTIVITY_CATALOG } from "@/lib/processing-activities/catalog";
import { type ActivityCopy, activityCopyOf } from "@/lib/processing-activities/copy";
import { type RouterOutputs, trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { ActivitySuppliers } from "./ActivitySuppliers";
import type { Described, Draft } from "./draft";
import { Aside, Heading, Lead } from "./ExplainScreens";
import { Toggle } from "./RowParts";
import { Suggestions } from "./Suggestions";
import type { Of, WorkProps } from "./WorkScreens";

type Activity = RouterOutputs["processingActivity"]["list"][number];

/** The catalogue's words in the page language: names and suggested answers, by activity id. */
function useActivityCopy(): ReadonlyMap<string, ActivityCopy> {
  const messages = useMessages();
  return activityCopyOf(messages.durchgang).copy;
}

/**
 * G-ROP.1: one slice of the catalogue, ticked into the record of processing activities. What the
 * company's asset list from the NIS 2 walk suggests starts ticked (`ItemView.suggestedActivities`)
 * and says why; what is on the record already shows ticked and stays: the walk only ever adds.
 */
export function Activities({
  item,
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"activities"> }) {
  const t = useTranslations("durchgang.ui.activities");
  const copy = useActivityCopy();
  const record = trpc.processingActivity.list.useQuery();
  const [own, setOwn] = useState("");
  const onRecord = new Set(
    (record.data ?? []).flatMap((a) => (a.catalogId ? [a.catalogId] : [])),
  );
  // An own activity saved on an earlier slice is on the record now; it is not pending twice.
  const recordNames = new Set((record.data ?? []).map((a) => nameKey(a.name)));
  const pendingOwn = draft.ownActivities.filter((n) => !recordNames.has(nameKey(n)));
  const suggested = new Set(item.suggestedActivities);
  const items = ACTIVITY_CATALOG.filter((a) =>
    entry.screen.groups.some((g) => g === a.group),
  );
  const toggle = (id: string) =>
    onDraft({
      ...draft,
      activities: draft.activities.includes(id)
        ? draft.activities.filter((x) => x !== id)
        : [...draft.activities, id],
    });
  const addOwn = () => {
    const name = own.trim();
    if (!name || draft.ownActivities.includes(name)) return;
    onDraft({ ...draft, ownActivities: [...draft.ownActivities, name] });
    setOwn("");
  };
  const count =
    (record.data?.length ?? 0) +
    draft.activities.filter((id) => !onRecord.has(id)).length +
    pendingOwn.length;

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
        <ListChecks className="size-4" />
        {t("count", { count })}
      </p>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {items.map(({ id }) => {
          const kept = onRecord.has(id);
          const on = kept || draft.activities.includes(id);
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={on}
                disabled={kept}
                onClick={() => toggle(id)}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-default",
                  on ? "border-primary bg-primary/[0.05]" : "hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border",
                    on && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {on && <Check className="size-3.5" />}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium leading-snug">
                    {copy.get(id)?.label ?? id}
                  </span>
                  {kept ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {t("onRecord")}
                    </span>
                  ) : suggested.has(id) ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {t("suggested")}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {pendingOwn.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {pendingOwn.map((name) => (
            <li
              key={name}
              className="flex items-center gap-2 rounded-xl border border-primary bg-primary/[0.05] px-4 py-2.5 text-sm"
            >
              <Check className="size-4 shrink-0 text-primary" />
              <span className="flex-1">{name}</span>
              <button
                type="button"
                aria-label={t("remove")}
                onClick={() =>
                  onDraft({
                    ...draft,
                    ownActivities: draft.ownActivities.filter((n) => n !== name),
                  })
                }
                className="cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-4 flex max-w-xl gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addOwn();
        }}
      >
        <Label htmlFor={`own-${entry.screen.id}`} className="sr-only">
          {t("own")}
        </Label>
        <Input
          id={`own-${entry.screen.id}`}
          value={own}
          placeholder={t("ownPlaceholder")}
          onChange={(e) => setOwn(e.target.value)}
          className="h-11 text-base sm:h-10 sm:text-sm"
        />
        <Button type="submit" variant="outline" className="h-11 sm:h-10">
          <Plus />
          {t("add")}
        </Button>
      </form>
    </>
  );
}

/** A fact's value as the screen shows it: what was entered on this visit, else what is stored. */
const shownValue = <K extends keyof Described & keyof Activity>(
  activity: Activity,
  draft: Draft,
  key: K,
): Described[K] | Activity[K] => draft.described[activity.id]?.[key] ?? activity[key];

/** Whether the activity answers every fact the screen asks. */
export const describedAll = (
  activity: Activity,
  draft: Draft,
  facts: readonly ActivityFact[],
): boolean =>
  facts.every((fact) => {
    const value = shownValue(activity, draft, fact);
    if (isYesNoFact(fact)) return typeof value === "boolean";
    if (fact === "legalBases") {
      const bases = Array.isArray(value) ? value : [];
      if (bases.length === 0) return false;
      // Legitimate interests are a basis only with the interest named (Art. 6(1)(f)).
      const interests = shownValue(activity, draft, "legitimateInterests");
      return (
        !bases.includes("legitimate_interests") ||
        (typeof interests === "string" && interests.trim() !== "")
      );
    }
    return typeof value === "string" && value.trim() !== "";
  });

/** The answer a catalogue item suggests for a fact; the yes or no facts have none. */
const suggestionOf = (
  copy: ActivityCopy | undefined,
  fact: ActivityFact,
): string | null => {
  if (!copy) return null;
  switch (fact) {
    case "purpose":
    case "dataSubjects":
    case "dataCategories":
    case "recipients":
    case "retention":
      return copy[fact];
    // The bases themselves are marked as usual, never filled in; the interest has a suggestion.
    case "legalBases":
      return copy.legitimateInterests ?? null;
    case "specialCategories":
    case "transfersOutsideEea":
      return null;
    default:
      return fact satisfies never;
  }
};

/**
 * G-ROP.1: each activity on the record, with the Art. 30(1) facts this screen asks. A catalogue
 * activity offers its suggested answer under each field, which a tap takes over; nothing is filled
 * in for the person.
 */
export function Describe({
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"describe"> }) {
  const t = useTranslations("durchgang.ui.describe");
  const copy = useActivityCopy();
  const record = trpc.processingActivity.list.useQuery();
  const set = (activity: Activity, change: Described) =>
    onDraft({
      ...draft,
      described: {
        ...draft.described,
        [activity.id]: { ...draft.described[activity.id], ...change },
      },
    });

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      {record.data === undefined ? null : record.data.length === 0 ? (
        <Aside className="mt-8">{t("empty")}</Aside>
      ) : (
        <ul className="mt-8 space-y-4">
          {record.data.map((activity) => {
            const own = activity.catalogId ? copy.get(activity.catalogId) : undefined;
            return (
              <li key={activity.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <p className="text-lg font-semibold">{activity.name}</p>
                <div className="mt-4 space-y-5">
                  {entry.screen.suppliers && (
                    <ActivitySuppliers
                      id={`${activity.id}-suppliers`}
                      activity={activity}
                      chosen={draft.described[activity.id]?.supplierIds}
                      onChange={(supplierIds) => set(activity, { supplierIds })}
                    />
                  )}
                  {entry.screen.facts.map((fact) => (
                    <FactInput
                      key={fact}
                      id={`${activity.id}-${fact}`}
                      fact={fact}
                      activity={activity}
                      draft={draft}
                      suggestion={suggestionOf(own, fact)}
                      usual={
                        (activity.catalogId &&
                          ACTIVITY_BY_ID.get(activity.catalogId)?.bases) ||
                        []
                      }
                      onChange={(change) => set(activity, change)}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function FactInput({
  id,
  fact,
  activity,
  draft,
  suggestion,
  usual,
  onChange,
}: {
  id: string;
  fact: ActivityFact;
  activity: Activity;
  draft: Draft;
  suggestion: string | null;
  /** The bases a catalogue activity usually rests on, marked, never ticked for the person. */
  usual: readonly LegalBasis[];
  onChange: (change: Described) => void;
}) {
  const t = useTranslations("durchgang.ui.describe.facts");
  const value = shownValue(activity, draft, fact);
  if (fact === "legalBases") {
    const chosen: readonly LegalBasis[] = Array.isArray(value) ? value : [];
    const interests = shownValue(activity, draft, "legitimateInterests");
    // Kept in the order of Art. 6(1), so the same choice is always stored the same way.
    const toggle = (basis: LegalBasis) =>
      onChange({
        legalBases: LEGAL_BASES.filter((b) =>
          b === basis ? !chosen.includes(b) : chosen.includes(b),
        ),
      });
    return (
      <fieldset>
        <legend className="text-sm font-medium">{t("legalBases.label")}</legend>
        <p className="mt-0.5 text-sm text-muted-foreground">{t("legalBases.hint")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LEGAL_BASES.map((basis) => (
            <Toggle key={basis} on={chosen.includes(basis)} onClick={() => toggle(basis)}>
              {usual.includes(basis)
                ? `${t(`legalBases.bases.${basis}`)} · ${t("legalBases.usual")}`
                : t(`legalBases.bases.${basis}`)}
            </Toggle>
          ))}
        </div>
        {chosen.includes("legitimate_interests") && (
          <div className="mt-3 max-w-xl space-y-1.5">
            <Label htmlFor={`${id}-interests`}>{t("legitimateInterests.label")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("legitimateInterests.hint")}
            </p>
            <Textarea
              id={`${id}-interests`}
              rows={2}
              value={typeof interests === "string" ? interests : ""}
              onChange={(e) => onChange({ legitimateInterests: e.target.value })}
              className="text-base sm:text-sm"
            />
            {suggestion && (
              <Suggestions
                items={[suggestion]}
                value={typeof interests === "string" ? interests : ""}
                onChange={(next) => onChange({ legitimateInterests: next })}
              />
            )}
          </div>
        )}
      </fieldset>
    );
  }
  if (isYesNoFact(fact)) {
    const details = shownValue(activity, draft, "transferDetails");
    return (
      <fieldset>
        <legend className="text-sm font-medium">{t(`${fact}.label`)}</legend>
        <p className="mt-0.5 text-sm text-muted-foreground">{t(`${fact}.hint`)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Toggle on={value === true} onClick={() => onChange({ [fact]: true })}>
            {t(`${fact}.yes`)}
          </Toggle>
          <Toggle on={value === false} onClick={() => onChange({ [fact]: false })}>
            {t(`${fact}.no`)}
          </Toggle>
        </div>
        {fact === "transfersOutsideEea" && value === true && (
          <div className="mt-3 max-w-xl space-y-1.5">
            <Label htmlFor={`${id}-details`}>{t("transfersOutsideEea.details")}</Label>
            <Input
              id={`${id}-details`}
              value={typeof details === "string" ? details : ""}
              placeholder={t("transfersOutsideEea.detailsHint")}
              onChange={(e) => onChange({ transferDetails: e.target.value })}
              className="h-11 text-base sm:h-10 sm:text-sm"
            />
          </div>
        )}
      </fieldset>
    );
  }
  const text = typeof value === "string" ? value : "";
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{t(`${fact}.label`)}</Label>
      <p className="text-sm text-muted-foreground">{t(`${fact}.hint`)}</p>
      <Textarea
        id={id}
        rows={2}
        value={text}
        onChange={(e) => onChange({ [fact]: e.target.value })}
        className="text-base sm:text-sm"
      />
      {suggestion && (
        <Suggestions
          items={[suggestion]}
          value={text}
          onChange={(next) => onChange({ [fact]: next })}
        />
      )}
    </div>
  );
}
