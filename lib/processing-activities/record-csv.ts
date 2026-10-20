/**
 * The record of processing activities as a file the company can hand over (Art. 30(4) GDPR): a
 * table any spreadsheet opens. Each line is a list of cells; a cell is quoted, inner quotes
 * doubled, so commas, quotes and line breaks in the company's answers stay inside their cell.
 */

const cell = (value: string | null): string => `"${(value ?? "").replaceAll('"', '""')}"`;

/** The lines as CSV, with a byte order mark so spreadsheet programs read it as UTF-8. */
export const recordCsv = (lines: ReadonlyArray<ReadonlyArray<string | null>>): string =>
  `﻿${lines.map((line) => line.map(cell).join(",")).join("\r\n")}\r\n`;
