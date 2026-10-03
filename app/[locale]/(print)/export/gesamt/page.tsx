import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CompleteExport } from "@/components/export/CompleteExport";
import { PrintButton } from "@/components/export/PrintButton";
import { getPathname, Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { db } from "@/lib/db";
import { mayExport } from "@/lib/export/access";
import { loadCompanyExport } from "@/lib/export/company-export";
import { exportNames } from "@/lib/export/value-names";
import { renderDocumentMarkdown } from "@/lib/mail/markdown";
import { pdfLocale } from "@/lib/pdf/format";
import { loadReportData } from "@/lib/pdf/load-report-data";
import { api } from "@/lib/trpc/server";
import { getNis2Assessment } from "@/server/trpc/helpers/nis2-scope";

/** A4 with margins, and the matrix's colours kept when printed. */
const PRINT_CSS = `
@page { size: A4; margin: 14mm 14mm 16mm; }
@media print {
  html, body { background: #fff !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  nextjs-portal, [data-sonner-toaster] { display: none !important; }
}`;

/**
 * Everything the company recorded on one long page, to read and to save as a PDF from the
 * browser's print window. Outside the portal's shell, so the sidebar never prints. Who may open
 * it is who may export (`mayExport`): review access, or management.
 */
export default async function CompleteExportPage() {
  const [session, localeTag] = await Promise.all([getSession(), getLocale()]);
  if (!session) redirect(getPathname({ href: "/auth/signin", locale: localeTag }));
  const companyId = session.companyId;
  if (!companyId || !mayExport(session)) {
    redirect(getPathname({ href: "/export", locale: localeTag }));
  }
  const locale = pdfLocale(localeTag);
  const mayWalk = mayWalkDurchgang(
    session.accessLevel,
    isPlatformAdmin(session.user.email),
  );

  const [data, assessment, names, gaps, t] = await Promise.all([
    loadCompanyExport(db, companyId),
    getNis2Assessment(db, companyId),
    exportNames(locale),
    // The open points come from the walk, which only a company that may walk has.
    mayWalk ? api.durchgang.gaps({ locale }) : Promise.resolve([]),
    getTranslations({ locale, namespace: "export.complete" }),
  ]);
  const [report, documents] = await Promise.all([
    assessment ? loadReportData(assessment.id, locale) : Promise.resolve(null),
    Promise.all(
      data.documents.map(async (doc) => ({
        doc,
        html: await renderDocumentMarkdown(doc.content ?? ""),
      })),
    ),
  ]);

  return (
    <div className="min-h-screen bg-muted/40 py-8 print:bg-transparent print:py-0">
      <style>{PRINT_CSS}</style>
      <div className="mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-4 px-4 print:hidden">
        <Link
          href="/export"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {t("back")}
        </Link>
        <div className="flex items-center gap-3">
          <p className="hidden max-w-[32ch] text-right text-xs text-muted-foreground sm:block">
            {t("printHint")}
          </p>
          <PrintButton label={t("print")} />
        </div>
      </div>
      <CompleteExport view={{ locale, data, report, names, documents, gaps }} />
    </div>
  );
}
