import type { WalkLocale } from "@/lib/durchgang/types";
import type { PartAnswer } from "@/lib/export/read-part";
import type { ToolOutcome } from "./gates";

/** Who may read the records is who may export them (lib/export/may-export.ts). */
const NOT_EXPORTER: Record<WalkLocale, string> = {
  en: "Only the company's admins, reviewers and management may read its records, as only they may export them. Ask one of them, or read the walkthrough with get_walkthrough.",
  de: "Die Aufzeichnungen des Unternehmens dürfen nur seine Admins, Prüfer und die Geschäftsleitung lesen, so wie nur sie sie exportieren dürfen. Fragen Sie eine dieser Personen, oder lesen Sie den Durchgang mit get_walkthrough.",
  cs: "Záznamy firmy smějí číst jen její správci, revizoři a vedení, stejně jako je jen oni smějí exportovat. Požádejte některého z nich, nebo čtěte průvodce pomocí get_walkthrough.",
};

/** In the words of the export page's own question (messages/billing `acts.export.confirmBody`). */
const CONFIRM_FIRST: Record<WalkLocale, (link: string) => string> = {
  en: (link) =>
    `Reading the records is an export. While the company could still cancel its order and get its money back, its first export ends that (terms B7). The person confirms it on the export page first, which shows until when; an assistant cannot: ${link}`,
  de: (link) =>
    `Das Lesen der Aufzeichnungen ist ein Export. Solange das Unternehmen seine Bestellung noch kündigen und sein Geld zurückbekommen könnte, entfällt das mit dem ersten Export (AGB B7). Die Person bestätigt das zuerst auf der Exportseite, die auch sagt, bis wann; ein Assistent kann es nicht: ${link}`,
  cs: (link) =>
    `Čtení záznamů je export. Dokud by firma ještě mohla objednávku vypovědět a dostat peníze zpět, prvním exportem to končí (VOP B7). Osoba to nejprve potvrdí na stránce exportu, která ukazuje i do kdy; asistent to udělat nemůže: ${link}`,
};

/** Why someone who may not export reads nothing, in the assistant's language. */
export const notExporter = (language: WalkLocale): string => NOT_EXPORTER[language];

/** Why a read inside the money back waits for the person, with the page where they answer. */
export const confirmFirst = (language: WalkLocale, exportLink: string): string =>
  CONFIRM_FIRST[language](exportLink);

/** A part's answer as the tool returns it: the record, or a page with the way to the next. */
export function toolAnswer(part: string, page: number, answer: PartAnswer): ToolOutcome {
  if (answer.kind === "record") return { ok: true, data: { part, record: answer.record } };
  return {
    ok: true,
    data: {
      part,
      page,
      rows: answer.rows,
      more: answer.more,
      next: answer.more
        ? `More rows follow: call read_records with part "${part}" and page ${page + 1}.`
        : null,
    },
  };
}
