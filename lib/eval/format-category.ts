import type { ReportCategory } from "@/lib/pdf/load-report-data";

export type FormatMode = "structure" | "data";

/**
 * Format a category for the panel evaluation prompt.
 *
 * Structure mode: shows requirement metadata (code, title, evidence type, legal ref).
 * Data mode: shows structure + sign-off data, operational snapshots, evidence counts.
 */
export function formatCategoryForPrompt(
  category: ReportCategory,
  mode: FormatMode,
): string {
  const lines: string[] = [];
  let notStartedCount = 0;

  for (const req of category.requirements) {
    const hasSigned = !!req.signedOffRole;

    if (mode === "data" && req.status === "not_started" && !hasSigned) {
      notStartedCount++;
      continue;
    }

    lines.push(`\n### ${req.code}: ${req.title}`);
    if (req.legalRef) lines.push(`Legal ref: ${req.legalRef}`);
    lines.push(`Evidence type: ${req.evidenceType}`);

    if (mode === "data") {
      lines.push(`Status: ${req.status}`);
      lines.push(`Evidence files: ${req.evidence.length}`);

      if (req.signedOffRole) {
        lines.push(`Signed off by: ${req.signedOffRole}`);
        if (req.signedOffAt) lines.push(`Signed off at: ${req.signedOffAt.toISOString()}`);
      }

      if (req.signOffSnapshot?.derivedData) {
        lines.push("Operational data at sign-off:");
        for (const [key, value] of Object.entries(req.signOffSnapshot.derivedData)) {
          lines.push(`  ${key}: ${JSON.stringify(value)}`);
        }
      }
    }
  }

  if (notStartedCount > 0) {
    lines.push(`\n(${notStartedCount} requirements not yet started — no sign-off)`);
  }

  return lines.join("\n");
}
