"use client";

import { trpc } from "@/lib/trpc/client";
import { Heading, Lead } from "./ExplainScreens";
import { Toggle } from "./RowParts";
import type { Of, WorkProps } from "./WorkScreens";

/**
 * 4.2: for each process that must keep running, the systems and rooms on the company's list it
 * needs. The links are `process_asset`; 4.4 then asks how long each of those takes to come back
 * and compares (BSI-Standard 200-4 p. 187; 300-1 Anhang 2). Nothing is typed here: everything is
 * picked from what 2.2 already listed.
 */
export function NeedsScreen({
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"needs"> }) {
  const assets = trpc.asset.list.useQuery();
  const stored = trpc.durchgang.processNeeds.useQuery();
  if (!assets.data || !stored.data) return null;
  const links = stored.data;
  const critical = assets.data.filter(
    (a) => a.type === "process" && (draft.critical[a.id]?.on ?? Boolean(a.isCritical)),
  );
  const things = assets.data.filter((a) => a.type !== "process");

  const needsOf = (processId: string): readonly string[] =>
    draft.needs[processId] ??
    links.filter((l) => l.processId === processId).map((l) => l.assetId);
  const toggle = (processId: string, assetId: string) => {
    const current = needsOf(processId);
    const next = current.includes(assetId)
      ? current.filter((id) => id !== assetId)
      : [...current, assetId];
    onDraft({ ...draft, needs: { ...draft.needs, [processId]: next } });
  };

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      {critical.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{entry.copy.none}</p>
      ) : things.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{entry.copy.empty}</p>
      ) : (
        <ul className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
          {critical.map((process) => {
            const chosen = needsOf(process.id);
            return (
              <li key={process.id} className="space-y-3 px-5 py-4">
                <p className="font-medium break-words">{process.name}</p>
                <p className="text-sm text-muted-foreground">{entry.copy.needs}</p>
                <div className="flex flex-wrap gap-2">
                  {things.map((thing) => (
                    <Toggle
                      key={thing.id}
                      on={chosen.includes(thing.id)}
                      onClick={() => toggle(process.id, thing.id)}
                    >
                      {thing.name}
                    </Toggle>
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
