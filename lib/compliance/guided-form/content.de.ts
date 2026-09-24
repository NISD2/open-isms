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

/**
 * German labels for intake fields, overriding the ones `introspectSchema` derives from the key.
 *
 * Without this a German screen reads "Muk Account Id", because the introspector title-cases the
 * identifier and the identifiers are English. Only the fields seen so far are here; an unlisted
 * field falls back to the derived label, which is visibly wrong and therefore gets noticed.
 */
export const FIELD_LABEL: Readonly<Record<string, string>> = {
  // Registration and scope
  entityClassification: "Einstufung",
  applicableSectors: "Sektoren",
  mukAccountId: "MUK-Kontonummer",
  bsiRegistrationDate: "Datum der Registrierung",
  registrationProofUploaded: "Bestätigung des BSI",
  contactPersonName: "Ansprechpartner",
  contactPersonEmail: "E-Mail des Ansprechpartners",

  // Asked once per supplier (CIR 5.2)
  contractSecurityClauses: "Sicherheitsklauseln im Vertrag",
  auditFrequency: "Prüfturnus",
  monitoringMethod: "Wie überwacht",
  lastReviewDate: "Letzte Überprüfung",
  dueDiligenceProcess: "Prüfung vor Beauftragung",

  // Asked once per asset (CIR 4(1), 4(2), § 34 BSIG)
  rto: "Wiederanlaufzeit",
  rpo: "Zulässiger Datenverlust",
  hasBackup: "Wird gesichert",
  backupFrequency: "Sicherungsturnus",
  backupLocation: "Ort der Sicherung",
  lastBackupTestDate: "Letzte Rücksicherung getestet",
  endOfLife: "Supportende",
  lastPatchDate: "Letztes Update",
  lastVulnScanDate: "Letzter Schwachstellenscan",
};

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
  /** The third exit, and it is a peer of Weiter rather than something hidden in a menu. */
  leaveOpen: "Später klären",
  leftOpen: "Später klären",
  waitingNote: "Offen, Sie kommen beim nächsten Mal hierher zurück.",
  confirmed: "Bestätigen",
  register: (module: string) => REGISTER[module] ?? module,
  noRegister: "Kein Register hinterlegt",
} as const;
