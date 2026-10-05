import { ArrowRight, ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { MotionProvider } from "@/components/landing/motion";
import { type ShotName, shotImage, zoomSizes } from "@/components/landing/shots";
import { AutoShot } from "@/components/landing/ZoomShot";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { WalkHow } from "@/components/wiki/WalkHow";
import { WalkPriceCard } from "@/components/wiki/WalkPriceCard";
import { WikiAnswerHeader } from "@/components/wiki/WikiAnswerHeader";
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
import { type Locale, pageAlternates, pageOg } from "@/lib/seo";
import { PrintShareActions } from "./PrintShareActions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("nis2Roadmap.meta.title");
  const description = t("nis2Roadmap.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/umsetzung/nis2-roadmap", locale),
    ...pageOg({
      slug: "wiki/umsetzung/nis2-roadmap",
      locale,
      title: t("nis2Roadmap.meta.ogTitle"),
      description: t("nis2Roadmap.meta.ogDescription"),
      type: "article",
    }),
  };
}

/** Where a step's action leads: a page of this site, or the authority's own tool. */
type StepLink =
  | { readonly kind: "internal"; readonly path: string }
  | { readonly kind: "external"; readonly url: string };

/**
 * The roadmap, in the order the steps come up. Each names who does it and, where the walkthrough
 * has the same step, the screenshot that shows it there (the landing page's screenshots).
 */
const STEPS = [
  {
    key: "check",
    personal: false,
    link: { kind: "external", url: "https://betroffenheitspruefung-nis-2.bsi.de/" },
  },
  {
    key: "register",
    personal: false,
    link: { kind: "internal", path: "/wiki/umsetzung/nis2-registration-portals" },
    shot: "explain",
  },
  {
    key: "training",
    personal: true,
    link: { kind: "internal", path: "/training/nis2-ceo" },
  },
  {
    key: "assets",
    personal: false,
    link: {
      kind: "internal",
      path: "/wiki/umsetzung/wie-nis2-risikoanalyse-durchfuehren",
    },
    shot: "riskMap",
  },
  {
    key: "suppliers",
    personal: false,
    link: { kind: "internal", path: "/wiki/umsetzung/nis2-lieferkette" },
    shot: "inRegister",
  },
  {
    key: "measures",
    personal: false,
    link: { kind: "internal", path: "/wiki/umsetzung/nis2-requirements" },
    shot: "ongoing",
  },
  {
    key: "approve",
    personal: true,
    link: { kind: "internal", path: "/wiki/umsetzung/nis2-documents" },
    shot: "approved",
  },
] as const satisfies readonly {
  readonly key: string;
  readonly personal: boolean;
  readonly link: StepLink;
  readonly shot?: ShotName;
}[];

/** A screenshot's width beside its step on a large screen (the 30rem column). */
const SHOT_PX = 480;

const ACTION_CLASS =
  "mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline print:hidden";

