import { renderToBuffer } from "@react-pdf/renderer";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { attachment, exportAccess } from "@/lib/export/access";
import { loadCompanyExport } from "@/lib/export/company-export";
import { DocumentsDocument } from "@/lib/pdf/company-export";
import { pdfLocale } from "@/lib/pdf/format";

/** The documents the walk wrote as one PDF, each with who approved it and when. */
export async function GET(request: NextRequest) {
  const access = await exportAccess("documents", 5);
  if (!access.ok) return access.response;

  const locale = pdfLocale(request.nextUrl.searchParams.get("locale"));
  const data = await loadCompanyExport(db, access.companyId);
  const buffer = await renderToBuffer(DocumentsDocument({ data, locale }));
  return new Response(new Uint8Array(buffer), {
    headers: attachment(
      "application/pdf",
      locale === "de" ? "nis2-dokumente" : "nis2-documents",
      "pdf",
    ),
  });
}
