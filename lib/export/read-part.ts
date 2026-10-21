import "@/lib/server-guard";

import { z } from "zod";
import type { DbOrTx } from "@/lib/db";
import {
  EXPORT_PART_NAMES,
  EXPORT_PARTS,
  type ExportPart,
  SINGLE_PARTS,
} from "./company-export";

/** Rows a page of a register holds: enough to work with, small enough for any client's answer. */
export const PAGE_ROWS = 50;

/** A document holds a whole policy's text, so it is read one at a time. */
const PAGE_ROWS_OF: Partial<Record<ExportPart, number>> = { documents: 1 };

export const pageSizeOf = (part: ExportPart): number => PAGE_ROWS_OF[part] ?? PAGE_ROWS;

const SINGLE: ReadonlySet<ExportPart> = new Set(SINGLE_PARTS);

/** The fields of a read, shared by the procedure and the MCP tool that describes them. */
export const READ_PART_FIELDS = {
  part: z
    .enum(EXPORT_PART_NAMES)
    .describe(
      "Which part of the company's records: company (master data), requirements (each NIS 2 requirement's status and sign-off), answers (what was typed per category), documents (the policies the walkthrough wrote, one per page), or a register: assets, suppliers, risks, trainings, managementReviews, incidents, vulnerabilities, patches, changes, exercises, improvements, internalAudits, kpis.",
    ),
  page: z
    .number()
    .int()
    .min(1)
    .max(100_000)
    .default(1)
    .describe(`Which page, from 1. A register page holds ${PAGE_ROWS} rows.`),
};

export const ReadPartInput = z
  .object(READ_PART_FIELDS)
  .refine((input) => input.page === 1 || !SINGLE.has(input.part), {
    message: "That part is one record: read it with page 1.",
    path: ["page"],
  });

/** One part's answer: a record, or a page of rows and whether another page follows. */
export type PartAnswer =
  | { readonly kind: "record"; readonly record: unknown }
  | { readonly kind: "rows"; readonly rows: readonly unknown[]; readonly more: boolean };

/**
 * One page of one part of the company's records, exactly as the export file holds it
 * (`EXPORT_PARTS`). One row more than the page is loaded, to tell whether another follows.
 */
export async function readPart(
  db: DbOrTx,
  companyId: string,
  { part, page }: { readonly part: ExportPart; readonly page: number },
): Promise<PartAnswer> {
  const size = pageSizeOf(part);
  const loaded = await EXPORT_PARTS[part](db, companyId, {
    offset: (page - 1) * size,
    limit: size + 1,
  });
  return Array.isArray(loaded)
    ? { kind: "rows", rows: loaded.slice(0, size), more: loaded.length > size }
    : { kind: "record", record: loaded };
}
