import { getTranslations } from "next-intl/server";
import { NIS2_ASSET_TYPES } from "@/lib/compliance/asset-types";
import { RISK_LEVEL_TEXT, RISK_LEVELS } from "@/lib/compliance/bsi-200-3";
import {
  enteredDay,
  gapLines,
  ONGOING_COPY,
  type ShownGap,
  withPlanSlot,
} from "@/lib/durchgang";
import { fromScale, levelOf } from "@/lib/durchgang/ratings";
import type { CompanyExport } from "@/lib/export/company-export";
import { riskCounts } from "@/lib/export/risk-cells";
import {
  answerRow,
  fieldRows,
  shown,
  statusCounts,
  statusLabel,
  titleOf,
  type Words,
} from "@/lib/export/rows";
import type { ExportNames } from "@/lib/export/value-names";
import { exportLabels } from "@/lib/pdf/export-labels";
import { formatReportDate, formatSigner, type PdfLocale } from "@/lib/pdf/format";
import type { ReportData } from "@/lib/pdf/load-report-data";
import { getReportLabels } from "@/lib/pdf/policy-labels";
import type { RouterOutputs } from "@/lib/trpc/client";
import { Entry, Fields, Group, Section, Table } from "./layout";
import { RiskCounts } from "./RiskCounts";

export interface CompleteView {
  /** The walk's language, which the whole export is written in. */
  readonly locale: PdfLocale;
  readonly data: CompanyExport;
  /** The NIS 2 requirements by category; null without an assessment. */
  readonly report: ReportData | null;
  readonly names: ExportNames;
  /** Each walk document with its text rendered on the server, without raw HTML. */
  readonly documents: ReadonlyArray<{
    readonly doc: CompanyExport["documents"][number];
    readonly html: string;
  }>;
  /** What the company's own answers leave open; null when it does not walk, so nothing worked it out. */
  readonly gaps: readonly ShownGap[] | null;
  /** Who takes care of each open point and by when, by step. */
  readonly measures: RouterOutputs["durchgang"]["measures"];
}

/**
 * Who takes care of an open point and by when, as one line; null when neither is set. An owner
 * who has left the company is named only as gone.
 */
function planLine(
  measure: CompleteView["measures"][number] | undefined,
  locale: PdfLocale,
  t: (key: "owner" | "due" | "formerMember") => string,
): string | null {
  const owner =
    measure?.ownerName?.trim() ||
    measure?.ownerEmail ||
    (measure?.assignedTo ? t("formerMember") : null);
  const parts = [
    ...(owner ? [`${t("owner")}: ${owner}`] : []),
    ...(measure?.targetDate
      ? [`${t("due")}: ${enteredDay(locale, measure.targetDate)}`]
      : []),
  ];
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** The presets in their order (processes first), rooms last, anything typed in after them. */
const TYPE_ORDER: readonly string[] = [...NIS2_ASSET_TYPES, "room"];
const typeRank = (type: string) =>
  TYPE_ORDER.includes(type) ? TYPE_ORDER.indexOf(type) : TYPE_ORDER.length;

const LEVEL_ORDER: readonly string[] = ["critical", "high", "medium", "low"];
const levelRank = (level: string | null) =>
  level !== null && LEVEL_ORDER.includes(level)
    ? LEVEL_ORDER.indexOf(level)
    : LEVEL_ORDER.length;

/**
 * An asset without its false flags. Every yes/no column on an asset defaults to false, so false
 * mostly means nobody was asked: "Backup: Nein" or "MFA: Nein" on a process or a room would read as
 * a gap that is none. Where the walk asks (the second factor), "Was noch offen ist" names the
 * programs without one.
 */
const withoutNo = (row: object): object =>
  Object.fromEntries(Object.entries(row).filter(([, value]) => value !== false));

/** Groups rows by a key, in the order `rank` gives the keys. */
function groupBy<T>(
  rows: readonly T[],
  keyOf: (row: T) => string,
  rank: (key: string) => number,
): [string, T[]][] {
  const keys = [...new Set(rows.map(keyOf))].toSorted(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b),
  );
  return keys.map((key) => [key, rows.filter((row) => keyOf(row) === key)]);
}

