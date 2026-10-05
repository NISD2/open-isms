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
import { type Locale, pageAlternates, pageOg } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("missedRegistration.meta.title");
  const description = t("missedRegistration.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates(
      "wiki/troubleshooting/nis2-registrierung-verpasst",
      locale,
    ),
    ...pageOg({
      slug: "wiki/troubleshooting/nis2-registrierung-verpasst",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const stepKeys = ["check", "certificate", "gather", "register", "record"] as const;
const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

/** The walk's registration step, whose screen shows the country and its authority. */
const REGISTRATION_STEP = "12.2";

export default async function MissedRegistrationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.missedRegistration"),
    getTranslations("info.wikiWalk"),
  ]);
  const shot = itemShot(REGISTRATION_STEP, rawLocale, t("walk.seeItAlt"));
  if (!shot) throw new Error(`The walk has no screenshot for step ${REGISTRATION_STEP}`);

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="troubleshooting"
          slug="nis2-registrierung-verpasst"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung und IT-Verantwortliche im Mittelstand"
          citationKeys={["nis2", "bsig"]}
          aboutKeys={["bsig"]}
          mentionsKeys={["nis2"]}
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
          badge="Art. 3 Abs. 4 NIS 2 · § 33 BSIG"
          title={t("title")}
          answer={t("subtitle")}
          art="/images/durchgang/12_2.svg"
        />

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
        />

        <Separator />

        <section className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">{t("who.heading")}</h2>
            {(["p1", "p2", "p3"] as const).map((key) => (
              <p key={key} className="text-sm leading-relaxed text-muted-foreground">
                {t(`who.${key}`)}
              </p>
            ))}
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("deadline.heading")}
            </h2>
            {(["p1", "p2", "p3"] as const).map((key) => (
              <p key={key} className="text-sm leading-relaxed text-muted-foreground">
                {t(`deadline.${key}`)}
              </p>
            ))}
          </div>
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
        </section>

        <WalkHow
          heading={t("walk.heading")}
          lead={t("walk.lead")}
          points={t.raw("walk.points") as string[]}
          shot={shot}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">{t("after.heading")}</h2>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t("after.p1")}
          </p>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t("after.p2")}
          </p>
          <ul className="space-y-2">
            {(t.raw("after.items") as string[]).map((item) => (
              <li
                key={item}
                className="flex max-w-[62ch] items-start gap-2 text-sm leading-relaxed"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
          <WikiMoreLink href="/wiki/umsetzung/umsetzung-mittelstand">
            {t("after.link")}
          </WikiMoreLink>
        </section>

        <section className="space-y-3 rounded-2xl bg-primary/[0.06] p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">{t("missed.heading")}</h2>
          <ol className="space-y-2.5">
            {(t.raw("missed.items") as string[]).map((item, i) => (
              <li key={item} className="flex max-w-[62ch] gap-3 text-sm leading-relaxed">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold tabular-nums text-primary-foreground">
                  {i + 1}
                </span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        </section>

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
          <WikiMoreLink href="/wiki/umsetzung/nis2-registration-portals">
            {w("more")}
          </WikiMoreLink>
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

        <WalkSteps codes={["12.2", "12.3"]} />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
