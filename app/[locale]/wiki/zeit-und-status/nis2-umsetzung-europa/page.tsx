import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { itemShot } from "@/components/durchgang/itemShots";
import { JsonLd } from "@/components/JsonLd";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { WalkHow } from "@/components/wiki/WalkHow";
import { WalkPriceCard } from "@/components/wiki/WalkPriceCard";
import { WalkSteps } from "@/components/wiki/WalkSteps";
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
import type { RegistrationPortal } from "@/lib/registration-portals";
import { getRegistrationPortals } from "@/lib/registration-portals";
import { type Locale, pageAlternates, pageOg } from "@/lib/seo";

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

const faqKeys = ["1", "2", "3", "4"] as const;

/** The walk's registration step, whose screen shows the country and its authority. */
const REGISTRATION_STEP = "12.2";

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
                `registrationPortals.countries.${portal.countryCode}` as Parameters<
                  typeof t
                >[0],
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
  const [info, t, w] = await Promise.all([
    getTranslations("info"),
    getTranslations("info.euImplementation"),
    getTranslations("info.wikiWalk"),
  ]);
  const data = getRegistrationPortals();
  const shot = itemShot(REGISTRATION_STEP, rawLocale, t("walk.seeItAlt"));
  if (!shot) throw new Error(`The walk has no screenshot for step ${REGISTRATION_STEP}`);

  const operational = data.portals.filter((p) => p.status === "operational");
  const preReg = data.portals.filter((p) => p.status === "pre-registration");
  const planned = data.portals.filter((p) => p.status === "planned");
  const notAvailable = data.portals.filter((p) => p.status === "not-yet-available");

  // A country has transposed NIS 2 once its national law is in force.
  const countryName = (code: string) =>
    info(`registrationPortals.countries.${code}` as Parameters<typeof info>[0]);
  const status = {
    inForce: data.portals.filter((p) => p.entryIntoForce !== null).length,
    missing: new Intl.ListFormat(rawLocale, { type: "conjunction" }).format(
      data.portals
        .filter((p) => p.entryIntoForce === null)
        .map((p) => countryName(p.countryCode)),
    ),
  };
  const faq: WikiQuestion[] = faqKeys.map((key) => ({
    q: t(`faq.q${key}`),
    a: t(`faq.a${key}`, status),
  }));

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="zeit-und-status"
          slug="nis2-umsetzung-europa"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung und IT-Verantwortliche im Mittelstand"
          citationKeys={["nis2", "cir-2024-2690"]}
          aboutKeys={["nis2"]}
        />
        <JsonLd data={faqJsonLd(faq)} />

        <WikiAnswerHeader
          badge={t("badge")}
          title={t("title")}
          answer={t("subtitle", status)}
          art="/images/wiki/nis2-europa.svg"
        />

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale}
          lastReviewedAt={data.lastUpdated}
          sourceLocale="de"
        />

        <Separator />

        <section id="portals" className="scroll-mt-24 space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("portals.heading")}
            </h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("portals.lead")}
            </p>
          </div>

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
                    {info(`registrationPortals.status.${key}`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {(
            [
              {
                list: operational,
                title: "operationalSection",
                lead: "operationalDescription",
              },
              { list: preReg, title: "preRegSection", lead: "preRegDescription" },
              { list: planned, title: "plannedSection", lead: "plannedDescription" },
              {
                list: notAvailable,
                title: "notAvailableSection",
                lead: "notAvailableDescription",
              },
            ] as const
          )
            .filter(({ list }) => list.length > 0)
            .map(({ list, title, lead }) => (
              <Card key={title}>
                <CardHeader>
                  <CardTitle>{info(`registrationPortals.${title}`)}</CardTitle>
                  <CardDescription>{info(`registrationPortals.${lead}`)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <PortalTable portals={list} t={info} />
                </CardContent>
              </Card>
            ))}
        </section>

        <WikiSection
          heading={t("rule.heading")}
          paragraphs={t.raw("rule.paragraphs") as string[]}
          law={t("rule.law")}
        />

        <WikiSection
          heading={t("same.heading")}
          paragraphs={t.raw("same.paragraphs") as string[]}
          law={t("same.law")}
        />

        <WikiSection
          heading={t("size.heading")}
          paragraphs={t.raw("size.paragraphs") as string[]}
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
          shot={shot}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <WikiFaq heading={t("faq.heading")} items={faq} />

        <WikiSources
          heading={t("sources.heading")}
          items={t.raw("sources.items") as string[]}
        />

        <WalkSteps kind="national" />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
