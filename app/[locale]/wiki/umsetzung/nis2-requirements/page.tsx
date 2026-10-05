import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { shotImage } from "@/components/landing/shots";
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
  const title = t("nis2Requirements.meta.title");
  const description = t("nis2Requirements.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/umsetzung/nis2-requirements", locale),
    ...pageOg({
      slug: "wiki/umsetzung/nis2-requirements",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

/** The four duties at a glance, each with the page that covers it. */
const OVERVIEW = [
  { key: "measures", href: "#massnahmen" },
  { key: "report", href: "/wiki/umsetzung/nis2-meldepflicht" },
  { key: "register", href: "/wiki/troubleshooting/nis2-registrierung-verpasst" },
  { key: "management", href: "/wiki/grundlagen/bsig-38" },
] as const;

const measureKeys = [
  "m1",
  "m2",
  "m3",
  "m4",
  "m5",
  "m6",
  "m7",
  "m8",
  "m9",
  "m10",
] as const;
const stageKeys = ["s1", "s2", "s3"] as const;
const evidenceKeys = ["audits", "certifications", "documentation"] as const;
const supplyChainKeys = ["assess", "contractual", "monitor"] as const;

const LAW_CHIP =
  "inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground ring-1 ring-inset ring-border";

export default async function Nis2RequirementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.nis2Requirements"),
    getTranslations("info.wikiWalk"),
  ]);

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="umsetzung"
          slug="nis2-requirements"
          locale={locale}
          authorSlug="cory-hisey"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung und IT-Verantwortliche im Mittelstand"
          citationKeys={["nis2", "bsig", "cir-2024-2690"]}
          aboutKeys={["nis2"]}
        />

        <WikiAnswerHeader
          badge="Art. 21 NIS 2 · § 30 BSIG"
          title={t("title")}
          answer={t("subtitle")}
          shot
        />

        <WikiPageMeta
          authorSlug="cory-hisey"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
        />

        <WikiPartnerStrip />

        <Separator />

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("overview.heading")}
            </h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("overview.lead")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {OVERVIEW.map(({ key, href }) => (
              <Card key={key} className="gap-2 py-5">
                <CardContent className="space-y-2 px-5">
                  <h3 className="text-base font-semibold">
                    {t(`overview.items.${key}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`overview.items.${key}.text`)}
                  </p>
                  <p>
                    <span className={LAW_CHIP}>{t(`overview.items.${key}.law`)}</span>
                  </p>
                  <WikiMoreLink href={href}>{w("more")}</WikiMoreLink>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="massnahmen" className="scroll-mt-24 space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("measures.heading")}
            </h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("measures.description")}
            </p>
          </div>
          <div className="grid gap-3">
            {measureKeys.map((key, i) => (
              <Card key={key} className="py-5">
                <CardContent className="flex gap-4 px-5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 space-y-1.5">
                    <h3 className="text-base font-semibold">
                      {t(`measures.items.${key}.title`)}
                    </h3>
                    <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                      {t(`measures.items.${key}.description`)}
                    </p>
                    <p className="max-w-[62ch] text-sm leading-relaxed">
                      <span className="font-medium">{t("measures.exampleLabel")}:</span>{" "}
                      {t(`measures.items.${key}.example`)}
                    </p>
                    <p>
                      <span className={LAW_CHIP}>{t(`measures.items.${key}.law`)}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("proportionality.heading")}
          </h2>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t("proportionality.p1")}
          </p>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t("proportionality.p2")}
          </p>
          <WikiMoreLink href="/wiki/grundlagen/nis2-verhaeltnismaessigkeit">
            {t("proportionality.link")}
          </WikiMoreLink>
        </section>

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

        <WalkHow
          heading={t("walk.heading")}
          lead={t("walk.lead")}
          points={t.raw("walk.points") as string[]}
          shot={shotImage("approved", rawLocale, t("walk.seeItAlt"))}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <Card>
          <CardHeader>
            <CardTitle>{t("incidentReporting.heading")}</CardTitle>
            <CardDescription>{t("incidentReporting.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {stageKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <Badge variant="outline" className="mb-2">
                    {t(`incidentReporting.stages.${key}.deadline`)}
                  </Badge>
                  <p className="text-sm font-semibold">
                    {t(`incidentReporting.stages.${key}.title`)}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t(`incidentReporting.stages.${key}.description`)}
                  </p>
                </div>
              ))}
            </div>
            <WikiMoreLink href="/wiki/umsetzung/nis2-meldepflicht">
              {t("incidentReporting.link")}
            </WikiMoreLink>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("auditRequirements.heading")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["kritis", "bwe", "we"] as const).map((key) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t(`auditRequirements.${key}.heading`)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`auditRequirements.${key}.description`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("auditRequirements.evidence.heading")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {evidenceKeys.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {t(`auditRequirements.evidence.items.${key}`)}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">
                {t("auditRequirements.evidence.note")}
              </p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{t("supplyChain.heading")}</CardTitle>
            <CardDescription>{t("supplyChain.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {supplyChainKeys.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {t(`supplyChain.items.${key}`)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

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

        <WalkSteps codes={["2.2", "3.1", "7.3"]} />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
