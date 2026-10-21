import { renderToBuffer } from "@react-pdf/renderer";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { attachment, exportAccess, logDownload } from "@/lib/export/access";
import { loadCompanyExport } from "@/lib/export/company-export";
import { exportNames } from "@/lib/export/value-names";
import { RegistersDocument } from "@/lib/pdf/company-export";
import { exportLabels } from "@/lib/pdf/export-labels";
import { pdfLocale } from "@/lib/pdf/format";

/** The registers as one PDF: master data, assets, suppliers, risks, trainings, reviews, incidents. */
export async function GET(request: NextRequest) {
  const access = await exportAccess("registers", 5);
  if (!access.ok) return access.response;

  const locale = pdfLocale(request.nextUrl.searchParams.get("locale"));
  const [data, names] = await Promise.all([
    loadCompanyExport(db, access.companyId),
    exportNames(locale),
  ]);
  const buffer = await renderToBuffer(RegistersDocument({ data, locale, names }));
  await logDownload(request, access);
  return new Response(new Uint8Array(buffer), {
    headers: attachment("application/pdf", exportLabels(locale).registers.file, "pdf"),
  });
}
