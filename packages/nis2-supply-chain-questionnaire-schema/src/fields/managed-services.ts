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
      cs: "Zavedená správa privilegovaného přístupu (PAM)",
      pt: "Gestão de acessos privilegiados (PAM) implementada",
      ro: "Gestionarea accesului privilegiat (PAM) implementată",
    },
    description: {
      en: "Tick yes if you use a privileged access management tool for administrative remote sessions on customer systems. Examples: CyberArk, BeyondTrust, Teleport. A logged jump-host setup counts.",
      de: "Ja, wenn Sie für administrative Fernzugriffe auf Kundensysteme ein Privileged-Access-Management einsetzen. Beispiele: CyberArk, BeyondTrust, Teleport. Ein protokolliertes Jumphost-Setup zählt.",
      fr: "Cochez oui si vous utilisez un outil de gestion des accès à privilèges pour les sessions distantes d'administration sur les systèmes des clients. Exemples : CyberArk, BeyondTrust, Teleport. Une configuration de jump-host journalisée compte.",
      it: "Selezionare sì se si utilizza uno strumento di gestione degli accessi privilegiati per le sessioni remote amministrative sui sistemi dei clienti. Esempi: CyberArk, BeyondTrust, Teleport. Una configurazione jump-host con registrazione dei log è valida.",
      es: "Marque sí si utiliza una herramienta de gestión de accesos privilegiados para las sesiones remotas administrativas en los sistemas de los clientes. Ejemplos: CyberArk, BeyondTrust, Teleport. Una configuración de jump-host con registro de logs cuenta.",
      pl: "Zaznacz tak, jeśli używasz narzędzia do zarządzania dostępem uprzywilejowanym dla administracyjnych sesji zdalnych w systemach klientów. Przykłady: CyberArk, BeyondTrust, Teleport. Konfiguracja jump-host z rejestrowaniem logów się liczy.",
      cs: "Zaškrtněte ano, pokud pro administrativní vzdálené relace na systémech zákazníků používáte nástroj pro správu privilegovaného přístupu. Příklady: CyberArk, BeyondTrust, Teleport. Protokolovaná konfigurace jump-host se počítá.",
      pt: "Assinale sim se utilizar uma ferramenta de gestão de acessos privilegiados para sessões remotas administrativas nos sistemas dos clientes. Exemplos: CyberArk, BeyondTrust, Teleport. Uma configuração de jump-host com registo de logs conta.",
      ro: "Bifați da dacă utilizați un instrument de gestionare a accesului privilegiat pentru sesiunile administrative la distanță pe sistemele clienților. Exemple: CyberArk, BeyondTrust, Teleport. O configurație jump-host cu jurnalizare contează.",
    },
    legalBasis: "NIS2 Art. 21(2)(i) / ENISA TIG §11.3",
    required: true,
    visibleWhen: { field: "isManagedService", equals: true },
  },
  {
    id: "managedAdminAccessLogged",
    section: "managed_services",
    type: "boolean",
    label: {
      en: "Administrative access to customer systems is logged",
      de: "Administrative Zugriffe auf Kundensysteme werden protokolliert",
    },
    description: {
      en: "Tick yes if it is recorded who accessed your customers' systems with administrator rights, and when, so it can be traced afterwards. Recording whole sessions is not expected.",
      de: "Ja, wenn festgehalten wird, wer wann mit Administratorrechten auf Systeme Ihrer Kunden zugegriffen hat, sodass es sich später nachvollziehen lässt. Ganze Sitzungen aufzuzeichnen wird nicht erwartet.",
    },
    legalBasis: "CIR 2024/2690 §3.2",
    required: true,
    visibleWhen: { field: "isManagedService", equals: true },
  },
];
