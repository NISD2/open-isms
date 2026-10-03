/**
 * The company the walk demo fills in: a machine builder of 118 people near Osnabrück, an
 * important entity under NIS 2 (Annex II, manufacture of machinery) and the typical customer, one
 * IT lead doing the walk next to their job, the managing directors signing at the end.
 *
 * Every answer is one a company like this gives: its real kinds of software and machines, several
 * of a kind where it has several, the providers behind them, ratings that follow from what stops
 * production, and gaps a company six months in still has (no second factor on the ERP, no log of
 * remote maintenance), so the approval screen shows what it shows a real customer. Between them
 * the assets cover every asset type the platform knows, and the suppliers every level of the
 * supplier register.
 *
 * The company, its people, numbers and addresses are invented; the software vendors are the
 * products such a company runs. Domains end in .example, phone numbers carry zero blocks and IP
 * addresses are private ranges.
 *
 * Keys are the app's own: catalogue ids (lib/asset-inventory/catalog.ts), BSI 200-3 scale keys
 * (lib/compliance/bsi-200-3.ts), intake field keys and register columns. The driver turns them
 * into what the screens show.
 */
import type { Frequency, Impact } from "@/lib/compliance/bsi-200-3";
import type { RoleKey } from "@/lib/compliance/role-mapping";
import type { asset, supplier } from "@/schema";

export const DOMAIN = "kemper-lohse.example";

export const MANAGEMENT = {
  email: `gf@${DOMAIN}`,
  name: "Claudia Lohse",
  // Role key as the team page sets it: "ceo" is management, who approves the walk's documents.
  jobTitle: "ceo" satisfies RoleKey,
} as const;

export const IT_LEAD = {
  email: `it@${DOMAIN}`,
  name: "Markus Reinholt",
  jobTitle: "cto" satisfies RoleKey,
} as const;

export const COMPANY = {
  name: "Kemper & Lohse Fördertechnik GmbH",
  legalForm: "GmbH",
  sector: "manufacturing",
  entityType: "important",
  employeeCount: 118,
  annualRevenue: "23800000",
  country: "DE",
  registeredAddress: "Gewerbepark Nord 9, 49134 Wallenhorst",
  primaryLocations: "Werk und Verwaltung Wallenhorst",
  contactEmail: MANAGEMENT.email,
  contactPhone: "+49 5407 000000",
  cisoName: IT_LEAD.name,
  cisoReportsTo: "Geschäftsführung",
} as const;

const SYSTEMHAUS = "IT-Service Diekmann GmbH";
const MICROSOFT = "Microsoft Ireland Operations Ltd.";
const PROALPHA = "proALPHA Business Solutions GmbH";
const DATEV = "DATEV eG";
const KANZLEI = "Steuerkanzlei Wiebold & Partner";
const TELEKOM = "Telekom Deutschland GmbH";
const AUTOMATION = "Automation Service Brune GmbH";
const ELEKTRO = "Hollmann Elektrotechnik GmbH";
const HETZNER = "Hetzner Online GmbH";
const AGENTUR = "Agentur Feldkamp Mediendesign";
const SICHERHEIT = "Sicherheitstechnik Lüdke GmbH";
const BESCHICHTUNG = "Beschichtungstechnik Sander GmbH";

/**
 * What the checklists of 2.2 hold for this company, by catalogue id. Everything else the screens
 * offer is left unticked, including entries the catalogue ticks by default: Teams is one program
 * here, not three, and there is no HR system or cloud platform.
 */
export const ASSETS: readonly string[] = [
  // Processes
  "bp-sales-cs",
  "bp-production-service",
  "bp-procurement",
  "bp-hr-payroll",
  "bp-finance-accounting",
  "bp-marketing",
  "bp-logistics",
  "bp-warehousing",
  "bp-maintenance",
  "bp-quality",
  "bp-rnd",
  "bp-it-operations",
  // Programs for customers and the office
  "cf-website",
  "cf-contact-form",
  "cf-social-media",
  "sales-quote-proposal",
  "cs-voip",
  "cs-shared-mailbox",
  "cs-field-service",
  "hr-payroll",
  "hr-time-tracking",
  "hr-scheduling",
  "hr-safety",
  "fin-accounting",
  "fin-erp",
  "fin-online-banking",
  "fin-tax-advisor",
  "fin-tax-portal",
  // Programs everyone uses, and the machine builder's own
  "it-email",
  "it-file-storage",
  "it-video-conferencing",
  "it-identity-provider",
  "it-endpoint-protection",
  "it-password-manager",
  "it-office-suite",
  "it-remote-support",
  "it-email-security",
  "it-mdm",
  "it-patch-rmm",
  "sec-plc-scada",
  "sec-cad-plm",
  // Technology, devices, lines and places
  "infra-onprem-servers",
  "infra-network-equipment",
  "infra-backup-system",
  "infra-backup-media",
  "infra-virtualisation",
  "infra-directory",
  "infra-database",
  "infra-dns-domains",
  "infra-printer-fleet",
  "infra-ups",
  "ep-laptops",
  "ep-mobile",
  "ep-shared-pcs",
  "ep-handheld-scanners",
  "ep-meeting-rooms",
  "ep-cameras",
  "ep-access-control",
  "ep-building-tech",
  "net-internet",
  "net-vpn",
  "net-lan",
  "net-wifi",
  "net-remote-maintenance",
  "loc-main-office",
  "loc-server-room",
  "loc-employee-homes",
  "loc-production",
  "loc-warehouse",
  "loc-technical-rooms",
  "loc-archive",
];

