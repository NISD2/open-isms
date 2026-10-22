import type { WalkLocale } from "@/lib/durchgang/types";
import type { PartAnswer } from "@/lib/export/read-part";
import type { ToolOutcome } from "./gates";

/** Reading the records is a decision of its own, the admin's (`company.assistants_read_records`). */
const NOT_ALLOWED: Record<WalkLocale, (link: string) => string> = {
  en: (link) =>
    `This company's admin has not let assistants read the records. An admin turns it on in Settings: ${link}`,
  de: (link) =>
    `Der Admin dieses Unternehmens hat Assistenten das Lesen der Aufzeichnungen nicht erlaubt. Ein Admin schaltet es in den Einstellungen ein: ${link}`,
  cs: (link) =>
    `Správce této firmy nepovolil asistentům číst záznamy. Správce to zapne v Nastavení: ${link}`,
};

/** Who may read the records is who may export them (lib/export/may-export.ts). */
const NOT_EXPORTER: Record<WalkLocale, string> = {
  en: "Only the company's admins, reviewers, legal reviewers and management may read its records, as only they may export them. Ask one of them, or read the walkthrough with get_walkthrough.",
  de: "Die Aufzeichnungen des Unternehmens dürfen nur seine Admins, Prüfer, rechtlichen Prüfer und die Geschäftsleitung lesen, so wie nur sie sie exportieren dürfen. Fragen Sie eine dieser Personen, oder lesen Sie den Durchgang mit get_walkthrough.",
  cs: "Záznamy firmy smějí číst jen její správci, revizoři, právní revizoři a vedení, stejně jako je jen oni smějí exportovat. Požádejte některého z nich, nebo čtěte průvodce pomocí get_walkthrough.",
};

/**
 * Inside an order's money back, the assistant reads nothing until it is over. The terms end it with
 * the first export, and name the export page as the way to one (AGB B7 (a)); a read is not one,
 * so this says when the assistant reads, not that reading exports.
 */
const CONFIRM_FIRST: Record<WalkLocale, (link: string) => string> = {
  en: (link) =>
    `An assistant reads the records only once the company's 30 days of money back are over. They end with its first export (terms B7), which the person confirms on the export page; an assistant cannot: ${link}`,
  de: (link) =>
    `Ein Assistent liest die Aufzeichnungen erst, wenn die 30 Tage Geld zurück des Unternehmens vorbei sind. Sie enden mit seinem ersten Export (AGB B7), den die Person auf der Exportseite bestätigt; ein Assistent kann das nicht: ${link}`,
  cs: (link) =>
    `Asistent čte záznamy až po skončení 30 dnů na vrácení peněz. Končí prvním exportem firmy (VOP B7), který osoba potvrdí na stránce exportu; asistent to udělat nemůže: ${link}`,
};

/** Why nobody's assistant reads the records until an admin allows it, with the page to do so. */
export const notAllowed = (language: WalkLocale, settingsLink: string): string =>
  NOT_ALLOWED[language](settingsLink);

/** Why someone who may not export reads nothing, in the assistant's language. */
export const notExporter = (language: WalkLocale): string => NOT_EXPORTER[language];

/** Why a read inside the money back waits for the person, with the page where they answer. */
export const confirmFirst = (language: WalkLocale, exportLink: string): string =>
  CONFIRM_FIRST[language](exportLink);

/** A part's answer as the tool returns it: the record, or a page with the way to the next. */
export function toolAnswer(part: string, page: number, answer: PartAnswer): ToolOutcome {
  if (answer.kind === "record")
    return { ok: true, data: { part, record: answer.record } };
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
