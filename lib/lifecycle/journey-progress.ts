/**
 * Pure aggregation of company_requirement_status rows into the numbers a
 * lifecycle email talks about: how many requirements are done, and which
 * open step comes next on the path. Kept free of I/O so it is unit-testable;
 * the caller supplies NIS 2-scoped rows.
 */

/**
 * Mirrors DONE_STATUSES in server/trpc/routers/assessment.ts and
 * isDoneStatus in server/trpc/routers/journey.ts: "completed" is the normal
 * user sign-off result, "approved" adds the legal review, "not_applicable"
 * is scoped out.
 */
const DONE_STATUSES: ReadonlySet<string> = new Set([
  "completed",
  "approved",
  "not_applicable",
]);

export interface JourneyStatusRow {
  companyId: string;
  status: string | null;
  code: string;
  sortOrder: number | null;
}

export interface JourneySummary {
  total: number;
  done: number;
  /** Requirement code of the first open step in path order; null when everything is done. */
  nextCode: string | null;
}

export function summarizeJourneys(
  rows: readonly JourneyStatusRow[],
): Map<string, JourneySummary> {
  const byCompany = new Map<
    string,
    { total: number; done: number; nextCode: string | null; nextSort: number }
  >();

  for (const row of rows) {
    const entry = byCompany.get(row.companyId) ?? {
      total: 0,
      done: 0,
      nextCode: null,
      nextSort: Number.POSITIVE_INFINITY,
    };
    entry.total++;
    if (DONE_STATUSES.has(row.status ?? "not_started")) {
      entry.done++;
    } else {
      // Missing sortOrder sinks to the end of the path, same as the journey
      // view's `sortOrder ?? 999`.
      const sort = row.sortOrder ?? 999;
      if (sort < entry.nextSort) {
        entry.nextSort = sort;
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
