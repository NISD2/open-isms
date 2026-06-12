import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  pageAlternates,
  pageOg,
  buildSoftwareApplicationJsonLd,
  type Locale,
} from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { MarketingHero } from "@/components/marketing/MarketingHero";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("features.meta.title");
  const description = t("features.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("features", locale),
    ...pageOg({ slug: "features", locale, title, description, type: "website", image: `/og/features-${locale}.png` }),
  };
}

const moduleKeys = [
  "assets",
  "risks",
  "incidents",
  "suppliers",
  "policies",
  "training",
  "access",
  "crypto",
  "continuity",
  "vulnerability",
  "network",
  "monitoring",
  "communication",
] as const;

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");
  const featureList = moduleKeys.map((key) => t(`features.modules.items.${key}`));

  return (
    <div className="space-y-10">
      <JsonLd
        data={buildSoftwareApplicationJsonLd({
          slug: "features",
          locale,
          name: t("features.meta.title"),
          description: t("features.meta.description"),
          featureList,
        })}
      />
      {/* Header */}
      <MarketingHero
        eyebrow={<Badge variant="secondary">Platform</Badge>}
        headline={t("features.title")}
        subhead={t("features.subtitle")}
      />


      <Separator />

      {/* Guided Process */}
      <section id="guided" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("features.guided.heading")}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <Badge variant="outline" className="mb-2">§§ 28–30 BSIG</Badge>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("features.guided.p1")}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <Badge variant="outline" className="mb-2">{t("features.badges.tenMeasures")}</Badge>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("features.guided.p2")}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <Badge variant="outline" className="mb-2">{t("features.badges.traceable")}</Badge>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("features.guided.p3")}
            </p>
          </div>
        </div>
      </section>

      {/* Management Liability */}
      <Card id="liability" className="scroll-mt-24">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{t("features.liability.heading")}</CardTitle>
            <Badge variant="secondary">§ 38 BSIG</Badge>
          </div>
          <CardDescription>{t("features.liability.p1")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {(["approval", "oversight", "training"] as const).map((duty, i) => (
              <div key={duty} className="rounded-lg border p-4">
                <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {duty === "approval" && t("features.liability.p2")}
                  {duty === "oversight" && t("features.liability.p3")}
                  {duty === "training" && t("features.liability.p1")}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 132 Requirements */}
      <Card id="requirements" className="scroll-mt-24">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{t("features.requirements.heading")}</CardTitle>
          </div>
          <CardDescription>{t("features.requirements.p1")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold">132</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("features.badges.requirements")}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold">10</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("features.badges.measures")}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold">AI</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("features.badges.assistedPrefill")}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{t("features.requirements.p2")}</p>
            <p>{t("features.requirements.p3")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Deadline Tracking */}
      <Card id="deadlines" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>{t("features.deadlines.heading")}</CardTitle>
          <CardDescription>{t("features.deadlines.p1")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="mb-2">{t("features.badges.tenPhases")}</Badge>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("features.deadlines.p2")}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="mb-2">{t("features.badges.granular")}</Badge>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("features.deadlines.p3")}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="mb-2">24h / 72h / 1m</Badge>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("features.deadlines.p1")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 13 Modules */}
      <section id="modules" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("features.modules.heading")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("features.modules.p1")}</p>
        </div>

        <div className="grid gap-3">
          {moduleKeys.map((key, i) => (
            <Card key={key} className="py-4">
              <CardContent className="flex gap-4 py-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground">
                  {t(`features.modules.items.${key}`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{t("features.modules.p2")}</p>
      </section>

      {/* Audit Trail */}
      <Card id="audit-trail" className="scroll-mt-24">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{t("features.auditTrail.heading")}</CardTitle>
            <Badge variant="secondary">SHA-256</Badge>
          </div>
          <CardDescription>{t("features.auditTrail.p1")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-semibold">{t("features.badges.exportAnytime")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("features.auditTrail.p2")}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-semibold">{t("features.badges.dataStaysForever")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("features.auditTrail.p3")}
              </p>
            </div>
          </div>

          <Separator />

          <p className="text-sm font-medium text-foreground">
            {t("features.auditTrail.p4")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
