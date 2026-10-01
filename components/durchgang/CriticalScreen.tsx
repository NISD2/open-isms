"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import type { Critical } from "./draft";
import { Heading, Lead } from "./ExplainScreens";
import { Toggle } from "./RowParts";
import type { Of, WorkProps } from "./WorkScreens";

/**
 * 4.2: the business processes on the company's list. The person marks what must keep running
 * without IT and says in one line how; the plan on the next screens prints both. The mark is the
 * asset's own `is_critical`, so the asset page shows the same.
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

  const answerOf = (id: string, stored: boolean | null): Critical =>
    draft.critical[id] ?? { on: Boolean(stored), how: fallbacks[id] ?? "" };
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
            const value = answerOf(process.id, process.isCritical);
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
