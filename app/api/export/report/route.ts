import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyAssessment } from "@/schema";
import { eq } from "drizzle-orm";
import { loadReportData } from "@/lib/pdf/load-report-data";
import { pdfLocale } from "@/lib/pdf/format";
import { ComplianceReport } from "@/lib/pdf/compliance-report";
import { rateLimit } from "@/lib/rate-limit";
import { getNis2FrameworkId } from "@/server/trpc/helpers/nis2-scope";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!rateLimit(`export:report:${session.user.id}`, 5, 60_000)) {
    return new Response("Too many requests", { status: 429 });
  }

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
    assessment.companyId !== session.companyId ||
    assessment.frameworkId !== nis2FrameworkId
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  const data = await loadReportData(assessmentId, locale);
  const buffer = await renderToBuffer(
    ComplianceReport({ data, locale }),
  );

  const date = new Date().toISOString().split("T")[0];

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="compliance-report-${date}.pdf"`,
    },
  });
}
