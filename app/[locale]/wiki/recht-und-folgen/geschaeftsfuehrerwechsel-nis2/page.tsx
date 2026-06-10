import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("nis2ManagementChange.meta.title");
  const description = t("nis2ManagementChange.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates(
      "wiki/recht-und-folgen/geschaeftsfuehrerwechsel-nis2",
      locale,
    ),
    ...pageOg({
      slug: "wiki/recht-und-folgen/geschaeftsfuehrerwechsel-nis2",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const anchorKeys = ["directive", "registryUpdate", "transposition"] as const;
const transferKeys = [
  "trainingRecord",
  "riskApprovals",
  "supplierContext",
  "incidentPlaybook",
] as const;
const stepKeys = ["registryUpdate", "training", "approvals"] as const;
const pitfallKeys = ["staleContact", "unbriefedAcceptances", "trainingForgotten"] as const;

export default async function ManagementChangePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale =
    rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-10">
        <WikiPageJsonLd
          category="recht-und-folgen"
          slug="geschaeftsfuehrerwechsel-nis2"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Intermediate"
          audienceType="Geschäftsführung, Personalwesen, Compliance"
          citationKeys={["nis2", "bsig"]}
          aboutKeys={["nis2", "bsig"]}
          mentionsKeys={["bsig"]}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            Art. 20 + Art. 27 NIS 2 · §33(5) + §38 + §65 BSIG
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("nis2ManagementChange.title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("nis2ManagementChange.subtitle")}
          </p>
        </header>

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-06-04"
          sourceLocale="en"
        />

        <Separator />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("nis2ManagementChange.overview.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("nis2ManagementChange.overview.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("nis2ManagementChange.overview.p2")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("nis2ManagementChange.overview.p3")}
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("nis2ManagementChange.legalAnchor.heading")}
            </CardTitle>
            <CardDescription>
              {t("nis2ManagementChange.legalAnchor.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anchorKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`nis2ManagementChange.legalAnchor.${key}.label`)}
                  </p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">
                    {t(`nis2ManagementChange.legalAnchor.${key}.quote`)}
                  </blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`nis2ManagementChange.legalAnchor.${key}.context`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("nis2ManagementChange.whatToTransfer.heading")}
            </CardTitle>
            <CardDescription>
              {t("nis2ManagementChange.whatToTransfer.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {transferKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`nis2ManagementChange.whatToTransfer.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`nis2ManagementChange.whatToTransfer.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("nis2ManagementChange.threeSteps.heading")}
            </CardTitle>
            <CardDescription>
              {t("nis2ManagementChange.threeSteps.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stepKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`nis2ManagementChange.threeSteps.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`nis2ManagementChange.threeSteps.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("nis2ManagementChange.pitfalls.heading")}
            </CardTitle>
            <CardDescription>
              {t("nis2ManagementChange.pitfalls.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {pitfallKeys.map((key) => (
                <li key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`nis2ManagementChange.pitfalls.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`nis2ManagementChange.pitfalls.items.${key}.body`)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("nis2ManagementChange.whatHappensIfNotDone.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("nis2ManagementChange.whatHappensIfNotDone.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("nis2ManagementChange.whatHappensIfNotDone.p2")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2ManagementChange.sources.heading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(t.raw("nis2ManagementChange.sources.items") as string[]).map(
                (s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                    {s}
                  </li>
                ),
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardContent className="pt-6">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("nis2ManagementChange.disclaimer")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("nis2ManagementChange.ctaCard.heading")}
            </CardTitle>
            <CardDescription>
              {t("nis2ManagementChange.ctaCard.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth/signin">{t("nis2ManagementChange.cta")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
