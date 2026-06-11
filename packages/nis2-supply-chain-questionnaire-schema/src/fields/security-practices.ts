// Source of truth for the supplier questionnaire fields in this section.
// Edit this file (not data/supply-chain-questionnaire.json) and run
// `bun run build:json` to regenerate the published JSON artefact.
//
// Descriptions are Mittelstand-readable plain language with a "tick yes if"
// threshold and concrete examples. Legal citations live in `legalBasis` so
// audit teams still see the source. Labels are the public schema contract
// and are not edited here.

import type { SupplierField } from "../schema";

export const securityPracticesFields: SupplierField[] = [
  {
    id: "hasIsms",
    section: "security_practices",
    type: "boolean",
    label: { en: "Documented Information Security Management System (ISMS)", de: "Dokumentiertes Informationssicherheits-Managementsystem (ISMS)" },
    description: {
      en: "Tick yes if you have a written information security policy with assigned roles, regular reviews, and documented incident handling. ISO 27001 or BSI Grundschutz certification implies yes.",
      de: "Ja, wenn Sie eine schriftliche Informationssicherheits-Richtlinie haben, klar zugewiesene Rollen, regelmäßige Überprüfungen und einen dokumentierten Umgang mit Vorfällen. ISO 27001 oder BSI Grundschutz Zertifizierung bedeutet automatisch Ja.",
    },
    legalBasis: "CIR 2024/2690 §5.1.2(a)",
    required: true,
  },
  {
    id: "hasIso27001OrEquivalent",
    section: "security_practices",
    type: "boolean",
    label: { en: "Hold ISO 27001, BSI Grundschutz, or equivalent certification", de: "ISO 27001, BSI Grundschutz oder gleichwertige Zertifizierung" },
    description: {
      en: "Tick yes if your company currently holds an ISO 27001, BSI Grundschutz, SOC 2 Type II, or equivalent certification. Upload the certificate in the Certifications tab.",
      de: "Ja, wenn Ihr Unternehmen aktuell nach ISO 27001, BSI Grundschutz, SOC 2 Type II oder einem gleichwertigen Standard zertifiziert ist. Das Zertifikat laden Sie im Reiter Zertifizierungen hoch.",
    },
    legalBasis: "CIR 2024/2690 §5.1.2(b)",
    required: true,
  },
  {
    id: "staffSecurityTraining",
    section: "security_practices",
    type: "boolean",
    label: { en: "Annual security awareness training for all staff", de: "Jährliche Security-Awareness-Schulung für alle Mitarbeitenden" },
    description: {
      en: "Tick yes if every staff member receives at least one annual information-security awareness training. E-learning counts; phishing simulations add to it.",
      de: "Ja, wenn alle Mitarbeitenden mindestens einmal pro Jahr eine Awareness-Schulung zur Informationssicherheit erhalten. E-Learning genügt, Phishing-Simulationen kommen oben drauf.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(b)",
    required: true,
  },
  {
    id: "backgroundChecks",
    section: "security_practices",
    type: "boolean",
    label: { en: "Background checks on staff with customer data access", de: "Zuverlässigkeitsprüfung für Mitarbeitende mit Kundendaten-Zugriff" },
    description: {
      en: "Tick yes if you run a background check for staff with access to customer data. Common bar: a criminal record extract or equivalent document on hire.",
      de: "Ja, wenn Sie für Mitarbeitende mit Zugang zu Kundendaten eine Zuverlässigkeitsprüfung durchführen. Übliche Stufe: polizeiliches Führungszeugnis oder vergleichbares Dokument bei der Einstellung.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(c)",
    required: true,
  },
  {
    id: "vulnerabilityHandling",
    section: "security_practices",
    type: "boolean",
    label: { en: "Documented vulnerability handling and patching process", de: "Dokumentierter Schwachstellen- und Patch-Management-Prozess" },
    description: {
      en: "Tick yes if you have a written process for handling security vulnerabilities: detect, assess, prioritise, patch or mitigate. CVE monitoring and SLA-driven patching are the standard.",
      de: "Ja, wenn Sie einen schriftlichen Prozess für die Behandlung von Sicherheitslücken haben: erkennen, bewerten, priorisieren, patchen oder mitigieren. CVE-Monitoring und SLA-basiertes Patching gelten als Standard.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(f)",
    required: true,
  },
  {
    id: "acceptRightToAudit",
    section: "security_practices",
    type: "boolean",
    label: { en: "Accept customer right to audit (or provide audit reports)", de: "Akzeptanz des Auditrechts (oder Bereitstellung von Auditberichten)" },
    description: {
      en: "Tick yes if you either grant customers an on-site audit right or provide substitute audit reports (for example SOC 2, ISAE 3402).",
      de: "Ja, wenn Sie Kunden entweder ein Auditrecht vor Ort einräumen oder ihnen stellvertretend Auditberichte (zum Beispiel SOC 2, ISAE 3402) zur Verfügung stellen.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(e)",
    required: true,
  },
  {
    id: "hasSubprocessors",
    section: "security_practices",
    type: "boolean",
    label: { en: "Use subprocessors / sub-suppliers", de: "Einsatz von Sub-Unternehmern / Sub-Lieferanten" },
    description: {
      en: "Tick yes if you use other companies to deliver your service that have access to customer data or infrastructure. Typical examples: AWS, Azure, Cloudflare, Stripe.",
      de: "Ja, wenn Sie für die Leistungserbringung andere Unternehmen einsetzen, die Zugang zu Kundendaten oder Kunden-Infrastruktur haben. Typische Beispiele: AWS, Azure, Cloudflare, Stripe.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(g)",
    required: true,
  },
  {
    id: "subprocessorList",
    section: "security_practices",
    type: "text",
    label: { en: "List of subprocessors", de: "Liste der Sub-Unternehmer" },
    description: {
      en: "List every subprocessor with name, processing location, and what they do for you. A table or bullet list is enough. Update whenever you add or remove one.",
      de: "Liste aller Sub-Unternehmer mit Name, Verarbeitungsstandort und Aufgabe. Eine Tabelle oder Stichpunktliste genügt. Aktualisieren Sie diese, wenn Sie einen Sub-Unternehmer hinzufügen oder entfernen.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(g)",
    required: false,
    visibleWhen: { field: "hasSubprocessors", equals: true },
  },
  {
    id: "dataReturnOnTermination",
    section: "security_practices",
    type: "boolean",
    label: { en: "Commit to return / destroy customer data on termination", de: "Verpflichtung zur Rückgabe / Vernichtung von Kundendaten bei Vertragsende" },
    description: {
      en: "Tick yes if you contractually commit to returning or destroying customer data at the end of the contract. Common practice: export and return, then delete within 30 days.",
      de: "Ja, wenn Sie sich vertraglich verpflichten, Kundendaten am Ende des Vertrags zurückzugeben oder zu vernichten. Üblich: Rückgabe als Export, dann Löschung innerhalb von 30 Tagen.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(h)",
    required: true,
  },
  {
    id: "dpaAvailable",
    section: "security_practices",
    type: "boolean",
    label: { en: "Standard data processing agreement (DPA) available", de: "Standard-Auftragsverarbeitungsvertrag (AVV) verfügbar" },
    description: {
      en: "Tick yes if you have a standard data processing agreement under GDPR Article 28 that customers can sign. Required as soon as you process personal data.",
      de: "Ja, wenn Sie einen standardisierten Auftragsverarbeitungsvertrag nach Artikel 28 DSGVO haben, den Kunden unterschreiben können. Notwendig, sobald Sie personenbezogene Daten verarbeiten.",
    },
    legalBasis: "GDPR Art. 28",
    required: true,
  },
  {
    id: "securityPolicyReviewedAnnually",
    section: "security_practices",
    type: "boolean",
    label: { en: "Security policies reviewed at least annually", de: "Sicherheitsrichtlinien werden mindestens jährlich überprüft" },
    description: {
      en: "Tick yes if your security policies are reviewed at least once a year and updated as needed. A written note in the document is enough evidence.",
      de: "Ja, wenn Ihre Sicherheitsrichtlinien mindestens jährlich überprüft und bei Bedarf aktualisiert werden. Eine schriftliche Notiz im Dokument genügt als Nachweis.",
    },
    legalBasis: "NIS2 Art. 21(2)(a) / ENISA TIG §1.1",
    required: true,
  },
  {
    id: "hasIncidentResponsePlan",
    section: "security_practices",
    type: "boolean",
    label: { en: "Documented incident response plan", de: "Dokumentierter Notfall-/Incident-Response-Plan" },
    description: {
      en: "Tick yes if you have a written plan for handling security incidents: who decides, who communicates, who documents. At least one tabletop exercise per year is good practice.",
      de: "Ja, wenn Sie einen schriftlichen Plan für den Umgang mit Sicherheitsvorfällen haben: wer entscheidet, wer kommuniziert, wer dokumentiert. Mindestens eine Tabletop-Übung pro Jahr ist gute Praxis.",
    },
    legalBasis: "NIS2 Art. 21(2)(b) / ENISA TIG §3",
    required: true,
  },
  {
    id: "hasBusinessContinuityPlan",
    section: "security_practices",
    type: "boolean",
    label: { en: "Documented business continuity / disaster recovery plan", de: "Dokumentierter Business-Continuity- / Disaster-Recovery-Plan" },
    description: {
      en: "Tick yes if you have a plan that explains how you keep running or recover quickly during an outage: critical systems, fallbacks, RTO and RPO targets.",
      de: "Ja, wenn Sie einen Plan haben, der erklärt, wie Sie den Betrieb bei einem Ausfall aufrechterhalten oder schnell wiederherstellen: kritische Systeme, Ersatzwege, RTO und RPO Ziele.",
    },
    legalBasis: "NIS2 Art. 21(2)(c) / ENISA TIG §4",
    required: true,
  },
  {
    id: "hasCryptographyPolicy",
    section: "security_practices",
    type: "boolean",
    label: { en: "Documented cryptography policy", de: "Dokumentierte Kryptografie-Richtlinie" },
    description: {
      en: "Tick yes if you have written down which cryptography you use where: data in transit (TLS 1.2+), data at rest (AES-256), key management, hashing algorithms.",
      de: "Ja, wenn Sie schriftlich festgelegt haben, welche Verschlüsselungsverfahren Sie wofür einsetzen: Daten im Transit (TLS 1.2+), Daten im Ruhezustand (AES-256), Schlüsselverwaltung, ausgewählte Hashing-Verfahren.",
    },
    legalBasis: "NIS2 Art. 21(2)(h) / ENISA TIG §9",
    required: true,
  },
  {
    id: "hasPrivilegedAccessMgmt",
    section: "security_practices",
    type: "boolean",
    label: { en: "Privileged access management (PAM) for internal staff", de: "Privileged Access Management (PAM) für interne Mitarbeitende" },
    description: {
      en: "Tick yes if administrators and privileged accounts get extra controls: separate sign-in, MFA, session logging, or just-in-time access.",
      de: "Ja, wenn Administratoren und privilegierte Konten besondere Kontrollen haben: separater Login, MFA, Sitzungsprotokollierung oder zeitlich befristete Berechtigung.",
    },
    legalBasis: "NIS2 Art. 21(2)(i) / ENISA TIG §11.3",
    required: true,
  },
  {
    id: "mfaEnforcedInternal",
    section: "security_practices",
    type: "boolean",
    label: { en: "MFA enforced for all internal admin / privileged accounts", de: "MFA für alle internen Admin- / privilegierten Konten erzwungen" },
    description: {
      en: "Tick yes if every internal admin or privileged account must use MFA. Hardware tokens or authenticator apps count; SMS does not.",
      de: "Ja, wenn alle internen Administrator-Konten oder Konten mit erhöhten Rechten MFA erzwingen müssen. Hardware-Tokens oder Authenticator-Apps zählen, SMS ist nicht ausreichend.",
    },
    legalBasis: "NIS2 Art. 21(2)(j)",
    required: true,
  },
  {
    id: "hasAssetInventory",
    section: "security_practices",
    type: "boolean",
    label: { en: "Maintain an inventory of information assets", de: "Asset-Inventar wird gepflegt" },
    description: {
      en: "Tick yes if you keep a current list of every information system you use to deliver your service: servers, databases, SaaS tools, endpoints. A spreadsheet is enough.",
      de: "Ja, wenn Sie eine aktuelle Liste aller Informationssysteme führen, die Sie für die Leistungserbringung einsetzen: Server, Datenbanken, SaaS-Werkzeuge, Endgeräte. Eine Tabelle genügt.",
    },
    legalBasis: "NIS2 Art. 21(2)(i) / ENISA TIG §12.4",
    required: true,
  },
  {
    id: "hasPenetrationTestingProgram",
    section: "security_practices",
    type: "boolean",
    label: { en: "Annual or biennial penetration testing program", de: "Jährliches oder zweijährliches Penetrationstest-Programm" },
    description: {
      en: "Tick yes if you commission an external penetration test at least every one to two years. For smaller companies, an external vulnerability scan as a minimum step is acceptable.",
      de: "Ja, wenn Sie mindestens alle ein bis zwei Jahre einen externen Penetrationstest beauftragen. Bei kleineren Unternehmen ist eine externe Schwachstellenanalyse als Mindestschritt akzeptabel.",
    },
    legalBasis: "NIS2 Art. 21(2)(e) / ENISA TIG §6.5",
    required: true,
  },
  {
    id: "pastBreachesDisclosed",
    section: "security_practices",
    type: "boolean",
    label: { en: "We disclose past notifiable cybersecurity events when asked by customers", de: "Wir legen frühere meldepflichtige Sicherheitsvorfälle auf Anfrage offen" },
    description: {
      en: "Tick yes if, on customer request, you openly disclose whether and which reportable security incidents your company had in the past. Common window: the last three to five years.",
      de: "Ja, wenn Sie auf Kundenanfrage offen kommunizieren, ob und welche meldepflichtigen Sicherheitsvorfälle Ihr Unternehmen in der Vergangenheit hatte. Übliche Schwelle: die letzten drei bis fünf Jahre.",
    },
    legalBasis: "ENISA TIG §5.1.2",
    required: true,
  },
  {
    id: "incidentAssistanceCommitment",
    section: "security_practices",
    type: "boolean",
    label: { en: "Provide incident assistance to customers at no / ex-ante cost", de: "Wir unterstützen Kunden im Vorfall ohne / zu vorab definierten Kosten" },
    description: {
      en: "Tick yes if you commit to helping customers at no extra cost when an incident is caused by your product or service. If you agree a pre-defined day rate up front instead, also tick yes.",
      de: "Ja, wenn Sie sich verpflichten, Kunden bei einem durch Ihr Produkt oder Ihre Dienstleistung verursachten Vorfall ohne zusätzliche Kosten zu unterstützen. Wenn Sie stattdessen einen vorab definierten Tagessatz vereinbaren, wählen Sie auch Ja.",
    },
    legalBasis: "ENISA TIG §5.1.4 TIPS",
    required: true,
  },
  {
    id: "cooperateWithAuthorities",
    section: "security_practices",
    type: "boolean",
    label: { en: "Fully cooperate with competent authorities (BSI, ENISA, national CSIRTs)", de: "Vollständige Kooperation mit zuständigen Behörden (BSI, ENISA, nationale CSIRTs)" },
    description: {
      en: "Tick yes if you commit to fully cooperating with competent authorities like BSI, ENISA, or national CSIRTs during inspections, audits, and incident handling. Standard for serious suppliers.",
      de: "Ja, wenn Sie sich verpflichten, mit zuständigen Behörden wie BSI, ENISA oder nationalen CSIRTs bei Inspektionen, Audits und Vorfallbearbeitung vollständig zu kooperieren. Standard für seriöse Lieferanten.",
    },
    legalBasis: "ENISA TIG §5.1.4 TIPS",
    required: true,
  },
  {
    id: "notifyMaterialChanges",
    section: "security_practices",
    type: "boolean",
    label: { en: "Notify customers of any material change affecting service delivery", de: "Wir benachrichtigen Kunden über jede wesentliche Änderung der Leistungserbringung" },
    description: {
      en: "Tick yes if you commit to notifying customers of any material change affecting your ability to deliver: acquisitions, subprocessor changes, major technical shifts.",
      de: "Ja, wenn Sie sich verpflichten, Kunden über jede wesentliche Veränderung zu informieren, die Ihre Fähigkeit zur Leistungserbringung beeinflusst: Übernahmen, Wechsel des Sub-Unternehmers, größere technische Umstellungen.",
    },
    legalBasis: "ENISA TIG §5.1.4 TIPS",
    required: true,
  },
  {
    id: "notifyOnLocationChange",
    section: "security_practices",
    type: "boolean",
    label: { en: "Notify customers in advance if data-processing locations change", de: "Wir benachrichtigen Kunden im Voraus, wenn sich Verarbeitungsstandorte ändern" },
    description: {
      en: "Tick yes if you notify customers in advance before the processing location of their data changes. Important for data protection and for GDPR-compliant supply chain oversight.",
      de: "Ja, wenn Sie Kunden im Voraus informieren, bevor sich der Verarbeitungsstandort ihrer Daten ändert. Wichtig für Datenschutz und für DSGVO-konforme Lieferkettenkontrolle.",
    },
    legalBasis: "ENISA TIG §5.1.4 TIPS",
    required: true,
  },
  {
    id: "hasExitPlan",
    section: "security_practices",
    type: "boolean",
    label: { en: "Documented exit strategy with mandatory transition period", de: "Dokumentierte Exit-Strategie mit verpflichtender Übergangszeit" },
    description: {
      en: "Tick yes if you have a written exit strategy: how long an orderly handover takes, what data and knowledge gets transferred, what you commit to during the transition.",
      de: "Ja, wenn Sie eine schriftliche Exit-Strategie haben: Wie lange dauert der geordnete Übergang, welche Daten und welches Wissen werden übergeben, welche Mitwirkungspflichten gelten in dieser Phase.",
    },
    legalBasis: "ENISA TIG §5.1.4 TIPS",
    required: true,
  },
  {
    id: "providesSbomForAi",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "Provide an SBOM-for-AI per G7 minimum elements",
      de: "Wir stellen ein SBOM-for-AI nach G7-Mindestelementen bereit",
    },
    description: {
      en: "Optional. Tick yes if you can provide an SBOM-for-AI per the G7 minimum elements (May 2026). Documents metadata, models, training data, infrastructure, security properties, KPIs, and system behaviour. Voluntary standard.",
      de: "Optional. Ja, wenn Sie eine SBOM-for-AI nach den G7-Mindestelementen (Mai 2026) bereitstellen können. Dokumentiert Metadaten, Modelle, Trainingsdaten, Infrastruktur, Sicherheitsmerkmale, KPIs und Systemverhalten. Freiwilliger Standard.",
    },
    legalBasis: "NIS2 Art. 21(2)(d) / ENISA TIG §5.1.2",
    required: false,
    visibleWhen: { field: "usesAiSystems", equals: true },
  },
  {
    id: "aiSbomUrl",
    section: "security_practices",
    type: "url",
    label: {
      en: "SBOM-for-AI document URL",
      de: "URL des SBOM-for-AI-Dokuments",
    },
    description: {
      en: "Public or shared URL to your SBOM-for-AI document. Can be a PDF, a JSON file, or a project page.",
      de: "Öffentliche oder geteilte URL zu Ihrem SBOM-for-AI-Dokument. Kann ein PDF, eine JSON-Datei oder eine Projektseite sein.",
    },
    legalBasis: "NIS2 Art. 21(2)(d) / ENISA TIG §5.1.2",
    required: false,
    visibleWhen: { field: "providesSbomForAi", equals: true },
  },
];
