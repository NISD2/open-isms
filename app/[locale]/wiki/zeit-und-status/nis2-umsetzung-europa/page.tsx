import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ExternalLink } from "lucide-react";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { getRegistrationPortals } from "@/lib/registration-portals";
import type { RegistrationPortal } from "@/lib/registration-portals";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("euImplementation.meta.title");
  const description = t("euImplementation.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/zeit-und-status/nis2-umsetzung-europa", locale),
    ...pageOg({
      slug: "wiki/zeit-und-status/nis2-umsetzung-europa",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const faqKeys = ["q1", "q2", "q3", "q4"] as const;

function PortalTable({
  portals,
  t,
}: {
  portals: RegistrationPortal[];
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("registrationPortals.headers.country")}</TableHead>
          <TableHead>{t("registrationPortals.headers.authority")}</TableHead>
          <TableHead>{t("registrationPortals.headers.portal")}</TableHead>
          <TableHead>{t("registrationPortals.headers.deadline")}</TableHead>
          <TableHead>{t("registrationPortals.headers.law")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {portals.map((portal) => (
          <TableRow key={portal.countryCode}>
            <TableCell className="font-medium">
              {t(
                `registrationPortals.countries.${portal.countryCode}` as Parameters<typeof t>[0]
              )}
            </TableCell>
            <TableCell className="text-sm">
              {portal.authorityUrl ? (
                <a
                  href={portal.authorityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {portal.authority}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                portal.authority
              )}
            </TableCell>
            <TableCell>
              {portal.portalUrl ? (
                <a
                  href={portal.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {portal.portalName ?? t("registrationPortals.visitPortal")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t("registrationPortals.noPortal")}
                </span>
              )}
            </TableCell>
            <TableCell className="text-sm">
              {portal.registrationDeadline ?? (
                <span className="text-xs text-muted-foreground">
                  {t("registrationPortals.noDeadline")}
                </span>
              )}
            </TableCell>
            <TableCell className="text-sm">
              {portal.nationalLaw ?? (
                <span className="text-xs text-muted-foreground">
                  {t("registrationPortals.noLaw")}
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function NIS2EuropaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");
  const data = getRegistrationPortals();

  const operational = data.portals.filter((p) => p.status === "operational");
  const preReg = data.portals.filter((p) => p.status === "pre-registration");
  const planned = data.portals.filter((p) => p.status === "planned");
  const notAvailable = data.portals.filter((p) => p.status === "not-yet-available");

  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`multiCountryReg.faq.${key}.q`),
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: t(`multiCountryReg.faq.${key}.a`),
    },
  }));

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="zeit-und-status"
        slug="nis2-umsetzung-europa"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und Compliance-Beauftragte"
        citationKeys={["nis2", "cir-2024-2690"]}
        aboutKeys={["nis2"]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs,
        }}
      />

      {/* ── Hero ── */}
      <header>
        <Badge variant="secondary" className="mb-3">EU-27</Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("euImplementation.title")}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("euImplementation.subtitle")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("registrationPortals.lastUpdated")}:{" "}
          {new Date(data.lastUpdated).toLocaleDateString(
            locale === "de" ? "de-DE" : "en-US",
            { year: "numeric", month: "long", day: "numeric" }
          )}
        </p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-4">
        {(
          [
            { list: operational, key: "operational" },
            { list: preReg, key: "pre-registration" },
            { list: planned, key: "planned" },
            { list: notAvailable, key: "not-yet-available" },
          ] as const
        ).map(({ list, key }) => (
          <Card key={key}>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-primary">{list.length}</p>
              <p className="mt-1 text-sm font-medium">
                {t(`registrationPortals.status.${key}`)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Registration Portals ── */}
      <section id="portals" className="space-y-6">
        {operational.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("registrationPortals.operationalSection")}</CardTitle>
              <CardDescription>{t("registrationPortals.operationalDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <PortalTable portals={operational} t={t} />
            </CardContent>
          </Card>
        )}

        {preReg.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("registrationPortals.preRegSection")}</CardTitle>
              <CardDescription>{t("registrationPortals.preRegDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <PortalTable portals={preReg} t={t} />
            </CardContent>
          </Card>
        )}

        {planned.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("registrationPortals.plannedSection")}</CardTitle>
              <CardDescription>{t("registrationPortals.plannedDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <PortalTable portals={planned} t={t} />
            </CardContent>
          </Card>
        )}

        {notAvailable.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("registrationPortals.notAvailableSection")}</CardTitle>
              <CardDescription>{t("registrationPortals.notAvailableDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <PortalTable portals={notAvailable} t={t} />
            </CardContent>
          </Card>
        )}
      </section>

      <Separator />

      {/* ── Multi-Country Registration ── */}
      <section id="multi-country" className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {t("multiCountryReg.rule.heading")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("multiCountryReg.rule.p1")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("multiCountryReg.rule.p2")}
          </p>
        </div>

        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="text-base">
              {t("multiCountryReg.onestop.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("multiCountryReg.onestop.description")}
            </p>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight">
            {t("multiCountryReg.faq.heading")}
          </h3>
          {faqKeys.map((key) => (
            <details key={key} className="group rounded-lg border p-4">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
                {t(`multiCountryReg.faq.${key}.q`)}
                <span className="ml-2 shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
                  &#9662;
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`multiCountryReg.faq.${key}.a`)}
              </p>
            </details>
          ))}
        </section>
      </section>

      {/* ── Sources ── */}
      <Card>
        <CardHeader>
          <CardTitle>{t("euImplementation.sources.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(t.raw("euImplementation.sources.items") as string[]).map(
              (source, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  {source}
                </li>
              )
            )}
          </ul>
        </CardContent>
      </Card>

      {/* ── CTA ── */}
      <Card>
        <CardHeader>
          <CardTitle>{t("euImplementation.ctaCard.heading")}</CardTitle>
          <CardDescription>
            {t("euImplementation.ctaCard.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("euImplementation.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
