/**
 * The export's two PDFs, rendered for real and read back as text: what a company recorded has to
 * reach the page, with the words a reader knows, and every body page keeps its footer.
 */
import { describe, expect, test } from "bun:test";
import { renderToBuffer } from "@react-pdf/renderer";
import { extractText, getDocumentProxy } from "unpdf";
import type { CompanyExport } from "@/lib/export/company-export";
import { DocumentsDocument, RegistersDocument } from "./company-export";

async function pagesOf(node: React.ReactElement): Promise<string[]> {
  const buffer = await renderToBuffer(node);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });
  return (text as string[]).map((page) => page.replace(/\s+/g, " ").trim());
}

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
  hasMfa: false,
  mfaMethod: null,
  hasBackup: false,
  backupFrequency: null,
  lastBackupTestDate: null,
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
    bsiRegistrationId: null,
  },
  requirements: [],
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
      type: "website",
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
      hasSecurityCertification: false,
      securityCertificationType: null,
      contractStartDate: null,
      contractEndDate: null,
      processesPersonalData: false,
      dpaAvailable: false,
    },
  ],
  risks: [],
  trainings: [],
  managementReviews: [],
  incidents: [],
};

describe("the registers PDF", () => {
  test("says what each asset is for and who provides it", async () => {
    const text = (await pagesOf(RegistersDocument({ data: FIXTURE, locale: "de" }))).join(" ");
    expect(text).toContain("Wofür es da ist");
    expect(text).toContain("Kundenanfragen, WordPress auf einem gemieteten Server");
    expect(text).toContain("Anbieter Hetzner");
    expect(text).toContain("Betreut unsere Server und Arbeitsplätze");
  });

  test("names coded values instead of printing the code", async () => {
    const text = (await pagesOf(RegistersDocument({ data: FIXTURE, locale: "de" }))).join(" ");
    expect(text).toContain("Wichtige Einrichtung");
    expect(text).toContain("Risiko hoch");
    expect(text).not.toContain("important");
  });

  test("an empty register says so", async () => {
    const text = (await pagesOf(RegistersDocument({ data: FIXTURE, locale: "en" }))).join(" ");
    expect(text).toContain("No entries.");
  });

  test("every body page carries the company and its page number", async () => {
    const pages = await pagesOf(RegistersDocument({ data: FIXTURE, locale: "en" }));
    for (const page of pages.slice(1)) {
      expect(page).toContain("Beispielwerke GmbH");
      expect(page).toMatch(/Page \d+ of \d+/);
    }
  });
});

describe("the documents PDF", () => {
  test("prints who approved a document, in which role, and when", async () => {
    const text = (await pagesOf(DocumentsDocument({ data: FIXTURE, locale: "de" }))).join(" ");
    expect(text).toContain("Freigegeben von Anna Beispiel (Geschäftsführung)");
    expect(text).toContain("Freigegeben am 1.10.2026");
    expect(text).toContain("Erster Punkt");
  });

  test("a draft says it is one", async () => {
    const text = (await pagesOf(DocumentsDocument({ data: FIXTURE, locale: "de" }))).join(" ");
    expect(text).toContain("Entwurf, noch nicht freigegeben");
  });

  test("the document's own top heading is not printed under the page title again", async () => {
    const pages = await pagesOf(DocumentsDocument({ data: FIXTURE, locale: "de" }));
    const page = pages.find((p) => p.includes("Geltungsbereich")) ?? "";
    expect(page.split("Leitlinie zur Informationssicherheit der Beispielwerke GmbH")).toHaveLength(
      2,
    );
  });

  test("without documents it says the walk has written none yet", async () => {
    const text = (
      await pagesOf(DocumentsDocument({ data: { ...FIXTURE, documents: [] }, locale: "en" }))
    ).join(" ");
    expect(text).toContain("The walkthrough has not written any documents yet.");
  });
});
