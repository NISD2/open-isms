import {
  Braces,
  ChevronRight,
  ClipboardList,
  FileDown,
  FileText,
  type LucideIcon,
  Sheet,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { mayExport } from "@/lib/export/access";
import { pdfLocale } from "@/lib/pdf/format";
import { api } from "@/lib/trpc/server";

const FILES = [
  { key: "report", icon: ClipboardList, format: "PDF", needsAssessment: true },
  { key: "documents", icon: FileText, format: "PDF", needsAssessment: false },
  { key: "registers", icon: FileDown, format: "PDF", needsAssessment: false },
  { key: "table", icon: Sheet, format: "CSV", needsAssessment: true },
  { key: "data", icon: Braces, format: "JSON", needsAssessment: false },
] as const satisfies ReadonlyArray<{
  key: string;
  icon: LucideIcon;
  format: string;
  needsAssessment: boolean;
}>;

type FileKey = (typeof FILES)[number]["key"];

/** Where each file downloads from; the two requirement files are per NIS 2 assessment. */
const hrefOf = (key: FileKey, locale: string, assessmentId: string | null): string => {
  const assessment = assessmentId ? `assessmentId=${assessmentId}&` : "";
  switch (key) {
    case "report":
      return `/api/export/report?${assessment}locale=${locale}`;
    case "table":
      return `/api/export/csv?${assessment}locale=${locale}`;
    case "documents":
      return `/api/export/documents?locale=${locale}`;
    case "registers":
      return `/api/export/registers?locale=${locale}`;
    case "data":
      return "/api/export/data";
  }
};

/**
 * Everything the company recorded, as files to pass on. One card per file, each a download
 * link as a whole (ui-design principle 14). The routes check access themselves; the page only
 * says who may use it.
 */
export default async function ExportPage() {
  const [t, locale, session, assessment] = await Promise.all([
    getTranslations("export"),
    getLocale(),
    getSession(),
    api.assessment.getActiveAssessment(),
  ]);
  const allowed = session ? mayExport(session) : false;
  const pdf = pdfLocale(locale);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-3 max-w-[62ch] text-muted-foreground">{t("lead")}</p>

      {!allowed ? (
        <p className="mt-8 text-sm text-muted-foreground">{t("noAccess")}</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {FILES.filter((f) => !f.needsAssessment || assessment).map((file) => {
            const Icon = file.icon;
            return (
              <li
                key={file.key}
                className="relative flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-xs transition-colors hover:border-primary/40 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <a
                    href={hrefOf(file.key, pdf, assessment?.id ?? null)}
                    download
                    className="font-medium after:absolute after:inset-0 focus-visible:outline-none"
                  >
                    {t(`files.${file.key}.title`)}
                  </a>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t(`files.${file.key}.text`)}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  {file.format}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </li>
            );
          })}
        </ul>
      )}
      {allowed && !assessment ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("noAssessment")}</p>
      ) : null}
    </div>
  );
}
