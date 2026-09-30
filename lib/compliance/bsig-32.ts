/**
 * § 32 Abs. 1 BSIG: the deadlines for reporting a significant incident to the joint reporting
 * office of the BSI and the BBK. The first two run from the moment the company learns of the
 * incident ("nach Kenntniserlangung"); the last runs from when the second report was actually
 * sent (Nr. 4). The rule is "unverzüglich"; these are the outer limits.
 *
 * If the incident is still going on when the month is up, a progress report takes the place of
 * the final report, and the final report follows once the incident is dealt with (Abs. 2).
 */
export const REPORTING_CLOCK = {
  /** Nr. 1, frühe Erstmeldung. */
  earlyWarningHours: 24,
  /** Nr. 2, Meldung. */
  notificationHours: 72,
  /** Nr. 4, Abschlussmeldung. */
  finalReportMonths: 1,
} as const;

export const REPORTS = ["early_warning", "notification", "final_report"] as const;
export type Report = (typeof REPORTS)[number];

interface ReportText {
  readonly name: string;
  readonly content: string;
}

/**
 * What each report is called and what it contains. The German keeps the statute's words (§ 32
 * Abs. 1 Nr. 1, 2 and 4); the English is our translation, as the BSIG has no official one.
 */
export const REPORT_TEXT: Readonly<
  Record<"de" | "en", Readonly<Record<Report, ReportText>>>
> = {
  de: {
    early_warning: {
      name: "Frühe Erstmeldung",
      content:
        "Ob der Verdacht besteht, dass der Vorfall auf rechtswidrige oder böswillige Handlungen zurückzuführen ist oder grenzüberschreitende Auswirkungen haben könnte.",
    },
    notification: {
      name: "Meldung",
      content:
        "Bestätigt oder aktualisiert die Erstmeldung, mit einer ersten Bewertung von Schweregrad und Auswirkungen und gegebenenfalls den Kompromittierungsindikatoren.",
    },
    final_report: {
      name: "Abschlussmeldung",
      content:
        "Eine ausführliche Beschreibung des Vorfalls, die wahrscheinliche Ursache, die getroffenen und laufenden Abhilfemaßnahmen und gegebenenfalls die grenzüberschreitenden Auswirkungen.",
    },
  },
  en: {
    early_warning: {
      name: "Early warning",
      content:
        "Whether the incident is suspected of being caused by unlawful or malicious acts, or could have a cross-border impact.",
    },
    notification: {
      name: "Incident notification",
      content:
        "Confirms or updates the early warning, with an initial assessment of severity and impact and, where available, the indicators of compromise.",
    },
    final_report: {
      name: "Final report",
      content:
        "A detailed description of the incident, its likely root cause, the mitigation measures applied and ongoing, and any cross-border impact.",
    },
  },
};
