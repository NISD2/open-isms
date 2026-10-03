import { renderToBuffer } from "@react-pdf/renderer";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { attachment, exportAccess } from "@/lib/export/access";
import { ComplianceReport } from "@/lib/pdf/compliance-report";
import { pdfLocale } from "@/lib/pdf/format";
import { loadReportData } from "@/lib/pdf/load-report-data";
import { companyAssessment } from "@/schema";
import { getNis2FrameworkId } from "@/server/trpc/helpers/nis2-scope";

export async function GET(request: NextRequest) {
  const access = await exportAccess("report", 5);
  if (!access.ok) return access.response;

  const assessmentId = request.nextUrl.searchParams.get("assessmentId");
  const locale = pdfLocale(request.nextUrl.searchParams.get("locale"));

  if (!assessmentId) {
    return new Response("Missing assessmentId", { status: 400 });
  }

  // Authorization: must belong to the same company as the assessment
  // NIS 2 only. The UI no longer offers a non-NIS 2 assessment here, but the
  // id arrives from the query string, so an old bookmark or a hand-built URL
  // would still produce a GDPR / AI Act / CRA export for a tenant who owns it.
  const nis2FrameworkId = await getNis2FrameworkId(db);
  const assessment = await db.query.companyAssessment.findFirst({
    where: eq(companyAssessment.id, assessmentId),
  });
  if (
    !assessment ||
    assessment.companyId !== access.companyId ||
    assessment.frameworkId !== nis2FrameworkId
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  const data = await loadReportData(assessmentId, locale);
  const buffer = await renderToBuffer(ComplianceReport({ data, locale }));
  return new Response(new Uint8Array(buffer), {
    headers: attachment("application/pdf", "compliance-report", "pdf"),
  });
}
