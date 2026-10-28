"use client";

import { compare, type SystemStanding } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { Heading, Lead } from "./ExplainScreens";
import type { Of, WorkProps } from "./WorkScreens";

/** The verdicts in the order management reads them: what to fix first, what is fine last. */
const ORDER = ["too_slow", "unknown", "not_asked", "unrated", "ok"] as const;

type Copy = Of<"recovery">["copy"];

/** One system's line: who needs it, how long they can wait, how long it takes back. */
const line = (standing: SystemStanding, copy: Copy): string => {
  const { verdict } = standing;
  if (verdict.kind === "not_needed") return "";
  const parts = [`${copy.needs} ${verdict.needs.join(", ")}`];
  if (verdict.kind !== "unrated") {
    parts.push(`${copy.required} ${copy.spans[verdict.required]}`);
  }
  if (verdict.kind === "ok" || verdict.kind === "too_slow") {
    parts.push(`${copy.restore} ${copy.spans[verdict.restore]}`);
  }
  return parts.join(" · ");
};

/**
 * 4.4: each system the critical processes need against the shortest time those processes can
 * wait, computed from the rows 4.2 and this item recorded (BSI-Standard 200-4 p. 196, 198). What
 * is too slow or unknown is also an open point on the approval (7.3). Nothing is stored here.
 */
export function RecoveryScreen({ entry }: WorkProps & { entry: Of<"recovery"> }) {
  const facts = trpc.durchgang.recovery.useQuery();
  if (!facts.data) return null;
  const standings = compare(facts.data).filter((s) => s.verdict.kind !== "not_needed");
  const groups = ORDER.flatMap((kind) => {
    const at = standings.filter((s) => s.verdict.kind === kind);
    return at.length > 0 ? [{ kind, at }] : [];
  });
  // "Everything comes back in time" only once every needed system has been answered and passes.
  const allInTime = standings.every((s) => s.verdict.kind === "ok");

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      {standings.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{entry.copy.none}</p>
      ) : (
        <>
          {allInTime && (
            <p className="mt-8 text-sm font-medium text-emerald-700">{entry.copy.good}</p>
          )}
          {groups.map(({ kind, at }) => (
            <section key={kind} className="mt-6">
              <h3 className="text-sm font-semibold">{entry.copy.verdicts[kind]}</h3>
              <ul className="mt-2 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
                {at.map((standing) => (
                  <li key={standing.system.id} className="px-5 py-3">
                    <p className="font-medium break-words">{standing.system.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {line(standing, entry.copy)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </>
  );
}
