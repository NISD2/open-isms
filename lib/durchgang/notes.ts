/**
 * The lines the Durchgang appends to a requirement's `internal_notes`: the company's own dated
 * trail of why something waits and what was proposed. Readable text only; item state is read from
 * the audit log, never parsed out of these lines. No person's name goes in, so erasing a user
 * leaves nothing of them here (the audit row that carries their id is redacted by the erasure).
 */

import { RISK_LEVEL_TEXT, type RiskLevel } from "@/lib/compliance/bsi-200-3";

export type NoteLocale = "de" | "en";

/** A calendar day in Berlin, as the company reads its records: 2026-09-30. */
const berlinDay = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" });

export const noteLine = (at: Date, text: string): string =>
  `${berlinDay.format(at)} ${text.replace(/\s+/g, " ").trim()}`;

const TEXT = {
  de: {
    waiting: (reason: string, note: string | null) =>
      `Geht noch nicht: ${reason}.${note ? ` Notiz: ${note}` : ""}`,
    sources: (labels: readonly string[]) => `Nachgesehen in: ${labels.join(", ")}.`,
    method: "Methode festgelegt: Risikoanalyse nach BSI-Standard 200-3.",
    acceptance: (level: string) =>
      `Vorschlag zur Unterschrift: Risiken bis zur Stufe „${level}“ werden hingenommen.`,
  },
  en: {
    waiting: (reason: string, note: string | null) =>
      `Not possible yet: ${reason}.${note ? ` Note: ${note}` : ""}`,
    sources: (labels: readonly string[]) => `Looked in: ${labels.join(", ")}.`,
    method: "Method set: risk analysis according to BSI Standard 200-3.",
    acceptance: (level: string) =>
      `Proposal for signature: risks up to the level "${level}" are accepted.`,
  },
} as const;

export const waitingNote = (locale: NoteLocale, reason: string, note: string | null) =>
  TEXT[locale].waiting(reason, note);

export const sourcesNote = (locale: NoteLocale, labels: readonly string[]) =>
  TEXT[locale].sources(labels);

export const methodNote = (locale: NoteLocale) => TEXT[locale].method;

export const acceptanceNote = (locale: NoteLocale, level: RiskLevel) =>
  TEXT[locale].acceptance(RISK_LEVEL_TEXT[locale][level].label);
