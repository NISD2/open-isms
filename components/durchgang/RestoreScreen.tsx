"use client";

import { useTranslations } from "next-intl";
import { OUTAGE_SPANS } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { Restore } from "./draft";
import { Heading, Lead } from "./ExplainScreens";
import type { Of, WorkProps } from "./WorkScreens";

const chip = (on: boolean) =>
  cn(
    "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
    on
      ? "border-primary bg-primary/[0.06] text-foreground"
      : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
  );

/**
 * 4.4: the systems the critical processes need (4.2), each with how long it takes to bring it
 * back, on the same five steps as the tolerance, or "unknown", which the standard allows as an
 * answer and the next screen lists as a gap (BSI-Standard 200-4 p. 196). The answers are the
 * asset's own columns, answered only here and read by the comparison, the approval's open points
 * and the export.
 */
export function RestoreScreen({
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"restore"> }) {
  const spans = useTranslations("durchgang.ui.spans");
  const assets = trpc.asset.list.useQuery();
  const links = trpc.durchgang.processNeeds.useQuery();
  if (!assets.data || !links.data) return null;
  const needed = new Set(links.data.map((l) => l.assetId));
  const systems = assets.data.filter((a) => a.type !== "process" && needed.has(a.id));
  const nameOf = new Map(assets.data.map((a) => [a.id, a.name]));
  const neededBy = (assetId: string): readonly string[] =>
    (links.data ?? [])
      .filter((l) => l.assetId === assetId)
      .flatMap((l) => {
        const name = nameOf.get(l.processId);
        return name ? [name] : [];
      });

  const shown = (system: (typeof systems)[number]): Restore =>
    draft.restore[system.id] ?? {
      span: system.restoreTime ?? null,
      unknown: Boolean(system.restoreTimeUnknown),
    };
  const set = (id: string, value: Restore) =>
    onDraft({ ...draft, restore: { ...draft.restore, [id]: value } });

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      {systems.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{entry.copy.none}</p>
      ) : (
        <ul className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
          {systems.map((system) => {
            const value = shown(system);
            return (
              <li key={system.id} className="space-y-3 px-5 py-4">
                <div>
                  <p className="font-medium break-words">{system.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.copy.needs} {neededBy(system.id).join(", ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {OUTAGE_SPANS.map((span) => (
                    <button
                      key={span}
                      type="button"
                      aria-pressed={value.span === span}
                      onClick={() =>
                        set(system.id, {
                          span: value.span === span ? null : span,
                          unknown: false,
                        })
                      }
                      className={chip(value.span === span)}
                    >
                      {spans(span)}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-pressed={value.unknown}
                    onClick={() =>
                      set(system.id, { span: null, unknown: !value.unknown })
                    }
                    className={chip(value.unknown)}
                  >
                    {entry.copy.unknown}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{entry.copy.hint}</p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