/** What the company types in itself, by 2.2 checklist screen. */
export const OWN_ENTRIES: Readonly<Record<string, readonly string[]>> = {
  technology: ["Messrechner am Prüfstand"],
};

export interface Named {
  /** The product or system, which becomes the asset's name. */
  readonly what: string;
  /** What it is for here, the asset's description. */
  readonly about: string;
  readonly providers: readonly string[];
}

/**
 * 2.2 "Welches Programm genau, und von wem?" and the same for technology, by catalogue id, or by
 * the name of an entry the company typed in. Several entries are several things of that kind,
 * the second and later added with "Noch eins dieser Art".
 */
export const NAMED: Readonly<Record<string, readonly Named[]>> = {
  "cf-website": [
    {
      what: `Website ${DOMAIN} (WordPress)`,
      about:
        "Produktkatalog, Referenzen, Stellenanzeigen; Kundendaten nur aus dem Formular",
      providers: [AGENTUR, HETZNER],
    },
  ],
  "cf-contact-form": [
    {
      what: "Kontaktformular der Website",
      about: "Anfragen gehen an vertrieb@",
      providers: [AGENTUR],
    },
  ],
  "cf-social-media": [
    {
      what: "LinkedIn-Unternehmensseite",
      about: "Stellenanzeigen und Messeankündigungen",
      providers: [],
    },
  ],
  "sales-quote-proposal": [
    {
      what: "Angebotsmodul in proALPHA",
      about: "Angebote und Vorkalkulation für Sonderanlagen",
      providers: [PROALPHA],
    },
  ],
  "cs-voip": [
    {
      what: "Cloud-Telefonanlage (NFON)",
      about: "Zentrale, Vertrieb, Service und Rufbereitschaft",
      providers: ["NFON AG"],
    },
  ],
  "cs-shared-mailbox": [
    {
      what: "Servicepostfach service@ in Microsoft 365",
      about: "Störmeldungen und Ersatzteilanfragen von Kunden",
      providers: [MICROSOFT],
    },
  ],
  "cs-field-service": [
    {
      what: "Servicemodul proALPHA mit App für Monteure",
      about: "Einsätze bei Kunden, Wartungsprotokolle, Ersatzteile",
      providers: [PROALPHA],
    },
  ],
  "hr-payroll": [
    {
      what: "DATEV LODAS",
      about: "Lohnabrechnung für 118 Beschäftigte über die Steuerkanzlei",
      providers: [DATEV, KANZLEI],
    },
  ],
  "hr-time-tracking": [
    {
      what: "Zeiterfassung mit Terminals in Halle und Verwaltung",
      about: "Arbeitszeiten und Rückmeldungen auf Fertigungsaufträge",
      providers: ["Tempora Zeitsysteme GmbH"],
    },
  ],
  "hr-scheduling": [
    {
      what: "Schichtplan in Excel auf dem Fileserver",
      about: "Zwei Schichten in der Fertigung",
      providers: [],
    },
  ],
  "hr-safety": [
    {
      what: "Unterweisungen mit Lernvideos und Teilnahmelisten",
      about: "Jährliche Sicherheitsunterweisung für Halle, Lager und Service",
      providers: [],
    },
  ],
  "fin-accounting": [
    {
      what: "DATEV Kanzlei-Rechnungswesen",
      about: "Finanzbuchhaltung und Jahresabschluss über die Steuerkanzlei",
      providers: [DATEV, KANZLEI],
    },
  ],
  "fin-erp": [
    {
      what: "proALPHA ERP",
      about:
        "Aufträge, Stücklisten, Einkauf, Lager und Fertigungssteuerung; ohne ERP steht die Auftragsabwicklung",
      providers: [PROALPHA, SYSTEMHAUS],
    },
  ],
  "fin-online-banking": [
    {
      what: "Firmenkundenportal der Hausbank",
      about: "Zahlungsverkehr und Gehaltszahlungen",
      providers: [],
    },
  ],
  "fin-tax-advisor": [
    {
      what: "DATEV Unternehmen online",
      about: "Belege und Auswertungen mit der Steuerkanzlei",
      providers: [DATEV],
    },
  ],
  "fin-tax-portal": [
    {
      what: "ELSTER mit Organisationszertifikat",
      about: "Steuermeldungen und der Zugang zum BSI-Portal über Mein Unternehmenskonto",
      providers: [],
    },
  ],
  "it-email": [
    {
      what: "Microsoft 365 Exchange Online",
      about: "E-Mail für 74 Konten",
      providers: [MICROSOFT, SYSTEMHAUS],
    },
  ],
  "it-file-storage": [
    {
      what: "Fileserver Verwaltung",
      about: "Angebote, Personalordner, Qualitätsunterlagen",
      providers: [SYSTEMHAUS],
    },
    {
      what: "SharePoint Online",
      about: "Projektordner, die mit Kunden geteilt werden",
      providers: [MICROSOFT],
    },
  ],
  "it-video-conferencing": [
    {
      what: "Microsoft Teams",
      about: "Chat, Besprechungen und Abnahmen per Video mit Kunden",
      providers: [MICROSOFT],
    },
  ],
  "it-identity-provider": [
    {
      what: "Microsoft Entra ID",
      about: "Anmeldung an Microsoft 365, gekoppelt an das Active Directory",
      providers: [MICROSOFT],
    },
  ],
  "it-endpoint-protection": [
    {
      what: "Microsoft Defender for Business",
      about: "Virenschutz auf allen Notebooks, PCs und Servern",
      providers: [MICROSOFT, SYSTEMHAUS],
    },
  ],
  "it-password-manager": [
    {
      what: "Bitwarden (nur IT)",
      about: "Adminpasswörter und Zugänge zu Dienstleisterportalen",
      providers: ["Bitwarden Inc."],
    },
  ],
  "it-office-suite": [
    {
      what: "Microsoft 365 Apps",
      about: "Word, Excel, Outlook auf allen Arbeitsplätzen",
      providers: [MICROSOFT],
    },
  ],
  "it-remote-support": [
    {
      what: "TeamViewer Tensor",
      about:
        "Fernwartung an ausgelieferten Anlagen bei Kunden und Unterstützung der eigenen Arbeitsplätze",
      providers: ["TeamViewer Germany GmbH"],
    },
  ],
  "it-email-security": [
    {
      what: "Microsoft Defender for Office 365",
      about: "Filtert eingehende E-Mails auf Spam, Phishing und Schadsoftware",
      providers: [MICROSOFT],
    },
  ],
  "it-mdm": [
    {
      what: "Microsoft Intune",
      about: "Verwaltet Diensthandys und Notebooks",
      providers: [MICROSOFT],
    },
  ],
  "it-patch-rmm": [
    {
      what: "NinjaOne RMM des Systemhauses",
      about: "Updates und Überwachung aller Windows-Rechner und Server",
      providers: [SYSTEMHAUS, "NinjaOne LLC"],
    },
  ],
  "sec-plc-scada": [
    {
      what: "Siemens SIMATIC S7-1500 am Schweißroboter",
      about: "Steuert die Roboterschweißzelle in Halle 2",
      providers: [AUTOMATION],
    },
    {
      what: "Siemens SIMATIC S7-1200 an der Laseranlage",
      about: "Steuert den Laserzuschnitt der Bleche",
      providers: [AUTOMATION],
    },
    {
      what: "Steuerung der Pulverbeschichtungsanlage",
      about: "Ofen und Förderkette der Lackierung, mit eigenem Bedienrechner",
      providers: [BESCHICHTUNG],
    },
  ],
  "sec-cad-plm": [
    {
      what: "SolidWorks mit PDM",
      about: "Konstruktion der Förderanlagen, Zeichnungen und Stücklisten für das ERP",
      providers: ["Dassault Systèmes Deutschland GmbH", "CAD-Systemhaus Rehme GmbH"],
    },
  ],
  "infra-onprem-servers": [
    {
      what: "Hyper-V-Host 1 (Dell PowerEdge R650)",
      about: "Trägt ERP, Datenbank und den ersten Domänencontroller",
      providers: [SYSTEMHAUS],
    },
    {
      what: "Hyper-V-Host 2 (Dell PowerEdge R650)",
      about: "Trägt Fileserver und Zweitsysteme, übernimmt bei Ausfall von Host 1",
      providers: [SYSTEMHAUS],
    },
  ],
  "infra-network-equipment": [
    {
      what: "Sophos Firewall XGS",
      about: "Zugang ins Internet, VPN und Trennung von Büronetz und Fertigungsnetz",
      providers: [SYSTEMHAUS],
    },
    {
      what: "Aruba-Switches und WLAN-Controller",
      about: "Zwölf Switches in Verwaltung und Hallen",
      providers: [SYSTEMHAUS],
    },
  ],
  "infra-backup-system": [
    {
      what: "Veeam Backup & Replication auf Synology-NAS",
      about: "Nächtliche Sicherung aller Server, Kopie wöchentlich außer Haus",
      providers: [SYSTEMHAUS],
    },
  ],
  "infra-backup-media": [
    {
      what: "Zwei USB-Festplatten im Wechsel",
      about: "Wöchentliche Kopie der Sicherung, liegt im Tresor der Geschäftsführung",
      providers: [],
    },
  ],
  "infra-virtualisation": [
    {
      what: "Microsoft Hyper-V",
      about: "Neun virtuelle Server auf den beiden Hosts",
      providers: [SYSTEMHAUS],
    },
  ],
  "infra-directory": [
    {
      what: "Active Directory mit zwei Domänencontrollern",
      about: "Benutzerkonten und Rechte im Firmennetz",
      providers: [SYSTEMHAUS],
    },
  ],
  "infra-database": [
    {
      what: "Microsoft SQL Server für proALPHA",
      about: "Datenbank des ERP",
      providers: [SYSTEMHAUS],
    },
  ],
  "infra-dns-domains": [
    {
      what: `Domain ${DOMAIN}`,
      about: "Website und E-Mail-Adressen",
      providers: [HETZNER],
    },
  ],
  "infra-printer-fleet": [
    {
      what: "Vier Multifunktionsgeräte (geleast)",
      about: "Drucken und Scannen in Verwaltung und Halle",
      providers: ["Bürotechnik Osnabrücker Land GmbH"],
    },
  ],
  "infra-ups": [
    {
      what: "USV im Serverraum",
      about: "30 Minuten Laufzeit, fährt die Server bei Stromausfall geordnet herunter",
      providers: [ELEKTRO],
    },
  ],
  "ep-laptops": [
    {
      what: "62 Notebooks mit Windows 11",
      about: "Verwaltung, Vertrieb und Service",
      providers: [SYSTEMHAUS],
    },
    {
      what: "21 Desktop-PCs, davon 9 CAD-Arbeitsplätze",
      about: "Konstruktion und Arbeitsvorbereitung",
      providers: [SYSTEMHAUS],
    },
  ],
  "ep-mobile": [
    {
      what: "38 Diensthandys",
      about: "Vertrieb, Service, Schichtführer und Geschäftsführung",
      providers: [TELEKOM],
    },
  ],
  "ep-shared-pcs": [
    {
      what: "Acht Hallen-PCs an den Montageplätzen",
      about: "Zeichnungen anzeigen, Rückmeldungen ins ERP",
      providers: [],
    },
  ],
  "ep-handheld-scanners": [
    {
      what: "Sechs Handscanner im Lager",
      about: "Wareneingang, Kommissionierung und Inventur",
      providers: [],
    },
  ],
  "ep-meeting-rooms": [
    {
      what: "Konferenzraumtechnik (Teams-Raum)",
      about: "Großbildschirm, Kamera und Mikrofon im Besprechungsraum",
      providers: [SYSTEMHAUS],
    },
  ],
  "ep-cameras": [
    {
      what: "Acht Außenkameras am Werksgelände",
      about: "Aufzeichnung auf einem Rekorder im Technikraum, 72 Stunden",
      providers: [SICHERHEIT],
    },
  ],
  "ep-access-control": [
    {
      what: "Zutrittskontrolle mit Transpondern",
      about: "Werkstore, Serverraum und Verwaltung",
      providers: [SICHERHEIT],
    },
  ],
  "ep-building-tech": [
    {
      what: "Gebäudeleittechnik für Heizung und Druckluft",
      about: "Mit Fernzugriff des Wartungsdienstes für die Kompressoren",
      providers: [ELEKTRO],
    },
  ],
  "net-internet": [
    {
      what: "Glasfaser 500 Mbit/s mit LTE-Ersatzleitung",
      about: "Einziger Internetzugang des Werks",
      providers: [TELEKOM],
    },
  ],
  "net-vpn": [
    {
      what: "Sophos VPN",
      about: "Homeoffice und Monteure beim Kunden",
      providers: [SYSTEMHAUS],
    },
  ],
  "net-lan": [
    {
      what: "Firmennetz mit getrenntem Fertigungsnetz",
      about: "Büro, Konstruktion und Halle in eigenen Netzbereichen",
      providers: [],
    },
  ],
  "net-wifi": [
    {
      what: "WLAN für Büro, Halle und Gäste",
      about: "Gästenetz vom Firmennetz getrennt",
      providers: [],
    },
  ],
  "net-remote-maintenance": [
    {
      what: "Fernwartungszugang für Dienstleister",
      about:
        "Für das Systemhaus und die Automatisierer, nur auf Anforderung freigeschaltet",
      providers: [SYSTEMHAUS, AUTOMATION],
    },
  ],
  "Messrechner am Prüfstand": [
    {
      what: "Messrechner am Prüfstand für Förderbänder",
      about: "Zeichnet die Lauftests vor jeder Auslieferung auf",
      providers: [],
    },
  ],
};

