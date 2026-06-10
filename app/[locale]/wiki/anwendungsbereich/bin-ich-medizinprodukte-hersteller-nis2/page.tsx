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
  const title = t("amIMedicalDeviceManufacturer.meta.title");
  const description = t("amIMedicalDeviceManufacturer.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates(
      "wiki/anwendungsbereich/bin-ich-medizinprodukte-hersteller-nis2",
      locale,
    ),
    ...pageOg({
      slug: "wiki/anwendungsbereich/bin-ich-medizinprodukte-hersteller-nis2",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const anchorKeys = ["directive", "regulation", "transposition"] as const;
const elementKeys = ["criticalList", "genericDevice", "size"] as const;
const principleKeys = ["annexIvsAnnexII", "mdrParallel"] as const;
const nationalKeys = ["bsi", "bfarm", "enisa"] as const;
const pitfallKeys = ["mdrCoversCyber", "classILowRisk", "samdOnly"] as const;

export default async function AmIMedicalDeviceManufacturerPage({
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
          category="anwendungsbereich"
          slug="bin-ich-medizinprodukte-hersteller-nis2"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung, CISO und Regulatory Affairs bei Medizinprodukteherstellern"
          citationKeys={["nis2", "bsig"]}
          aboutKeys={["nis2"]}
          mentionsKeys={["bsig"]}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            Anhang I + II Sektor 5 NIS 2
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("amIMedicalDeviceManufacturer.title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("amIMedicalDeviceManufacturer.subtitle")}
          </p>
        </header>

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-05-30"
          sourceLocale="en"
        />

        <Separator />

        {/* Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("amIMedicalDeviceManufacturer.overview.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("amIMedicalDeviceManufacturer.overview.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("amIMedicalDeviceManufacturer.overview.p2")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("amIMedicalDeviceManufacturer.overview.p3")}
          </p>
        </section>

        {/* Legal anchor */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("amIMedicalDeviceManufacturer.legalAnchor.heading")}
            </CardTitle>
            <CardDescription>
              {t("amIMedicalDeviceManufacturer.legalAnchor.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anchorKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(
                      `amIMedicalDeviceManufacturer.legalAnchor.${key}.label`,
                    )}
                  </p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">
                    {t(
                      `amIMedicalDeviceManufacturer.legalAnchor.${key}.quote`,
                    )}
                  </blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      `amIMedicalDeviceManufacturer.legalAnchor.${key}.context`,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Three tests */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("amIMedicalDeviceManufacturer.elements.heading")}
            </CardTitle>
            <CardDescription>
              {t("amIMedicalDeviceManufacturer.elements.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {elementKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <Badge variant="outline" className="mb-2 text-[10px]">
                    {t(
                      `amIMedicalDeviceManufacturer.elements.items.${key}.section`,
                    )}
                  </Badge>
                  <p className="text-sm font-semibold">
                    {t(
                      `amIMedicalDeviceManufacturer.elements.items.${key}.title`,
                    )}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      `amIMedicalDeviceManufacturer.elements.items.${key}.body`,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Two principles */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("amIMedicalDeviceManufacturer.principles.heading")}
            </CardTitle>
            <CardDescription>
              {t("amIMedicalDeviceManufacturer.principles.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {principleKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(
                      `amIMedicalDeviceManufacturer.principles.items.${key}.title`,
                    )}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      `amIMedicalDeviceManufacturer.principles.items.${key}.body`,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* National view */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("amIMedicalDeviceManufacturer.nationalView.heading")}
            </CardTitle>
            <CardDescription>
              {t("amIMedicalDeviceManufacturer.nationalView.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nationalKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {t(
                        `amIMedicalDeviceManufacturer.nationalView.items.${key}.country`,
                      )}
                    </Badge>
                    <p className="text-sm font-semibold">
                      {t(
                        `amIMedicalDeviceManufacturer.nationalView.items.${key}.label`,
                      )}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      `amIMedicalDeviceManufacturer.nationalView.items.${key}.body`,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pitfalls */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("amIMedicalDeviceManufacturer.pitfalls.heading")}
            </CardTitle>
            <CardDescription>
              {t("amIMedicalDeviceManufacturer.pitfalls.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {pitfallKeys.map((key) => (
                <li key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(
                      `amIMedicalDeviceManufacturer.pitfalls.items.${key}.myth`,
                    )}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      `amIMedicalDeviceManufacturer.pitfalls.items.${key}.reality`,
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Practitioner */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("amIMedicalDeviceManufacturer.practitioner.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("amIMedicalDeviceManufacturer.practitioner.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("amIMedicalDeviceManufacturer.practitioner.p2")}
            </p>
          </CardContent>
        </Card>

        {/* Platform */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("amIMedicalDeviceManufacturer.platform.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("amIMedicalDeviceManufacturer.platform.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("amIMedicalDeviceManufacturer.platform.p2")}
            </p>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("amIMedicalDeviceManufacturer.sources.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(
                t.raw(
                  "amIMedicalDeviceManufacturer.sources.items",
                ) as string[]
              ).map((source, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  {source}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("amIMedicalDeviceManufacturer.ctaCard.heading")}
            </CardTitle>
            <CardDescription>
              {t("amIMedicalDeviceManufacturer.ctaCard.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/applicability">
                {t("amIMedicalDeviceManufacturer.cta")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
