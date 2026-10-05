import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { itemShot } from "@/components/durchgang/itemShots";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { WalkHow } from "@/components/wiki/WalkHow";
import { WalkPriceCard } from "@/components/wiki/WalkPriceCard";
import { WalkSteps } from "@/components/wiki/WalkSteps";
import { WikiAnswerHeader } from "@/components/wiki/WikiAnswerHeader";
import { WikiMoreLink } from "@/components/wiki/WikiMoreLink";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { WikiPartnerStrip } from "@/components/wiki/WikiPartnerStrip";
import { type Locale, pageAlternates, pageOg } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("incidentReporting.meta.title");
  const description = t("incidentReporting.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/umsetzung/nis2-meldepflicht", locale),
    ...pageOg({
      slug: "wiki/umsetzung/nis2-meldepflicht",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const timelineKeys = ["early", "update", "intermediate", "final", "progress"] as const;
const criteriaKeys = ["disruption", "financial", "spread", "data", "duration"] as const;

/** The step whose screen shows the three reporting deadlines. */
const REPORTING_STEP = "3.3";

export default async function IncidentReportingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.incidentReporting"),
    getTranslations("info.wikiWalk"),
  ]);
  const shot = itemShot(REPORTING_STEP, rawLocale, t("walk.seeItAlt"));
  if (!shot) throw new Error(`The walk has no screenshot for step ${REPORTING_STEP}`);

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="umsetzung"
          slug="nis2-meldepflicht"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung und IT-Verantwortliche im Mittelstand"
          citationKeys={["nis2", "bsig", "cir-2024-2690"]}
          aboutKeys={["nis2"]}
        />

        <WikiAnswerHeader
          badge="Art. 23 NIS 2 · § 32 BSIG"
          title={t("title")}
          answer={t("subtitle")}
          shot
        />

        <WikiPageMeta authorSlug="simon-orzel" locale={locale} />

        <WikiPartnerStrip />

        <Separator />

        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("criteria.heading")}
            </h2>
            <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("criteria.intro")}
            </p>
            <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("criteria.description")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {criteriaKeys.map((key) => (
              <div key={key} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">
                  {t(`criteria.items.${key}.title`)}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t(`criteria.items.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
          <p className="max-w-[62ch] rounded-lg bg-primary/[0.06] p-4 text-sm leading-relaxed">
            {t("criteria.doubt")}
          </p>
          <WikiMoreLink href="/wiki/grundlagen/erheblicher-sicherheitsvorfall">
            {w("more")}
          </WikiMoreLink>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{t("timeline.heading")}</CardTitle>
            <CardDescription>{t("timeline.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="max-w-[62ch] text-sm leading-relaxed">
              {t("timeline.awareness")}
            </p>
            {timelineKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">
                      {t(`timeline.items.${key}.title`)}
                    </p>
                    <Badge variant="outline">{t(`timeline.items.${key}.deadline`)}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t(`timeline.items.${key}.description`)}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {(t.raw(`timeline.items.${key}.contents`) as string[]).map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">{t("example.heading")}</h2>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t("example.lead")}
          </p>
          <div className="space-y-2 border-l-2 border-primary/30 pl-4">
            {(t.raw("example.items") as string[]).map((item) => (
              <p key={item} className="max-w-[62ch] text-sm leading-relaxed">
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">{t("fields.heading")}</h2>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t("fields.description")}
          </p>
          <ul className="space-y-1.5">
            {(t.raw("fields.list") as string[]).map((item) => (
              <li
                key={item}
                className="flex max-w-[62ch] items-start gap-2 text-sm leading-relaxed"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t("fields.note")}
          </p>
        </section>

        <WalkHow
          heading={t("walk.heading")}
          lead={t("walk.lead")}
          points={t.raw("walk.points") as string[]}
          shot={shot}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <Card>
          <CardHeader>
            <CardTitle>{t("where.heading")}</CardTitle>
            <CardDescription>{t("where.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["p1", "p2", "p3"] as const).map((key) => (
              <p
                key={key}
                className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground"
              >
                {t(`where.${key}`)}
              </p>
            ))}
          </CardContent>
        </Card>

        <section className="grid gap-8 sm:grid-cols-2">
          {(["after", "prepare"] as const).map((block) => (
            <div key={block} className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight">
                {t(`${block}.heading`)}
              </h2>
              <ul className="space-y-2">
                {(t.raw(`${block}.items`) as string[]).map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm leading-relaxed"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">{t("sources.heading")}</h2>
          <ul className="space-y-1.5">
            {(t.raw("sources.items") as string[]).map((source) => (
              <li key={source} className="text-xs leading-relaxed text-muted-foreground">
                {source}
              </li>
            ))}
          </ul>
        </section>

        <WalkSteps codes={["3.1", "3.3"]} />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
