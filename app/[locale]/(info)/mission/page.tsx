import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import {
  pageAlternates,
  pageOg,
  buildAboutPageJsonLd,
  type Locale,
} from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("mission.meta.title");
  const description = t("mission.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("mission", locale),
    ...pageOg({ slug: "mission", locale, title, description, type: "website" }),
  };
}

const breakdownItems = [
  { key: "staff", percent: 45 },
  { key: "consultants", percent: 26 },
  { key: "software", percent: 16 },
  { key: "hardware", percent: 13 },
] as const;

const savingsItems = [
  { key: "consultants", percent: 36 },
  { key: "internal", percent: 30 },
  { key: "evidence", percent: 24 },
  { key: "software", percent: 9 },
] as const;

const tacticsKeys = ["consultants", "internal", "evidence", "software"] as const;

export default async function MissionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");
  const freeItems = t.raw("mission.free.items") as string[];

  return (
    <div className="space-y-12">
      <JsonLd
        data={buildAboutPageJsonLd({
          slug: "mission",
          locale,
          name: t("mission.meta.title"),
          description: t("mission.meta.description"),
        })}
      />
      {/* Header */}
      <header>
        <Badge variant="secondary" className="mb-3">{t("mission.badge")}</Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t("mission.title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("mission.subtitle")}</p>
      </header>

      <Separator />

      {/* The problem */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("mission.problem.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("mission.problem.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("mission.problem.p2")}</p>
      </section>

      {/* Breakdown chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t("mission.breakdown.heading")}</CardTitle>
          <CardDescription>{t("mission.breakdown.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {breakdownItems.map((item) => (
            <div key={item.key} className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">{t(`mission.breakdown.items.${item.key}.label`)}</span>
                <span className="text-sm tabular-nums text-muted-foreground">{t(`mission.breakdown.items.${item.key}.value`)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/80"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
          <p className="pt-2 text-xs text-muted-foreground/70">{t("mission.breakdown.footnote")}</p>
        </CardContent>
      </Card>

      {/* The plan */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("mission.plan.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("mission.plan.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("mission.plan.p2")}</p>
      </section>

      {/* Savings chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <CardTitle>{t("mission.savings.heading")}</CardTitle>
            <Badge>{t("mission.savings.total")}</Badge>
          </div>
          <CardDescription>{t("mission.savings.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {savingsItems.map((item) => (
            <div key={item.key} className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">{t(`mission.savings.items.${item.key}.label`)}</span>
                <span className="text-sm tabular-nums text-muted-foreground">{t(`mission.savings.items.${item.key}.value`)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* How each cut works (granular tactics) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("mission.tactics.heading")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("mission.tactics.description")}</p>
        </div>
        <div className="space-y-4">
          {tacticsKeys.map((key) => {
            const tactics = t.raw(`mission.tactics.items.${key}.tactics`) as string[];
            return (
              <Card key={key}>
                <CardHeader>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <CardTitle className="text-base">{t(`mission.tactics.items.${key}.heading`)}</CardTitle>
                    <Badge variant="outline" className="tabular-nums">{t(`mission.tactics.items.${key}.amount`)}</Badge>
                  </div>
                  <CardDescription className="italic">{t(`mission.tactics.items.${key}.principle`)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tactics.map((tactic, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="leading-relaxed">{tactic}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* What is free */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("mission.free.heading")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("mission.free.description")}</p>
        </div>
        <ul className="space-y-2">
          {freeItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Where we charge */}
      <Card>
        <CardHeader>
          <CardTitle>{t("mission.paid.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("mission.paid.p1")}</p>
          <p className="text-sm font-medium">{t("mission.paid.p2")}</p>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardHeader>
          <CardTitle>{t("mission.cta.heading")}</CardTitle>
          <CardDescription>{t("mission.cta.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/applicability">{t("mission.cta.checkButton")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">{t("mission.cta.platformButton")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