/** 5.1: suppliers that are no provider of a listed program, with what they do here. */
export const SUPPLIERS: ReadonlyArray<{ name: string; does: string }> = [
  {
    name: "Reinigungsdienst Glanzwerk GmbH",
    does: "reinigt abends die Büros, hat Schlüssel zum Verwaltungsgebäude",
  },
  {
    name: "Aktenvernichtung Nordwest GmbH",
    does: "holt Papierakten und ausgemusterte Festplatten zur Vernichtung ab",
  },
  {
    name: "Spedition Brinker GmbH",
    does: "liefert Anlagen an Kunden aus und kennt Liefertermine und Adressen",
  },
];

export interface Rating {
  readonly impact: Impact;
  readonly frequency: Frequency;
  readonly note?: string;
}

/** Anything not named here is rated as a small, rare damage. */
export const DEFAULT_RATING: Rating = { impact: "limited", frequency: "rare" };

/**
 * 2.3, by the name the row shows: the product named in 2.2, or the supplier. Spread over the
 * matrix as a company like this rates: a few very high, a band of high and medium, the rest low.
 */
export const RATINGS: Readonly<Record<string, Rating>> = {
  // Very high
  "Microsoft 365 Exchange Online": {
    impact: "considerable",
    frequency: "very_frequent",
    note: "Täglich Phishingversuche; Filter und zweiter Faktor sind aktiv",
  },
  "Fernwartungszugang für Dienstleister": {
    impact: "existential",
    frequency: "frequent",
    note: "Wird auf Anforderung freigeschaltet; ein Protokoll der Sitzungen fehlt noch",
  },
  [SYSTEMHAUS]: {
    impact: "existential",
    frequency: "frequent",
    note: "Adminzugang zu allen Systemen; Sicherheitsklauseln und Meldepflicht im Vertrag",
  },
  // High
  "proALPHA ERP": {
    impact: "existential",
    frequency: "medium",
    note: "Nächtliche Sicherung; Wiederanlauf mit IT-Service Diekmann binnen 48 Stunden vereinbart",
  },
  "Hyper-V-Host 1 (Dell PowerEdge R650)": {
    impact: "existential",
    frequency: "medium",
    note: "Host 2 übernimmt; Wiederherstellung aus Veeam im September getestet",
  },
  "Active Directory mit zwei Domänencontrollern": {
    impact: "existential",
    frequency: "medium",
  },
  "Siemens SIMATIC S7-1500 am Schweißroboter": {
    impact: "existential",
    frequency: "medium",
    note: "Fertigungsnetz getrennt; Steuerungsprogramme beim Automatisierer gesichert",
  },
  "TeamViewer Tensor": {
    impact: "considerable",
    frequency: "frequent",
    note: "Sitzung nur mit Freigabe durch den Kunden",
  },
  "Sophos Firewall XGS": { impact: "considerable", frequency: "frequent" },
  "62 Notebooks mit Windows 11": {
    impact: "limited",
    frequency: "very_frequent",
    note: "Festplatten mit BitLocker verschlüsselt",
  },
  [PROALPHA]: { impact: "existential", frequency: "medium" },
  [AUTOMATION]: { impact: "considerable", frequency: "frequent" },
  // Medium
  "Microsoft Entra ID": { impact: "existential", frequency: "rare" },
  "Veeam Backup & Replication auf Synology-NAS": {
    impact: "existential",
    frequency: "rare",
  },
  "Hyper-V-Host 2 (Dell PowerEdge R650)": { impact: "existential", frequency: "rare" },
  "Microsoft SQL Server für proALPHA": { impact: "existential", frequency: "rare" },
  "SolidWorks mit PDM": { impact: "considerable", frequency: "rare" },
  "Siemens SIMATIC S7-1200 an der Laseranlage": {
    impact: "considerable",
    frequency: "rare",
  },
  "Steuerung der Pulverbeschichtungsanlage": {
    impact: "considerable",
    frequency: "medium",
    note: "Bedienrechner mit altem Windows, vom Netz getrennt",
  },
  "Glasfaser 500 Mbit/s mit LTE-Ersatzleitung": {
    impact: "considerable",
    frequency: "medium",
    note: "LTE-Ersatzleitung schaltet automatisch um",
  },
  "Sophos VPN": { impact: "considerable", frequency: "medium" },
  "Aruba-Switches und WLAN-Controller": { impact: "considerable", frequency: "rare" },
  "Fileserver Verwaltung": { impact: "considerable", frequency: "medium" },
  "SharePoint Online": { impact: "considerable", frequency: "rare" },
  [`Website ${DOMAIN} (WordPress)`]: { impact: "limited", frequency: "frequent" },
  "DATEV LODAS": { impact: "considerable", frequency: "rare" },
  "Cloud-Telefonanlage (NFON)": { impact: "considerable", frequency: "rare" },
  "38 Diensthandys": { impact: "limited", frequency: "frequent" },
  "Zutrittskontrolle mit Transpondern": { impact: "considerable", frequency: "rare" },
  [MICROSOFT]: { impact: "considerable", frequency: "medium" },
  [TELEKOM]: { impact: "considerable", frequency: "rare" },
  [DATEV]: { impact: "considerable", frequency: "rare" },
  [HETZNER]: { impact: "limited", frequency: "frequent" },
  // Low, beyond the default
  "Kontaktformular der Website": { impact: "negligible", frequency: "medium" },
  "LinkedIn-Unternehmensseite": { impact: "negligible", frequency: "frequent" },
  "Konferenzraumtechnik (Teams-Raum)": { impact: "negligible", frequency: "rare" },
  "Acht Außenkameras am Werksgelände": { impact: "limited", frequency: "medium" },
  "Vier Multifunktionsgeräte (geleast)": { impact: "limited", frequency: "medium" },
  [KANZLEI]: { impact: "limited", frequency: "medium" },
};

