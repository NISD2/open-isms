import { renderToBuffer } from "@react-pdf/renderer";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { attachment, exportAccess } from "@/lib/export/access";
import { loadCompanyExport } from "@/lib/export/company-export";
import { exportNames } from "@/lib/export/value-names";
import { DocumentsDocument } from "@/lib/pdf/company-export";
import { exportLabels } from "@/lib/pdf/export-labels";
import { pdfLocale } from "@/lib/pdf/format";

/** The documents the walk wrote as one PDF, each with who approved it and when. */
export async function GET(request: NextRequest) {
  const access = await exportAccess("documents", 5);
  if (!access.ok) return access.response;

  const locale = pdfLocale(request.nextUrl.searchParams.get("locale"));
  const [data, names] = await Promise.all([
    loadCompanyExport(db, access.companyId),
    exportNames(locale),
  ]);
  const buffer = await renderToBuffer(
    DocumentsDocument({ data, framework: "nis2", locale, names }),
  );
  return new Response(new Uint8Array(buffer), {
    headers: attachment(
      "application/pdf",
      exportLabels(locale).documents.file.nis2,
      "pdf",
    ),
  });
}
