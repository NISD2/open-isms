import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyAssessment } from "@/schema";
import { eq } from "drizzle-orm";
import { loadReportData } from "@/lib/pdf/load-report-data";
import { ComplianceReport } from "@/lib/pdf/compliance-report";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!rateLimit(`export:report:${session.user.id}`, 5, 60_000)) {
    return new Response("Too many requests", { status: 429 });
  }

  const assessmentId = request.nextUrl.searchParams.get("assessmentId");
  const locale = request.nextUrl.searchParams.get("locale") ?? "en";

  if (!assessmentId) {
    return new Response("Missing assessmentId", { status: 400 });
  }

  // Authorization: must belong to the same company as the assessment
  const assessment = await db.query.companyAssessment.findFirst({
    where: eq(companyAssessment.id, assessmentId),
  });
  if (!assessment || assessment.companyId !== session.companyId) {
    return new Response("Forbidden", { status: 403 });
  }

  const data = await loadReportData(assessmentId);
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
