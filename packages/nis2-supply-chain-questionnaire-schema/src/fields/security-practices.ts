// Source of truth for the supplier questionnaire fields in this section.
// Edit this file (not data/supply-chain-questionnaire.json) and run
// `bun run build:json` to regenerate the published JSON artefact.
//
// Descriptions are Mittelstand-readable plain language with a "tick yes if"
// threshold and concrete examples. Legal citations live in `legalBasis` so
// audit teams still see the source, and in `legalBasisLocalised` the way a
// Czech reader cites them. A field whose English or German text changes
// carries those two and Czech (a test checks Czech) until the other locales
// are translated again.
//
// Order: what every supplier is asked, then what depends on what it reaches
// at its customers (./gates.ts), narrowest last.

import type { SupplierField } from "../schema";
import {
  ACCESSES_PREMISES,
  ACCESSES_SYSTEMS,
  BUILDS_SOFTWARE,
  PROCESSES_DATA,
  REACHES_CUSTOMER,
  REACHES_DIGITAL,
  RUNS_IT,
} from "./gates";

export const securityPracticesFields: SupplierField[] = [
  {
    id: "staffSecurityTraining",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "Staff who work for customers are instructed in security when they start and at regular intervals",
      de: "Mitarbeitende, die für Kunden arbeiten, werden zu Beginn und danach regelmäßig in Sicherheit unterwiesen",
      cs: "Pracovníci, kteří pracují pro zákazníky, jsou poučeni o bezpečnosti při nástupu a poté v pravidelných intervalech",
    },
    description: {
      en: "Tick yes if everyone who works for customers learns the security rules that apply to them when they start, and again at regular intervals, for example in a short briefing, an e-learning course or written rules they sign.",
      de: "Ja, wenn alle, die für Kunden arbeiten, die für sie geltenden Sicherheitsregeln zu Beginn und danach regelmäßig vermittelt bekommen, etwa in einer kurzen Unterweisung, einem E-Learning oder schriftlichen Regeln, die sie unterschreiben.",
      cs: "Ano, pokud se všichni, kdo pracují pro zákazníky, seznámí s bezpečnostními pravidly, která pro ně platí, při nástupu a poté znovu v pravidelných intervalech, například na krátkém poučení, v e-learningovém kurzu nebo z písemných pravidel, která podepíší.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(b)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.4 písm. b)",
    },
    iso27001: ["A.6.3"],
    required: true,
  },
  {
    id: "acceptRightToAudit",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We accept audits by customers or provide audit reports",
      de: "Wir akzeptieren Audits durch Kunden oder stellen Prüfberichte bereit",
      cs: "Umožňujeme zákazníkům audit nebo jim poskytujeme zprávy z auditu",
    },
    description: {
      en: "Tick yes if you either let customers audit you or give them audit reports instead (for example SOC 2, ISAE 3402).",
      de: "Ja, wenn Sie Kunden entweder ein Auditrecht einräumen oder ihnen stattdessen Prüfberichte (zum Beispiel SOC 2, ISAE 3402) zur Verfügung stellen.",
      cs: "Ano, pokud zákazníkům buď umožníte audit, nebo jim místo toho poskytnete zprávy z auditu (například SOC 2, ISAE 3402).",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(e)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.4 písm. e)",
    },
    iso27001: ["A.5.20", "A.5.22"],
    required: true,
  },
  {
    id: "hasSubprocessors",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We use subcontractors to deliver our service",
      de: "Wir setzen für unsere Leistung Unterauftragnehmer ein",
      cs: "K poskytování služby využíváme subdodavatele",
    },
    description: {
      en: "Tick yes if other companies help you deliver your service and in doing so reach customer data, systems or premises. Examples: a cloud host such as AWS or Azure, a payment provider, or a subcontracted crew that works on site.",
      de: "Ja, wenn andere Unternehmen an Ihrer Leistung mitwirken und dabei an Daten, Systeme oder Räume Ihrer Kunden gelangen. Beispiele: ein Cloudanbieter wie AWS oder Azure, ein Zahlungsdienst oder ein beauftragtes Team, das vor Ort arbeitet.",
      cs: "Ano, pokud se na vaší službě podílejí jiné firmy a dostanou se přitom k datům, systémům nebo prostorám vašich zákazníků. Příklady: poskytovatel cloudu jako AWS nebo Azure, platební služba nebo najatý tým, který pracuje na místě.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(g)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.4 písm. g)",
    },
    iso27001: ["A.5.20", "A.5.21"],
    required: true,
  },
  {
    id: "subprocessorList",
    section: "security_practices",
    type: "text",
    label: {
      en: "List of subcontractors",
      de: "Liste der Unterauftragnehmer",
      cs: "Seznam subdodavatelů",
    },
    description: {
      en: "Every subcontractor with name, location and what they do for you. One per line is enough. Update it whenever you add or remove one.",
      de: "Alle Unterauftragnehmer mit Name, Ort und Aufgabe. Eine Zeile pro Unterauftragnehmer genügt. Aktualisieren Sie die Liste, wenn Sie einen hinzufügen oder entfernen.",
      cs: "Všichni subdodavatelé s názvem, místem a tím, co pro vás dělají. Stačí jeden na řádek. Seznam aktualizujte, kdykoli některého přidáte nebo odeberete.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(g)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.4 písm. g)",
    },
    iso27001: ["A.5.20", "A.5.21"],
    required: false,
    visibleWhen: { field: "hasSubprocessors", equals: true },
  },
  {
    id: "subprocessorRequirementsPassedOn",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We bind subcontractors to comparable security requirements",
      de: "Wir verpflichten Unterauftragnehmer auf vergleichbare Sicherheitsanforderungen",
      cs: "Subdodavatele zavazujeme ke srovnatelným bezpečnostním požadavkům",
    },
    description: {
      en: "Tick yes if your contracts with subcontractors contain security requirements that match what your customers ask of you, for example on incidents, access and data handling.",
      de: "Ja, wenn Ihre Verträge mit Unterauftragnehmern Sicherheitsanforderungen enthalten, die dem entsprechen, was Ihre Kunden von Ihnen verlangen, etwa zu Vorfällen, Zugängen und dem Umgang mit Daten.",
      cs: "Ano, pokud vaše smlouvy se subdodavateli obsahují bezpečnostní požadavky, které odpovídají tomu, co po vás požadují vaši zákazníci, například k incidentům, přístupům a zacházení s daty.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(g)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.4 písm. g)",
    },
    iso27001: ["A.5.20", "A.5.21"],
    required: true,
    visibleWhen: { field: "hasSubprocessors", equals: true },
  },
  {
    id: "notifyMaterialChanges",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We inform customers of material changes, including where their data is processed",
      de: "Wir informieren Kunden über wesentliche Änderungen, auch der Verarbeitungsorte",
      cs: "Informujeme zákazníky o podstatných změnách, včetně míst, kde se zpracovávají jejich data",
    },
    description: {
      en: "Tick yes if you tell customers before anything material changes in how you deliver: a takeover, a new subcontractor, another hosting provider, or a new country where their data is processed.",
      de: "Ja, wenn Sie Kunden vorab informieren, bevor sich an Ihrer Leistung etwas Wesentliches ändert: eine Übernahme, ein neuer Unterauftragnehmer, ein anderer Hoster oder ein neues Land, in dem ihre Daten verarbeitet werden.",
      cs: "Ano, pokud zákazníky informujete předem, než se na vaší službě změní něco podstatného: převzetí vaší firmy, nový subdodavatel, jiný poskytovatel hostingu nebo nová země, kde se zpracovávají jejich data.",
    },
    legalBasis: "ENISA TIG §5.1.4",
    legalBasisLocalised: {
      cs: "ENISA TIG, oddíl 5.1.4",
    },
    iso27001: ["A.5.22"],
    required: true,
  },
  {
    id: "pastBreachesDisclosed",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "On request, we tell customers about security incidents that affected customers",
      de: "Auf Anfrage informieren wir Kunden über Sicherheitsvorfälle, die Kunden betrafen",
      cs: "Na požádání informujeme zákazníky o bezpečnostních incidentech, které zasáhly zákazníky",
    },
    description: {
      en: "Tick yes if, when a customer asks, you say openly whether and which security incidents affecting customers you had in the past.",
      de: "Ja, wenn Sie auf Anfrage eines Kunden offen sagen, ob und welche Sicherheitsvorfälle mit Auswirkung auf Kunden es bei Ihnen gab.",
      cs: "Ano, pokud na dotaz zákazníka otevřeně řeknete, zda a jaké bezpečnostní incidenty s dopadem na zákazníky jste v minulosti měli.",
    },
    legalBasis: "ENISA TIG §5.1.2",
    legalBasisLocalised: {
      cs: "ENISA TIG, oddíl 5.1.2",
    },
    iso27001: ["A.5.22"],
    required: true,
  },
  {
    id: "cooperateWithAuthorities",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We give customers the information their authority asks for",
      de: "Wir liefern Kunden die Angaben, die ihre Behörde verlangt",
      cs: "Poskytujeme zákazníkům údaje, které po nich požaduje jejich úřad",
    },
    description: {
      en: "Tick yes if you give your customers the information their supervisory authority asks for after an incident or during an audit. Unless you are an essential or important entity under NIS 2 yourself, you owe that authority nothing directly; the duty is your customer's, and you help them meet it.",
      de: "Ja, wenn Sie Ihren Kunden die Angaben liefern, die deren Aufsichtsbehörde nach einem Vorfall oder bei einer Prüfung verlangt. Sofern Sie nicht selbst eine wesentliche oder wichtige Einrichtung unter NIS 2 sind, sind Sie dieser Behörde nicht selbst verpflichtet; die Pflicht hat Ihr Kunde, und Sie helfen ihm, sie zu erfüllen.",
      cs: "Ano, pokud svým zákazníkům poskytnete údaje, které po nich jejich dozorový úřad (v Česku NÚKIB) požaduje po incidentu nebo při kontrole. Pokud sami nejste základním nebo důležitým subjektem podle NIS 2 (v Česku poskytovatelem regulované služby podle zákona č. 264/2025 Sb.), nemáte vůči tomuto úřadu přímé povinnosti; povinnost má váš zákazník a vy mu pomáháte ji splnit.",
    },
    legalBasis: "ENISA TIG §5.1.4",
    legalBasisLocalised: {
      cs: "ENISA TIG, oddíl 5.1.4",
    },
    iso27001: ["A.5.20", "A.5.31"],
    required: true,
  },
  {
    id: "confidentialityCommitted",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "Everyone who works for our customers is bound to confidentiality",
      de: "Alle, die für unsere Kunden arbeiten, sind zur Verschwiegenheit verpflichtet",
      cs: "Všichni, kdo pracují pro naše zákazníky, jsou vázáni mlčenlivostí",
    },
    description: {
      en: "Tick yes if everyone who works for customers has signed a confidentiality commitment, in the employment contract or a separate agreement, or is bound by professional secrecy by law.",
      de: "Ja, wenn alle, die für Kunden arbeiten, sich im Arbeitsvertrag oder separat schriftlich zur Verschwiegenheit verpflichtet haben oder gesetzlich zur Verschwiegenheit verpflichtet sind.",
      cs: "Ano, pokud se všichni, kdo pracují pro zákazníky, písemně zavázali k mlčenlivosti, v pracovní smlouvě nebo v samostatné dohodě, nebo je k mlčenlivosti zavazuje zákon.",
    },
    legalBasis: "ENISA TIG §5.1 TIPS; CIR 2024/2690 §10.3.2",
    legalBasisLocalised: {
      cs: "ENISA TIG, oddíl 5.1, tipy; prováděcí nařízení (EU) 2024/2690, příloha, bod 10.3.2",
    },
    iso27001: ["A.6.6"],
    required: true,
    visibleWhen: REACHES_CUSTOMER,
  },
  {
    id: "backgroundChecks",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We check that staff who get access at customers are suitable",
      de: "Wir prüfen die Eignung von Mitarbeitenden, die Zugang bei Kunden erhalten",
      cs: "Ověřujeme, že pracovníci, kteří získají přístup u zákazníků, jsou pro to vhodní",
    },
    description: {
      en: "Tick yes if, before they start, you check that people who will have access to customer data, systems or premises (key holders, for example) are suitable for that role, as far as employment and data protection law allow: references, for example, or a criminal record certificate where lawful and needed for the role. Checking every member of staff is not expected.",
      de: "Ja, wenn Sie vor dem Einsatz prüfen, ob Mitarbeitende mit Zugang zu Daten, Systemen oder Räumen von Kunden (etwa Schlüsselinhaber) für diese Rolle geeignet sind, soweit Arbeitsrecht und Datenschutz es erlauben: etwa Referenzen oder, wo zulässig und für die Rolle nötig, ein Führungszeugnis. Eine Prüfung aller Mitarbeitenden wird nicht erwartet.",
      cs: "Ano, pokud před nástupem ověřujete, že lidé, kteří budou mít přístup k datům, systémům nebo prostorám zákazníků (například držitelé klíčů), jsou pro tuto roli vhodní, v rozsahu, který dovoluje pracovní právo a ochrana osobních údajů: například reference nebo, kde je to přípustné a pro roli nutné, výpis z rejstříku trestů. Ověřování všech pracovníků se neočekává.",
    },
    legalBasis: "CIR 2024/2690 §10.2.1",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 10.2.1",
    },
    iso27001: ["A.6.1"],
    required: true,
    visibleWhen: REACHES_CUSTOMER,
  },
  {
    id: "dataReturnOnTermination",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "At contract end we hand back or destroy what we hold of the customer",
      de: "Bei Vertragsende geben wir zurück oder vernichten, was wir vom Kunden haben",
      cs: "Na konci smlouvy vrátíme nebo zničíme vše, co od zákazníka máme",
    },
    description: {
      en: "Tick yes if your contract commits you to hand back the customer's data in a usable, documented format (for example CSV or JSON) and then delete it, return keys, badges and documents, and close accounts you had with them.",
      de: "Ja, wenn Ihr Vertrag Sie verpflichtet, die Daten des Kunden in einem nutzbaren, beschriebenen Format (etwa CSV oder JSON) zurückzugeben und dann zu löschen, Schlüssel, Ausweise und Unterlagen zurückzugeben und Zugänge beim Kunden zu schließen.",
      cs: "Ano, pokud vás smlouva zavazuje vrátit data zákazníka v použitelném, popsaném formátu (například CSV nebo JSON) a poté je smazat, vrátit klíče, přístupové karty a dokumenty a zrušit přístupy, které jste u zákazníka měli.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(h); §5.1.2(d)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.4 písm. h); bod 5.1.2 písm. d)",
    },
    iso27001: ["A.5.11", "A.8.10"],
    required: true,
    visibleWhen: REACHES_CUSTOMER,
  },
  {
    id: "dataProcessingAgreement",
    section: "security_practices",
    type: "enum",
    options: [
      {
        value: "available",
        label: {
          en: "Yes, we offer a standard DPA",
          de: "Ja, wir bieten einen Mustervertrag an",
          cs: "Ano, nabízíme vzorovou smlouvu o zpracování osobních údajů",
        },
      },
      {
        value: "independentController",
        label: {
          en: "Not needed: we are an independent controller (for example a tax adviser)",
          de: "Nicht nötig: Wir sind selbst Verantwortlicher (zum Beispiel Steuerberater)",
          cs: "Není potřeba: jsme samostatný správce, ne zpracovatel",
        },
      },
      {
        value: "noPersonalData",
        label: {
          en: "Not needed: we process no personal data for customers",
          de: "Nicht nötig: Wir verarbeiten für Kunden keine personenbezogenen Daten",
          cs: "Není potřeba: pro zákazníky nezpracováváme žádné osobní údaje",
        },
      },
      {
        value: "no",
        label: { en: "No", de: "Nein", cs: "Ne" },
      },
    ],
    label: {
      en: "Data processing agreement (Art. 28 GDPR)",
      de: "Vertrag zur Auftragsverarbeitung (Art. 28 DSGVO)",
      cs: "Smlouva o zpracování osobních údajů (čl. 28 GDPR)",
    },
    description: {
      en: "Needed when you process personal data on a customer's behalf and on their instructions (Art. 28(3) GDPR). Some professions are controllers by law and sign none, in Germany tax advisers (§ 11(2) StBerG).",
      de: "Nötig, wenn Sie personenbezogene Daten im Auftrag und nach Weisung eines Kunden verarbeiten (Art. 28 Abs. 3 DSGVO). Manche Berufe sind von Gesetzes wegen selbst Verantwortliche und schließen keinen ab, in Deutschland etwa Steuerberater (§ 11 Abs. 2 StBerG).",
      cs: "Potřebná, pokud zpracováváte osobní údaje jménem zákazníka a podle jeho pokynů (čl. 28 odst. 3 GDPR). Kdo sám určuje účely a prostředky zpracování, je správce a tuto smlouvu jako zpracovatel neuzavírá. Správce může určit i přímo právní předpis (čl. 4 bod 7 GDPR).",
    },
    legalBasis: "GDPR Art. 28(3); Art. 4(7)",
    legalBasisLocalised: {
      cs: "obecné nařízení o ochraně osobních údajů (GDPR), čl. 28 odst. 3; čl. 4 bod 7",
    },
    iso27001: ["A.5.34"],
    required: true,
    visibleWhen: PROCESSES_DATA,
  },
  {
    id: "encryptionAtRest",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "Customer data we hold electronically is encrypted",
      de: "Kundendaten, die wir elektronisch speichern, sind verschlüsselt",
      cs: "Data zákazníků, která uchováváme elektronicky, jsou šifrovaná",
    },
    description: {
      en: "Tick yes if customer data is encrypted wherever you store it electronically: on servers, laptops, phones and backups, for example with BitLocker, FileVault or your cloud provider's disk encryption.",
      de: "Ja, wenn Kundendaten überall verschlüsselt sind, wo Sie sie elektronisch speichern: auf Servern, Laptops, Telefonen und Sicherungen, etwa mit BitLocker, FileVault oder der Festplattenverschlüsselung Ihres Cloudanbieters.",
      cs: "Ano, pokud jsou data zákazníků šifrovaná všude, kde je elektronicky ukládáte: na serverech, noteboocích, telefonech a v zálohách, například pomocí BitLockeru, FileVaultu nebo šifrování disků u vašeho poskytovatele cloudu.",
    },
    legalBasis: "CIR 2024/2690 §5.1.2(c); §9.2(a)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.2 písm. c); bod 9.2 písm. a)",
    },
    iso27001: ["A.8.24"],
    required: true,
    visibleWhen: PROCESSES_DATA,
  },
  {
    id: "encryptionInTransit",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "Customer data we send is encrypted in transit",
      de: "Kundendaten, die wir übertragen, sind verschlüsselt",
      cs: "Data zákazníků, která přenášíme, jsou při přenosu šifrovaná",
    },
    description: {
      en: "Tick yes if your websites and interfaces use HTTPS with TLS 1.2 or higher, and files go to customers through an encrypted portal or encrypted email.",
      de: "Ja, wenn Ihre Webseiten und Schnittstellen HTTPS mit TLS 1.2 oder höher nutzen und Dateien über ein verschlüsseltes Portal oder verschlüsselte E-Mail an Kunden gehen.",
      cs: "Ano, pokud vaše webové stránky a rozhraní používají HTTPS s TLS 1.2 nebo vyšším a soubory zákazníkům posíláte přes šifrovaný portál nebo šifrovaným e-mailem.",
    },
    legalBasis: "CIR 2024/2690 §5.1.2(c); §9.2(a)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.2 písm. c); bod 9.2 písm. a)",
    },
    iso27001: ["A.8.24"],
    required: true,
    visibleWhen: PROCESSES_DATA,
  },
  {
    id: "hasIsms",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We run a documented information security management system (ISMS)",
      de: "Wir betreiben ein dokumentiertes Informationssicherheitsmanagementsystem (ISMS)",
      cs: "Provozujeme zdokumentovaný systém řízení bezpečnosti informací (ISMS)",
    },
    description: {
      en: "Tick yes if you have a written information security policy with assigned roles, regular reviews and documented incident handling. ISO/IEC 27001 certification, also on the basis of IT-Grundschutz, implies yes.",
      de: "Ja, wenn Sie eine schriftliche Richtlinie zur Informationssicherheit haben, klar zugewiesene Rollen, regelmäßige Überprüfungen und einen dokumentierten Umgang mit Vorfällen. Eine Zertifizierung nach ISO/IEC 27001, auch auf Basis von IT-Grundschutz, bedeutet Ja.",
      cs: "Ano, pokud máte písemnou politiku bezpečnosti informací, jasně přidělené role, pravidelné přezkumy a zdokumentovaný postup při incidentech. Certifikace podle ISO/IEC 27001, i na základě německé metodiky IT-Grundschutz, znamená ano.",
    },
    legalBasis: "CIR 2024/2690 §5.1.2(a)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.2 písm. a)",
    },
    iso27001: ["A.5.1"],
    required: true,
    visibleWhen: REACHES_DIGITAL,
  },
  {
    id: "hasIso27001OrEquivalent",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We hold a current security certificate or audit report that covers the service we deliver to customers",
      de: "Wir haben ein gültiges Sicherheitszertifikat oder einen Prüfbericht, der die Leistung für unsere Kunden abdeckt",
      cs: "Máme platný bezpečnostní certifikát nebo zprávu z auditu, které pokrývají službu, jež dodáváme zákazníkům",
    },
    description: {
      en: "Counts: ISO/IEC 27001 (also on the basis of IT-Grundschutz), a BSI C5 attestation, a TISAX label, a SOC 2 Type II or ISAE 3402 report, or a European cybersecurity certificate. Tick yes only if its scope covers the service you deliver to customers.",
      de: "Es zählen: ISO/IEC 27001 (auch auf Basis von IT-Grundschutz), ein Testat nach BSI C5, ein Label nach TISAX, ein Bericht nach SOC 2 Typ II oder ISAE 3402 oder ein europäisches Cybersicherheitszertifikat. Ja nur, wenn der Geltungsbereich die Leistung für Ihre Kunden abdeckt.",
      cs: "Počítá se: ISO/IEC 27001 (i na základě německé metodiky IT-Grundschutz), atestace podle katalogu C5 německého úřadu BSI, označení TISAX, zpráva SOC 2 Type II nebo ISAE 3402 nebo evropský certifikát kybernetické bezpečnosti. Ano jen tehdy, pokud jeho rozsah pokrývá službu, kterou dodáváte zákazníkům.",
    },
    legalBasis: "CIR 2024/2690 §5.1.2(a); ENISA TIG §5.1.2",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.2 písm. a); ENISA TIG, oddíl 5.1.2",
    },
    iso27001: ["A.5.19", "A.5.22"],
    required: true,
    visibleWhen: REACHES_DIGITAL,
  },
  {
    id: "certificationDetails",
    section: "security_practices",
    type: "text",
    label: {
      en: "Certificate or report: standard, issuer, valid until, scope",
      de: "Zertifikat oder Bericht: Standard, ausstellende Stelle, gültig bis, Geltungsbereich",
      cs: "Certifikát nebo zpráva: norma, vydavatel, platnost do, rozsah",
    },
    description: {
      en: "Copy the scope as it is printed on the certificate or report. Several? One per line.",
      de: "Übernehmen Sie den Geltungsbereich so, wie er auf dem Zertifikat oder Bericht steht. Mehrere? Eines pro Zeile.",
      cs: "Rozsah opište tak, jak je uveden na certifikátu nebo ve zprávě. Máte jich více? Každý na samostatný řádek.",
    },
    legalBasis: "CIR 2024/2690 §5.1.2(a); ENISA TIG §5.1.2",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.2 písm. a); ENISA TIG, oddíl 5.1.2",
    },
    iso27001: ["A.5.22"],
    required: true,
    visibleWhen: { field: "hasIso27001OrEquivalent", equals: true },
  },
  {
    id: "vulnerabilityHandling",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We install security updates promptly and follow up known vulnerabilities",
      de: "Wir spielen Sicherheitsupdates zeitnah ein und gehen bekannten Schwachstellen nach",
      cs: "Bezpečnostní aktualizace instalujeme včas a známé zranitelnosti řešíme",
    },
    description: {
      en: "Tick yes if you have a set routine for security holes in the systems and software you use for customers: you learn about them, judge how urgent they are, and install the update or take another measure in time.",
      de: "Ja, wenn Sie für Sicherheitslücken in den Systemen und Programmen, die Sie für Kunden nutzen, ein festes Vorgehen haben: Sie erfahren davon, schätzen die Dringlichkeit ein und spielen das Update rechtzeitig ein oder ergreifen eine andere Maßnahme.",
      cs: "Ano, pokud máte pro zranitelnosti v systémech a softwaru, které pro zákazníky používáte, pevně stanovený postup: dozvíte se o nich, posoudíte jejich naléhavost a včas nainstalujete aktualizaci nebo přijmete jiné opatření.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(f)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.4 písm. f)",
    },
    iso27001: ["A.8.8"],
    required: true,
    visibleWhen: REACHES_DIGITAL,
  },
  {
    id: "hasIncidentResponsePlan",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We have a written plan for security incidents",
      de: "Wir haben einen schriftlichen Plan für Sicherheitsvorfälle",
      cs: "Máme písemný plán pro bezpečnostní incidenty",
    },
    description: {
      en: "Tick yes if a written plan sets out how you handle a security incident: who decides, who informs customers and who documents.",
      de: "Ja, wenn ein schriftlicher Plan festlegt, wie Sie mit einem Sicherheitsvorfall umgehen: wer entscheidet, wer die Kunden informiert und wer dokumentiert.",
      cs: "Ano, pokud písemný plán stanoví, jak postupujete při bezpečnostním incidentu: kdo rozhoduje, kdo informuje zákazníky a kdo vše dokumentuje.",
    },
    legalBasis: "CIR 2024/2690 §5.1.2(a); §3.1",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.2 písm. a); bod 3.1",
    },
    iso27001: ["A.5.24", "A.5.26"],
    required: true,
    visibleWhen: REACHES_DIGITAL,
  },
  {
    id: "hasBusinessContinuityPlan",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We have a written plan for outages, including backups",
      de: "Wir haben einen schriftlichen Plan für Ausfälle, einschließlich Sicherungen",
      cs: "Máme písemný plán pro výpadky, včetně záloh",
    },
    description: {
      en: "Tick yes if a written plan says how you keep working or restart after an outage, including backups of the data you hold for customers, kept apart from the live systems and test-restored. It names your critical systems, the fallback, and how long an outage may last and how much data may be lost at most.",
      de: "Ja, wenn ein schriftlicher Plan festlegt, wie Sie nach einem Ausfall weiterarbeiten oder wieder anlaufen, einschließlich Sicherungen der Daten, die Sie für Kunden halten, getrennt von den laufenden Systemen und probeweise zurückgespielt. Er nennt die wichtigen Systeme, den Ersatzweg und wie lange ein Ausfall höchstens dauern und wie viele Daten höchstens verloren gehen dürfen.",
      cs: "Ano, pokud písemný plán stanoví, jak po výpadku pokračujete v práci nebo znovu spustíte provoz, včetně záloh dat, která pro zákazníky uchováváte, uložených odděleně od provozních systémů a ověřených zkušební obnovou. Plán uvádí vaše kritické systémy, náhradní postup a jak dlouho smí výpadek nejvýše trvat a kolik dat se smí nejvýše ztratit.",
    },
    legalBasis: "CIR 2024/2690 §5.1.2(c); §4.1; §4.2",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.2 písm. c); bod 4.1; bod 4.2",
    },
    iso27001: ["A.5.29", "A.5.30", "A.8.13"],
    required: true,
    visibleWhen: REACHES_DIGITAL,
  },
  {
    id: "mfaEnforcedInternal",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "All internal administrator accounts are protected with a second factor",
      de: "Alle internen Administratorkonten sind mit einem zweiten Faktor geschützt",
      cs: "Všechny interní administrátorské účty jsou chráněny druhým faktorem",
    },
    description: {
      en: "Tick yes if every account with administrator rights in your own systems (email, cloud, servers, accounting) needs a second factor to sign in, such as an authenticator app or a security key. Codes by SMS count but are the weakest option.",
      de: "Ja, wenn jedes Konto mit Administratorrechten in Ihren eigenen Systemen (E-Mail, Cloud, Server, Buchhaltung) zur Anmeldung einen zweiten Faktor braucht, etwa eine App oder einen Sicherheitsschlüssel. Codes per SMS zählen, sind aber die schwächste Variante.",
      cs: "Ano, pokud každý účet s administrátorskými právy ve vašich vlastních systémech (e-mail, cloud, servery, účetnictví) vyžaduje k přihlášení druhý faktor, například ověřovací aplikaci nebo bezpečnostní klíč. Kódy přes SMS se počítají, ale jsou nejslabší možností.",
    },
    legalBasis: "CIR 2024/2690 §5.1.2(a); §11.7",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.2 písm. a); bod 11.7",
    },
    iso27001: ["A.8.5", "A.8.2"],
    required: true,
    visibleWhen: REACHES_DIGITAL,
  },
  {
    id: "hasPenetrationTestingProgram",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "The systems we use to serve customers are security tested by an independent party",
      de: "Die Systeme, mit denen wir Kunden bedienen, werden von einer unabhängigen Stelle auf Sicherheit getestet",
      cs: "Systémy, kterými obsluhujeme zákazníky, testuje na bezpečnost nezávislá strana",
    },
    description: {
      en: "Tick yes if an independent party tests these systems for security holes, as often as your risk calls for. A penetration test and an external vulnerability scan both count.",
      de: "Ja, wenn eine unabhängige Stelle diese Systeme auf Sicherheitslücken prüft, so oft, wie es Ihr Risiko verlangt. Ein Penetrationstest und ein externer Schwachstellenscan zählen beide.",
      cs: "Ano, pokud tyto systémy testuje na zranitelnosti nezávislá strana, tak často, jak to vyžaduje vaše riziko. Počítá se penetrační test i externí sken zranitelností.",
    },
    legalBasis: "CIR 2024/2690 §5.1.2(a); §6.5",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.2 písm. a); bod 6.5",
    },
    iso27001: ["A.8.29", "A.8.8"],
    required: true,
    visibleWhen: RUNS_IT,
  },
  {
    id: "secureDevelopment",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We develop to defined secure development rules",
      de: "Wir entwickeln nach festgelegten Regeln für sichere Entwicklung",
      cs: "Vyvíjíme podle stanovených pravidel bezpečného vývoje",
    },
    description: {
      en: "Tick yes if your development follows set rules, for example a review before every change goes live, dependencies kept up to date, tests, and a check for known vulnerabilities. Asked only of suppliers who run software as a service or ship software.",
      de: "Ja, wenn Ihre Entwicklung festen Regeln folgt, zum Beispiel einer Prüfung vor jeder Änderung, die live geht, aktuellen Abhängigkeiten, Tests und einer Prüfung auf bekannte Schwachstellen. Gefragt nur bei Lieferanten, die Software als Dienst betreiben oder ausliefern.",
      cs: "Ano, pokud se váš vývoj řídí pevnými pravidly, například kontrolou každé změny před nasazením do provozu, aktuálními závislostmi, testy a kontrolou známých zranitelností. Ptáme se jen dodavatelů, kteří provozují software jako službu nebo software dodávají.",
    },
    legalBasis: "CIR 2024/2690 §5.1.2(a)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.2 písm. a)",
    },
    iso27001: ["A.8.25", "A.8.28"],
    required: true,
    visibleWhen: BUILDS_SOFTWARE,
  },
  {
    id: "vulnerabilityDisclosurePolicy",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We publish how to report a security hole to us",
      de: "Wir veröffentlichen, wie man uns eine Sicherheitslücke meldet",
      cs: "Zveřejňujeme, jak nám nahlásit zranitelnost",
    },
    description: {
      en: "Tick yes if your website says how to report a security hole and what you then do, for example in a security.txt file (RFC 9116). From 11 December 2027 the Cyber Resilience Act requires such a policy and a contact address from makers of software products.",
      de: "Ja, wenn auf Ihrer Webseite steht, wie man Ihnen eine Sicherheitslücke meldet und was Sie dann tun, etwa in einer security.txt (RFC 9116). Ab dem 11.12.2027 verlangt der Cyber Resilience Act diese Regelung und eine Kontaktadresse von Herstellern von Softwareprodukten.",
      cs: "Ano, pokud na vašem webu stojí, jak vám nahlásit zranitelnost a co pak uděláte, například v souboru security.txt (RFC 9116). Od 11. prosince 2027 vyžaduje akt o kybernetické odolnosti (CRA) od výrobců softwarových produktů takovou politiku a kontaktní adresu.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(f); CRA Annex I Part II(5), (6)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.4 písm. f); akt o kybernetické odolnosti (CRA), příloha I část II body 5 a 6",
    },
    iso27001: ["A.8.8", "A.5.21"],
    required: true,
    visibleWhen: BUILDS_SOFTWARE,
  },
  {
    id: "customerAccessPersonalMfa",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "Access to customer systems uses personal accounts with a second factor",
      de: "Zugriffe auf Kundensysteme laufen über persönliche Konten mit zweitem Faktor",
      cs: "Do systémů zákazníků přistupujeme přes osobní účty s druhým faktorem",
    },
    description: {
      en: "Tick yes if everyone who signs in to customer systems uses their own account with a second factor, including remote maintenance tools such as TeamViewer; nobody shares a login.",
      de: "Ja, wenn alle, die sich bei Kunden anmelden, ein eigenes Konto mit zweitem Faktor nutzen, auch bei Fernwartung, etwa mit TeamViewer; niemand teilt sich eine Anmeldung.",
      cs: "Ano, pokud každý, kdo se přihlašuje do systémů zákazníků, používá vlastní účet s druhým faktorem, i u nástrojů pro vzdálenou správu, jako je TeamViewer; nikdo nesdílí přihlašovací údaje s ostatními.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(a); §11.3.2(a); §11.5.2(b)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.4 písm. a); bod 11.3.2 písm. a); bod 11.5.2 písm. b)",
    },
    iso27001: ["A.8.2", "A.8.5", "A.5.16"],
    required: true,
    visibleWhen: ACCESSES_SYSTEMS,
  },
  {
    id: "customerAccessLogged",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "Administrative access to customer systems is logged",
      de: "Administrative Zugriffe auf Kundensysteme werden protokolliert",
      cs: "Administrátorské přístupy do systémů zákazníků se zaznamenávají",
    },
    description: {
      en: "Tick yes if it is recorded who accessed your customers' systems with administrator rights, and when, so it can be traced afterwards. Recording whole sessions is not expected.",
      de: "Ja, wenn festgehalten wird, wer wann mit Administratorrechten auf Systeme Ihrer Kunden zugegriffen hat, sodass es sich später nachvollziehen lässt. Ganze Sitzungen aufzuzeichnen wird nicht erwartet.",
      cs: "Ano, pokud se zaznamenává, kdo a kdy přistupoval do systémů vašich zákazníků s administrátorskými právy, aby to šlo později dohledat. Nahrávání celých relací se neočekává.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(a); §3.2.3(e)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.4 písm. a); bod 3.2.3 písm. e)",
    },
    iso27001: ["A.8.15"],
    required: true,
    visibleWhen: ACCESSES_SYSTEMS,
  },
  {
    id: "premisesAccessManaged",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We keep track of the keys, badges and codes customers give us",
      de: "Wir verwalten Schlüssel, Ausweise und Codes unserer Kunden nachvollziehbar",
      cs: "Evidujeme klíče, přístupové karty a kódy, které nám zákazníci svěřili",
    },
    description: {
      en: "Tick yes if you always know who holds which key, badge or code, take it back when someone leaves or changes job, and tell the customer without delay when one is lost.",
      de: "Ja, wenn Sie jederzeit wissen, wer welchen Schlüssel, Ausweis oder Code hat, ihn bei Ausscheiden oder Aufgabenwechsel zurücknehmen und den Kunden unverzüglich informieren, wenn einer verloren geht.",
      cs: "Ano, pokud vždy víte, kdo má jaký klíč, kartu nebo kód, odeberete je, když někdo odchází nebo mění práci, a zákazníka bez zbytečného odkladu informujete, když se některý ztratí.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(a); §11.2.2(d); §13.3.2(b)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.4 písm. a); bod 11.2.2 písm. d); bod 13.3.2 písm. b)",
    },
    iso27001: ["A.7.2", "A.5.11", "A.5.18"],
    required: true,
    visibleWhen: ACCESSES_PREMISES,
  },
  {
    id: "premisesConductRules",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "Our staff on customer premises follow written rules of conduct",
      de: "Unsere Mitarbeitenden halten sich in Räumen von Kunden an schriftliche Verhaltensregeln",
      cs: "Naši pracovníci se v prostorách zákazníků řídí písemnými pravidly chování",
    },
    description: {
      en: "Tick yes if your staff have written rules for working at customers, for example: let no one in, leave screens, devices and documents alone, report anything unusual to the customer.",
      de: "Ja, wenn Ihre Mitarbeitenden schriftliche Regeln für die Arbeit bei Kunden haben, zum Beispiel: niemanden hereinlassen, Bildschirme, Geräte und Unterlagen nicht anfassen, Auffälliges dem Kunden melden.",
      cs: "Ano, pokud mají vaši pracovníci písemná pravidla pro práci u zákazníků, například: nikoho nepouštět dovnitř, nesahat na obrazovky, zařízení a dokumenty, cokoli neobvyklého hlásit zákazníkovi.",
    },
    legalBasis: "ENISA TIG §5.1 TIPS; CIR 2024/2690 §8.1.1",
    legalBasisLocalised: {
      cs: "ENISA TIG, oddíl 5.1, tipy; prováděcí nařízení (EU) 2024/2690, příloha, bod 8.1.1",
    },
    iso27001: ["A.7.2", "A.7.7", "A.6.3"],
    required: true,
    visibleWhen: ACCESSES_PREMISES,
  },
];
