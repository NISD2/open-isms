import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import {
  QUESTIONNAIRE_LOCALES,
  type QuestionnaireLocale,
  SupplierQuestionnaireDocument,
} from "@/lib/pdf/supplier-questionnaire";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const requested = url.searchParams.get("locale");
  const locale: QuestionnaireLocale =
    requested && (QUESTIONNAIRE_LOCALES as string[]).includes(requested)
      ? (requested as QuestionnaireLocale)
      : "en";

  try {
    const buffer = await renderToBuffer(SupplierQuestionnaireDocument({ locale }));
    const filename =
      locale === "de"
        ? "nis2-lieferanten-fragebogen.pdf"
        : "nis2-supplier-questionnaire.pdf";

    return new Response(new Uint8Array(buffer), {
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