/** 5.2: what each supplier's paper settles. Every other supplier settles nothing. */
export const AGREEMENTS: Readonly<
  Record<string, { readonly security: boolean; readonly incidents: boolean }>
> = {
  [SYSTEMHAUS]: { security: true, incidents: true },
  [MICROSOFT]: { security: true, incidents: true },
  [DATEV]: { security: true, incidents: true },
  [PROALPHA]: { security: true, incidents: false },
  [TELEKOM]: { security: true, incidents: false },
  [KANZLEI]: { security: true, incidents: false },
  [AUTOMATION]: { security: true, incidents: false },
  [HETZNER]: { security: true, incidents: false },
};

/**
 * 11.1: the sign-ins that take a second factor: everything signed in through Microsoft Entra, the
 * cloud portals and the admin consoles that offer one. What signs in with the domain account
 * inside the network (ERP, CAD, fileserver, switches, the database) stays on a password, the gap
 * a company like this still has, which the approval then lists.
 */
export const SECOND_FACTOR: readonly string[] = [
  "Microsoft 365 Exchange Online",
  "Microsoft Entra ID",
  "Microsoft Teams",
  "Microsoft 365 Apps",
  "Microsoft Intune",
  "Microsoft Defender for Business",
  "Microsoft Defender for Office 365",
  "Servicepostfach service@ in Microsoft 365",
  "SharePoint Online",
  "Sophos VPN",
  "Sophos Firewall XGS",
  "Veeam Backup & Replication auf Synology-NAS",
  "TeamViewer Tensor",
  "Cloud-Telefonanlage (NFON)",
  "DATEV LODAS",
  "DATEV Kanzlei-Rechnungswesen",
  "DATEV Unternehmen online",
  "ELSTER mit Organisationszertifikat",
  "Firmenkundenportal der Hausbank",
  "Bitwarden (nur IT)",
  "NinjaOne RMM des Systemhauses",
  `Domain ${DOMAIN}`,
  "LinkedIn-Unternehmensseite",
  "Fernwartungszugang für Dienstleister",
];

