/**
 * Taking the next real document number (see document_number_counter). Committed on its own, on the
 * pool rather than in the caller's transaction, so a Qonto failure afterwards cannot return a
 * number that another order or cancel then takes as well: a failed call leaves a gap, never a
 * duplicate.
 */
import "@/lib/server-guard";
import { sql } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { documentNumberCounter, type documentSeriesEnum } from "@/schema";
import { invoiceNumber } from "./invoice-number";

type DocumentSeries = (typeof documentSeriesEnum.enumValues)[number];

export const takeDocumentNumber = async (
  db: Database,
  series: DocumentSeries,
  prefix: string,
  year: number,
): Promise<string> => {
  const [row] = await db
    .insert(documentNumberCounter)
    .values({ series, year, lastValue: 1 })
    .onConflictDoUpdate({
      target: [documentNumberCounter.series, documentNumberCounter.year],
      set: { lastValue: sql`${documentNumberCounter.lastValue} + 1` },
    })
    .returning({ lastValue: documentNumberCounter.lastValue });
  if (!row) throw new Error(`${series} number counter returned no row`);
  return invoiceNumber(prefix, year, row.lastValue);
};
