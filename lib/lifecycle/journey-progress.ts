/**
 * Pure aggregation of company_requirement_status rows into the numbers a
 * lifecycle email talks about: how many requirements are done, and which
 * open step comes next on the path. Kept free of I/O so it is unit-testable;
 * the caller supplies NIS 2-scoped rows.
 *
 * "Next" uses the one journey order every surface sorts by (journeyIndex),
 * so the step the email names is the step the journey page highlights when
 * the reader clicks through. The order is a property of the code, not of the
 * row, which is why a row carries nothing but company, status and code. Ties
 * (only possible between codes the journey does not know) break on the code
 * so the pick is deterministic across runs.
 */
import { isDoneStatus, journeyIndex } from "@/lib/compliance/journey-position";

export interface JourneyStatusRow {
  companyId: string;
  status: string | null;
  code: string;
}

export interface JourneySummary {
  total: number;
  done: number;
  /** Requirement code of the first open step in journey order; null when everything is done. */
  nextCode: string | null;
}

export function summarizeJourneys(
  rows: readonly JourneyStatusRow[],
): Map<string, JourneySummary> {
  const byCompany = new Map<
    string,
    { total: number; done: number; nextCode: string | null; nextPosition: number }
  >();

  for (const row of rows) {
    const entry = byCompany.get(row.companyId) ?? {
      total: 0,
      done: 0,
      nextCode: null,
      nextPosition: Number.POSITIVE_INFINITY,
    };
    entry.total++;
    if (isDoneStatus(row.status)) {
      entry.done++;
    } else {
      const position = journeyIndex(row.code);
      if (
        position < entry.nextPosition ||
        (position === entry.nextPosition &&
          (entry.nextCode === null || row.code < entry.nextCode))
      ) {
        entry.nextPosition = position;
        entry.nextCode = row.code;
      }
    }
    byCompany.set(row.companyId, entry);
  }

  const summaries = new Map<string, JourneySummary>();
  for (const [companyId, entry] of byCompany) {
    summaries.set(companyId, {
      total: entry.total,
      done: entry.done,
      nextCode: entry.nextCode,
    });
  }
  return summaries;
}