/** 4.2: processes that must keep running, by catalogue id, with how they do without IT. */
export const KEEP_RUNNING: Readonly<Record<string, string>> = {
  "bp-production-service":
    "Fertigung läuft zwei Tage mit ausgedruckten Fertigungsaufträgen, Zeichnungen und Stücklisten weiter; die CNC-Programme liegen auf den Maschinen",
  "bp-sales-cs":
    "Störmeldungen über die Rufbereitschaft am Diensthandy, Aufträge auf Papier",
  "bp-logistics": "Lieferscheine von Hand nach der Versandliste vom Vortag",
  "bp-maintenance":
    "Service beim Kunden mit ausgedruckten Wartungsplänen und den Diensthandys",
};

/** 4.4: per backup system, how often it backs up and the last restore that worked. */
export const BACKUPS: Readonly<Record<string, { frequency: string; restored: string }>> =
  {
    "Veeam Backup & Replication auf Synology-NAS": {
      frequency: "täglich",
      restored: "2026-09-18",
    },
  };

/** Answers for the walk's form fields, by intake field key. The incident lead stays the walker. */
export const FIELDS: Readonly<Record<string, string | boolean>> = {
  mukAccountId: "1004718263",
  bsiRegistrationDate: "2026-02-26",
  itEmergencyNumber: "0151 000 040 00 (Diensthandy IT-Leitung)",
  secureCommsChannel: "Anrufe auf die Handynummern; Telefonliste auf Papier",
  incidentEscalationContacts:
    "Geschäftsführung: Claudia Lohse, 0151 000 011 00; IT-Dienstleister: IT-Service Diekmann, Hotline 0541 000 990; Datenschutzbeauftragter (extern): 0541 000 770",
  bsiReportingRegistered: true,
  secureCommsTools:
    "Microsoft Teams im Alltag; Signal-Gruppe auf den Diensthandys für den Notfall",
  vulnerabilityDisclosureUrl: `security@${DOMAIN}`,
};

