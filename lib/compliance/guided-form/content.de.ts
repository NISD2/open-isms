/**
 * German chrome for the Durchgang screens.
 *
 * Small on purpose. Everything about an item, its title, description and guidance, comes from
 * `messages/requirements/<locale>.json` and `data/guidance/<locale>.json`, which is the same
 * content the existing requirement page shows. Nothing is authored for these screens, so there is
 * nothing here to keep in sync with them.
 *
 * Not in `messages/` yet: this wording has not been through the primary-source fact-check gate or
 * past Simon, and translating unsettled copy into ten locales is work that gets thrown away. The
 * keys are already the shape a message file wants, so the move is mechanical.
 */

/** The registers, named as the interface names them. */
const REGISTER: Readonly<Record<string, string>> = {
  asset: "Asset-Inventar",
  supplier: "Lieferantenverzeichnis",
  risk: "Risikoregister",
  policy: "Richtlinien",
  incident: "Vorfälle",
  exercise: "Übungen",
  improvement_item: "Maßnahmen",
  vulnerability: "Schwachstellen",
  patch_record: "Patches",
  change_request: "Änderungen",
  kpi_measurement: "Kennzahlen",
  internal_audit: "Interne Audits",
  management_review: "Managementbewertungen",
  training_record: "Schulungsnachweise",
  team: "Team",
  bsi_registration: "BSI-Registrierung",
};

export const UI = {
  back: "Zurück",
  next: "Weiter",
  stepOf: (n: number, of: number) => `Schritt ${n} von ${of}`,
  start: "Anfangen",
  item: (code: string) => `Punkt ${code}`,
  optional: "optional",
  readStatute: "Gesetzestext lesen",
  /**
   * The one forward button, worded for what it does when the screen is incomplete.
   *
   * There is no separate "later" control: it is the same button, so the label is the only thing
   * that changes. Saying so beats a disabled button that explains nothing.
   */
  laterLabel: "Später weiter",
  leftOpen: "Später weiter",
  waitingNote: "Offen, Sie kommen beim nächsten Mal hierher zurück.",
  confirmed: "Bestätigen",
  register: (module: string) => REGISTER[module] ?? module,
} as const;
