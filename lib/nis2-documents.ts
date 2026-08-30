/**
 * NIS 2 + CIR 2024/2690 required-records reference.
 *
 * Each entry is anchored to a primary source — Directive (EU) 2022/2555
 * (NIS 2) and Commission Implementing Regulation (EU) 2024/2690 — and a
 * matching nisd2.eu platform module where coverage is built-in.
 *
 * Editorial principles:
 *   - Names follow the regulation's own terminology, not toolkit-vendor naming.
 *   - One regulation requirement = one record. We do not split a single CIR
 *     measure into a "procedure" plus a "form" plus an "appendix"; that is
 *     consultancy bloat, not a legal requirement.
 *   - The Art. 23 reporting cascade is one record (the incident itself)
 *     evolving through five status phases, not five separate documents.
 *   - Where the regulation does not require a separate document, none is listed.
 *
 * Sources:
 *   - Directive (EU) 2022/2555 — Articles 20, 21(2), 23, 27
 *   - Commission Implementing Regulation (EU) 2024/2690 — Annex sections 1-13
 *   - BSIG (German transposition) — §§ 30, 32, 33, 38
 *
 * Every `cirRef` below was checked on 30.08.2026 against the OJ text of the
 * CIR Annex (eur-lex.europa.eu, OJ L_202402690), point by point, and resolves
 * to a point that says what the row claims. Anchors that are easy to get
 * wrong, all of them mistakes this file previously shipped:
 *   - Point 7 (7.1-7.3) is only the effectiveness policy itself. The word
 *     "audit" does not appear in it. Internal audit is 2.3, the independent
 *     review, and the report to the management bodies is 2.2.1.
 *   - 3.5 is incident response and 3.6 post-incident reviews. The Article
 *     23(4) reporting cascade is a Directive duty with no annex point of its
 *     own, but 3.5.3(a) does require a communication procedure with the CSIRT
 *     for incident notification, and 3.5.3(b) the same for external
 *     stakeholders, so those are the annex hooks for the reporting rows.
 *   - 5.2 is the directory of suppliers; 5.1.4 is the contract clauses.
 *   - 6.3 is configuration management; 6.6 is patch management.
 *   - 11.6 is authentication and 11.7 multi-factor authentication. The
 *     secured voice, video and text limb of Art. 21(2)(j) has no annex point:
 *     "voice", "video" and "emergency communication" appear nowhere in it.
 *   - 12.1 is classification, 12.2 handling, 12.4 the inventory. Disposal and
 *     irretrievable destruction is 12.2.2, NOT 12.5, which is only about
 *     assets held by staff at termination of employment.
 * No row currently cites 12.3 (removable media) or 12.5; both are annex
 * points with no matching document in this list.
 */

export type DocumentGroup =
  | "governance"
  | "risk"
  | "incident"
  | "incident-reporting"
  | "continuity"
  | "supply-chain"
  | "acquisition"
  | "effectiveness"
  | "training"
  | "cryptography"
  | "hr-access"
  | "authentication"
  | "assets"
  | "registration";

export interface PlatformCoverage {
  /** Platform category code: GOV, RSK, INC, BCP, SUP, PRO, EFF, TRN, CRY, ACC, AUT, REG. Null = not yet covered natively. */
  module: string | null;
  /** Route slug under the portal (e.g. "/risk-management"). */
  slug: string | null;
  /** Short "how the platform covers this" note. */
  note_en: string;
  note_de: string;
}

export interface Nis2Document {
  id: string;
  group: DocumentGroup;
  name_en: string;
  name_de: string;
  /** NIS 2 Directive article reference. */
  nis2Ref: string;
  /** CIR 2024/2690 Annex section reference. */
  cirRef: string;
  description_en: string;
  description_de: string;
  platform: PlatformCoverage;
}

export const NIS2_DOCUMENT_GROUPS: Record<
  DocumentGroup,
  { label_en: string; label_de: string }
> = {
  governance: { label_en: "Governance & Top-level Policy", label_de: "Governance & übergeordnete Richtlinie" },
  risk: { label_en: "Risk Management", label_de: "Risikomanagement" },
  incident: { label_en: "Incident Handling", label_de: "Vorfallsbearbeitung" },
  "incident-reporting": { label_en: "Incident Reporting (Art. 23)", label_de: "Meldepflicht (Art. 23)" },
  continuity: { label_en: "Business Continuity & Recovery", label_de: "Notfall & Wiederanlauf" },
  "supply-chain": { label_en: "Supply Chain Security", label_de: "Lieferkettensicherheit" },
  acquisition: { label_en: "Acquisition, Development & Maintenance", label_de: "Beschaffung, Entwicklung & Wartung" },
  effectiveness: { label_en: "Effectiveness, Audit & Review", label_de: "Wirksamkeit, Audit & Bewertung" },
  training: { label_en: "Cyber Hygiene & Training", label_de: "Cyber-Hygiene & Schulung" },
  cryptography: { label_en: "Cryptography", label_de: "Kryptografie" },
  "hr-access": { label_en: "HR Security & Access Control", label_de: "Personal & Zugriffskontrolle" },
  authentication: { label_en: "Authentication & Secure Communication", label_de: "Authentifizierung & sichere Kommunikation" },
  assets: { label_en: "Asset Management", label_de: "Asset-Management" },
  registration: { label_en: "Entity Registration", label_de: "Einrichtungsregistrierung" },
};

