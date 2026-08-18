import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyAssessment } from "@/schema";
import { eq } from "drizzle-orm";
import { loadReportData } from "@/lib/pdf/load-report-data";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!rateLimit(`export:csv:${session.user.id}`, 10, 60_000)) {
    return new Response("Too many requests", { status: 429 });
  }

  const assessmentId = request.nextUrl.searchParams.get("assessmentId");
  if (!assessmentId) {
    return new Response("Missing assessmentId", { status: 400 });
  }

  const assessment = await db.query.companyAssessment.findFirst({
    where: eq(companyAssessment.id, assessmentId),
  });
  if (!assessment || assessment.companyId !== session.companyId) {
    return new Response("Forbidden", { status: 403 });
  }

  const locale = request.nextUrl.searchParams.get("locale") ?? "en";
  const data = await loadReportData(assessmentId, locale);

  const headers = [
    "Category Code",
    "Category Name",
    "Requirement Code",
    "Requirement Title",
    "Priority",
    "Status",
    "Signed Off At",
    "Evidence Count",
    "Review Feedback",
  ];

  const rows: string[][] = [];
  for (const cat of data.categories) {
    for (const req of cat.requirements) {
      rows.push([
        cat.code,
        cat.name,
        req.code,
        req.title,
        req.priority,
        req.status,
        req.signedOffAt ? new Date(req.signedOffAt).toISOString() : "",
        String(req.evidence.length),
        req.reviewFeedback ?? "",
      ]);
    }
  }

  const csvLines = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ];

  // UTF-8 BOM for Excel compatibility with German umlauts
  const BOM = "\uFEFF";
  const csv = BOM + csvLines.join("\r\n");

  const date = new Date().toISOString().split("T")[0];

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="compliance-export-${date}.csv"`,
    },
  });
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
