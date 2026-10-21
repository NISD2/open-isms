import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { attachment, exportAccess } from "@/lib/export/access";
import { loadGdprExport } from "@/lib/export/gdpr-export";
import { exportLabels } from "@/lib/pdf/export-labels";
import { pdfLocale } from "@/lib/pdf/format";

/** Everything the company recorded under the GDPR, as one JSON file: for its own tools, or to take elsewhere. */
export async function GET(request: NextRequest) {
  const access = await exportAccess("gdpr-data", 5);
  if (!access.ok) return access.response;

  const locale = pdfLocale(request.nextUrl.searchParams.get("locale"));
  const data = await loadGdprExport(db, access.companyId);
  return new Response(JSON.stringify(data, null, 2), {
    headers: attachment(
      "application/json; charset=utf-8",
      exportLabels(locale).gdprFiles.data,
      "json",
    ),
  });
}
