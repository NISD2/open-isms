import {
  groupBySection,
  supplierQuestionnaire,
} from "@nisd2/nis2-supply-chain-questionnaire-schema";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/client-ip";
import { pickLocalized } from "@/lib/locale";
import { rateLimitPublicRoute } from "@/lib/rate-limit";
import {
  EXPORT_STRINGS,
  QUESTIONNAIRE_LOCALES,
  type QuestionnaireLocale,
  requiredLabel,
  SECTION_TITLES,
} from "@/lib/supplier-questionnaire-export-strings";
import {
  conditionText,
  isoText,
  QUESTIONNAIRE_COUNTS,
  SECTION_ORDER,
} from "@/lib/supplier-questionnaire-text";

export const runtime = "nodejs";

const META = { size: 18, color: "666666" } as const;

function buildDoc(locale: QuestionnaireLocale): Document {
  const strings = EXPORT_STRINGS[locale];
  const grouped = groupBySection(supplierQuestionnaire);
  const sections = SECTION_ORDER.map((id) => ({
    title: SECTION_TITLES[id][locale],
    fields: grouped.get(id) ?? [],
  })).filter((section) => section.fields.length > 0);

  const header = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: strings.title, bold: true })],
    }),
    new Paragraph({ children: [new TextRun({ text: strings.subtitle, italics: true })] }),
    new Paragraph({
      children: [new TextRun({ text: strings.meta(QUESTIONNAIRE_COUNTS), ...META })],
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [new TextRun({ text: strings.intro(QUESTIONNAIRE_COUNTS) })],
    }),
    new Paragraph({ children: [new TextRun({ text: strings.source, ...META })] }),
    new Paragraph({ text: "" }),
  ];

  const body = sections.flatMap((section, i) => [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: `${i + 1}. ${section.title}  (${strings.fieldCount(section.fields.length)})`,
          bold: true,
        }),
      ],
    }),
    ...section.fields.flatMap((field) => {
      const provenance = [
        `[${field.type}]`,
        requiredLabel(field, strings),
        `${strings.legalBasis}: ${field.legalBasis}`,
        isoText(field),
      ]
        .filter(Boolean)
        .join("  ·  ");
      const condition = conditionText(field, locale, strings);
      return [
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({ text: pickLocalized(field.label, locale), bold: true }),
          ],
        }),
        new Paragraph({ children: [new TextRun({ text: provenance, ...META })] }),
        ...(condition
          ? [
              new Paragraph({
                children: [new TextRun({ text: condition, ...META, italics: true })],
              }),
            ]
          : []),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun({ text: pickLocalized(field.description, locale) })],
        }),
        ...(field.options ?? []).map(
          (option) =>
            new Paragraph({
              bullet: { level: 0 },
              children: [new TextRun({ text: pickLocalized(option.label, locale) })],
            }),
        ),
        new Paragraph({ text: "" }),
      ];
    }),
  ]);

  const footer = new Paragraph({
    children: [new TextRun({ text: strings.license, size: 18, color: "888888" })],
  });

  return new Document({
    creator: "NISD2",
    title: strings.title,
    description: strings.subtitle,
    sections: [{ properties: {}, children: [...header, ...body, footer] }],
  });
}

export async function GET(request: Request): Promise<Response> {
  // Audit F-1 (2026-09-10): unauthenticated document build, same reasoning as
  // the PDF sibling.
  if (
    !(await rateLimitPublicRoute("questionnaire:docx", getClientIp(request.headers), 10))
  ) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(request.url);
  const localeParam = url.searchParams.get("locale");
  const locale: QuestionnaireLocale =
    localeParam && (QUESTIONNAIRE_LOCALES as string[]).includes(localeParam)
      ? (localeParam as QuestionnaireLocale)
      : "en";

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
