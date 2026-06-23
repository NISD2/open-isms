/**
 * The single canonical journey disclaimer. We are an opinionated NIS 2
 * framework: the path orders mandatory controls by a recommended sequence.
 * This one string is reused everywhere the ordering is shown (the page footer
 * and the per-band info icons) so the legal framing stays identical and
 * defensible. Change it here, it changes everywhere.
 */
export type JourneyLocale = "en" | "de" | "nl";

export const JOURNEY_DISCLAIMER: Record<JourneyLocale, string> = {
  de: "Dies ist eine bewusst priorisierte Empfehlung zur Reihenfolge, keine Rechtsberatung. Alle Anforderungen bleiben verpflichtend, unabhängig von ihrer Position. Die Verantwortung für Umsetzung und Fristen bleibt bei Ihrer Einrichtung.",
  en: "This is an opinionated recommended order, not legal advice. Every requirement stays mandatory regardless of its position. Responsibility for implementation and deadlines remains with your organisation.",
  nl: "Dit is een bewust geprioriteerde aanbevolen volgorde, geen juridisch advies. Elke vereiste blijft verplicht, ongeacht de positie. De verantwoordelijkheid voor implementatie en termijnen blijft bij uw organisatie.",
};

/** Short label for the disclaimer affordance (icon aria-label / heading). */
export const JOURNEY_DISCLAIMER_LABEL: Record<JourneyLocale, string> = {
  de: "Hinweis zur Priorisierung",
  en: "About this prioritisation",
  nl: "Over deze prioritering",
};

export function journeyDisclaimer(locale: string): string {
  return JOURNEY_DISCLAIMER[(locale as JourneyLocale) in JOURNEY_DISCLAIMER ? (locale as JourneyLocale) : "en"];
}

export function journeyDisclaimerLabel(locale: string): string {
  return JOURNEY_DISCLAIMER_LABEL[(locale as JourneyLocale) in JOURNEY_DISCLAIMER_LABEL ? (locale as JourneyLocale) : "en"];
}
