/**
 * The export's two PDFs, rendered for real and read back as text: what a company recorded has to
 * reach the page, with the words a reader knows, and every body page keeps its footer.
 */
import { describe, expect, test } from "bun:test";
import { renderToBuffer } from "@react-pdf/renderer";
import { extractText, getDocumentProxy } from "unpdf";
import { type CompanyExport, EXPORT_FIELDS } from "@/lib/export/company-export";
import { exportNames, type Register } from "@/lib/export/value-names";
import { DocumentsDocument, RegistersDocument } from "./company-export";
import { PDF_LOCALES, type PdfLocale } from "./format";

const NAMES = {
  de: await exportNames("de"),
  en: await exportNames("en"),
  cs: await exportNames("cs"),
};

async function pagesOf(node: React.ReactElement): Promise<string[]> {
  const buffer = await renderToBuffer(node);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });
  return (text as string[]).map((page) => page.replace(/\s+/g, " ").trim());
}

const textOf = async (node: React.ReactElement): Promise<string> =>
  (await pagesOf(node)).join(" ");

const none = {
  quantity: 1,
  isCritical: false,
  isOT: false,
  owner: null,
  location: null,
  hostname: null,
  ipAddress: null,
  operatingSystem: null,
  softwareVersion: null,
  lastPatchDate: null,
  accessManagement: null,
  hasMfa: true,
  mfaMethod: "security_key" as const,
  encryptionAtRest: null,
  encryptionInTransit: null,
  hasBackup: true,
  backupFrequency: "daily",
  lastBackupTestDate: null,
  rto: null,
  rpo: null,
  processesPersonalData: false,
  endOfLife: null,
};

const FIXTURE: CompanyExport = {
  exportedAt: new Date("2026-10-03T10:00:00Z"),
  company: {
    name: "Beispielwerke GmbH",
    legalForm: "GmbH",
    sector: "manufacturing",
    entityType: "important",
    employeeCount: 90,
    registeredAddress: null,
    primaryLocations: null,
    contactEmail: "it@beispielwerke.example",
    contactPhone: null,
    cisoName: null,
    cisoReportsTo: null,
    bsiContactName: null,
    bsiContactEmail: null,
    bsiContactPhone: null,
    bsiRegistrationId: null,
  },
  requirements: [],
  answers: {},
  documents: [
    {
      code: "2.4",
      type: "information_security",
      title: "Leitlinie zur Informationssicherheit der Beispielwerke GmbH",
      content:
        "# Leitlinie zur Informationssicherheit der Beispielwerke GmbH\n\n## 1. Geltungsbereich\n\nGilt für alle Beschäftigten.\n\n- Erster Punkt\n- Zweiter Punkt\n",
      status: "approved",
      version: "2026-10-01",
      effectiveFrom: "2026-10-01",
      approvedAt: new Date("2026-10-01T09:00:00Z"),
      approverRole: "ceo",
      approver: "Anna Beispiel",
    },
    {
      code: "3.1",
      type: "incident_response",
      title: "Notfallplan der Beispielwerke GmbH",
      content: "# Notfallplan\n\nWer bemerkt, ruft an.",
      status: "draft",
      version: "1.0",
      effectiveFrom: null,
      approvedAt: null,
      approverRole: null,
      approver: null,
    },
  ],
  assets: [
    {
      name: "Website",
      type: "application",
      description: "Kundenanfragen, WordPress auf einem gemieteten Server",
      ...none,
      providers: ["Hetzner"],
    },
  ],
  suppliers: [
    {
      name: "Systemhaus Muster",
      description: "Betreut unsere Server und Arbeitsplätze",
      serviceType: null,
      contactName: null,
      contactEmail: null,
      riskLevel: "high",
      isCritical: true,
      hasAccessToSystems: true,
      hasAccessToData: false,
      hasSecurityClauses: false,
      contractSecurityClauses: null,
      hasAuditRights: false,
      hasSecurityCertification: false,
      securityCertificationType: null,
      contractStartDate: null,
      contractEndDate: null,
      lastReviewDate: null,
      processesPersonalData: false,
      dpaAvailable: false,
    },
  ],
  risks: [],
  trainings: [],
  managementReviews: [],
  incidents: [],
};

const registers = (locale: PdfLocale) =>
  RegistersDocument({ data: FIXTURE, locale, names: NAMES[locale] });
const documents = (data: CompanyExport = FIXTURE, locale: PdfLocale = "de") =>
  DocumentsDocument({ data, framework: "nis2", locale, names: NAMES[locale] });

describe("the export names fields the way the app's forms do", () => {
  const registers: readonly Register[] = [
    "asset",
    "supplier",
    "risk",
    "training",
    "managementReview",
    "incident",
  ];
  for (const locale of PDF_LOCALES) {
    test(`every exported register field has its form's label (${locale})`, () => {
      const unlabelled = registers.flatMap((record) =>
        EXPORT_FIELDS[record]
          .filter((field) => !Object.hasOwn(NAMES[locale].fields[record], field))
          .map((field) => `${record}.${field}`),
      );
      expect(unlabelled).toEqual([]);
    });
  }
});

