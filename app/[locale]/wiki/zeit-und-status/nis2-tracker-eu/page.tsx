import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { itemShot } from "@/components/durchgang/itemShots";
import { JsonLd } from "@/components/JsonLd";
import { Separator } from "@/components/ui/separator";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { WalkHow } from "@/components/wiki/WalkHow";
import { WalkPriceCard } from "@/components/wiki/WalkPriceCard";
import { WalkSteps } from "@/components/wiki/WalkSteps";
import { WikiAnswerHeader } from "@/components/wiki/WikiAnswerHeader";
import { WikiMoreLink } from "@/components/wiki/WikiMoreLink";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import {
  faqJsonLd,
  WikiExample,
  WikiFaq,
  type WikiQuestion,
  WikiSection,
  WikiSources,
} from "@/components/wiki/WikiSection";
import { Link } from "@/i18n/navigation";
import { isLocaleCode } from "@/lib/locale";
import {
  getRegistrationPortals,
  getTranspositionStatus,
  type RegistrationPortal,
  type TranspositionStatus,
} from "@/lib/registration-portals";
import { type Locale, pageAlternates, pageOg } from "@/lib/seo";

const SLUG = "wiki/zeit-und-status/nis2-tracker-eu";

const resolveLocale = (rawLocale: string): Locale =>
  isLocaleCode(rawLocale) ? rawLocale : "de";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations("info.euTracker");
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title,
    description,
    alternates: pageAlternates(SLUG, locale),
    ...pageOg({ slug: SLUG, locale, title, description, type: "article" }),
  };
}

/** How many of the latest laws in force the page lists. */
const LATEST = 5;

const faqKeys = ["1", "2", "3", "4"] as const;

/** The walk's registration step, whose screen shows the country and its authority. */
const REGISTRATION_STEP = "12.2";

/** The message key of each transposition status. */
const STATUS_KEY = {
  "in-force": "inForce",
  "bill-pending": "pending",
  drafting: "drafting",
  unknown: "unknown",
} as const satisfies Record<TranspositionStatus, string>;

