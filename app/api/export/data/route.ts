import { db } from "@/lib/db";
import { attachment, exportAccess, logDownload } from "@/lib/export/access";
import { loadCompanyExport } from "@/lib/export/company-export";

/** Everything the company recorded, as one JSON file: for its own tools, or to take elsewhere. */
export async function GET(request: Request) {
  const access = await exportAccess("data", 5);
  if (!access.ok) return access.response;

  const data = await loadCompanyExport(db, access.companyId);
  await logDownload(request, access);
  return new Response(JSON.stringify(data, null, 2), {
    headers: attachment("application/json; charset=utf-8", "nis2-daten", "json"),
  });
}
