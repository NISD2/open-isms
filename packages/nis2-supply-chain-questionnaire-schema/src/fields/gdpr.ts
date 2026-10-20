// Source of truth for the GDPR questions of the security-practices section, asked of a supplier
// that processes personal data on its customers' behalf (./gates.ts, PROCESSES_FOR_CUSTOMERS).
// They sit beside `dataProcessingAgreement` in the portal; their own file keeps
// security-practices.ts readable. Run `bun run build:json` after editing.

import type { SupplierField } from "../schema";
import { PROCESSES_FOR_CUSTOMERS } from "./gates";

export const gdprFields: SupplierField[] = [
  {
    id: "personalDataTransfers",
    section: "security_practices",
    type: "enum",
    options: [
      {
        value: "inEea",
        label: {
          en: "No, it stays in the EEA",
          de: "Nein, sie bleiben im EWR",
          cs: "Ne, zůstávají v EHP",
        },
      },
      {
        value: "adequacy",
        label: {
          en: "Yes, only to countries with an adequacy decision of the European Commission (Art. 45)",
          de: "Ja, nur in Länder mit Angemessenheitsbeschluss der Europäischen Kommission (Art. 45)",
          cs: "Ano, pouze do zemí, pro které Evropská komise přijala rozhodnutí o odpovídající ochraně (čl. 45)",
        },
      },
      {
        value: "sccs",
        label: {
          en: "Yes, under the standard contractual clauses of the European Commission (Art. 46(2)(c))",
          de: "Ja, auf Grundlage der Standardvertragsklauseln der Europäischen Kommission (Art. 46 Abs. 2 Buchst. c)",
          cs: "Ano, na základě standardních doložek o ochraně osobních údajů přijatých Evropskou komisí (čl. 46 odst. 2 písm. c))",
        },
      },
      {
        value: "bcr",
        label: {
          en: "Yes, under binding corporate rules (Art. 47)",
          de: "Ja, auf Grundlage verbindlicher interner Datenschutzvorschriften (Art. 47)",
          cs: "Ano, na základě závazných podnikových pravidel (čl. 47)",
        },
      },
      {
        value: "other",
        label: {
          en: "Yes, on another basis",
          de: "Ja, auf anderer Grundlage",
          cs: "Ano, na jiném základě",
        },
      },
    ],
    label: {
      en: "Customers' personal data outside the European Economic Area",
      de: "Personenbezogene Daten Ihrer Kunden außerhalb des Europäischen Wirtschaftsraums",
      cs: "Osobní údaje zákazníků mimo Evropský hospodářský prostor",
    },
    description: {
      en: "Whether you or your sub-processors transfer customers' personal data to a country outside the EEA, and on which basis. A transfer needs one of the bases of Chapter V GDPR (Art. 44).",
      de: "Ob Sie oder Ihre Unterauftragsverarbeiter personenbezogene Daten Ihrer Kunden in ein Land außerhalb des EWR übermitteln, und auf welcher Grundlage. Eine Übermittlung braucht eine der Grundlagen aus Kapitel V DSGVO (Art. 44).",
      cs: "Zda vy nebo vaši další zpracovatelé předáváte osobní údaje zákazníků do země mimo EHP, a na jakém základě. Předání potřebuje jeden ze základů podle kapitoly V GDPR (čl. 44).",
    },
    legalBasis: "GDPR Art. 44; Art. 45; Art. 46(2)(c); Art. 47",
    legalBasisLocalised: {
      cs: "obecné nařízení o ochraně osobních údajů (GDPR), čl. 44; čl. 45; čl. 46 odst. 2 písm. c); čl. 47",
    },
    required: true,
    visibleWhen: PROCESSES_FOR_CUSTOMERS,
  },
  {
    id: "subprocessorEngagement",
    section: "security_practices",
    type: "enum",
    options: [
      {
        value: "general",
        label: {
          en: "General authorisation: we tell you before adding or replacing one, and you may object",
          de: "Allgemeine Genehmigung: Wir informieren Sie vor jeder Hinzunahme oder Ersetzung, und Sie können widersprechen",
          cs: "Obecné povolení: před přijetím nebo nahrazením dalšího zpracovatele vás informujeme a můžete vznést námitku",
        },
      },
      {
        value: "specific",
        label: {
          en: "We ask for your specific authorisation for each one",
          de: "Wir holen für jeden einzelnen Ihre gesonderte Genehmigung ein",
          cs: "Pro každého si vyžádáme vaše konkrétní povolení",
        },
      },
      {
        value: "none",
        label: {
          en: "We engage no sub-processors for customers' personal data",
          de: "Wir setzen für personenbezogene Daten unserer Kunden keine Unterauftragsverarbeiter ein",
          cs: "Pro osobní údaje zákazníků nezapojujeme žádné další zpracovatele",
        },
      },
    ],
    label: {
      en: "How you engage sub-processors",
      de: "Wie Sie Unterauftragsverarbeiter einsetzen",
      cs: "Jak zapojujete další zpracovatele",
    },
    description: {
      en: "A processor engages another processor only with the customer's prior specific or general written authorisation. Under a general one, it tells the customer of any intended addition or replacement, so the customer can object (Art. 28(2) GDPR).",
      de: "Ein Auftragsverarbeiter nimmt einen weiteren nur mit vorheriger gesonderter oder allgemeiner schriftlicher Genehmigung des Kunden in Anspruch. Bei einer allgemeinen informiert er den Kunden über jede beabsichtigte Hinzunahme oder Ersetzung, damit dieser widersprechen kann (Art. 28 Abs. 2 DSGVO).",
      cs: "Zpracovatel zapojí dalšího zpracovatele jen s předchozím konkrétním nebo obecným písemným povolením zákazníka. U obecného povolení zákazníka informuje o každém zamýšleném přijetí nebo nahrazení, aby mohl vznést námitku (čl. 28 odst. 2 GDPR).",
    },
    legalBasis: "GDPR Art. 28(2)",
    legalBasisLocalised: {
      cs: "obecné nařízení o ochraně osobních údajů (GDPR), čl. 28 odst. 2",
    },
    required: true,
    visibleWhen: PROCESSES_FOR_CUSTOMERS,
  },
  {
    id: "breachNoticeToController",
    section: "security_practices",
    type: "boolean",
    label: {
      en: "We notify you of a personal data breach without undue delay after becoming aware of it",
      de: "Wir melden Ihnen eine Verletzung des Schutzes personenbezogener Daten unverzüglich, nachdem sie uns bekannt wird",
      cs: "Porušení zabezpečení osobních údajů vám ohlásíme bez zbytečného odkladu poté, co se o něm dozvíme",
    },
    description: {
      en: "A processor owes this to the controller (Art. 33(2) GDPR). The controller needs it to meet its own duty to notify the supervisory authority (Art. 33(1)).",
      de: "Das schuldet ein Auftragsverarbeiter dem Verantwortlichen (Art. 33 Abs. 2 DSGVO). Der Verantwortliche braucht die Meldung, um seine eigene Meldepflicht gegenüber der Aufsichtsbehörde zu erfüllen (Art. 33 Abs. 1).",
      cs: "To zpracovatel dluží správci (čl. 33 odst. 2 GDPR). Správce ohlášení potřebuje, aby splnil vlastní povinnost ohlásit porušení dozorovému úřadu (čl. 33 odst. 1).",
    },
    legalBasis: "GDPR Art. 33(2)",
    legalBasisLocalised: {
      cs: "obecné nařízení o ochraně osobních údajů (GDPR), čl. 33 odst. 2",
    },
    required: true,
    visibleWhen: PROCESSES_FOR_CUSTOMERS,
  },
];
