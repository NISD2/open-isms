import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { toCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { attachment, exportAccess, logDownload } from "@/lib/export/access";
import { statusLabel } from "@/lib/export/rows";
import { loadReportData } from "@/lib/pdf/load-report-data";
import { getReportLabels } from "@/lib/pdf/policy-labels";
import { companyAssessment } from "@/schema";
import { getNis2FrameworkId } from "@/server/trpc/helpers/nis2-scope";

export async function GET(request: NextRequest) {
  const access = await exportAccess("csv", 10);
  if (!access.ok) return access.response;

  const assessmentId = request.nextUrl.searchParams.get("assessmentId");
  if (!assessmentId) {
    return new Response("Missing assessmentId", { status: 400 });
  }

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

  const locale = request.nextUrl.searchParams.get("locale") ?? "en";
  const data = await loadReportData(assessmentId, locale);
  const labels = getReportLabels(locale);

  const headers = [
    "Category Code",
    "Category Name",
    "Requirement Code",
    "Requirement Title",
    "Priority",
    "Status",
    "Walkthrough Notes",
    "Signed Off At",
    "Evidence Count",
    "Review Feedback",
  ];

  const rows = data.categories.flatMap((cat) =>
    cat.requirements.map((req) => [
      cat.code,
      cat.name,
      req.code,
      req.title,
      req.priority,
      statusLabel(req, labels),
      req.notes ?? "",
      req.signedOffAt ? new Date(req.signedOffAt).toISOString() : "",
      String(req.evidence.length),
      req.reviewFeedback ?? "",
    ]),
  );

  // UTF-8 BOM for Excel compatibility with German umlauts
  const BOM = "\uFEFF";
  const csv = BOM + toCsv([headers, ...rows]);
  await logDownload(request, access);
  return new Response(csv, {
    headers: attachment("text/csv; charset=utf-8", "compliance-export", "csv"),
  });
}
