import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ComponentProps } from "react";
import { itemShot } from "@/components/durchgang/itemShots";
import { JsonLd } from "@/components/JsonLd";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { SourceText } from "@/components/wiki/SourceText";
import { WalkHow } from "@/components/wiki/WalkHow";
import { WalkPriceCard } from "@/components/wiki/WalkPriceCard";
import { WalkSteps } from "@/components/wiki/WalkSteps";
import { WikiAnswerHeader } from "@/components/wiki/WikiAnswerHeader";
import { WikiMoreLink } from "@/components/wiki/WikiMoreLink";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { WikiPartnerStrip } from "@/components/wiki/WikiPartnerStrip";
import { Link } from "@/i18n/navigation";
import { wikiLocale } from "@/lib/content/wiki-locale";
import { TROUBLESHOOTING_ENTRIES } from "@/lib/content/wiki-toc-troubleshooting";
import { WALK_DATE_LOCALE } from "@/lib/durchgang";
import {
  berlinDay,
  type DeadlineState,
  deadlineState,
  getRegistrationPortals,
  type RegistrationPortal,
} from "@/lib/registration-portals";
import { pageAlternates, pageOg } from "@/lib/seo";

const SLUG = "nis2-frist-verpasst";
const PATH = `wiki/troubleshooting/${SLUG}`;

/** The languages this page is written in, from its own TOC entry. */
const textLocales = TROUBLESHOOTING_ENTRIES.find(
  (entry) => entry.slug === SLUG,
)?.textLocales;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("missedDeadline");
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title,
    description,
    alternates: pageAlternates(PATH, locale, textLocales),
    ...pageOg({ slug: PATH, locale, title, description, type: "article" }),
  };
}

const stepKeys = ["find", "register", "record", "measures", "management"] as const;
// "when" first: "bis wann" and "Frist" are what people search (Keyword Planner, 20.10.2026).
const faqKeys = ["when", "q1", "q2", "q3", "q4"] as const;

/** The walk's registration step, whose screen shows the country and its authority. */
const REGISTRATION_STEP = "12.2";

/** A passed deadline reads in full strength; one ahead or none recorded stays quiet. */
const deadlineTone = (state: DeadlineState): string =>
  state.kind === "passed"
    ? "font-medium text-foreground"
    : "font-normal text-muted-foreground";

/**
 * The language the page's text is in: German on the German page, English everywhere else, since
 * the page is written in those two only (`textLocales`). Country names and dates follow the text.
 */
const textLanguage = (locale: string): "de" | "en" => (locale === "de" ? "de" : "en");

/** Germany's row leads to the step by step page for the BSI; every other country to its status page. */
const countryPage = (portal: RegistrationPortal): string | null =>
  portal.countryCode === "DE"
    ? "/wiki/troubleshooting/nis2-registrierung-verpasst"
    : portal.wikiSlug
      ? `/wiki/zeit-und-status/${portal.wikiSlug}`
      : null;

