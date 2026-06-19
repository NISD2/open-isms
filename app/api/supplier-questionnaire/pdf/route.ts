import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import {
  supplierQuestionnaire,
  groupBySection,
  type SupplierField,
} from "@nisd2/nis2-supply-chain-questionnaire-schema";
import { pickLocalized } from "@/lib/locale";

const VERSION = supplierQuestionnaire.version;
const LAST_UPDATED = supplierQuestionnaire.lastUpdated;

export const runtime = "nodejs";

type Locale = "de" | "en" | "nl" | "fr" | "it" | "es" | "pl";

const KNOWN_LOCALES: Locale[] = ["de", "en", "nl", "fr", "it", "es", "pl"];

const SECTION_ORDER = [
  "profile",
  "security_practices",
  "saas_technical",
  "on_prem_technical",
  "pro_services",
  "managed_services",
] as const;

const SECTION_TITLES: Record<(typeof SECTION_ORDER)[number], Record<Locale, string>> = {
  profile: {
    de: "1. Lieferantenprofil",
    en: "1. Supplier Profile",
    nl: "1. Leveranciersprofiel",
    fr: "1. Profil du fournisseur",
    it: "1. Profilo del fornitore",
    es: "1. Perfil del proveedor",
    pl: "1. Profil dostawcy",
  },
  security_practices: {
    de: "2. Sicherheitspraktiken",
    en: "2. Security Practices",
    nl: "2. Beveiligingspraktijken",
    fr: "2. Pratiques de sécurité",
    it: "2. Pratiche di sicurezza",
    es: "2. Prácticas de seguridad",
    pl: "2. Praktyki bezpieczeństwa",
  },
  saas_technical: {
    de: "3. SaaS-spezifisch",
    en: "3. SaaS-specific",
    nl: "3. SaaS-specifiek",
    fr: "3. Spécifique au SaaS",
    it: "3. Specifico per SaaS",
    es: "3. Específico de SaaS",
    pl: "3. Specyficzne dla SaaS",
  },
  on_prem_technical: {
    de: "4. On-Premise-spezifisch",
    en: "4. On-Premise-specific",
    nl: "4. On-Premise-specifiek",
    fr: "4. Spécifique à l'On-Premise",
    it: "4. Specifico per On-Premise",
    es: "4. Específico de On-Premise",
    pl: "4. Specyficzne dla On-Premise",
  },
  pro_services: {
    de: "5. Professional Services",
    en: "5. Professional Services",
    nl: "5. Professional Services",
    fr: "5. Professional Services",
    it: "5. Professional Services",
    es: "5. Professional Services",
    pl: "5. Professional Services",
  },
  managed_services: {
    de: "6. Managed Services",
    en: "6. Managed Services",
    nl: "6. Managed Services",
    fr: "6. Managed Services",
    it: "6. Managed Services",
    es: "6. Managed Services",
    pl: "6. Managed Services",
  },
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
  nl: {
    title: "NIS 2 Leveranciersvragenlijst",
    subtitle: "Een open, EU-verankerde vragenlijst voor de NIS 2 leveranciersbeoordeling",
    meta: `Versie ${VERSION} - Laatst bijgewerkt ${LAST_UPDATED} - ${supplierQuestionnaire.fields.length} velden in 6 secties`,
    intro:
      "Elk veld is verankerd aan een primaire bron op EU-niveau: NIS 2 Art. 21(2), CIR 2024/2690, ENISA Technical Implementation Guidance, GDPR Art. 28 of de Cyber Resilience Act. Sectorspecifieke aanvullingen (TISAX, VDA ISA, BSI C5, KRITIS) komen bovenop deze basis.",
    source:
      "Bron: github.com/NISD2/nis2-supply-chain-questionnaire-schema (MIT + CC BY 4.0)",
    fieldType: "Veldtype",
    legalBasis: "Rechtsgrondslag",
    required: "Verplicht",
    optional: "Optioneel",
    conditional: "Voorwaardelijk",
    license: "Licentie: MIT (schema) + CC BY 4.0 (inhoud). Vrij te gebruiken, te forken en aan te passen.",
    fieldsLabel: "velden",
  },
  fr: {
    title: "Questionnaire fournisseur NIS 2",
    subtitle: "Un questionnaire ouvert et ancré dans le droit de l'UE pour l'évaluation des fournisseurs au titre de NIS 2",
    meta: `Version ${VERSION} - Dernière mise à jour ${LAST_UPDATED} - ${supplierQuestionnaire.fields.length} champs répartis en 6 sections`,
    intro:
      "Chaque champ est ancré à une source primaire de niveau européen : NIS 2 Art. 21(2), CIR 2024/2690, ENISA Technical Implementation Guidance, GDPR Art. 28 ou le Cyber Resilience Act. Les compléments sectoriels (TISAX, VDA ISA, BSI C5, KRITIS) s'ajoutent à cette base.",
    source:
      "Source : github.com/NISD2/nis2-supply-chain-questionnaire-schema (MIT + CC BY 4.0)",
    fieldType: "Type de champ",
    legalBasis: "Base juridique",
    required: "Obligatoire",
    optional: "Facultatif",
    conditional: "Conditionnel",
    license: "Licence : MIT (schéma) + CC BY 4.0 (contenu). Libre d'utilisation, de fork et d'adaptation.",
    fieldsLabel: "champs",
  },
  it: {
    title: "Questionario per i fornitori NIS 2",
    subtitle: "Un questionario aperto e ancorato al diritto dell'UE per la valutazione dei fornitori ai sensi di NIS 2",
    meta: `Versione ${VERSION} - Ultimo aggiornamento ${LAST_UPDATED} - ${supplierQuestionnaire.fields.length} campi in 6 sezioni`,
    intro:
      "Ogni campo è ancorato a una fonte primaria a livello UE: NIS 2 Art. 21(2), CIR 2024/2690, ENISA Technical Implementation Guidance, GDPR Art. 28 o il Cyber Resilience Act. Le integrazioni settoriali (TISAX, VDA ISA, BSI C5, KRITIS) si aggiungono a questa base.",
    source:
      "Fonte: github.com/NISD2/nis2-supply-chain-questionnaire-schema (MIT + CC BY 4.0)",
    fieldType: "Tipo di campo",
    legalBasis: "Base giuridica",
    required: "Obbligatorio",
    optional: "Facoltativo",
    conditional: "Condizionale",
    license: "Licenza: MIT (schema) + CC BY 4.0 (contenuto). Libero di usare, forkare e adattare.",
    fieldsLabel: "campi",
  },
  es: {
    title: "Cuestionario para proveedores NIS 2",
    subtitle: "Un cuestionario abierto y anclado en el derecho de la UE para la evaluación de proveedores conforme a NIS 2",
    meta: `Versión ${VERSION} - Última actualización ${LAST_UPDATED} - ${supplierQuestionnaire.fields.length} campos en 6 secciones`,
    intro:
      "Cada campo está anclado a una fuente primaria de nivel europeo: NIS 2 Art. 21(2), CIR 2024/2690, ENISA Technical Implementation Guidance, GDPR Art. 28 o el Cyber Resilience Act. Los complementos sectoriales (TISAX, VDA ISA, BSI C5, KRITIS) se añaden a esta base.",
    source:
      "Fuente: github.com/NISD2/nis2-supply-chain-questionnaire-schema (MIT + CC BY 4.0)",
    fieldType: "Tipo de campo",
    legalBasis: "Base jurídica",
    required: "Obligatorio",
    optional: "Opcional",
    conditional: "Condicional",
    license: "Licencia: MIT (esquema) + CC BY 4.0 (contenido). Libre para usar, bifurcar y adaptar.",
    fieldsLabel: "campos",
  },
  pl: {
    title: "Kwestionariusz dla dostawców NIS 2",
    subtitle: "Otwarty, zakotwiczony w prawie UE kwestionariusz do oceny dostawców w ramach NIS 2",
    meta: `Wersja ${VERSION} - Ostatnia aktualizacja ${LAST_UPDATED} - ${supplierQuestionnaire.fields.length} pól w 6 sekcjach`,
    intro:
      "Każde pole jest zakotwiczone w pierwotnym źródle na poziomie UE: NIS 2 Art. 21(2), CIR 2024/2690, ENISA Technical Implementation Guidance, GDPR Art. 28 lub Cyber Resilience Act. Uzupełnienia sektorowe (TISAX, VDA ISA, BSI C5, KRITIS) są dodawane do tej podstawy.",
    source:
      "Źródło: github.com/NISD2/nis2-supply-chain-questionnaire-schema (MIT + CC BY 4.0)",
    fieldType: "Typ pola",
    legalBasis: "Podstawa prawna",
    required: "Wymagane",
    optional: "Opcjonalne",
    conditional: "Warunkowe",
    license: "Licencja: MIT (schemat) + CC BY 4.0 (treść). Można swobodnie używać, forkować i adaptować.",
    fieldsLabel: "pól",
  },
};

function pickLocaleString(value: { en: string } & Record<string, string | undefined>, locale: Locale): string {
  return pickLocalized(value, locale);
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
  const locale: Locale =
    localeParam && (KNOWN_LOCALES as string[]).includes(localeParam)
      ? (localeParam as Locale)
      : "en";

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
