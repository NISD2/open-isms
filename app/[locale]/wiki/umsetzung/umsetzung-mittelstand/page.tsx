import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { shotImage } from "@/components/landing/shots";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { WalkHow } from "@/components/wiki/WalkHow";
import { WalkPriceCard } from "@/components/wiki/WalkPriceCard";
import { WalkSteps } from "@/components/wiki/WalkSteps";
import { WikiAnswerHeader } from "@/components/wiki/WikiAnswerHeader";
import { WikiMoreLink } from "@/components/wiki/WikiMoreLink";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { type Locale, pageAlternates, pageOg } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("smeGuide.meta.title");
  const description = t("smeGuide.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/umsetzung/umsetzung-mittelstand", locale),
    ...pageOg({
      slug: "wiki/umsetzung/umsetzung-mittelstand",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

/** The four duties, each with the page that covers it. */
const DUTIES = [
  { key: "register", href: "/wiki/troubleshooting/nis2-registrierung-verpasst" },
  { key: "measures", href: "/wiki/umsetzung/nis2-requirements" },
  { key: "report", href: "/wiki/umsetzung/nis2-meldepflicht" },
  { key: "management", href: "/wiki/grundlagen/bsig-38" },
] as const;

const mistakeKeys = [
  "waiting",
  "overEngineering",
  "noManagement",
  "ignoreSupplyChain",
  "paperOnly",
] as const;

const LAW_CHIP =
  "inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground ring-1 ring-inset ring-border";

export default async function SmeGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.smeGuide"),
    getTranslations("info.wikiWalk"),
  ]);
  const orderSteps = t.raw("order.steps") as string[];

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="umsetzung"
          slug="umsetzung-mittelstand"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung im Mittelstand"
          citationKeys={["nis2", "bsig"]}
          aboutKeys={["nis2"]}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: t("title"),
            description: t("subtitle"),
            step: orderSteps.map((text, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              text,
            })),
          }}
        />

        <WikiAnswerHeader
          badge={t("badge")}
          title={t("title")}
          answer={t("subtitle")}
          art="/images/wiki/nis2-umsetzen.svg"
        />

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
        />

        <Separator />

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("duties.heading")}
            </h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("duties.lead")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {DUTIES.map(({ key, href }) => (
              <Card key={key} className="py-5">
                <CardContent className="space-y-2 px-5">
                  <h3 className="text-base font-semibold">
                    {t(`duties.items.${key}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`duties.items.${key}.text`)}
                  </p>
                  <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
                    <dt className="text-muted-foreground">{w("lawLabel")}</dt>
                    <dd>
                      <span className={LAW_CHIP}>{t(`duties.items.${key}.law`)}</span>
                    </dd>
                    <dt className="text-muted-foreground">{w("whoLabel")}</dt>
                    <dd>{t(`duties.items.${key}.who`)}</dd>
                  </dl>
                  <WikiMoreLink href={href}>{w("more")}</WikiMoreLink>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">{t("size.heading")}</h2>
          <div className="space-y-2">
            {(t.raw("size.items") as string[]).map((item) => (
              <p
                key={item}
                className="flex max-w-[62ch] items-start gap-2.5 text-sm leading-relaxed"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </p>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">{t("order.heading")}</h2>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t("order.lead")}
          </p>
          <ol className="space-y-2.5">
            {orderSteps.map((step, i) => (
              <li key={step} className="flex max-w-[62ch] gap-3 text-sm leading-relaxed">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold tabular-nums text-primary-foreground">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <WikiMoreLink href="/wiki/umsetzung/nis2-roadmap">
            {t("order.roadmapLink")}
          </WikiMoreLink>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">{t("example.heading")}</h2>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t("example.lead")}
          </p>
          <div className="space-y-2 border-l-2 border-primary/30 pl-4">
            {(t.raw("example.steps") as string[]).map((step) => (
              <p key={step} className="max-w-[62ch] text-sm leading-relaxed">
                {step}
              </p>
            ))}
          </div>
        </section>

        <WalkHow
          heading={t("walk.heading")}
          lead={t("walk.lead")}
          points={t.raw("walk.points") as string[]}
          shot={shotImage("path", rawLocale, t("walk.seeItAlt"))}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("mistakes.heading")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {mistakeKeys.map((key) => (
              <div key={key} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">
                  {t(`mistakes.items.${key}.title`)}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t(`mistakes.items.${key}.description`)}
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
                {source}
              </li>
            ))}
          </ul>
        </section>

        <WalkSteps codes={["12.2", "2.2", "7.3"]} />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