export default async function MissedDeadlinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = wikiLocale(rawLocale);
  const language = textLanguage(rawLocale);
  const [t, info, w] = await Promise.all([
    getTranslations("missedDeadline"),
    getTranslations({ locale: language, namespace: "info" }),
    getTranslations("info.wikiWalk"),
  ]);
  const shot = itemShot(REGISTRATION_STEP, rawLocale, t("walk.seeItAlt"));
  if (!shot) throw new Error(`The walk has no screenshot for step ${REGISTRATION_STEP}`);

  const data = getRegistrationPortals(language);
  // Dates in the data are calendar days; formatted in UTC they stay the same day, as in the walk.
  const day = new Intl.DateTimeFormat(WALK_DATE_LOCALE[language], {
    timeZone: "UTC",
    dateStyle: "long",
  });
  const formatDay = (iso: string) => day.format(new Date(iso));
  const countryName = (code: string) =>
    info(`registrationPortals.countries.${code}` as Parameters<typeof info>[0]);
  const today = berlinDay(new Date());
  const rows = data.portals
    .map((portal) => ({
      portal,
      name: countryName(portal.countryCode),
      state: deadlineState(portal, today),
    }))
    .toSorted((a, b) => a.name.localeCompare(b.name, language));
  const stateLabel = (state: DeadlineState) =>
    state.kind === "none"
      ? t("countries.state.none")
      : t(`countries.state.${state.kind}`, { date: formatDay(state.deadline) });

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="troubleshooting"
          slug={SLUG}
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung und IT-Verantwortliche im Mittelstand"
          citationKeys={["nis2"]}
          aboutKeys={["nis2"]}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqKeys.map((key) => ({
              "@type": "Question",
              name: t(`faq.${key}.q`),
              acceptedAnswer: { "@type": "Answer", text: t(`faq.${key}.a`) },
            })),
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: t("steps.heading"),
            description: t("steps.description"),
            step: stepKeys.map((key, index) => ({
              "@type": "HowToStep",
              position: index + 1,
              name: t(`steps.items.${key}.title`),
              text: t(`steps.items.${key}.description`),
            })),
          }}
        />

        <WikiAnswerHeader
          badge={t("badge")}
          title={t("title")}
          answer={t("subtitle")}
          shot
        />

        <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : locale} />

        <WikiPartnerStrip />

        <Separator />

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("countries.heading")}
            </h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("countries.lead", { date: formatDay(data.lastUpdated) })}
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("countries.columns.country")}</TableHead>
                <TableHead>{t("countries.columns.authority")}</TableHead>
                <TableHead className="hidden sm:table-cell">
                  {t("countries.columns.deadline")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ portal, name, state }) => {
                const page = countryPage(portal);
                return (
                  <TableRow key={portal.countryCode}>
                    <TableCell className="w-[38%] align-top font-medium whitespace-normal sm:w-auto">
                      {page ? (
                        <Link
                          // Wiki pathnames are built at runtime (wikiPathnames), so the typed union cannot list them.
                          href={page as ComponentProps<typeof Link>["href"]}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {name}
                        </Link>
                      ) : (
                        name
                      )}
                      {/* On a phone the deadline sits under the country, so it never scrolls out of view. */}
                      <span
                        className={`mt-1 block text-xs sm:hidden ${deadlineTone(state)}`}
                      >
                        {stateLabel(state)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[22rem] align-top text-sm whitespace-normal">
                      <span className="block text-muted-foreground">
                        {portal.authority}
                      </span>
                      {portal.portalUrl && portal.status !== "not-yet-available" ? (
                        <a
                          href={portal.portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          {portal.portalName ?? t("countries.portal")}
                          <ExternalLink aria-hidden className="size-3" />
                        </a>
                      ) : (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {portal.status === "not-yet-available"
                            ? t("countries.noPortal")
                            : t("countries.portalNotRecorded")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className={`hidden align-top text-sm sm:table-cell ${deadlineTone(state)}`}
                    >
                      {stateLabel(state)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t("countries.later")}
          </p>
          <WikiMoreLink href="/wiki/zeit-und-status/nis2-tracker-eu">
            {t("countries.more")}
          </WikiMoreLink>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{t("steps.heading")}</h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("steps.description")}
            </p>
          </div>
          <div className="space-y-3">
            {stepKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold">
                    {t(`steps.items.${key}.title`)}
                  </h3>
                  <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                    {t(`steps.items.${key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <WikiMoreLink href="/wiki/troubleshooting/nis2-registrierung-verpasst">
            {t("steps.germany")}
          </WikiMoreLink>
        </section>

        <WalkHow
          heading={t("walk.heading")}
          lead={t("walk.lead")}
          points={t.raw("walk.points") as string[]}
          shot={shot}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">{t("faq.heading")}</h2>
          <div className="space-y-4">
            {faqKeys.map((key) => (
              <div key={key}>
                <h3 className="text-sm font-semibold">{t(`faq.${key}.q`)}</h3>
                <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                  {t(`faq.${key}.a`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">{t("sources.heading")}</h2>
          <ul className="space-y-1.5">
            {(t.raw("sources.items") as string[]).map((source) => (
              <li key={source} className="text-xs leading-relaxed text-muted-foreground">
                <SourceText text={source} />
              </li>
            ))}
          </ul>
          <WikiMoreLink href="/wiki/zeit-und-status/nis2-umsetzung-europa">
            {t("sources.list")}
          </WikiMoreLink>
        </section>

        <WalkSteps kind="national" />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
