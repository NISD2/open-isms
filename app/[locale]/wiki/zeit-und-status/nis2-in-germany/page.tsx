import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("nis2InGermany.meta.title");
  const description = t("nis2InGermany.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/zeit-und-status/nis2-in-germany", locale),
    ...pageOg({
      slug: "wiki/zeit-und-status/nis2-in-germany",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const timelineKeys = ["euPublished", "euForce", "euDeadline", "bundestag", "bundesrat", "published", "inForce", "portal", "registration", "kritisAudit"] as const;
const highlightedTimelineKeys = new Set(["inForce", "registration"]);
const categoryKeys = ["essential", "important", "kritis"] as const;
const penaltyCategoryKeys = ["bwe", "we"] as const;
const violationKeys = ["measures", "incidents", "bsiDirectives", "kritisComponents", "kritisAudit", "registration", "obstruction", "contact"] as const;
const dutyKeys = ["approval", "oversight", "training"] as const;
const supervisionKeys = ["approach", "fines", "audit", "kritisAudit"] as const;

export default async function Nis2InGermanyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="zeit-und-status"
        slug="nis2-in-germany"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und Compliance-Beauftragte"
        citationKeys={["nis2", "bsig"]}
        aboutKeys={["bsig"]}
        mentionsKeys={["nis2"]}
      />
      {/* Header */}
      <header>
        <Badge variant="secondary" className="mb-3">BSIG / NIS2UmsuCG</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("nis2InGermany.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("nis2InGermany.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>{t("nis2InGermany.timeline.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">{t("features.badges.date")}</TableHead>
                <TableHead>{t("features.badges.event")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timelineKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell className={highlightedTimelineKeys.has(key) ? "font-bold" : "font-medium"}>
                    {t(`nis2InGermany.timeline.items.${key}.date`)}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {highlightedTimelineKeys.has(key) ? (
                      <span className="font-semibold">{t(`nis2InGermany.timeline.items.${key}.event`)}</span>
                    ) : (
                      t(`nis2InGermany.timeline.items.${key}.event`)
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground">{t("nis2InGermany.timeline.noTransition")}</p>
          <div className="mt-3">
            <Link href={"/wiki/zeit-und-status/nis2-timeline" as never} className="text-sm text-primary hover:underline">
              {t("nis2InGermany.timeline.seeFullTimeline")} &rarr;
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Entity Categories */}
      <Card>
        <CardHeader>
          <CardTitle>{t("nis2InGermany.categories.heading")}</CardTitle>
          <CardDescription>{t("nis2InGermany.categories.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("nis2InGermany.categories.headers.euTerm")}</TableHead>
                <TableHead>{t("nis2InGermany.categories.headers.germanTerm")}</TableHead>
                <TableHead>{t("nis2InGermany.categories.headers.abbreviation")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell className="whitespace-normal">{t(`nis2InGermany.categories.rows.${key}.eu`)}</TableCell>
                  <TableCell className="whitespace-normal font-medium">{t(`nis2InGermany.categories.rows.${key}.de`)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t(`nis2InGermany.categories.rows.${key}.abbr`)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground">{t("nis2InGermany.categories.hierarchy")}</p>
        </CardContent>
      </Card>

      {/* Penalties */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">{t("nis2InGermany.penalties.heading")}</h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("nis2InGermany.penalties.byCategory.heading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("nis2InGermany.penalties.byCategory.headers.category")}</TableHead>
                  <TableHead>{t("nis2InGermany.penalties.byCategory.headers.maxFine")}</TableHead>
                  <TableHead>{t("nis2InGermany.penalties.byCategory.headers.turnover")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penaltyCategoryKeys.map((key) => (
                  <TableRow key={key}>
                    <TableCell className="whitespace-normal font-medium">{t(`nis2InGermany.penalties.byCategory.rows.${key}.category`)}</TableCell>
                    <TableCell className="font-semibold">{t(`nis2InGermany.penalties.byCategory.rows.${key}.fine`)}</TableCell>
                    <TableCell className="whitespace-normal">{t(`nis2InGermany.penalties.byCategory.rows.${key}.turnover`)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("nis2InGermany.penalties.byViolation.heading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("nis2InGermany.penalties.byViolation.headers.violation")}</TableHead>
                  <TableHead className="text-right">{t("nis2InGermany.penalties.byViolation.headers.maxFine")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violationKeys.map((key) => (
                  <TableRow key={key}>
                    <TableCell className="whitespace-normal">{t(`nis2InGermany.penalties.byViolation.rows.${key}.violation`)}</TableCell>
                    <TableCell className="text-right font-medium">{t(`nis2InGermany.penalties.byViolation.rows.${key}.fine`)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Management Liability */}
      <Card>
        <CardHeader>
          <CardTitle>{t("nis2InGermany.managementLiability.heading")}</CardTitle>
          <CardDescription>{t("nis2InGermany.managementLiability.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold">{t("nis2InGermany.managementLiability.duties.heading")}</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {dutyKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">{t(`nis2InGermany.managementLiability.duties.${key}.title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(`nis2InGermany.managementLiability.duties.${key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2InGermany.managementLiability.liability")}</p>
          <p className="text-xs text-muted-foreground">{t("nis2InGermany.managementLiability.waiver")}</p>
        </CardContent>
      </Card>

      {/* BSI Registration */}
      <Card>
        <CardHeader>
          <CardTitle>{t("nis2InGermany.registration.heading")}</CardTitle>
          <CardDescription>{t("nis2InGermany.registration.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-sm font-semibold">{t("nis2InGermany.registration.deadline")}</p>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2InGermany.registration.process")}</p>
          <p className="text-xs text-muted-foreground">{t("nis2InGermany.registration.selfId")}</p>
        </CardContent>
      </Card>

      {/* Supervision */}
      <Card>
        <CardHeader>
          <CardTitle>{t("nis2InGermany.supervision.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("nis2InGermany.supervision.headers.aspect")}</TableHead>
                <TableHead>{t("nis2InGermany.supervision.headers.bwe")}</TableHead>
                <TableHead>{t("nis2InGermany.supervision.headers.we")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supervisionKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{t(`nis2InGermany.supervision.rows.${key}.aspect`)}</TableCell>
                  <TableCell className="whitespace-normal">{t(`nis2InGermany.supervision.rows.${key}.bwe`)}</TableCell>
                  <TableCell className="whitespace-normal">{t(`nis2InGermany.supervision.rows.${key}.we`)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
