import { requirementStatusLabel } from "@/lib/compliance/status-words";
import type { WalkLocale } from "@/lib/durchgang";
import type { ReportCategory } from "@/lib/pdf/load-report-data";

/**
 * The CSV's columns. "Status" is the walk's status in the reader's language, as every export
 * prints it; the requirement's stored status is printed nowhere, because it lags the walk.
 */
export const REQUIREMENT_CSV_HEADERS = [
  "Category Code",
  "Category Name",
  "Requirement Code",
  "Requirement Title",
  "Priority",
  "Status",
  "Walkthrough Notes",
  "Signed Off At",
  "Evidence Count",
  "Review Feedback",
] as const;

/** The CSV export of the requirements, header row first, one row per requirement. */
export function requirementsCsvTable(
  categories: readonly ReportCategory[],
  language: WalkLocale,
): string[][] {
  const rows = categories.flatMap((cat) =>
    cat.requirements.map((req) => [
      cat.code,
      cat.name,
      req.code,
      req.title,
      req.priority,
      requirementStatusLabel(req, language),
      req.notes ?? "",
      req.signedOffAt ? new Date(req.signedOffAt).toISOString() : "",
      String(req.evidence.length),
      req.reviewFeedback ?? "",
    ]),
  );
  return [[...REQUIREMENT_CSV_HEADERS], ...rows];
}
