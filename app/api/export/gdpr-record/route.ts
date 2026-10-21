import type { NextRequest } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { attachment, exportAccess } from "@/lib/export/access";
import { exportLabels } from "@/lib/pdf/export-labels";
import { pdfLocale } from "@/lib/pdf/format";
import { recordCsv } from "@/lib/processing-activities/record-csv";
import { recordLines, throughLine } from "@/lib/processing-activities/record-lines";
import {
  activitiesOf,
  controllerOf,
} from "@/server/trpc/helpers/processing-activity-record";

/**
 * The record of processing activities as a table, for the supervisory authority (Art. 30(4)
 * GDPR): the same lines as the register page's download (`recordLines`), in the language the
 * export page is in. The day it is dated is the Berlin day, not the server's.
 */
export async function GET(request: NextRequest) {
  const access = await exportAccess("gdpr-record", 5);
  if (!access.ok) return access.response;

  const locale = pdfLocale(request.nextUrl.searchParams.get("locale"));
  const [say, basis, format, controller, activities] = await Promise.all([
    getTranslations({ locale, namespace: "processingActivities" }),
    getTranslations({ locale, namespace: "suppliers.transferMechanism" }),
    getFormatter({ locale }),
    controllerOf(db, access.companyId),
    activitiesOf(db, access.companyId),
  ]);
  const receivers = new Map(
    activities.map((a) => [
      a.id,
      a.suppliers.map((s) => throughLine(say, basis, s.name, s.through)),
    ]),
  );
  const csv = recordCsv(
    recordLines(
      {
        say,
        day: (date) =>
          format.dateTime(new Date(date), {
            dateStyle: "long",
            timeZone: "Europe/Berlin",
          }),
      },
      controller,
      activities,
      (id) => receivers.get(String(id)) ?? [],
    ),
  );
  return new Response(csv, {
    headers: attachment(
      "text/csv; charset=utf-8",
      exportLabels(locale).gdprFiles.record,
      "csv",
    ),
  });
}