function statusBadgeClasses(status: TranspositionStatus): string {
  switch (status) {
    case "in-force":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-400/30";
    case "bill-pending":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-400/30";
    case "drafting":
      return "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-900/40 dark:text-slate-300 dark:ring-slate-400/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * The per-country note in the reader's language, from the data file, falling back to the English
 * note where the language has none.
 */
function trackerNote(portal: RegistrationPortal, locale: Locale): string | undefined {
  const byLocale: Partial<Record<Locale, string | undefined>> = {
    de: portal.trackerNoteDe,
    en: portal.trackerNoteEn,
    fr: portal.trackerNoteFr,
    it: portal.trackerNoteIt,
    es: portal.trackerNoteEs,
    pl: portal.trackerNotePl,
  };
  return byLocale[locale] ?? portal.trackerNoteEn;
}

/** A calendar date as the reader's language writes it, with its day and month kept on one line. */
function formatDay(isoDate: string, locale: string): string {
  const parts = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(isoDate));
  return parts
    .map((part, i) =>
      part.type === "literal" &&
      parts[i - 1]?.type === "day" &&
      parts[i + 1]?.type === "month"
        ? part.value.replaceAll(" ", " ")
        : part.value,
    )
    .join("");
}

export default async function Nis2TrackerEuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const [t, w] = await Promise.all([
    getTranslations("info.euTracker"),
    getTranslations("info.wikiWalk"),
  ]);
  const shot = itemShot(REGISTRATION_STEP, rawLocale, t("walk.seeItAlt"));
  if (!shot) throw new Error(`The walk has no screenshot for step ${REGISTRATION_STEP}`);

  const { portals, lastUpdated } = getRegistrationPortals();
  const display = new Intl.DisplayNames([locale], { type: "region" });
  const countryName = (code: string): string => display.of(code) ?? code;

  const today = new Date();
  const rows = portals
    .map((p) => ({
      ...p,
      transpositionStatus: getTranspositionStatus(p, today),
      name: countryName(p.countryCode),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  const counts = {
    inForce: rows.filter((r) => r.transpositionStatus === "in-force").length,
    pending: rows.filter((r) => r.transpositionStatus === "bill-pending").length,
    drafting: rows.filter(
      (r) => r.transpositionStatus === "drafting" || r.transpositionStatus === "unknown",
    ).length,
  };
  const latest = rows
    .flatMap((r) =>
      r.transpositionStatus === "in-force" && r.entryIntoForce
        ? [{ name: r.name, code: r.countryCode, since: r.entryIntoForce }]
        : [],
    )
    .sort((a, b) => b.since.localeCompare(a.since))
    .slice(0, LATEST);

  const summary = {
    date: formatDay(lastUpdated, locale),
    inForce: counts.inForce,
    missing: new Intl.ListFormat(locale, { type: "conjunction" }).format(
      rows.filter((r) => r.transpositionStatus !== "in-force").map((r) => r.name),
    ),
  };
  const faq: WikiQuestion[] = faqKeys.map((key) => ({
    q: t(`faq.q${key}`),
    a: t(`faq.a${key}`, summary),
  }));

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="zeit-und-status"
          slug="nis2-tracker-eu"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType={t("audience")}
          citationKeys={["nis2"]}
          aboutKeys={["nis2"]}
          mentionsKeys={["bsig"]}
        />
        <JsonLd data={faqJsonLd(faq)} />

        <WikiAnswerHeader
          badge={t("badge")}
          title={t("title")}
          answer={t("subtitle", summary)}
          art="/images/wiki/nis2-europa.svg"
        />

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "de" || locale === "en" || locale === "nl" ? locale : "en"}
          lastReviewedAt={lastUpdated}
          sourceLocale="de"
        />

        <Separator />

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
            <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
              {counts.inForce}
            </div>
            <div className="text-sm text-muted-foreground">{t("counts.inForce")}</div>
          </div>
          <div className="rounded-lg border bg-amber-50/50 p-4 dark:bg-amber-950/20">
            <div className="text-2xl font-semibold text-amber-700 dark:text-amber-300">
              {counts.pending}
            </div>
            <div className="text-sm text-muted-foreground">{t("counts.pending")}</div>
          </div>
          <div className="rounded-lg border bg-slate-50/50 p-4 dark:bg-slate-900/20">
            <div className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
              {counts.drafting}
            </div>
            <div className="text-sm text-muted-foreground">{t("counts.drafting")}</div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{t("table.heading")}</h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("table.lead")}
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {(["country", "act", "authority", "csirt", "status"] as const).map(
                    (key) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {t(`table.${key}`)}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const note = trackerNote(r, locale);
                  return (
                    <tr key={r.countryCode} className="border-t">
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-baseline gap-2">
                          <span className="inline-flex h-5 items-center rounded bg-muted px-1.5 font-mono text-[10px] tracking-wide text-muted-foreground">
                            {r.countryCode}
                          </span>
                          {r.wikiSlug ? (
                            <Link
                              href={`/wiki/zeit-und-status/${r.wikiSlug}` as never}
                              className="font-medium hover:underline"
                            >
                              {r.name}
                            </Link>
                          ) : (
                            <span className="font-medium">{r.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm leading-relaxed">
                          {r.nationalLaw ?? "-"}
                        </div>
                        {note && (
                          <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {note}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-sm leading-relaxed">
                        {r.authority}
                      </td>
                      <td className="px-4 py-3 align-top text-sm leading-relaxed">
                        {r.csirt ?? "-"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${statusBadgeClasses(r.transpositionStatus)}`}
                        >
                          {t(`status.${STATUS_KEY[r.transpositionStatus]}`)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <WikiSection heading={t("latest.heading")} paragraphs={[t("latest.lead")]}>
          <ul className="space-y-1.5">
            {latest.map(({ name, code, since }) => (
              <li key={code} className="text-sm leading-relaxed">
                {t("latest.item", { country: name, date: formatDay(since, locale) })}
              </li>
            ))}
          </ul>
        </WikiSection>

        <WikiSection
          heading={t("why.heading")}
          paragraphs={t.raw("why.paragraphs") as string[]}
          law={t("why.law")}
        />

        <WikiSection
          heading={t("size.heading")}
          paragraphs={t.raw("size.paragraphs") as string[]}
        >
          <WikiMoreLink href="/wiki/zeit-und-status/nis2-umsetzung-europa">
            {t("size.link")}
          </WikiMoreLink>
        </WikiSection>

        <WikiExample
          heading={t("example.heading")}
          lead={t("example.lead")}
          items={t.raw("example.items") as string[]}
        />

        <WalkHow
          heading={t("walk.heading")}
          lead={t("walk.lead")}
          points={t.raw("walk.points") as string[]}
          shot={shot}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("deepDives.heading")}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rows
              .filter((r) => r.wikiSlug)
              .map((r) => (
                <Link
                  key={r.countryCode}
                  href={`/wiki/zeit-und-status/${r.wikiSlug}` as never}
                  className="rounded-md border p-3 transition hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="inline-flex h-5 items-center rounded bg-muted px-1.5 font-mono text-[10px] tracking-wide text-muted-foreground">
                      {r.countryCode}
                    </span>
                    <span className="text-sm font-medium">{r.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.authority}</p>
                </Link>
              ))}
          </div>
        </section>

        <WikiFaq heading={t("faq.heading")} items={faq} />

        <WikiSources
          heading={t("sources.heading")}
          items={t.raw("sources.items") as string[]}
        />

        <WalkSteps kind="national" />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