/** The clauses added to each document the walk writes, by item, and the company's own words. */
export const POLICIES: Readonly<
  Record<string, { clauses: readonly string[]; own?: string }>
> = {
  "3.1": {
    clauses: ["IT-Notfallkarte"],
    own: "Störungen an Anlagen bei Kunden meldet die Rufbereitschaft des Service über das Servicemodul, nicht über diesen Plan.",
  },
  "2.4": { clauses: ["Schulungen"] },
  "9.1": { clauses: ["Laptops"] },
  "10.1": { clauses: ["Vertretung"] },
  "6.3": { clauses: ["Fernwartung"] },
  "4.2": { clauses: ["Gedruckte Fassung"] },
};

export interface TrainingLine {
  readonly who: string;
  /** The form's second answer: the provider for management, the topic for staff. */
  readonly what: string;
  readonly provider?: string;
  readonly date: string;
}

/** 1.1: the managing directors' NIS 2 training (§ 38 Abs. 3 BSIG), and who gave it. */
export const MANAGEMENT_TRAININGS: readonly TrainingLine[] = [
  {
    who: "Claudia Lohse (Geschäftsführerin)",
    what: "Onlinekurs der Weiterbildung Nordwest GmbH",
    date: "2026-03-12",
  },
  {
    who: "Thomas Kemper (Geschäftsführer)",
    what: "Onlinekurs der Weiterbildung Nordwest GmbH",
    date: "2026-03-12",
  },
];

/** 8.2: sessions for the staff. */
export const STAFF_TRAININGS: readonly TrainingLine[] = [
  {
    who: "Alle Beschäftigten der Verwaltung (46 Personen)",
    what: "Phishing erkennen und melden",
    provider: SYSTEMHAUS,
    date: "2026-02-24",
  },
  {
    who: "Schichtführer Fertigung und Lager (12 Personen)",
    what: "USB-Sticks, Hallen-PCs und Fernwartung an den Anlagen",
    provider: "IT-Leitung",
    date: "2026-05-06",
  },
];

/** 7.3: the management review held today, before management approves. */
export const REVIEW = {
  attendees: "Claudia Lohse, Thomas Kemper, Markus Reinholt",
  decisions:
    "Leitlinie, Notfallplan und Konzepte aus dem Durchgang freigegeben. Zweiter Faktor für proALPHA bis 31.03.2027. Protokoll der Fernwartungssitzungen bis Ende 2026. Notfallübung nach dem Notfallplan im Frühjahr 2027.",
} as const;

/**
 * The asset register form's own fields. Hostnames, addresses, versions and encryption are on no
 * form: no binding text asks for them per asset (NIS2 reviews/legal/2026-10-03-asset-description.md).
 */
type AssetDetails = Partial<
  Pick<
    typeof asset.$inferInsert,
    "description" | "owner" | "location" | "processesPersonalData" | "quantity" | "isOT"
  >
>;

/**
 * What the asset register holds beyond the walk, kept up on the register page before management
 * approves: what each process and room is, who owns what, where it stands, how many there are,
 * which are machine controls. By the asset's name.
 */