describe("the registers PDF", () => {
  test("says what each asset is and who provides it", async () => {
    const text = await textOf(registers("de"));
    expect(text).toContain(
      "Beschreibung Kundenanfragen, WordPress auf einem gemieteten Server",
    );
    expect(text).toContain("Anbieter Hetzner");
    expect(text).toContain("Betreut unsere Server und Arbeitsplätze");
  });

  test("names every coded value the way the app's screens do", async () => {
    const text = await textOf(registers("de"));
    expect(text).toContain("Einrichtungstyp Wichtige Einrichtung");
    expect(text).toContain("Sektor Verarbeitendes Gewerbe");
    expect(text).toContain("Typ Anwendung");
    expect(text).toContain("Art des zweiten Faktors Sicherheitsschlüssel");
    expect(text).toContain("Backup-Häufigkeit täglich");
    expect(text).toContain("Risikostufe Hoch");
    for (const code of ["important", "manufacturing", "application", "security_key"]) {
      expect(text).not.toContain(code);
    }
  });

  test("an empty register says so", async () => {
    expect(await textOf(registers("en"))).toContain("No entries.");
  });

  test("every body page carries the company and its page number", async () => {
    const pages = await pagesOf(registers("en"));
    for (const page of pages.slice(1)) {
      expect(page).toContain("Beispielwerke GmbH");
      expect(page).toMatch(/Page \d+ of \d+/);
    }
  });
});

describe("the documents PDF", () => {
  test("prints who approved a document, in which role, and when", async () => {
    const text = await textOf(documents());
    expect(text).toContain("Freigegeben von Anna Beispiel (CEO / Geschäftsführer)");
    expect(text).toContain("Freigegeben am 1.10.2026");
    expect(text).toContain("Erster Punkt");
  });

  test("a draft says it is one", async () => {
    expect(await textOf(documents())).toContain("Entwurf, noch nicht freigegeben");
  });

  test("the document's own top heading is not printed under the page title again", async () => {
    const pages = await pagesOf(documents());
    const page = pages.find((p) => p.includes("Geltungsbereich")) ?? "";
    expect(
      page.split("Leitlinie zur Informationssicherheit der Beispielwerke GmbH"),
    ).toHaveLength(2);
  });

  test("without documents it says the walk has written none yet", async () => {
    const text = await textOf(documents({ ...FIXTURE, documents: [] }));
    expect(text).toContain("Der Durchgang hat noch keine Dokumente geschrieben.");
  });

  test("names its framework on the cover and on every page", async () => {
    const gdpr = (locale: PdfLocale) =>
      textOf(
        DocumentsDocument({
          data: FIXTURE,
          framework: "gdpr",
          locale,
          names: NAMES[locale],
        }),
      );
    // The cover letter-spaces its eyebrow, so the text is compared without spaces.
    const bare = async (text: Promise<string>) => (await text).replaceAll(" ", "");
    const german = await bare(gdpr("de"));
    expect(german).toContain("DSGVODOKUMENTATION");
    expect(german).not.toContain("NIS2");
    expect(await bare(gdpr("en"))).toContain("GDPRRECORDS");
    expect(await bare(textOf(documents()))).toContain("NIS2DOKUMENTATION");
  });
});

describe("the Czech export", () => {
  // Read back from the rendered file: Inter has to carry the glyphs, not just the source.
  test("is written in Czech, with its diacritics intact", async () => {
    const text = await textOf(registers("cs"));
    expect(text).toContain("Počet zaměstnanců 90");
    expect(text).toContain("Přezkumy vedení");
    expect(text).toContain("Žádné záznamy.");
    for (const glyph of ["č", "ř", "ů", "ě", "Ž"]) {
      expect(text).toContain(glyph);
    }
  });

  test("names every coded value the way the Czech screens do", async () => {
    const text = await textOf(registers("cs"));
    expect(text).toContain("Klasifikace subjektu Důležitý subjekt");
    expect(text).toContain("Odvětví Výroba");
    expect(text).toContain("Úroveň rizika Vysoká");
    for (const code of ["important", "manufacturing", "application", "security_key"]) {
      expect(text).not.toContain(code);
    }
  });

  test("every body page carries its Czech page number", async () => {
    const pages = await pagesOf(registers("cs"));
    for (const page of pages.slice(1)) {
      expect(page).toMatch(/Strana \d+ z \d+/);
    }
  });

  test("prints who approved a document, and that a draft is one", async () => {
    const text = await textOf(documents(FIXTURE, "cs"));
    expect(text).toContain("Schválil Anna Beispiel (Generální ředitel / Jednatel)");
    expect(text).toContain("Datum schválení 1. 10. 2026");
    expect(text).toContain("Koncept, zatím neschválený");
  });
});
