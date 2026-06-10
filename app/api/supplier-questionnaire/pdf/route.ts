import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import {
  supplierQuestionnaire,
  groupBySection,
  type SupplierField,
} from "@nisd2/nis2-supply-chain-questionnaire-schema";

const VERSION = supplierQuestionnaire.version;
const LAST_UPDATED = supplierQuestionnaire.lastUpdated;

export const runtime = "nodejs";

type Locale = "de" | "en";

const SECTION_ORDER = [
  "profile",
  "security_practices",
  "saas_technical",
  "on_prem_technical",
  "pro_services",
  "managed_services",
] as const;

const SECTION_TITLES: Record<(typeof SECTION_ORDER)[number], Record<Locale, string>> = {
  profile: { de: "1. Lieferantenprofil", en: "1. Supplier Profile" },
  security_practices: { de: "2. Sicherheitspraktiken", en: "2. Security Practices" },
  saas_technical: { de: "3. SaaS-spezifisch", en: "3. SaaS-specific" },
  on_prem_technical: { de: "4. On-Premise-spezifisch", en: "4. On-Premise-specific" },
  pro_services: { de: "5. Professional Services", en: "5. Professional Services" },
  managed_services: { de: "6. Managed Services", en: "6. Managed Services" },
};

const STRINGS: Record<Locale, {
  title: string;
  subtitle: string;
  meta: string;
  intro: string;
  source: string;
  fieldType: string;
  legalBasis: string;
  required: string;
  optional: string;
  conditional: string;
  license: string;
  fieldsLabel: string;
}> = {
  de: {
    title: "NIS 2 Lieferanten-Fragebogen",
    subtitle: "Offener, EU-verankerter Fragebogen für die Lieferantenbewertung unter NIS 2",
    meta: `Version ${VERSION} - Stand ${LAST_UPDATED} - ${supplierQuestionnaire.fields.length} Felder in 6 Sektionen`,
    intro:
      "Jedes Feld ist an eine EU-rechtliche Primärquelle verankert: NIS 2 Art. 21(2), CIR 2024/2690, ENISA Technical Implementation Guidance, DSGVO Art. 28 oder den Cyber Resilience Act. Sektorspezifische Erweiterungen (TISAX, VDA ISA, BSI C5, KRITIS) ergänzen die Basis, ersetzen sie nicht.",
    source:
      "Quelle: github.com/NISD2/nis2-supply-chain-questionnaire-schema (MIT + CC BY 4.0)",
    fieldType: "Feldtyp",
    legalBasis: "Rechtsgrundlage",
    required: "Pflichtfeld",
    optional: "Optional",
    conditional: "Bedingt",
    license: "Lizenz: MIT (Schema) + CC BY 4.0 (Inhalt). Frei nutzbar, forkbar, anpassbar.",
    fieldsLabel: "Felder",
  },
  en: {
    title: "NIS 2 Supplier Questionnaire",
    subtitle: "An open, EU-anchored questionnaire for NIS 2 supplier due diligence",
    meta: `Version ${VERSION} - Last updated ${LAST_UPDATED} - ${supplierQuestionnaire.fields.length} fields across 6 sections`,
    intro:
      "Every field is anchored to an EU-level primary source: NIS 2 Art. 21(2), CIR 2024/2690, ENISA Technical Implementation Guidance, GDPR Art. 28, or the Cyber Resilience Act. Sector overlays (TISAX, VDA ISA, BSI C5, KRITIS) sit on top of this baseline.",
    source:
      "Source: github.com/NISD2/nis2-supply-chain-questionnaire-schema (MIT + CC BY 4.0)",
    fieldType: "Field type",
    legalBasis: "Legal basis",
    required: "Required",
    optional: "Optional",
    conditional: "Conditional",
    license: "License: MIT (schema) + CC BY 4.0 (content). Free to use, fork, and adapt.",
    fieldsLabel: "fields",
  },
};

function pickLocaleString(value: { en: string; de: string }, locale: Locale): string {
  return locale === "de" ? value.de : value.en;
}

function pickRequiredLabel(field: SupplierField, strings: (typeof STRINGS)[Locale]): string {
  if (field.visibleWhen) return strings.conditional;
  return field.required ? strings.required : strings.optional;
}

function buildPdf(locale: Locale): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const strings = STRINGS[locale];
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: strings.title,
        Author: "NISD2",
        Subject: strings.subtitle,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fontSize(20).font("Helvetica-Bold").text(strings.title);
    doc.moveDown(0.3);
    doc.fontSize(11).font("Helvetica").fillColor("#444").text(strings.subtitle);
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor("#777").text(strings.meta);
    doc.moveDown(0.8);
    doc.fontSize(9).fillColor("#444").text(strings.intro, { align: "justify" });
    doc.moveDown(0.4);
    doc.fontSize(8).fillColor("#666").text(strings.source);
    doc.moveDown(1);

    // Sections
    const grouped = groupBySection(supplierQuestionnaire);
    for (const sectionId of SECTION_ORDER) {
      const fields = grouped.get(sectionId) ?? [];
      if (fields.length === 0) continue;

      const sectionTitle = SECTION_TITLES[sectionId][locale];
      doc.moveDown(0.5);
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#000")
        .text(`${sectionTitle}  (${fields.length} ${strings.fieldsLabel})`);
      doc.moveDown(0.4);

      for (const field of fields) {
        if (doc.y > 750) doc.addPage();
        const label = pickLocaleString(field.label, locale);
        const description = pickLocaleString(field.description, locale);
        const reqLabel = pickRequiredLabel(field, strings);

        doc.fontSize(10).font("Helvetica-Bold").fillColor("#000").text(label, { continued: false });
        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor("#666")
          .text(`[${field.type}]  ${reqLabel}  -  ${strings.legalBasis}: ${field.legalBasis}`);
        doc.fontSize(9).fillColor("#333").text(description, { align: "justify" });
        doc.moveDown(0.5);
      }
    }

    // Footer
    doc.moveDown(1);
    doc.fontSize(8).fillColor("#888").text(strings.license);

    doc.end();
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const localeParam = url.searchParams.get("locale");
  const locale: Locale = localeParam === "de" ? "de" : "en";

  try {
    const pdf = await buildPdf(locale);
    const filename =
      locale === "de"
        ? "nis2-lieferanten-fragebogen.pdf"
        : "nis2-supplier-questionnaire.pdf";

    return new Response(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    console.error("[supplier-questionnaire/pdf] failed:", error);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
