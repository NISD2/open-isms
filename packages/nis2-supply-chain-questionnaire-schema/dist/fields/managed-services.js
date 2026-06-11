// Source of truth for the supplier questionnaire fields in this section.
// Edit this file (not data/supply-chain-questionnaire.json) and run
// `bun run build:json` to regenerate the published JSON artefact.
export const managedServicesFields = [
    {
        id: "managedPrivilegedAccessMgmt",
        section: "managed_services",
        type: "boolean",
        label: { en: "Privileged access management (PAM) in place", de: "Privileged Access Management (PAM) im Einsatz" },
        description: {
            en: "Tick yes if you use a privileged access management tool for administrative remote sessions on customer systems. Examples: CyberArk, BeyondTrust, Teleport. A logged jump-host setup counts.",
            de: "Ja, wenn Sie für administrative Fernzugriffe auf Kundensysteme ein Privileged-Access-Management einsetzen. Beispiele: CyberArk, BeyondTrust, Teleport. Ein protokolliertes Jumphost-Setup zählt.",
        },
        legalBasis: "NIS2 Art. 21(2)(i) / ENISA TIG §11.3",
        required: true,
        visibleWhen: { field: "isManagedService", equals: true },
    },
    {
        id: "managedSessionRecording",
        section: "managed_services",
        type: "boolean",
        label: { en: "Admin sessions are recorded", de: "Admin-Sitzungen werden aufgezeichnet" },
        description: {
            en: "Tick yes if admin sessions on customer systems are recorded and retained for review. Common retention: 90 days to 1 year. Needed for forensic reconstruction after incidents.",
            de: "Ja, wenn Admin-Sitzungen auf Kundensystemen aufgezeichnet und für die Nachprüfung aufbewahrt werden. Übliche Aufbewahrung: 90 Tage bis 1 Jahr. Notwendig für forensische Rekonstruktion nach Vorfällen.",
        },
        legalBasis: "NIS2 Art. 21(2)(f) / ENISA TIG §10",
        required: true,
        visibleWhen: { field: "isManagedService", equals: true },
    },
    {
        id: "managedOnCall24x7",
        section: "managed_services",
        type: "boolean",
        label: { en: "24/7 on-call coverage", de: "24/7-Bereitschaft" },
        description: {
            en: "Tick yes if you operate a 24/7 on-call rotation that responds to security incidents on customer systems. Business-hours-only support does not qualify.",
            de: "Ja, wenn Sie eine 24/7-Bereitschaft betreiben, die auf Sicherheitsvorfälle auf Kundensystemen reagiert. Reine Unterstützung zu Geschäftszeiten qualifiziert sich nicht.",
        },
        legalBasis: "NIS2 Art. 21(2)(b) / ENISA TIG §3",
        required: true,
        visibleWhen: { field: "isManagedService", equals: true },
    },
];
//# sourceMappingURL=managed-services.js.map