export const ASSET_DETAILS: Readonly<Record<string, AssetDetails>> = {
  "Vertrieb und Kundenservice": {
    description:
      "Angebote, Aufträge und Störmeldungen von Kunden aus Industrie und Logistik",
    owner: "Leitung Vertrieb",
  },
  "Produktion oder Dienstleistungserbringung": {
    description:
      "Konstruktion, Fertigung und Montage von Förderanlagen nach Kundenauftrag",
    owner: "Werkleitung",
  },
  Beschaffung: {
    description: "Einkauf von Stahl, Antrieben und Zukaufteilen bei rund 140 Lieferanten",
    owner: "Einkauf",
  },
  "Personal- und Lohnverwaltung": {
    description:
      "Personalakten, Bewerbungen und die Lohnabrechnung über die Steuerkanzlei",
    owner: "Personalabteilung",
  },
  "Finanzen und Buchhaltung": {
    description: "Rechnungen, Zahlungsverkehr und Jahresabschluss mit der Steuerkanzlei",
    owner: "Kaufmännische Leitung",
  },
  "Marketing und externe Kommunikation": {
    description: "Website, Messen und Produktkataloge",
    owner: "Leitung Vertrieb",
  },
  "Logistik, Transport und Versand": {
    description: "Verladung und Versand der Anlagen, Aufträge an die Spedition",
    owner: "Versand",
  },
  "Lagerhaltung und Bestandsführung": {
    description: "Zukaufteile und Ersatzteile, Inventur zweimal im Jahr",
    owner: "Lager",
  },
  "Instandhaltung und Wartung": {
    description:
      "Wartung der ausgelieferten Anlagen beim Kunden und der eigenen Maschinen",
    owner: "Service",
  },
  Qualitätsmanagement: {
    description: "ISO 9001, Prüfprotokolle und Reklamationen",
    owner: "Qualitätssicherung",
  },
  "Forschung und Entwicklung": {
    description: "Neue Förderbandmodule und die Steuerungssoftware dafür",
    owner: "Leitung Konstruktion",
  },
  "IT-Betrieb": {
    description: "IT-Leitung im Haus, Betrieb und Bereitschaft mit dem Systemhaus",
    owner: "IT-Leitung",
  },
  Hauptbüro: {
    description: "Verwaltungsgebäude mit 46 Arbeitsplätzen",
    location: "Wallenhorst, Gebäude A",
  },
  "Serverraum (On-Premise)": {
    description: "Klimatisiert und abgeschlossen; Zutritt nur IT-Leitung und Systemhaus",
    location: "Gebäude A, Untergeschoss",
  },
  "Homeoffices der Mitarbeitenden": {
    description: "31 Beschäftigte arbeiten bis zu zwei Tage in der Woche zu Hause",
    location: "Verteilt",
  },
  "Produktionshalle oder Werkstatt": {
    description: "Halle 1 Montage, Halle 2 Schweißen, Laser und Lackierung",
    location: "Wallenhorst, Hallen 1 und 2",
  },
  "Lager- oder Logistikstandort": {
    description: "Lager und Versand am Werk",
    location: "Wallenhorst, Halle 3",
  },
  "Technikräume und Netzwerkschränke": {
    description: "Drei Netzwerkschränke in den Hallen, Rekorder der Kameras",
    location: "Hallen 1 bis 3",
  },
  "Archivraum (Papierakten)": {
    description: "Personal- und Buchhaltungsakten der letzten zehn Jahre",
    location: "Gebäude A, Untergeschoss",
  },
  "Hyper-V-Host 1 (Dell PowerEdge R650)": { owner: "IT-Leitung", location: "Serverraum" },
  "Hyper-V-Host 2 (Dell PowerEdge R650)": { owner: "IT-Leitung", location: "Serverraum" },
  "Active Directory mit zwei Domänencontrollern": {
    owner: "IT-Leitung",
    location: "Serverraum",
    processesPersonalData: true,
  },
  "Microsoft SQL Server für proALPHA": {
    owner: "IT-Leitung",
    location: "Serverraum",
    processesPersonalData: true,
  },
  "proALPHA ERP": { owner: "Kaufmännische Leitung", processesPersonalData: true },
  "Veeam Backup & Replication auf Synology-NAS": {
    owner: "IT-Leitung",
    location: "Technikraum Halle 1, anderer Brandabschnitt als der Serverraum",
  },
  "Sophos Firewall XGS": { owner: "IT-Leitung", location: "Serverraum" },
  "Microsoft 365 Exchange Online": { owner: "IT-Leitung", processesPersonalData: true },
  "DATEV LODAS": { owner: "Personalabteilung", processesPersonalData: true },
  "SolidWorks mit PDM": { owner: "Leitung Konstruktion" },
  "Siemens SIMATIC S7-1500 am Schweißroboter": {
    owner: "Werkleitung",
    location: "Halle 2",
    isOT: true,
  },
  "Siemens SIMATIC S7-1200 an der Laseranlage": {
    owner: "Werkleitung",
    location: "Halle 2",
    isOT: true,
  },
  "Steuerung der Pulverbeschichtungsanlage": {
    owner: "Werkleitung",
    location: "Halle 2",
    isOT: true,
  },
  "62 Notebooks mit Windows 11": { owner: "IT-Leitung", quantity: 62 },
  "21 Desktop-PCs, davon 9 CAD-Arbeitsplätze": { owner: "IT-Leitung", quantity: 21 },
  "38 Diensthandys": { owner: "IT-Leitung", quantity: 38 },
  "Acht Hallen-PCs an den Montageplätzen": { quantity: 8, location: "Hallen 1 und 2" },
  "Sechs Handscanner im Lager": { quantity: 6, location: "Halle 3" },
  "Acht Außenkameras am Werksgelände": { quantity: 8, location: "Werksgelände" },
  "Vier Multifunktionsgeräte (geleast)": { quantity: 4 },
  "Messrechner am Prüfstand für Förderbänder": { location: "Halle 1, Prüfstand" },
};

type SupplierDetails = Partial<
  Pick<
    typeof supplier.$inferInsert,
    | "description"
    | "serviceType"
    | "contactName"
    | "contactEmail"
    | "isCritical"
    | "hasAccessToSystems"
    | "hasAccessToData"
    | "hasSecurityCertification"
    | "securityCertificationType"
    | "contractStartDate"
    | "hasAuditRights"
    | "processesPersonalData"
    | "dpaAvailable"
  >
>;

/**
 * What the supplier register holds beyond the walk: the kind of service, who to call, access,
 * certificates and contracts, kept up on the register page before management approves. Between
 * them every kind of supplier a machine builder has. By the supplier's name.
 */
