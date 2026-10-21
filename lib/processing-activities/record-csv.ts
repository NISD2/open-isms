import { toCsv } from "@/lib/csv";

/**
 * The record of processing activities as a file the company can hand over (Art. 30(4) GDPR): a
 * table any spreadsheet opens. Each line is a list of cells. The company's own words (an
 * activity's name, its purpose) go through the shared CSV writer, so commas, quotes and line
 * breaks stay inside their cell and a cell that starts like a formula opens as text.
 */

/** The lines as CSV, with a byte order mark so spreadsheet programs read it as UTF-8. */
export const recordCsv = (lines: ReadonlyArray<ReadonlyArray<string | null>>): string =>
  `﻿${toCsv(lines.map((line) => line.map((value) => value ?? "")))}\r\n`;
