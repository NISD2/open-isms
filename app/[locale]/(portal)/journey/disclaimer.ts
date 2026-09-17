/**
 * The single canonical journey disclaimer. We are an opinionated NIS 2
 * framework: the path orders mandatory controls by a recommended sequence.
 * This one string is reused everywhere the ordering is shown (the page footer
 * and the per-band info icons) so the legal framing stays identical and
 * defensible. Change it here, it changes everywhere.
 *
 * It states both halves of the legal position, because the first half alone
 * is misleading. Every requirement applies — nothing here is optional to
 * consider. But NIS 2 is a risk-management directive: Art. 21(1) requires
 * measures that are "appropriate and proportionate" to the state of the art,
 * cost, size and exposure, so HOW FAR a measure goes is a documented judgement
 * rather than a fixed bar. A reader told only that all 49 are mandatory
 * concludes they must implement all 49 to the maximum, which is neither what
 * the directive says nor what we believe.
 */
export type JourneyLocale = "en" | "de" | "nl";

export const JOURNEY_DISCLAIMER: Record<JourneyLocale, string> = {
  de: "Dies ist eine bewusst priorisierte Empfehlung zur Reihenfolge, keine Rechtsberatung. Jede Anforderung ist zu prüfen, unabhängig von ihrer Position. Wie weit eine Maßnahme gehen muss, bemisst sich nach Art. 21(1) NIS 2 an Größe, Risiko und Aufwand. Sie können eine Anforderung mit dokumentierter Begründung als nicht zutreffend einstufen. Die Verantwortung für Umsetzung und Fristen bleibt bei Ihrer Einrichtung.",
  en: "This is an opinionated recommended order, not legal advice. Every requirement has to be considered, regardless of its position. How far a measure has to go follows Art. 21(1) NIS 2: your size, your risk and the cost of implementation. You may record a requirement as not applicable with a documented reason. Responsibility for implementation and deadlines remains with your organisation.",
  nl: "Dit is een bewust geprioriteerde aanbevolen volgorde, geen juridisch advies. Elke vereiste moet worden beoordeeld, ongeacht de positie. Hoe ver een maatregel moet gaan, volgt uit Art. 21(1) NIS 2: omvang, risico en kosten van implementatie. U mag een vereiste als niet van toepassing vastleggen met een gedocumenteerde reden. De verantwoordelijkheid voor implementatie en termijnen blijft bij uw organisatie.",
};

/** Short label for the disclaimer affordance (icon aria-label / heading). */
export const JOURNEY_DISCLAIMER_LABEL: Record<JourneyLocale, string> = {
  de: "Hinweis zur Priorisierung",
  en: "About this prioritisation",
  nl: "Over deze prioritering",
};

export function journeyDisclaimer(locale: string): string {
  return JOURNEY_DISCLAIMER[
    (locale as JourneyLocale) in JOURNEY_DISCLAIMER ? (locale as JourneyLocale) : "en"
  ];
}

export function journeyDisclaimerLabel(locale: string): string {
  return JOURNEY_DISCLAIMER_LABEL[
    (locale as JourneyLocale) in JOURNEY_DISCLAIMER_LABEL
      ? (locale as JourneyLocale)
      : "en"
  ];
}