export const SUPPLIER_DETAILS: Readonly<Record<string, SupplierDetails>> = {
  [SYSTEMHAUS]: {
    description:
      "Betreut Server, Netzwerk und Arbeitsplätze, mit Fernwartung und Bereitschaft",
    serviceType: "IT-Dienstleister (Managed Services)",
    contactName: "Jens Diekmann",
    contactEmail: "support@diekmann-it.example",
    isCritical: true,
    hasAccessToSystems: true,
    hasAccessToData: true,
    contractStartDate: "2019-04-01",
    hasAuditRights: true,
    processesPersonalData: true,
    dpaAvailable: true,
  },
  [MICROSOFT]: {
    description:
      "Microsoft 365: E-Mail, Teams, SharePoint, Entra ID, Intune und Defender",
    serviceType: "Clouddienst (SaaS)",
    hasAccessToData: true,
    hasSecurityCertification: true,
    securityCertificationType: "ISO/IEC 27001, BSI C5",
    contractStartDate: "2021-01-01",
    processesPersonalData: true,
    dpaAvailable: true,
  },
  [PROALPHA]: {
    description: "Hersteller des ERP, Updates und Fernsupport auf Anfrage",
    serviceType: "Softwarehersteller",
    isCritical: true,
    hasAccessToSystems: true,
    hasAccessToData: true,
    contractStartDate: "2017-07-01",
    processesPersonalData: true,
    dpaAvailable: true,
  },
  [DATEV]: {
    description:
      "Lohn und Finanzbuchhaltung im DATEV-Rechenzentrum über die Steuerkanzlei",
    serviceType: "Rechenzentrum und Clouddienst",
    hasAccessToData: true,
    hasSecurityCertification: true,
    securityCertificationType: "ISO/IEC 27001",
    processesPersonalData: true,
    dpaAvailable: true,
  },
  [KANZLEI]: {
    description: "Lohnabrechnung, Finanzbuchhaltung und Jahresabschluss",
    serviceType: "Steuerberatung und Lohn",
    contactName: "Anke Wiebold",
    hasAccessToData: true,
    processesPersonalData: true,
    dpaAvailable: true,
  },
  [TELEKOM]: {
    description: "Glasfaseranschluss, LTE-Ersatzleitung und Mobilfunkverträge",
    serviceType: "Telekommunikation",
    isCritical: true,
    hasSecurityCertification: true,
    securityCertificationType: "ISO/IEC 27001",
  },
  [AUTOMATION]: {
    description: "Programmierung und Wartung der Steuerungen in Halle 2, mit Fernwartung",
    serviceType: "Wartung von Produktionsanlagen (OT)",
    contactName: "Frank Brune",
    isCritical: true,
    hasAccessToSystems: true,
    contractStartDate: "2022-03-01",
  },
  [BESCHICHTUNG]: {
    description: "Hersteller der Pulverbeschichtungsanlage, Wartung einmal im Jahr",
    serviceType: "Wartung von Produktionsanlagen (OT)",
    hasAccessToSystems: true,
  },
  [HETZNER]: {
    description: "Hosting der Website und der Domain",
    serviceType: "Hosting",
    hasSecurityCertification: true,
    securityCertificationType: "ISO/IEC 27001",
    dpaAvailable: true,
  },
  [AGENTUR]: {
    description: "Pflegt die Website und das Kontaktformular",
    serviceType: "Marketingagentur",
    hasAccessToSystems: true,
  },
  "NFON AG": {
    description: "Cloud-Telefonanlage",
    serviceType: "Telekommunikation (Cloud)",
    processesPersonalData: true,
    dpaAvailable: true,
  },
  "TeamViewer Germany GmbH": {
    description: "Fernwartungssoftware",
    serviceType: "Softwarehersteller (SaaS)",
    hasSecurityCertification: true,
    securityCertificationType: "ISO/IEC 27001",
  },
  "Tempora Zeitsysteme GmbH": {
    description: "Zeiterfassungsterminals und Software, Wartung per Fernzugriff",
    serviceType: "Softwarehersteller",
    hasAccessToData: true,
    processesPersonalData: true,
  },
  "Bitwarden Inc.": {
    description: "Passwortmanager der IT",
    serviceType: "Clouddienst (SaaS)",
    hasSecurityCertification: true,
    securityCertificationType: "SOC 2 Typ II",
  },
  "Dassault Systèmes Deutschland GmbH": {
    description: "Hersteller von SolidWorks",
    serviceType: "Softwarehersteller",
  },
  "CAD-Systemhaus Rehme GmbH": {
    description: "Lizenzen, Schulung und Support für SolidWorks",
    serviceType: "IT-Dienstleister (Fachhandel)",
    hasAccessToSystems: true,
  },
  "NinjaOne LLC": {
    description: "Werkzeug, mit dem das Systemhaus Updates verteilt und überwacht",
    serviceType: "Clouddienst (SaaS)",
  },
  [SICHERHEIT]: {
    description: "Kameras und Zutrittskontrolle, Wartung zweimal im Jahr",
    serviceType: "Sicherheitstechnik",
    hasAccessToSystems: true,
  },
  [ELEKTRO]: {
    description: "Wartung von USV, Elektroverteilung und Gebäudeleittechnik",
    serviceType: "Elektrotechnik und Gebäudetechnik",
    hasAccessToSystems: true,
  },
  "Bürotechnik Osnabrücker Land GmbH": {
    description: "Leasing und Wartung der Multifunktionsgeräte",
    serviceType: "Bürotechnik",
  },
  "Reinigungsdienst Glanzwerk GmbH": { serviceType: "Gebäudereinigung" },
  "Aktenvernichtung Nordwest GmbH": {
    serviceType: "Entsorgung und Aktenvernichtung",
    processesPersonalData: true,
    dpaAvailable: true,
  },
  "Spedition Brinker GmbH": { serviceType: "Logistik" },
};
