import "@/lib/server-guard";
import { z } from "zod";
import { getPathname } from "@/i18n/navigation";
import { billingVerdict } from "@/lib/billing/act-gate";
import { db } from "@/lib/db";
import { EXPORT_PART_NAMES, EXPORT_PARTS } from "@/lib/export/company-export";
import { getAppUrl } from "@/lib/utils";
import type { KeyHolder } from "./context";
import { language, notInPlan, refuse, type ToolOutcome } from "./gates";
import { PAGE_ROWS, pageSizeOf, readRefusal } from "./records-rules";

export const ReadRecordsInput = z.object({
  part: z
    .enum(EXPORT_PART_NAMES)
    .describe(
      "Which part of the company's records: company (master data), requirements (each NIS 2 requirement's status and sign-off), answers (what was typed per category), documents (the policies the walkthrough wrote, one per page), or a register: assets, suppliers, risks, trainings, managementReviews, incidents, vulnerabilities, patches, changes, exercises, improvements, internalAudits, kpis, processingActivities.",
    ),
  page: z
    .number()
    .int()
    .min(1)
    .max(100_000)
    .default(1)
    .describe(`Which page, from 1. A register page holds ${PAGE_ROWS} rows.`),
  language,
});

/**
 * One part of the company's records, a page at a time, exactly as the export file holds it: the
 * same fields (`EXPORT_FIELDS`), so a column the export leaves out, such as a supplier's access
 * token, never reaches an assistant either. Read only by someone who may export, under the same
 * money back rule as the export (AGB B7); the walkthrough's plan gate first, as for every tool.
 */
export async function readRecords(
  holder: KeyHolder,
  input: z.output<typeof ReadRecordsInput>,
): Promise<ToolOutcome> {
  const { part, page } = input;
  const locked = notInPlan(holder, input.language);
  if (locked) return locked;
  const verdict = holder.mayExport
    ? await billingVerdict(db, holder.billing, "export")
    : ({ kind: "allow" } as const);
  const exportLink = `${getAppUrl()}${getPathname({ href: "/export", locale: input.language })}`;
  const refusal = readRefusal(holder.mayExport, verdict, input.language, exportLink);
  if (refusal) return refuse(refusal);

  const size = pageSizeOf(part);
  // One row more than the page, to tell whether another page follows.
  const loaded = await EXPORT_PARTS[part](db, holder.companyId, {
    offset: (page - 1) * size,
    limit: size + 1,
  });
  if (!Array.isArray(loaded)) {
    return page === 1
      ? { ok: true, data: { part, record: loaded } }
      : refuse(`${part} is one record: read it with page 1.`);
  }
  const more = loaded.length > size;
  return {
    ok: true,
    data: {
      part,
      page,
      rows: loaded.slice(0, size),
      more,
      next: more
        ? `More rows follow: call read_records with part "${part}" and page ${page + 1}.`
        : null,
    },
  };
}
