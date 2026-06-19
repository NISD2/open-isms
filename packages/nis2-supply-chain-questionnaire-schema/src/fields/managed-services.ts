// Source of truth for the supplier questionnaire fields in this section.
// Edit this file (not data/supply-chain-questionnaire.json) and run
// `bun run build:json` to regenerate the published JSON artefact.

import type { SupplierField } from "../schema";

export const managedServicesFields: SupplierField[] = [
  {
    id: "managedPrivilegedAccessMgmt",
    section: "managed_services",
    type: "boolean",
    label: {
      en: "Privileged access management (PAM) in place",
      de: "Privileged Access Management (PAM) im Einsatz",
      fr: "Gestion des accès à privilèges (PAM) en place",
      it: "Gestione degli accessi privilegiati (PAM) attiva",
      es: "Gestión de accesos privilegiados (PAM) implantada",
      pl: "Wdrożone zarządzanie dostępem uprzywilejowanym (PAM)",
    },
    description: {
      en: "Tick yes if you use a privileged access management tool for administrative remote sessions on customer systems. Examples: CyberArk, BeyondTrust, Teleport. A logged jump-host setup counts.",
      de: "Ja, wenn Sie für administrative Fernzugriffe auf Kundensysteme ein Privileged-Access-Management einsetzen. Beispiele: CyberArk, BeyondTrust, Teleport. Ein protokolliertes Jumphost-Setup zählt.",
      fr: "Cochez oui si vous utilisez un outil de gestion des accès à privilèges pour les sessions distantes d'administration sur les systèmes des clients. Exemples : CyberArk, BeyondTrust, Teleport. Une configuration de jump-host journalisée compte.",
      it: "Selezionare sì se si utilizza uno strumento di gestione degli accessi privilegiati per le sessioni remote amministrative sui sistemi dei clienti. Esempi: CyberArk, BeyondTrust, Teleport. Una configurazione jump-host con registrazione dei log è valida.",
      es: "Marque sí si utiliza una herramienta de gestión de accesos privilegiados para las sesiones remotas administrativas en los sistemas de los clientes. Ejemplos: CyberArk, BeyondTrust, Teleport. Una configuración de jump-host con registro de logs cuenta.",
      pl: "Zaznacz tak, jeśli używasz narzędzia do zarządzania dostępem uprzywilejowanym dla administracyjnych sesji zdalnych w systemach klientów. Przykłady: CyberArk, BeyondTrust, Teleport. Konfiguracja jump-host z rejestrowaniem logów się liczy.",
    },
    legalBasis: "NIS2 Art. 21(2)(i) / ENISA TIG §11.3",
    required: true,
    visibleWhen: { field: "isManagedService", equals: true },
  },
  {
    id: "managedSessionRecording",
    section: "managed_services",
    type: "boolean",
    label: {
      en: "Admin sessions are recorded",
      de: "Admin-Sitzungen werden aufgezeichnet",
      fr: "Les sessions d'administration sont enregistrées",
      it: "Le sessioni amministrative vengono registrate",
      es: "Las sesiones de administración se graban",
      pl: "Sesje administracyjne są rejestrowane",
    },
    description: {
      en: "Tick yes if admin sessions on customer systems are recorded and retained for review. Common retention: 90 days to 1 year. Needed for forensic reconstruction after incidents.",
      de: "Ja, wenn Admin-Sitzungen auf Kundensystemen aufgezeichnet und für die Nachprüfung aufbewahrt werden. Übliche Aufbewahrung: 90 Tage bis 1 Jahr. Notwendig für forensische Rekonstruktion nach Vorfällen.",
      fr: "Cochez oui si les sessions d'administration sur les systèmes des clients sont enregistrées et conservées à des fins de vérification. Conservation courante : 90 jours à 1 an. Nécessaire pour la reconstruction forensique après un incident.",
      it: "Selezionare sì se le sessioni amministrative sui sistemi dei clienti vengono registrate e conservate per la verifica. Conservazione comune: da 90 giorni a 1 anno. Necessaria per la ricostruzione forense dopo gli incidenti.",
      es: "Marque sí si las sesiones de administración en los sistemas de los clientes se graban y se conservan para su revisión. Conservación habitual: de 90 días a 1 año. Necesaria para la reconstrucción forense tras los incidentes.",
      pl: "Zaznacz tak, jeśli sesje administracyjne w systemach klientów są rejestrowane i przechowywane do celów weryfikacji. Typowy okres przechowywania: od 90 dni do 1 roku. Niezbędne do rekonstrukcji forensycznej po incydentach.",
    },
    legalBasis: "NIS2 Art. 21(2)(f) / ENISA TIG §10",
    required: true,
    visibleWhen: { field: "isManagedService", equals: true },
  },
  {
    id: "managedOnCall24x7",
    section: "managed_services",
    type: "boolean",
    label: {
      en: "24/7 on-call coverage",
      de: "24/7-Bereitschaft",
      fr: "Astreinte 24/7",
      it: "Reperibilità 24/7",
      es: "Cobertura de guardia 24/7",
      pl: "Dyżur 24/7",
    },
    description: {
      en: "Tick yes if you operate a 24/7 on-call rotation that responds to security incidents on customer systems. Business-hours-only support does not qualify.",
      de: "Ja, wenn Sie eine 24/7-Bereitschaft betreiben, die auf Sicherheitsvorfälle auf Kundensystemen reagiert. Reine Unterstützung zu Geschäftszeiten qualifiziert sich nicht.",
      fr: "Cochez oui si vous assurez une astreinte 24/7 qui répond aux incidents de sécurité sur les systèmes des clients. Un support limité aux heures ouvrées ne suffit pas.",
      it: "Selezionare sì se si gestisce una reperibilità 24/7 che risponde agli incidenti di sicurezza sui sistemi dei clienti. Il supporto limitato all'orario lavorativo non è sufficiente.",
      es: "Marque sí si dispone de una guardia 24/7 que responde a los incidentes de seguridad en los sistemas de los clientes. El soporte limitado al horario laboral no cumple el requisito.",
      pl: "Zaznacz tak, jeśli prowadzisz dyżur 24/7, który reaguje na incydenty bezpieczeństwa w systemach klientów. Wsparcie wyłącznie w godzinach pracy nie spełnia tego wymogu.",
    },
    legalBasis: "NIS2 Art. 21(2)(b) / ENISA TIG §3",
    required: true,
    visibleWhen: { field: "isManagedService", equals: true },
  },
];