/**
 * Everything one company recorded, as one long document to read on screen and save as a PDF:
 * the cover with its master data, the status of every requirement, what is still open, the walk's
 * documents in full, the risk matrix and register, every register, the answers typed per area, and
 * the duties that stay with the company. The data is the JSON export's (`loadCompanyExport`), so
 * the two never disagree; fields and values are named as the PDFs name them (`lib/export/rows`).
 */
export async function CompleteExport({ view }: { view: CompleteView }) {
  const { locale, data, report, names, documents, gaps, measures } = view;
  const measureOf = new Map(measures.map((m) => [m.code, m]));
  // One language throughout: the walk's, which is German, English or Czech.
  const [t, tGaps, tScreens] = await Promise.all([
    getTranslations({ locale, namespace: "export.complete" }),
    getTranslations({ locale, namespace: "durchgang.ui.approve.gaps" }),
    getTranslations({ locale, namespace: "durchgang.items.7_3.screens" }),
  ]);
  const words: Words = { labels: exportLabels(locale), names, locale };
  const labels = words.labels;
  const reportLabels = getReportLabels(locale);
  const date = (value: Date | null) => (value ? formatReportDate(value, locale) : null);
  const entries = (count: number) => t("entries", { count });
  const ongoing = ONGOING_COPY.parse(tScreens.raw("ongoing"));
  const requirements = report?.categories.flatMap((c) => c.requirements) ?? [];
  const answered =
    report?.categories.filter((c) => Object.keys(c.intakeAnswers ?? {}).length > 0) ?? [];
  // Highest level first: in the 200-3 matrix the score alone does not order the levels.
  const risks = data.risks
    .map((risk) => {
      const rating = fromScale(risk.likelihood, risk.impact);
      return { risk, level: rating ? levelOf(rating) : null };
    })
    .toSorted(
      (a, b) =>
        (b.level ? RISK_LEVELS.indexOf(b.level) : -1) -
          (a.level ? RISK_LEVELS.indexOf(a.level) : -1) ||
        b.risk.riskScore - a.risk.riskScore,
    );

  const sections = [
    ["status", t("sections.status")],
    ["open", t("sections.open")],
    ["documents", t("sections.documents")],
    ["risks", t("sections.risks")],
    ["assets", t("sections.assets")],
    ["suppliers", t("sections.suppliers")],
    ["trainings", t("sections.trainings")],
    ["reviews", t("sections.reviews")],
    ["incidents", t("sections.incidents")],
    ["answers", t("sections.answers")],
    ["ongoing", ongoing.title],
  ] as const;

  return (
    <article className="mx-auto max-w-[210mm] bg-background px-10 py-12 shadow-sm ring-1 ring-border print:max-w-none print:p-0 print:shadow-none print:ring-0">
      <header>
        <p className="text-sm font-medium text-muted-foreground">{t("eyebrow")}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-3 text-xl">{data.company.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("asOf", { date: formatReportDate(data.exportedAt, locale) })}
        </p>
        <div className="mt-8">
          <h3 className="text-sm font-semibold">{labels.records.company}</h3>
          <Fields rows={fieldRows("company", data.company, words)} />
        </div>
        <nav className="mt-10 break-inside-avoid">
          <h3 className="text-sm font-semibold">{t("contents")}</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-7 text-sm">
            {sections.map(([id, title]) => (
              <li key={id}>
                <a href={`#${id}`} className="hover:underline">
                  {title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <Section
        id="status"
        title={t("sections.status")}
        lead={
          report
            ? t("statusLead", {
                total: report.totalRequirements,
                ...statusCounts(requirements),
              })
            : undefined
        }
      >
        {report?.categories.map((category) => (
          <Group
            key={category.code}
            title={category.name}
            count={entries(category.requirements.length)}
          >
            <Table
              head={[t("requirement"), t("state"), t("signedOff")]}
              widths={["w-[46%]", "w-[24%]", "w-[30%]"]}
              rows={category.requirements.map((req) => [
                <span key="title">
                  <span className="tabular-nums text-muted-foreground">{req.code}</span>{" "}
                  {req.title}
                  {req.notApplicable?.reason && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {t("notApplicable")}: {req.notApplicable.reason}
                    </span>
                  )}
                  {/* What the walk recorded for it, dated, e.g. the risk method adopted at
                      2.1: an auditor reads the decision, not only that it waits. */}
                  {req.notes?.split("\n").map((line, i) => (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: an append-only trail, never reordered; one step done twice on a day repeats a line word for word
                      key={i}
                      className="mt-0.5 block text-xs text-muted-foreground"
                    >
                      {line}
                    </span>
                  ))}
                </span>,
                statusLabel(req, reportLabels),
                [
                  formatSigner(
                    req.signedOffByName,
                    shown("approverRole", req.signedOffRole, words),
                  ),
                  date(req.signedOffAt),
                ]
                  .filter(Boolean)
                  .join(", "),
              ])}
            />
          </Group>
        )) ?? <p className="text-sm text-muted-foreground">{t("none")}</p>}
        {requirements.some((r) => r.evidence.length > 0) && (
          <Group title={t("evidence")} count="">
            <ul className="mt-2 space-y-1 text-sm">
              {requirements.flatMap((req) =>
                req.evidence.map((file) => (
                  <li key={`${req.code}:${file.fileName}`}>
                    <span className="tabular-nums text-muted-foreground">{req.code}</span>{" "}
                    {file.fileName}, {date(file.uploadedAt)}
                  </li>
                )),
              )}
            </ul>
          </Group>
        )}
      </Section>

      <Section
        id="open"
        title={t("sections.open")}
        lead={gaps === null ? undefined : t("openLead")}
      >
        {gaps === null ? (
          <p className="text-sm text-muted-foreground">{t("gapsNotWorkedOut")}</p>
        ) : gaps.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noGaps")}</p>
        ) : (
          <ul className="space-y-2 rounded-xl border border-amber-300/70 bg-amber-50/70 p-5 text-sm dark:border-amber-500/40 dark:bg-amber-950/20">
            {withPlanSlot(gapLines(gaps, tGaps)).map(({ line, showsPlan }) => {
              const plan = showsPlan
                ? planLine(measureOf.get(line.code), locale, tGaps)
                : null;
              return (
                <li key={`${line.code}:${line.text}`} className="flex gap-3">
                  <span className="min-w-0 flex-1">
                    {line.text}
                    {plan && <span className="block text-muted-foreground">{plan}</span>}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {t("step", { code: line.code })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section id="documents" title={t("sections.documents")}>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{labels.documents.empty}</p>
        ) : (
          documents.map(({ doc, html }) => (
            <div
              key={doc.type}
              className="mt-12 break-before-page first:mt-0 first:break-before-auto"
            >
              <h3 className="text-xl font-semibold tracking-tight">{doc.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {doc.status === "approved"
                  ? t("approved", {
                      signer:
                        formatSigner(
                          doc.approver,
                          shown("approverRole", doc.approverRole, words),
                        ) ?? "",
                      date: date(doc.approvedAt) ?? "",
                    })
                  : labels.documents.draft}
              </p>
              <div
                // The text opens with its own title, which the heading above already shows.
                className="prose prose-sm mt-5 max-w-none dark:prose-invert [&>h1:first-child]:hidden"
                // Rendered on the server from the stored text, without raw HTML.
                // biome-ignore lint/security/noDangerouslySetInnerHtml: see above
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          ))
        )}
      </Section>

      <Section id="risks" title={t("sections.risks")} lead={t("matrixLead")}>
        <div className="break-inside-avoid">
          <RiskCounts locale={locale} counts={riskCounts(data.risks)} />
        </div>
        <div className="mt-10">
          <Table
            head={[t("risk"), t("level"), t("treatment"), t("note")]}
            widths={["w-[40%]", "w-[13%]", "w-[15%]", "w-[32%]"]}
            rows={risks.map(({ risk, level }) => [
              risk.title,
              level ? RISK_LEVEL_TEXT[locale][level].label : String(risk.riskScore),
              shown("treatment", risk.treatment, words) ?? "",
              risk.treatmentDescription ?? "",
            ])}
          />
        </div>
      </Section>

      <Section
        id="assets"
        title={t("sections.assets")}
        lead={entries(data.assets.length)}
      >
        {groupBy(data.assets, (a) => a.type, typeRank).map(([type, assets]) => (
          <Group
            key={type}
            title={shown("type", type, words) ?? type}
            count={entries(assets.length)}
          >
            {assets.map((a) => (
              <Entry
                key={a.name}
                title={a.name}
                lead={a.description}
                rows={[
                  ...fieldRows("asset", withoutNo(a), words, ["type", "description"]),
                  [labels.providers, shown("providers", a.providers, words)],
                ]}
              />
            ))}
          </Group>
        ))}
      </Section>

      <Section
        id="suppliers"
        title={t("sections.suppliers")}
        lead={entries(data.suppliers.length)}
      >
        {groupBy(data.suppliers, (s) => s.riskLevel ?? "", levelRank).map(
          ([level, suppliers]) => (
            <Group
              key={level}
              title={shown("riskLevel", level, words) ?? t("none")}
              count={entries(suppliers.length)}
            >
              {suppliers.map((s) => (
                <Entry
                  key={s.name}
                  title={s.name}
                  lead={s.description}
                  rows={fieldRows("supplier", s, words, ["description", "riskLevel"])}
                />
              ))}
            </Group>
          ),
        )}
      </Section>

      {(
        [
          ["trainings", "training", data.trainings, t("none")],
          ["reviews", "managementReview", data.managementReviews, t("none")],
          ["incidents", "incident", data.incidents, t("noIncidents")],
        ] as const
      ).map(([id, record, rows, empty]) => (
        <Section key={id} id={id} title={t(`sections.${id}`)}>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{empty}</p>
          ) : (
            rows.map((row, i) => (
              <Entry
                // biome-ignore lint/suspicious/noArrayIndexKey: register rows carry no id here
                key={i}
                title={titleOf(row, words.names)}
                rows={fieldRows(record, row, words, ["title"])}
              />
            ))
          )}
        </Section>
      ))}

      <Section id="answers" title={t("sections.answers")}>
        {answered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("none")}</p>
        ) : (
          answered.map((category) => (
            <Group key={category.code} title={category.name} count="">
              <Fields
                rows={Object.entries(category.intakeAnswers ?? {}).map(([key, value]) =>
                  answerRow(category.code, key, value, names.answers, locale),
                )}
              />
            </Group>
          ))
        )}
      </Section>

      <Section id="ongoing" title={ongoing.title} lead={ongoing.lead}>
        {ongoing.groups.map((group) => (
          <Group key={group.title} title={group.title} count="">
            <ul className="mt-2 space-y-3 text-sm">
              {group.items.map((duty) => (
                <li key={duty.name} className="break-inside-avoid">
                  <p className="font-medium">{duty.name}</p>
                  <p className="text-muted-foreground">{duty.detail}</p>
                  <p className="text-xs text-muted-foreground">{duty.basis}</p>
                </li>
              ))}
            </ul>
          </Group>
        ))}
      </Section>
    </article>
  );
}
