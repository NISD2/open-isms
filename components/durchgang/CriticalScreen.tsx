"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { OUTAGE_SPANS } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { Critical } from "./draft";
import { Heading, Lead } from "./ExplainScreens";
import { Toggle } from "./RowParts";
import { Suggestions } from "./Suggestions";
import type { Of, WorkProps } from "./WorkScreens";

/**
 * 4.2: the business processes on the company's list. The person marks what must keep running
 * without IT, says in one line how, and how long it may be down at most (BSI-Standard 200-4
 * p. 178, on five coarse steps); the plan on the next screens prints all three. The mark is the
 * asset's own `is_critical`, which the asset page shows too; the tolerance is its `max_outage`,
 * answered only here and read by the plan, the 4.4 comparison and the export.
 */
export function CriticalScreen({
  item,
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"critical"> }) {
  const t = useTranslations("durchgang.ui.critical");
  const assets = trpc.asset.list.useQuery();
  const plan = trpc.durchgang.policyDraft.useQuery({ code: item.code });
  if (!assets.data || !plan.data) return null;
  const fallbacks = plan.data.fallbacks;
  const processes = assets.data.filter((a) => a.type === "process");

  const answerOf = (process: (typeof processes)[number]): Critical =>
    draft.critical[process.id] ?? {
      on: Boolean(process.isCritical),
      how: fallbacks[process.id] ?? "",
      // A tolerance belongs to a process that must keep running; a stale one never shows pressed.
      outage: process.isCritical ? (process.maxOutage ?? null) : null,
    };
  const set = (id: string, value: Critical) =>
    onDraft({ ...draft, critical: { ...draft.critical, [id]: value } });

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      {processes.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
          {processes.map((process) => {
            const value = answerOf(process);
            const inputId = `dg-critical-${process.id}`;
            return (
              <li key={process.id} className="space-y-3 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium break-words">{process.name}</p>
                  <Toggle
                    on={value.on}
                    onClick={() => set(process.id, { ...value, on: !value.on })}
                  >
                    {entry.copy.keep}
                  </Toggle>
                </div>
                {value.on && (
                  <div className="space-y-1.5">
                    <label htmlFor={inputId} className="text-sm text-muted-foreground">
                      {entry.copy.how}
                    </label>
                    <Input
                      id={inputId}
                      value={value.how}
                      maxLength={300}
                      placeholder={entry.copy.example}
                      onChange={(e) => set(process.id, { ...value, how: e.target.value })}
                    />
                    {entry.copy.suggestions && (
                      <Suggestions
                        items={entry.copy.suggestions}
                        value={value.how}
                        onChange={(how) => set(process.id, { ...value, how })}
                      />
                    )}
                    <fieldset className="space-y-2 pt-2">
                      <legend className="text-sm text-muted-foreground">
                        {entry.copy.outage}
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {OUTAGE_SPANS.map((span) => (
                          <button
                            key={span}
                            type="button"
                            aria-pressed={value.outage === span}
                            onClick={() =>
                              set(process.id, {
                                ...value,
                                outage: value.outage === span ? null : span,
                              })
                            }
                            className={cn(
                              "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
                              value.outage === span
                                ? "border-primary bg-primary/[0.06] text-foreground"
                                : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
                            )}
                          >
                            {entry.copy.outageOptions[span]}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {entry.copy.outageHint}
                      </p>
                    </fieldset>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