export default async function Nis2RoadmapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.nis2Roadmap"),
    getTranslations("info.wikiWalk"),
  ]);
  const faq = t.raw("faq.items") as WikiQuestion[];

  return (
    <GlossedProse locale={locale}>
      <MotionProvider>
        <div className="print:space-y-4">
          <WikiPageJsonLd
            category="umsetzung"
            slug="nis2-roadmap"
            locale={locale}
            authorSlug="simon-orzel"
            proficiencyLevel="Beginner"
            audienceType="Geschäftsführung und IT-Verantwortliche im Mittelstand"
            citationKeys={["nis2", "bsig"]}
            aboutKeys={["nis2"]}
          />
          <JsonLd data={faqJsonLd(faq)} />
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "HowTo",
              name: t("heroTitle"),
              description: t("heroSubtitle"),
              step: STEPS.map((step, i) => ({
                "@type": "HowToStep",
                position: i + 1,
                name: t(`steps.${step.key}.title`),
                text: t(`steps.${step.key}.what`),
              })),
            }}
          />

          <WikiAnswerHeader
            badge={t("heroBadge")}
            title={t("heroTitle")}
            answer={t("heroSubtitle")}
            art="/images/wiki/nis2-umsetzen.svg"
          />

          <div className="mt-6">
            <WikiPageMeta
              authorSlug="simon-orzel"
              locale={locale === "nl" ? "de" : (locale as "de" | "en")}
              lastReviewedAt="2026-10-05"
              sourceLocale="de"
            />
          </div>

          {/* One section per step: what to do and who does it on the left, the same step in the
              walkthrough on the right where the walkthrough has it. Sections, not list items:
              GlossedProse glosses everything inside an <li>, the legal basis chips included. */}
          <div className="mt-10">
            {STEPS.map((step, index) => {
              const shot = "shot" in step ? step.shot : undefined;
              return (
                <section
                  key={step.key}
                  aria-labelledby={`step-${step.key}`}
                  className="grid gap-8 border-t border-border/60 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-12 print:block print:py-4"
                >
                  <div className={shot ? undefined : "max-w-2xl lg:col-span-2"}>
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold tabular-nums text-primary-foreground">
                        {index + 1}
                      </span>
                      <span
                        className={
                          step.personal
                            ? "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/25"
                            : "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border"
                        }
                      >
                        {step.personal ? (
                          <ShieldCheck className="size-3" />
                        ) : (
                          <Check className="size-3" />
                        )}
                        {step.personal ? t("personalBadge") : t("delegableBadge")}
                      </span>
                    </div>
                    <h2
                      id={`step-${step.key}`}
                      className="mt-4 text-2xl font-semibold tracking-tight text-balance"
                    >
                      {t(`steps.${step.key}.title`)}
                    </h2>
                    <p className="mt-3 text-base leading-7 text-muted-foreground">
                      {t(`steps.${step.key}.what`)}
                    </p>
                    <dl className="mt-5 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
                      <dt className="text-muted-foreground">{t("lawLabel")}</dt>
                      <dd>
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs ring-1 ring-inset ring-border">
                          {t(`steps.${step.key}.law`)}
                        </span>
                      </dd>
                      <dt className="text-muted-foreground">{t("ownerLabel")}</dt>
                      <dd>{t(`steps.${step.key}.owner`)}</dd>
                    </dl>
                    {step.link.kind === "external" ? (
                      <a
                        href={step.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={ACTION_CLASS}
                      >
                        {t(`steps.${step.key}.action`)}
                        <ArrowUpRight className="size-4" />
                      </a>
                    ) : (
                      <Link href={step.link.path as never} className={ACTION_CLASS}>
                        {t(`steps.${step.key}.action`)}
                        <ArrowRight className="size-4" />
                      </Link>
                    )}
                  </div>

                  {shot ? (
                    <figure className="print:hidden">
                      <AutoShot
                        image={shotImage(shot, rawLocale, t(`steps.${step.key}.alt`))}
                        sizes={zoomSizes(shot, SHOT_PX)}
                        rounds={2}
                        className="rounded-xl border border-border/60 shadow-md"
                      />
                      <figcaption className="mt-3 text-sm leading-6 text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {t("inPlatform")}:
                        </span>{" "}
                        {t(`steps.${step.key}.platform`)}
                      </figcaption>
                    </figure>
                  ) : null}
                </section>
              );
            })}
          </div>

          <div className="space-y-12 border-t border-border/60 pt-10 print:hidden">
            <WikiSection
              heading={t("size.heading")}
              paragraphs={t.raw("size.paragraphs") as string[]}
              law={t("size.law")}
            />

            <WikiExample
              heading={t("example.heading")}
              lead={t("example.lead")}
              items={t.raw("example.items") as string[]}
            />

            <WalkHow
              heading={t("walk.heading")}
              lead={t("walk.lead")}
              points={t.raw("walk.points") as string[]}
              shot={shotImage("path", rawLocale, t("walk.seeItAlt"))}
              seeIt={w("seeIt")}
              next={t("walk.next")}
            />

            <WikiFaq heading={t("faq.heading")} items={faq} />

            <WikiSources
              heading={t("sources.heading")}
              items={t.raw("sources.items") as string[]}
            />

            <WalkPriceCard />
          </div>

          <div className="mt-12 border-t border-border/60 pt-6">
            <PrintShareActions
              printLabel={t("actions.print")}
              shareLabel={t("actions.share")}
              shareSubject={t("actions.shareSubject")}
              shareBody={t("actions.shareBody")}
            />
          </div>
        </div>
      </MotionProvider>
    </GlossedProse>
  );
}
