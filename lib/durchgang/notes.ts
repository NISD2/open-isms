/**
 * The lines the Durchgang appends to a requirement's `internal_notes`: the company's own dated
 * trail of why something waits and what was proposed. Readable text only; item state is read from
 * the audit log, never parsed out of these lines. No person's name goes in, so erasing a user
 * leaves nothing of them here (the audit row that carries their id is redacted by the erasure).
 */

export type NoteLocale = "de" | "en";

const berlinDay = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" });

/** A calendar day in Berlin, as the company reads its records: 2026-09-30. */
export const recordDay = (at: Date): string => berlinDay.format(at);

export const noteLine = (at: Date, text: string): string =>
  `${recordDay(at)} ${text.replace(/\s+/g, " ").trim()}`;

const TEXT = {
  de: {
    waiting: (reason: string, note: string | null) =>
      `Geht noch nicht: ${reason}.${note ? ` Notiz: ${note}` : ""}`,
    method:
      "Methode zur Risikobewertung festgelegt: Risikoanalyse nach BSI-Standard 200-3.",
    declined: (reason: string) =>
      `Bewusst nicht umgesetzt, zur Unterschrift. Begründung: ${reason}`,
    agreements: (lines: readonly string[]) =>
      `Vereinbarungen mit Lieferanten geprüft: ${lines.join("; ")}.`,
    security: "Sicherheit",
    incidents: "Vorfallmeldung",
    nothing: "nichts geregelt",
    logins: (lines: readonly string[]) => `Anmeldung geprüft: ${lines.join("; ")}.`,
    mfa: "mit zweitem Faktor",
    password: "nur Passwort",
    unknown: "noch nicht bekannt",
    approved: (day: string, titles: readonly string[]) =>
      `Von der Geschäftsführung freigegeben am ${day}: ${titles.join("; ")}.`,
    critical: (names: readonly string[]) =>
      names.length > 0
        ? `Muss ohne IT weiterlaufen: ${names.join(", ")}.`
        : "Abläufe geprüft: keiner muss ohne IT weiterlaufen.",
  },
  en: {
    waiting: (reason: string, note: string | null) =>
      `Not possible yet: ${reason}.${note ? ` Note: ${note}` : ""}`,
    method: "Risk assessment method set: risk analysis according to BSI Standard 200-3.",
    declined: (reason: string) =>
      `Decided not to do this, for signature. Reason: ${reason}`,
    agreements: (lines: readonly string[]) =>
      `Agreements with suppliers checked: ${lines.join("; ")}.`,
    security: "security",
    incidents: "incident reporting",
    nothing: "nothing agreed",
    logins: (lines: readonly string[]) => `Sign-in checked: ${lines.join("; ")}.`,
    mfa: "second factor",
    password: "password only",
    unknown: "not known yet",
    approved: (day: string, titles: readonly string[]) =>
      `Approved by management on ${day}: ${titles.join("; ")}.`,
    critical: (names: readonly string[]) =>
      names.length > 0
        ? `Must keep running without IT: ${names.join(", ")}.`
        : "Processes checked: none must keep running without IT.",
  },
} as const;

export const waitingNote = (locale: NoteLocale, reason: string, note: string | null) =>
  TEXT[locale].waiting(reason, note);

export const methodNote = (locale: NoteLocale) => TEXT[locale].method;

export const declinedNote = (locale: NoteLocale, reason: string) =>
  TEXT[locale].declined(reason);

/** One entry per supplier checked: its name and what is agreed with it, in the record language. */
export const agreementsNote = (
  locale: NoteLocale,
  rows: ReadonlyArray<{
    readonly name: string;
    readonly security: boolean;
    readonly incidents: boolean;
  }>,
) => {
  const text = TEXT[locale];
  return text.agreements(
    rows.map((row) => {
      const agreed = [
        ...(row.security ? [text.security] : []),
        ...(row.incidents ? [text.incidents] : []),
      ];
      return `${row.name}: ${agreed.length > 0 ? agreed.join(", ") : text.nothing}`;
    }),
  );
};

/**
 * One entry per sign-in checked: the program's name and whether it takes a second factor, or that
 * this is not known yet.
 */
export const loginsNote = (
  locale: NoteLocale,
  rows: ReadonlyArray<{ readonly name: string; readonly mfa: boolean | null }>,
) => {
  const text = TEXT[locale];
  const answer = (mfa: boolean | null) =>
    mfa === null ? text.unknown : mfa ? text.mfa : text.password;
  return text.logins(rows.map((row) => `${row.name}: ${answer(row.mfa)}`));
};

/** The documents management approved in one sitting, by title, on the day of the approval. */
export const approvedNote = (
  locale: NoteLocale,
  day: string,
  titles: readonly string[],
) => TEXT[locale].approved(day, titles);

/** The processes marked as having to keep running without IT, or that none was. */
export const criticalNote = (locale: NoteLocale, names: readonly string[]) =>
  TEXT[locale].critical(names);
