import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/client-ip";
import {
  QUESTIONNAIRE_LOCALES,
  type QuestionnaireLocale,
  SupplierQuestionnaireDocument,
} from "@/lib/pdf/supplier-questionnaire";
import { rateLimitPublicRoute } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  // Audit F-1 (2026-09-10): unauthenticated and CPU-bound. The response is
  // cacheable, but only `locale` changes the output, so any unknown query
  // parameter produces a fresh cache key and a fresh render. Every other
  // export route in the app throttles; this one had nothing.
  if (!rateLimitPublicRoute("questionnaire:pdf", getClientIp(request.headers), 10)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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
