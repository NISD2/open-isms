/**
 * Pure aggregation of company_requirement_status rows into the numbers a
 * lifecycle email talks about: how many requirements are done, and which
 * open step comes next on the path. Kept free of I/O so it is unit-testable;
 * the caller supplies NIS 2-scoped rows.
 *
 * "Next" uses the same category-weighted journey order as the path view
 * (journeyPosition), so the step the email names is the step the journey
 * page highlights when the reader clicks through. Ties (identical position,
 * which real data should not produce) break on the requirement code so the
 * pick is deterministic across runs.
 */
import { isDoneStatus, journeyPosition } from "@/lib/compliance/journey-position";

export interface JourneyStatusRow {
  companyId: string;
  status: string | null;
  code: string;
  sortOrder: number | null;
  categorySortOrder: number | null;
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
      const position = journeyPosition(row.categorySortOrder, row.sortOrder);
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
