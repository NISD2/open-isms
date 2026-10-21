import {
  BookOpen,
  Braces,
  ChevronRight,
  ClipboardList,
  FileDown,
  FileText,
  ListTree,
  type LucideIcon,
  Sheet,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { ExportLink } from "@/components/export/ExportLink";
import { getPathname } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { mayExport } from "@/lib/export/access";
import { pdfLocale } from "@/lib/pdf/format";
import { api } from "@/lib/trpc/server";

interface FileSpec {
  readonly key: string;
  readonly icon: LucideIcon;
  readonly format: string;
  readonly needsAssessment: boolean;
}

/**
 * The export, one section per framework: what the company recorded under NIS 2 and what it
 * recorded under the GDPR, each as files of its own. The registers (assets, suppliers) belong to
 * the NIS 2 files; the GDPR files carry the supplier fields the GDPR walk records.
 */
const SECTIONS = [
  {
    framework: "nis2",
    files: [
      { key: "report", icon: ClipboardList, format: "PDF", needsAssessment: true },
      { key: "documents", icon: FileText, format: "PDF", needsAssessment: false },
      { key: "registers", icon: FileDown, format: "PDF", needsAssessment: false },
      { key: "table", icon: Sheet, format: "CSV", needsAssessment: true },
      { key: "data", icon: Braces, format: "JSON", needsAssessment: false },
    ],
  },
  {
    framework: "gdpr",
    files: [
      { key: "gdprDocuments", icon: FileText, format: "PDF", needsAssessment: false },
      { key: "gdprRecord", icon: ListTree, format: "CSV", needsAssessment: false },
      { key: "gdprData", icon: Braces, format: "JSON", needsAssessment: false },
    ],
  },
] as const satisfies ReadonlyArray<{
  framework: string;
  files: readonly FileSpec[];
}>;

type FileKey = (typeof SECTIONS)[number]["files"][number]["key"];

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
    case "gdprDocuments":
      return `/api/export/gdpr-documents?locale=${locale}`;
    case "gdprRecord":
      return `/api/export/gdpr-record?locale=${locale}`;
    case "gdprData":
      return `/api/export/gdpr-data?locale=${locale}`;
  }
};

/**
 * Everything the company recorded, as files to pass on, one section per framework. One card per
 * file, each a download link as a whole (ui-design principle 14). The routes check access
 * themselves, the billing state included; each link asks first where that would refuse
 * (`ExportLink`). Open to an account that must order first as well: a company's own records
 * always leave with it (`FREE_PORTAL_PATHS`).
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
        SECTIONS.map(({ framework, files }) => (
          <section
            key={framework}
            aria-labelledby={`export-${framework}`}
            className="mt-10"
          >
            <h2
              id={`export-${framework}`}
              className="text-xl font-semibold tracking-tight"
            >
              {t(`sections.${framework}.title`)}
            </h2>
            <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
              {t(`sections.${framework}.lead`)}
            </p>

            {framework === "nis2" && (
              <div className="relative mt-4 flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/[0.04] p-5 shadow-xs transition-colors hover:border-primary/60 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <BookOpen className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <ExportLink
                    href={getPathname({ href: "/export/gesamt", locale })}
                    className="font-semibold after:absolute after:inset-0 focus-visible:outline-none"
                  >
                    {t("complete.card.title")}
                  </ExportLink>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t("complete.card.text")}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  PDF
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </div>
            )}

            <ul className="mt-3 space-y-3">
              {files
                .filter((f) => !f.needsAssessment || assessment)
                .map((file) => {
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
                        <ExportLink
                          href={hrefOf(file.key, pdf, assessment?.id ?? null)}
                          download
                          className="font-medium after:absolute after:inset-0 focus-visible:outline-none"
                        >
                          {t(`files.${file.key}.title`)}
                        </ExportLink>
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
            {framework === "nis2" && !assessment ? (
              <p className="mt-4 text-sm text-muted-foreground">{t("noAssessment")}</p>
            ) : null}
          </section>
        ))
      )}
    </div>
  );
}