const COVERED = (
  module: string,
  slug: string,
  note_en: string,
  note_de: string
): PlatformCoverage => ({ module, slug, note_en, note_de });

const NOT_COVERED = (note_en: string, note_de: string): PlatformCoverage => ({
  module: null,
  slug: null,
  note_en,
  note_de,
});

export const NIS2_DOCUMENTS: Nis2Document[] = [
  // ── Governance ─────────────────────────────────────────────────────
  {
    id: "information-security-policy",
    group: "governance",
    name_en: "Information System Security Policy",
    name_de: "Richtlinie zur Sicherheit der Netz- und Informationssysteme",
    nis2Ref: "Art. 21(2)(a)",
    cirRef: "CIR 1.1",
    description_en: "Top-level policy approved by management that sets the cybersecurity direction, scope, roles and responsibilities, and is reviewed at planned intervals.",
    description_de: "Übergeordnete, vom Management genehmigte Richtlinie, die Richtung, Geltungsbereich, Rollen und Verantwortlichkeiten der Cybersicherheit festlegt und regelmäßig überprüft wird.",
    platform: COVERED(
      "GOV",
      "/policies",
      "Policy editor (GOV 1.2) with management sign-off and version history.",
      "Policy-Editor (GOV 1.2) mit Geschäftsführungs-Sign-Off und Versionshistorie."
    ),
  },
  {
    id: "management-approval-record",
    group: "governance",
    name_en: "Management Approval Record",
    name_de: "Nachweis der Geschäftsleitungs-Genehmigung",
    nis2Ref: "Art. 20(1)",
    cirRef: "CIR 1.1.1(k), 1.1.2",
    description_en: "Evidence that the management body has approved the cybersecurity risk-management measures and is overseeing their implementation.",
    description_de: "Nachweis, dass die Geschäftsleitung die Cybersicherheits-Risikomanagementmaßnahmen genehmigt hat und ihre Umsetzung überwacht.",
    platform: COVERED(
      "GOV",
      "/policies",
      "Sign-off history (GOV 1.3, 1.4) — eIDAS-AES signature with checksummed snapshot.",
      "Sign-Off-Historie (GOV 1.3, 1.4) — eIDAS-AES-Signatur mit Prüfsummen-Snapshot."
    ),
  },

  // ── Risk Management ────────────────────────────────────────────────
  {
    id: "risk-management-framework",
    group: "risk",
    name_en: "Risk Management Framework",
    name_de: "Rahmenwerk für das Risikomanagement",
    nis2Ref: "Art. 21(2)(a)",
    cirRef: "CIR 2.1",
    description_en: "Defines how risks are identified, analysed, evaluated, treated, accepted and reviewed — including the criteria for risk acceptance.",
    description_de: "Legt fest, wie Risiken identifiziert, analysiert, bewertet, behandelt, akzeptiert und überprüft werden — einschließlich der Kriterien zur Risikoakzeptanz.",
    platform: COVERED(
      "RSK",
      "/compliance/risk-management",
      "Methodology editor (RSK 2.1) — likelihood/impact scales and acceptance thresholds.",
      "Methodik-Editor (RSK 2.1) — Skalen für Eintrittswahrscheinlichkeit/Auswirkung und Akzeptanzschwellen."
    ),
  },
  {
    id: "risk-register",
    group: "risk",
    name_en: "Risk Register & Treatment Plan",
    name_de: "Risikoregister und Behandlungsplan",
    nis2Ref: "Art. 21(1)",
    cirRef: "CIR 2.1.1, 2.1.2",
    description_en: "List of identified risks with likelihood, impact, owner, treatment option (mitigate / accept / transfer / avoid), planned controls and deadlines.",
    description_de: "Liste der identifizierten Risiken mit Eintrittswahrscheinlichkeit, Auswirkung, Verantwortlichem, Behandlungsoption (vermindern / akzeptieren / übertragen / vermeiden), geplanten Maßnahmen und Fristen.",
    platform: COVERED(
      "RSK",
      "/risks",
      "Risk module (RSK 2.3) — register joined to assets, treatment status, residual-risk acceptance.",
      "Risiko-Modul (RSK 2.3) — Register verknüpft mit Assets, Behandlungsstatus, Restrisiko-Akzeptanz."
    ),
  },
  {
    id: "residual-risk-acceptance",
    group: "risk",
    name_en: "Residual Risk Acceptance",
    name_de: "Restrisiko-Akzeptanz",
    nis2Ref: "Art. 20(1)",
    cirRef: "CIR 2.1.1",
    description_en: "Formal sign-off by management of risks that are accepted rather than mitigated, with rationale.",
    description_de: "Formale Genehmigung der Geschäftsleitung für Risiken, die akzeptiert statt behandelt werden, mit Begründung.",
    platform: COVERED(
      "RSK",
      "/risks",
      "Per-risk acceptedBy / acceptedAt fields with management sign-off.",
      "Pro Risiko Felder acceptedBy / acceptedAt mit Geschäftsführungs-Sign-Off."
    ),
  },

  // ── Incident Handling ──────────────────────────────────────────────
  {
    id: "incident-response-policy",
    group: "incident",
    name_en: "Incident Response Policy",
    name_de: "Richtlinie zur Reaktion auf Sicherheitsvorfälle",
    nis2Ref: "Art. 21(2)(b)",
    cirRef: "CIR 3.1",
    description_en: "Defines how incidents are detected, classified by severity, contained, eradicated, recovered from and reviewed.",
    description_de: "Legt fest, wie Sicherheitsvorfälle erkannt, nach Schweregrad klassifiziert, eingedämmt, behoben, wiederhergestellt und nachbereitet werden.",
    platform: COVERED(
      "INC",
      "/incidents",
      "Policy editor (INC 3.1) plus incident lifecycle module.",
      "Policy-Editor (INC 3.1) plus Vorfalls-Lebenszyklus-Modul."
    ),
  },
  {
    id: "incident-register",
    group: "incident",
    name_en: "Incident Register",
    name_de: "Vorfallsregister",
    nis2Ref: "Art. 21(2)(b)",
    cirRef: "CIR 3.4",
    description_en: "Chronological record of all incidents and near-misses, with timeline, classification, response actions and lessons learned.",
    description_de: "Chronologisches Verzeichnis aller Vorfälle und Beinahe-Vorfälle mit Zeitstrahl, Klassifizierung, Reaktionsmaßnahmen und Erkenntnissen.",
    platform: COVERED(
      "INC",
      "/incidents",
      "Incident table is the register — root cause, countermeasures and preventive measures captured per record.",
      "Vorfalls-Tabelle ist das Register — Ursachen, Gegen- und Präventivmaßnahmen je Datensatz erfasst."
    ),
  },
  {
    id: "post-incident-review",
    group: "incident",
    name_en: "Post-Incident Review",
    name_de: "Nachbereitung von Vorfällen",
    nis2Ref: "Art. 21(2)(b)",
    cirRef: "CIR 3.6",
    description_en: "Lessons-learned analysis after a significant incident: what failed, what worked, which controls or processes need adjustment.",
    description_de: "Lessons-Learned-Analyse nach einem erheblichen Vorfall: was versagt hat, was funktioniert hat, welche Maßnahmen oder Prozesse angepasst werden müssen.",
    platform: COVERED(
      "INC",
      "/incidents",
      "rootCause + preventiveMeasures fields per incident, surfaced in management review inputs.",
      "Felder rootCause + preventiveMeasures je Vorfall, fließen in die Managementbewertung ein."
    ),
  },

  // ── Incident Reporting Cascade (Art. 23) ───────────────────────────
  {
    id: "early-warning-24h",
    group: "incident-reporting",
    name_en: "Early Warning to CSIRT (within 24h)",
    name_de: "Frühwarnung an CSIRT (innerhalb 24h)",
    nis2Ref: "Art. 23(4)(a)",
    cirRef: "CIR 3.5.3(a)",
    description_en: "Initial flag to the CSIRT or competent authority indicating whether the incident is suspected to be malicious or has cross-border impact.",
    description_de: "Erstmeldung an das CSIRT oder die zuständige Behörde mit Hinweis, ob der Vorfall mutmaßlich böswillig ist oder grenzüberschreitende Auswirkungen hat.",
    platform: COVERED(
      "INC",
      "/incidents",
      "Single incident record progresses through reporting phases — 24h field with deadline tracker.",
      "Ein Vorfalls-Datensatz durchläuft die Meldephasen — 24h-Feld mit Fristen-Tracker."
    ),
  },
  {
    id: "incident-notification-72h",
    group: "incident-reporting",
    name_en: "Incident Notification (within 72h)",
    name_de: "Vorfallsmeldung (innerhalb 72h)",
    nis2Ref: "Art. 23(4)(b)",
    cirRef: "CIR 3.5.3(a)",
    description_en: "Initial assessment of severity, impact and indicators of compromise, submitted to the CSIRT within 72 hours.",
    description_de: "Erste Bewertung von Schweregrad, Auswirkung und Kompromittierungs-Indikatoren, innerhalb 72 Stunden an das CSIRT.",
    platform: COVERED(
      "INC",
      "/incidents",
      "Same record, 72h status — escalation engine reminds and escalates if missed.",
      "Selber Datensatz, 72h-Status — Eskalations-Engine erinnert und eskaliert bei Fristverletzung."
    ),
  },
  {
    id: "intermediate-report",
    group: "incident-reporting",
    name_en: "Intermediate Report",
    name_de: "Zwischenbericht",
    nis2Ref: "Art. 23(4)(c)",
    cirRef: "CIR 3.5.3(a)",
    description_en: "Status update on request of the CSIRT or competent authority during the response phase.",
    description_de: "Statusbericht auf Anforderung des CSIRT oder der zuständigen Behörde während der Reaktionsphase.",
    platform: COVERED(
      "INC",
      "/incidents",
      "Same record, intermediate status — fillable any time before final report.",
      "Selber Datensatz, Zwischenstatus — jederzeit vor Abschlussbericht ausfüllbar."
    ),
  },
  {
    id: "final-report-1m",
    group: "incident-reporting",
    name_en: "Final Report (within 1 month)",
    name_de: "Abschlussbericht (innerhalb 1 Monat)",
    nis2Ref: "Art. 23(4)(d)",
    cirRef: "CIR 3.5.3(a)",
    description_en: "Detailed description of the incident: severity and impact, threat type, root cause, mitigations applied and any cross-border impact.",
    description_de: "Detaillierte Beschreibung des Vorfalls: Schweregrad und Auswirkung, Bedrohungsart, Ursache, getroffene Maßnahmen und ggf. grenzüberschreitende Auswirkungen.",
    platform: COVERED(
      "INC",
      "/incidents",
      "Same record, final-report status — pulls in resolvedAt + root-cause fields automatically.",
      "Selber Datensatz, Abschlussberichts-Status — bezieht resolvedAt und Ursachen-Felder automatisch ein."
    ),
  },
  {
    id: "recipient-notification",
    group: "incident-reporting",
    name_en: "Notification to Recipients of Services",
    name_de: "Benachrichtigung der Empfänger der Dienste",
    nis2Ref: "Art. 23(1), Art. 23(2)",
    cirRef: "CIR 3.5.3(b)",
    description_en: "Communication to customers/users likely affected by a significant incident or cyber threat, including any mitigations they can apply.",
    description_de: "Kommunikation an Kunden/Nutzer, die von einem erheblichen Vorfall oder einer Cyber-Bedrohung betroffen sein könnten — einschließlich möglicher Gegenmaßnahmen.",
    platform: COVERED(
      "INC",
      "/incidents",
      "Customer-relationship broadcast (broadcastStatus / broadcastSentAt) per incident.",
      "Kunden-Broadcast (broadcastStatus / broadcastSentAt) je Vorfall."
    ),
  },

  // ── Business Continuity ────────────────────────────────────────────
  {
    id: "business-impact-analysis",
    group: "continuity",
    name_en: "Business Impact Analysis",
    name_de: "Business Impact Analyse",
    nis2Ref: "Art. 21(2)(c)",
    cirRef: "CIR 4.1",
    description_en: "Identifies critical activities, their dependencies, recovery objectives (RTO/RPO) and the impact of disruption over time.",
    description_de: "Identifiziert kritische Aktivitäten, deren Abhängigkeiten, Wiederanlauf-Ziele (RTO/RPO) und die Auswirkungen einer Unterbrechung über die Zeit.",
    platform: COVERED(
      "BCP",
      "/assets",
      "Per-asset RTO/RPO with criticality classification — feeds the BCP plan.",
      "Pro Asset RTO/RPO mit Kritikalitäts-Klassifizierung — fließt in den Notfallplan ein."
    ),
  },
  {
    id: "business-continuity-plan",
    group: "continuity",
    name_en: "Business Continuity Plan",
    name_de: "Notfallplan",
    nis2Ref: "Art. 21(2)(c)",
    cirRef: "CIR 4.1",
    description_en: "How essential operations are maintained during a disruption — alternative sites, fallback procedures, communication, decision authority.",
    description_de: "Wie der Geschäftsbetrieb bei Störungen aufrechterhalten wird — Ausweichstandorte, Rückfallverfahren, Kommunikation, Entscheidungsbefugnisse.",
    platform: COVERED(
      "BCP",
      "/policies",
      "Policy editor (BCP 4.1) plus exercise/test schedule with after-action reports.",
      "Policy-Editor (BCP 4.1) plus Übungs-/Test-Plan mit Nachbereitungsberichten."
    ),
  },
  {
    id: "disaster-recovery-plan",
    group: "continuity",
    name_en: "Disaster Recovery Plan",
    name_de: "Wiederherstellungsplan",
    nis2Ref: "Art. 21(2)(c)",
    cirRef: "CIR 4.1",
    description_en: "Technical procedures for restoring IT systems and services after a disruptive event, with RTO/RPO targets per critical asset.",
    description_de: "Technische Verfahren zur Wiederherstellung von IT-Systemen und Diensten nach einem Ausfall, mit RTO/RPO-Zielen je kritischem Asset.",
    platform: COVERED(
      "BCP",
      "/policies",
      "Policy editor (BCP 4.3) — per-system recovery procedures linked to asset register.",
      "Policy-Editor (BCP 4.3) — pro System Wiederherstellungsverfahren, mit Asset-Verzeichnis verknüpft."
    ),
  },
  {
    id: "backup-policy",
    group: "continuity",
    name_en: "Backup Policy",
    name_de: "Datensicherungsrichtlinie",
    nis2Ref: "Art. 21(2)(c)",
    cirRef: "CIR 4.2",
    description_en: "What is backed up, how often, where backups are stored, retention periods, encryption, and how restores are tested.",
    description_de: "Was wie häufig gesichert wird, wo Backups gespeichert werden, Aufbewahrungsfristen, Verschlüsselung, und wie Wiederherstellungen getestet werden.",
    platform: COVERED(
      "BCP",
      "/policies",
      "Per-asset backup fields (frequency, location, last test) plus BCP 4.4 policy.",
      "Pro Asset Backup-Felder (Frequenz, Ort, letzter Test) plus BCP 4.4 Richtlinie."
    ),
  },
  {
    id: "crisis-management-plan",
    group: "continuity",
    name_en: "Crisis Management Plan",
    name_de: "Krisenmanagementplan",
    nis2Ref: "Art. 21(2)(c)",
    cirRef: "CIR 4.3",
    description_en: "Decision-making process and communication structure during a crisis affecting the entity — escalation, command, internal/external communication.",
    description_de: "Entscheidungsprozess und Kommunikationsstruktur in einer Krise, die die Organisation betrifft — Eskalation, Stab, interne/externe Kommunikation.",
    platform: COVERED(
      "BCP",
      "/policies",
      "BCP policy editor (crisis section) + key-contacts module + escalation chain.",
      "BCP-Policy-Editor (Krisen-Abschnitt) + Modul Schlüsselkontakte + Eskalationskette."
    ),
  },

  // ── Supply Chain ───────────────────────────────────────────────────
  {
    id: "supplier-security-policy",
    group: "supply-chain",
    name_en: "Supplier Security Policy",
    name_de: "Lieferantensicherheitsrichtlinie",
    nis2Ref: "Art. 21(2)(d)",
    cirRef: "CIR 5.1",
    description_en: "Security requirements for direct suppliers and service providers, due-diligence process, ongoing monitoring obligations.",
    description_de: "Sicherheitsanforderungen an direkte Lieferanten und Dienstleister, Prüfprozess, laufende Überwachungspflichten.",
    platform: COVERED(
      "SUP",
      "/suppliers",
      "Policy editor (SUP 5.1) plus supplier register with security-clause flags.",
      "Policy-Editor (SUP 5.1) plus Lieferantenregister mit Sicherheitsklausel-Flags."
    ),
  },
  {
    id: "supplier-register",
    group: "supply-chain",
    name_en: "Supplier Register",
    name_de: "Lieferantenverzeichnis",
    nis2Ref: "Art. 21(2)(d)",
    cirRef: "CIR 5.2",
    description_en: "Authoritative list of suppliers and service providers with criticality, services received, security clauses in place and risk status.",
    description_de: "Vollständiges Verzeichnis der Lieferanten und Dienstleister mit Kritikalität, bezogenen Leistungen, vereinbarten Sicherheitsklauseln und Risikostatus.",
    platform: COVERED(
      "SUP",
      "/suppliers",
      "Supplier table — criticality, hasSecurityClauses, hasIncidentNotificationClause, hasAuditRights flags per supplier.",
      "Lieferanten-Tabelle — Kritikalität, hasSecurityClauses, hasIncidentNotificationClause, hasAuditRights je Lieferant."
    ),
  },
  {
    id: "supplier-risk-assessment",
    group: "supply-chain",
    name_en: "Supplier Risk Assessment",
    name_de: "Lieferanten-Risikobewertung",
    nis2Ref: "Art. 21(3)",
    cirRef: "CIR 5.1.2, 5.1.6",
    description_en: "Per-supplier risk evaluation considering supplier-specific vulnerabilities and the security practices of their development processes.",
    description_de: "Lieferantenbezogene Risikobewertung unter Berücksichtigung lieferantenspezifischer Schwachstellen und der Sicherheitspraktiken ihrer Entwicklungsprozesse.",
    platform: COVERED(
      "SUP",
      "/suppliers",
      "Per-supplier risk score linked to risk register; supplier-portal questionnaire collects evidence.",
      "Lieferanten-Risiko-Score verknüpft mit Risikoregister; Lieferantenportal-Fragebogen sammelt Nachweise."
    ),
  },

  // ── Acquisition, Development & Maintenance ─────────────────────────
  {
    id: "acquisition-development-policy",
    group: "acquisition",
    name_en: "Acquisition, Development & Maintenance Policy",
    name_de: "Richtlinie für Beschaffung, Entwicklung und Wartung",
    nis2Ref: "Art. 21(2)(e)",
    cirRef: "CIR 6.1, 6.2",
    description_en: "Security requirements throughout the ICT lifecycle — acquisition criteria, secure development practices, vulnerability disclosure, decommissioning.",
    description_de: "Sicherheitsanforderungen über den IKT-Lebenszyklus — Beschaffungskriterien, sichere Entwicklung, Schwachstellenoffenlegung, Außerbetriebnahme.",
    platform: COVERED(
      "PRO",
      "/policies",
      "Policy editor (PRO 6.1) — covers procurement, dev and maintenance in a single artefact.",
      "Policy-Editor (PRO 6.1) — deckt Beschaffung, Entwicklung und Wartung in einem Dokument ab."
    ),
  },
  {
    id: "change-management-procedure",
    group: "acquisition",
    name_en: "Change Management Procedure",
    name_de: "Verfahren zum Änderungsmanagement",
    nis2Ref: "Art. 21(2)(e)",
    cirRef: "CIR 6.4",
    description_en: "How changes to ICT systems are requested, risk-assessed, approved, tested, deployed and rolled back if necessary.",
    description_de: "Wie Änderungen an IKT-Systemen beantragt, risikoanalysiert, genehmigt, getestet, eingespielt und ggf. zurückgenommen werden.",
    platform: COVERED(
      "PRO",
      "/changes",
      "Change-request module with approval workflow and rollback notes.",
      "Change-Request-Modul mit Genehmigungs-Workflow und Rollback-Notizen."
    ),
  },
  {
    id: "vulnerability-patch-management",
    group: "acquisition",
    name_en: "Vulnerability & Patch Management Procedure",
    name_de: "Verfahren zum Schwachstellen- und Patch-Management",
    nis2Ref: "Art. 21(2)(e)",
    cirRef: "CIR 6.6, 6.10",
    description_en: "How vulnerabilities are discovered, classified by severity, prioritised, remediated and tracked, with SLAs by severity tier.",
    description_de: "Wie Schwachstellen erkannt, nach Schweregrad klassifiziert, priorisiert, behoben und verfolgt werden — mit SLAs je Schweregrad.",
    platform: COVERED(
      "PRO",
      "/vulnerabilities",
      "Vulnerability + patch-record tables with severity, owner and deadline.",
      "Schwachstellen- und Patch-Record-Tabellen mit Schweregrad, Verantwortlichem und Frist."
    ),
  },
  {
    id: "configuration-hardening",
    group: "acquisition",
    name_en: "Configuration & Hardening Standards",
    name_de: "Konfigurations- und Härtungsstandards",
    nis2Ref: "Art. 21(2)(e)",
    cirRef: "CIR 6.3",
    description_en: "Baseline secure configuration for ICT systems — what is enabled, what is disabled, default credentials handling, logging baselines.",
    description_de: "Sichere Standardkonfiguration für IKT-Systeme — was aktiviert, was deaktiviert ist, Umgang mit Standard-Zugangsdaten, Logging-Baselines.",
    platform: COVERED(
      "PRO",
      "/policies",
      "Hardening reference fields per asset class plus PRO 6.4 policy.",
      "Härtungs-Referenzfelder je Asset-Klasse plus PRO 6.4 Richtlinie."
    ),
  },

  // ── Effectiveness ──────────────────────────────────────────────────
  {
    id: "effectiveness-measurement",
    group: "effectiveness",
    name_en: "Effectiveness Measurement Programme",
    name_de: "Programm zur Wirksamkeitsmessung",
    nis2Ref: "Art. 21(2)(f)",
    cirRef: "CIR 7.1, 7.2",
    description_en: "KPIs, frequency, data sources and reporting format used to assess whether the cybersecurity measures are working.",
    description_de: "KPIs, Frequenz, Datenquellen und Berichtsformat zur Bewertung der Wirksamkeit der Cybersicherheitsmaßnahmen.",
    platform: COVERED(
      "EFF",
      "/kpis",
      "KPI measurement module with target values, periodic capture and trend display.",
      "KPI-Mess-Modul mit Zielwerten, regelmäßiger Erfassung und Trend-Anzeige."
    ),
  },
  {
    id: "internal-audit-report",
    group: "effectiveness",
    name_en: "Independent Review / Internal Audit Report",
    name_de: "Unabhängige Prüfung / Bericht des internen Audits",
    nis2Ref: "Art. 21(2)(f)",
    cirRef: "CIR 2.3",
    description_en: "Periodic independent assessment of the cybersecurity measures, with findings (nonconformities, observations) and severity.",
    description_de: "Regelmäßige unabhängige Prüfung der Cybersicherheitsmaßnahmen, mit Befunden (Nichtkonformitäten, Beobachtungen) und Schweregrad.",
    platform: COVERED(
      "EFF",
      "/internal-audits",
      "internal_audit + audit_finding tables — scope, checklist, findings linked to corrective actions.",
      "internal_audit + audit_finding-Tabellen — Geltungsbereich, Checkliste, Befunde verknüpft mit Korrekturmaßnahmen."
    ),
  },
  {
    id: "management-review",
    group: "effectiveness",
    name_en: "Management Review",
    name_de: "Managementbewertung",
    nis2Ref: "Art. 20(1), Art. 21(2)(f)",
    cirRef: "CIR 2.2.1",
    description_en: "Periodic top-management review of cybersecurity performance — KPI report, audit findings, incidents, decisions and assigned actions.",
    description_de: "Regelmäßige Bewertung der Cybersicherheits-Leistung durch die Geschäftsleitung — KPI-Bericht, Audit-Befunde, Vorfälle, Entscheidungen und zugewiesene Maßnahmen.",
    platform: COVERED(
      "EFF",
      "/management-reviews",
      "management_review record — attendees, inputs, decisions, action items, minutes file.",
      "management_review-Datensatz — Teilnehmer, Eingaben, Entscheidungen, Maßnahmen, Protokoll."
    ),
  },
  {
    id: "corrective-actions",
    group: "effectiveness",
    name_en: "Corrective Actions Register",
    name_de: "Register der Korrekturmaßnahmen",
    nis2Ref: "Art. 21(4)",
    cirRef: "CIR 2.3.3",
    description_en: "Tracking of all corrective actions arising from incidents, audits or reviews — root cause, owner, deadline, verification.",
    description_de: "Nachverfolgung aller Korrekturmaßnahmen aus Vorfällen, Audits oder Bewertungen — Ursache, Verantwortlicher, Frist, Verifizierung.",
    platform: COVERED(
      "EFF",
      "/improvements",
      "improvement_item table joined to source (incident / audit_finding / review).",
      "improvement_item-Tabelle verknüpft mit Quelle (Vorfall / Audit-Befund / Bewertung)."
    ),
  },

  // ── Cyber Hygiene & Training ───────────────────────────────────────
  {
    id: "training-awareness-programme",
    group: "training",
    name_en: "Cyber Hygiene & Training Programme",
    name_de: "Programm für Cyber-Hygiene und Schulung",
    nis2Ref: "Art. 21(2)(g)",
    cirRef: "CIR 8.1",
    description_en: "Training topics by audience (all staff, IT, security roles, top management), frequency, delivery method and effectiveness assessment.",
    description_de: "Schulungsthemen je Zielgruppe (alle Mitarbeitenden, IT, Sicherheitsrollen, Geschäftsleitung), Frequenz, Vermittlungsform und Erfolgskontrolle.",
    platform: COVERED(
      "TRN",
      "/training",
      "training_record module + course catalogue + per-employee completion tracking.",
      "training_record-Modul + Kurskatalog + Nachverfolgung der Abschlüsse je Mitarbeitendem."
    ),
  },
  {
    id: "management-cyber-training",
    group: "training",
    name_en: "Management Cybersecurity Training Record",
    name_de: "Schulungsnachweis Geschäftsleitung",
    nis2Ref: "Art. 20(2)",
    cirRef: "CIR 8.2",
    description_en: "Evidence that the management body has received cybersecurity training sufficient to assess risks and management practices.",
    description_de: "Nachweis, dass die Geschäftsleitung ausreichende Cybersicherheitsschulung erhalten hat, um Risiken und Managementpraktiken zu beurteilen.",
    platform: COVERED(
      "TRN",
      "/training/nis2-ceo",
      "Dedicated CEO training course (§38(3) BSIG) with completion certificate.",
      "Dedizierter Geschäftsführerkurs (§38(3) BSIG) mit Abschlusszertifikat."
    ),
  },

  // ── Cryptography ───────────────────────────────────────────────────
  {
    id: "cryptography-policy",
    group: "cryptography",
    name_en: "Cryptography Policy",
    name_de: "Kryptografie-Richtlinie",
    nis2Ref: "Art. 21(2)(h)",
    cirRef: "CIR 9.1",
    description_en: "Approved algorithms and key lengths, where encryption is mandatory (data at rest, in transit, backups), key lifecycle management.",
    description_de: "Zugelassene Algorithmen und Schlüssellängen, wo Verschlüsselung verpflichtend ist (Speicherung, Übertragung, Backups), Schlüssel-Lebenszyklus-Management.",
    platform: COVERED(
      "CRY",
      "/policies",
      "Policy editor with algorithm/keylength registry (BSI TR-02102 alignment).",
      "Policy-Editor mit Algorithmus-/Schlüssellängen-Registry (Abgleich mit BSI TR-02102)."
    ),
  },
  {
    id: "key-management-procedure",
    group: "cryptography",
    name_en: "Key Management Procedure",
    name_de: "Verfahren zum Schlüsselmanagement",
    nis2Ref: "Art. 21(2)(h)",
    cirRef: "CIR 9.2-9.3",
    description_en: "How cryptographic keys are generated, distributed, stored, rotated, archived and destroyed.",
    description_de: "Wie kryptografische Schlüssel erzeugt, verteilt, gespeichert, rotiert, archiviert und vernichtet werden.",
    platform: COVERED(
      "CRY",
      "/policies",
      "Key-management section of the cryptography policy editor.",
      "Schlüsselmanagement-Abschnitt im Kryptografie-Policy-Editor."
    ),
  },

  // ── HR Security & Access Control ───────────────────────────────────
  {
    id: "hr-security-policy",
    group: "hr-access",
    name_en: "Human Resources Security Policy",
    name_de: "Richtlinie zur Personalsicherheit",
    nis2Ref: "Art. 21(2)(i)",
    cirRef: "CIR 10.1",
    description_en: "Background checks, onboarding, role changes, offboarding and confidentiality obligations across the employment lifecycle.",
    description_de: "Hintergrundprüfungen, Eintritt, Rollenwechsel, Austritt und Vertraulichkeitspflichten über den gesamten Beschäftigungszyklus.",
    platform: COVERED(
      "ACC",
      "/policies",
      "Policy editor (ACC 10.1) — onboarding/offboarding checklists tied to user lifecycle.",
      "Policy-Editor (ACC 10.1) — Onboarding-/Offboarding-Checklisten, an User-Lebenszyklus geknüpft."
    ),
  },
  {
    id: "access-control-policy",
    group: "hr-access",
    name_en: "Access Control Policy",
    name_de: "Zugriffskontrollrichtlinie",
    nis2Ref: "Art. 21(2)(i)",
    cirRef: "CIR 11.1, 11.2, 11.3",
    description_en: "Rules for granting, reviewing and revoking access — least privilege, segregation of duties, privileged access, periodic recertification.",
    description_de: "Regeln zur Vergabe, Überprüfung und Entziehung von Zugriffsrechten — Need-to-know, Funktionstrennung, privilegierter Zugang, regelmäßige Rezertifizierung.",
    platform: COVERED(
      "ACC",
      "/policies",
      "RBAC editor + access-review workflow per system.",
      "RBAC-Editor + Workflow zur Zugriffsüberprüfung je System."
    ),
  },

  // ── Authentication & Communication ─────────────────────────────────
  {
    id: "authentication-policy",
    group: "authentication",
    name_en: "Authentication Policy",
    name_de: "Authentifizierungsrichtlinie",
    nis2Ref: "Art. 21(2)(j)",
    cirRef: "CIR 11.6, 11.7",
    description_en: "MFA requirements, password rules, session controls, service-account handling, alignment with BSI TR-03107 where applicable.",
    description_de: "MFA-Anforderungen, Passwortregeln, Sitzungssteuerung, Umgang mit Service-Konten, ggf. Abgleich mit BSI TR-03107.",
    platform: COVERED(
      "AUT",
      "/policies",
      "Policy editor (AUT 11.3) plus per-system MFA-status field.",
      "Policy-Editor (AUT 11.3) plus MFA-Status-Feld je System."
    ),
  },
  {
    id: "secure-communication-policy",
    group: "authentication",
    name_en: "Secure Voice, Video & Emergency Communication Policy",
    name_de: "Richtlinie für sichere Sprach-, Video- und Notfallkommunikation",
    nis2Ref: "Art. 21(2)(j)",
    cirRef: "—",
    description_en: "Approved tools and channels for sensitive communications, with explicit rules for emergency communication if normal channels fail.",
    description_de: "Zugelassene Werkzeuge und Kanäle für sensible Kommunikation, mit expliziten Regeln für die Notfallkommunikation bei Ausfall regulärer Kanäle.",
    platform: COVERED(
      "AUT",
      "/policies",
      "Policy editor (AUT 11.1) — captures channels, fallback procedures, key contacts.",
      "Policy-Editor (AUT 11.1) — erfasst Kanäle, Rückfallverfahren, Schlüsselkontakte."
    ),
  },

  // ── Asset Management ───────────────────────────────────────────────
  {
    id: "asset-register",
    group: "assets",
    name_en: "Asset Register",
    name_de: "Asset-Verzeichnis",
    nis2Ref: "Art. 21(2)(i)",
    cirRef: "CIR 12.4",
    description_en: "Authoritative inventory of ICT assets — owner, classification, criticality, location, operational state. Foundation for risk analysis and BCP.",
    description_de: "Vollständiges Verzeichnis der IKT-Assets — Verantwortlicher, Klassifizierung, Kritikalität, Standort, Betriebszustand. Grundlage für Risikoanalyse und Notfallplan.",
    platform: COVERED(
      "RSK",
      "/assets",
      "Asset table with 30+ fields — referenced by 7+ requirements across 5 categories.",
      "Asset-Tabelle mit 30+ Feldern — referenziert von 7+ Anforderungen in 5 Kategorien."
    ),
  },
  {
    id: "asset-classification-procedure",
    group: "assets",
    name_en: "Asset Classification & Handling Procedure",
    name_de: "Verfahren zur Asset-Klassifizierung und -Handhabung",
    nis2Ref: "Art. 21(2)(i)",
    cirRef: "CIR 12.1, 12.2",
    description_en: "How assets are classified by sensitivity and criticality, and the handling rules per classification level.",
    description_de: "Wie Assets nach Sensibilität und Kritikalität klassifiziert werden, und die Handhabungsregeln je Klassifizierungsstufe.",
    platform: COVERED(
      "RSK",
      "/assets",
      "asset.isCritical + classification fields + RSK 2.2 classification methodology.",
      "asset.isCritical + Klassifizierungs-Felder + RSK-2.2-Klassifizierungsmethodik."
    ),
  },

  // ── Entity Registration ────────────────────────────────────────────
  {
    id: "entity-registration",
    group: "registration",
    name_en: "Entity Registration with Competent Authority",
    name_de: "Einrichtungsregistrierung bei der zuständigen Behörde",
    nis2Ref: "Art. 3(4), §33 BSIG",
    cirRef: "—",
    description_en: "Registration data submitted to the national competent authority: legal entity details, sector, contact points, services, EU presence.",
    description_de: "Registrierungsdaten an die nationale zuständige Behörde: Rechtsform, Sektor, Kontaktstellen, Dienste, EU-Präsenz.",
    platform: COVERED(
      "REG",
      "/organization",
      "Organization module — registration data with versioned snapshots for audit.",
      "Organisations-Modul — Registrierungsdaten mit versionierten Snapshots für Audits."
    ),
  },

  // ── Known regulation requirements not yet natively covered ────────
  {
    id: "physical-environmental-security",
    group: "hr-access",
    name_en: "Physical & Environmental Security Policy",
    name_de: "Richtlinie zur physischen und Umgebungssicherheit",
    nis2Ref: "Art. 21(2)(i)",
    cirRef: "CIR 13",
    description_en: "Physical access controls to facilities, server rooms and data centres; environmental safeguards (fire, flood, power).",
    description_de: "Physische Zugangskontrollen für Gebäude, Serverräume und Rechenzentren; Schutz vor Umgebungsrisiken (Brand, Wasser, Strom).",
    platform: NOT_COVERED(
      "Policy upload via the GOV module — no dedicated module yet.",
      "Policy-Upload über das GOV-Modul — noch kein eigenes Modul."
    ),
  },
  {
    id: "secure-disposal-policy",
    group: "assets",
    name_en: "Secure Disposal & Destruction Policy",
    name_de: "Richtlinie zur sicheren Entsorgung und Vernichtung",
    nis2Ref: "Art. 21(2)(i)",
    cirRef: "CIR 12.2.2",
    description_en: "How media and devices are wiped or destroyed at end-of-life so that data cannot be recovered.",
    description_de: "Wie Datenträger und Geräte am Lebensende gelöscht oder vernichtet werden, sodass Daten nicht rekonstruierbar sind.",
    platform: NOT_COVERED(
      "Policy upload via the asset module — no dedicated decommissioning workflow yet.",
      "Policy-Upload über das Asset-Modul — noch kein eigener Außerbetriebnahme-Workflow."
    ),
  },
];
