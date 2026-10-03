/**
 * The numbers a lifecycle email talks about, per company: how many requirements are done and
 * which step comes next. Pure; the caller supplies each company's journey states
 * (`journeyStatesByCompany`), so "done" and "next" are the journey's own: a requirement met
 * inside the walk counts done, one no statute asks of the company never comes next, and the step
 * the email names is the step the journey page highlights when the reader clicks through
 * (`nextOnJourney`).
 */
import { isDoneState, nextOnJourney } from "@/lib/compliance/journey-position";
import type { JourneyEntry } from "@/lib/durchgang";

export interface JourneySummary {
  total: number;
  done: number;
  /** Requirement code of the next step on the journey; null when nothing is left. */
  nextCode: string | null;
}

export function summarizeJourneys(
  states: ReadonlyMap<string, ReadonlyMap<string, JourneyEntry>>,
): Map<string, JourneySummary> {
  return new Map(
    [...states].map(([companyId, byCode]) => {
      const items = [...byCode].map(([code, entry]) => ({ code, ...entry }));
      return [
        companyId,
        {
          total: items.length,
          done: items.filter((i) => isDoneState(i.state)).length,
          nextCode: nextOnJourney(items)?.code ?? null,
        },
      ];
    }),
  );
}
