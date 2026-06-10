import { NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from "docx";
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

function buildDoc(locale: Locale): Document {
  const strings = STRINGS[locale];
  const grouped = groupBySection(supplierQuestionnaire);
  const children: Paragraph[] = [];

  // Header
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: strings.title, bold: true })],
    }),
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: strings.subtitle, italics: true })],
    }),
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: strings.meta, size: 18, color: "666666" })],
    }),
  );
  children.push(new Paragraph({ text: "" }));
  children.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [new TextRun({ text: strings.intro })],
    }),
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: strings.source, size: 18, color: "666666" })],
    }),
  );
  children.push(new Paragraph({ text: "" }));

  // Sections
  for (const sectionId of SECTION_ORDER) {
    const fields = grouped.get(sectionId) ?? [];
    if (fields.length === 0) continue;

    const sectionTitle = SECTION_TITLES[sectionId][locale];
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: `${sectionTitle}  (${fields.length} ${strings.fieldsLabel})`,
            bold: true,
          }),
        ],
      }),
    );

    for (const field of fields) {
      const label = pickLocaleString(field.label, locale);
      const description = pickLocaleString(field.description, locale);
      const reqLabel = pickRequiredLabel(field, strings);

      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: label, bold: true })],
        }),
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[${field.type}]  ${reqLabel}  -  ${strings.legalBasis}: ${field.legalBasis}`,
              size: 18,
              color: "666666",
            }),
          ],
        }),
      );
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun({ text: description })],
        }),
      );
      children.push(new Paragraph({ text: "" }));
    }
  }

  // Footer
  children.push(
    new Paragraph({
      children: [new TextRun({ text: strings.license, size: 18, color: "888888" })],
    }),
  );

  return new Document({
    creator: "NISD2",
    title: strings.title,
    description: strings.subtitle,
    sections: [{ properties: {}, children }],
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const localeParam = url.searchParams.get("locale");
  const locale: Locale = localeParam === "de" ? "de" : "en";

  try {
    const doc = buildDoc(locale);
    const buffer = await Packer.toBuffer(doc);
    const filename =
      locale === "de"
        ? "nis2-lieferanten-fragebogen.docx"
        : "nis2-supplier-questionnaire.docx";

    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    console.error("[supplier-questionnaire/docx] failed:", error);
    return NextResponse.json({ error: "DOCX generation failed" }, { status: 500 });
  }
}
