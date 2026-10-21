import type { Verdict } from "@/lib/billing/account-state";
import type { WalkLocale } from "@/lib/durchgang/types";
import type { ExportPart } from "@/lib/export/company-export";

/** Rows a page of a register holds: enough to work with, small enough for any client's answer. */
export const PAGE_ROWS = 50;

/** A document holds a whole policy's text, so it is read one at a time. */
const PAGE_ROWS_OF: Partial<Record<ExportPart, number>> = { documents: 1 };

export const pageSizeOf = (part: ExportPart): number => PAGE_ROWS_OF[part] ?? PAGE_ROWS;

/** Who may read the records is who may export them (lib/export/access.ts `mayExport`). */
const NOT_EXPORTER: Record<WalkLocale, string> = {
  en: "Only the company's admins, reviewers and management may read its records, as only they may export them. Ask one of them, or read the walkthrough with get_walkthrough.",
  de: "Die Aufzeichnungen des Unternehmens dürfen nur seine Admins, Prüfer und die Geschäftsleitung lesen, so wie nur sie sie exportieren dürfen. Fragen Sie eine dieser Personen, oder lesen Sie den Durchgang mit get_walkthrough.",
  cs: "Záznamy firmy smějí číst jen její správci, revizoři a vedení, stejně jako je jen oni smějí exportovat. Požádejte některého z nich, nebo čtěte průvodce pomocí get_walkthrough.",
};

/** In the words of the export page's own question (messages/billing `acts.export.confirmBody`). */
const CONFIRM_FIRST: Record<WalkLocale, (lastDay: string, link: string) => string> = {
  en: (lastDay, link) =>
    `Reading the records is an export. Until ${lastDay} the company could still cancel and get its money back, and its first export ends that (terms B7). The person confirms it on the export page first; an assistant cannot: ${link}`,
  de: (lastDay, link) =>
    `Das Lesen der Aufzeichnungen ist ein Export. Bis zum ${lastDay} könnte das Unternehmen noch kündigen und bekäme sein Geld zurück, und mit dem ersten Export entfällt das (AGB B7). Die Person bestätigt das zuerst auf der Exportseite, ein Assistent kann es nicht: ${link}`,
  cs: (lastDay, link) =>
    `Čtení záznamů je export. Do ${lastDay} by firma ještě mohla vypovědět a dostat peníze zpět, a prvním exportem to končí (VOP B7). Osoba to nejprve potvrdí na stránce exportu, asistent to udělat nemůže: ${link}`,
};

/**
 * Why an assistant may not read the records, or null when it may: the person may not export them,
 * or the billing state wants the money back given up first, which only the person does, in the app.
 * The plan is checked before this (`notInPlan`), as for every tool.
 */
export function readRefusal(
  mayExport: boolean,
  verdict: Verdict,
  language: WalkLocale,
  exportLink: string,
): string | null {
  if (!mayExport) return NOT_EXPORTER[language];
  if (verdict.kind === "confirm")
    return CONFIRM_FIRST[language](verdict.lastDay, exportLink);
  return null;
}
