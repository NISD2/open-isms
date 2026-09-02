import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CopyProtected } from "@/components/CopyProtected";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { HELP_LOCALES, pageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("help");
  const title = t("meta.title");
  return {
    title,
    description: t("meta.description"),
    alternates: pageAlternates("hilfe", locale, HELP_LOCALES),
    // No openGraph block, deliberately. lib/og-cards.json carries no "hilfe"
    // entry, so ogImages() returned undefined -- and Next REPLACES the parent
    // openGraph object rather than deep-merging it. Declaring one here
    // therefore dropped siteName, locale, alternateLocale, title and
    // description from app/layout.tsx and shipped a bare share card for a
    // page the sitemap lists at priority 0.8. Inheriting the root defaults is
    // strictly better until a card exists, which is what /vermittlung does.
  };
}

const stepKeys = ["s1", "s2", "s3", "s4"] as const;
const notDoKeys = ["legal", "authority", "commission"] as const;

/**
 * Tier heading: the level label as a numeral badge plus the level's own
 * sentence. The numeral carries the three-step structure of the offer; the
 * label ("Stufe 2") stays readable for screen readers and for locales where
 * the word, not the digit, does the work.
 */
function TierHeading({ index, label, heading }: { index: number; label: string; heading: string }) {
  return (
    <CardHeader>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <CardTitle className="text-xl">
        <span className="text-primary tabular-nums">{index}. </span>
        {heading}
      </CardTitle>
    </CardHeader>
  );
}

export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ req?: string | string[] }>;
}) {
  const t = await getTranslations("help");
  const { req } = await searchParams;
  const reqRaw = Array.isArray(req) ? req[0] : req;

  // StuckLink appends ?req=<requirementCode> so the reader does not have to
  // retype where they got stuck. Nothing read it before, so every code
  // produced a distinct URL that behaved identically and the prefill the
  // prop documents silently did not happen. Folded into the mail subject
  // here. Shape-checked because the value goes straight into a mailto the
  // user is about to send: a requirement code, not arbitrary query text.
  const stuckOn =
    reqRaw && /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/.test(reqRaw) ? reqRaw : null;
  const subject = stuckOn
    ? `${t("contact.subject")} (${stuckOn})`
    : t("contact.subject");

  return (
    <CopyProtected>
      <article>
        <header>
          <MarketingHero headline={t("title")} subhead={t("intro")} />
        </header>

        <Separator className="my-8" />

        <div className="space-y-6">
          {/* Tier 1 — the free platform, hosted or self-hosted */}
          <section id="tier-1">
            <Card>
              <TierHeading index={1} label={t("tier1.label")} heading={t("tier1.heading")} />
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{t("tier1.p1")}</p>
                <p>{t("tier1.p2")}</p>
                <p>{t("tier1.p3")}</p>
                {/* Member-state transposition note: written for the EU-wide
                    copy, absent from the German original, which cites §30
                    BSIG inline instead. */}
                {t.has("tier1.p4") && <p>{t("tier1.p4")}</p>}
              </CardContent>
            </Card>
          </section>

          {/* Tier 2 — our own hours, the only rate on this page */}
          <section id="tier-2">
            <Card>
              <TierHeading index={2} label={t("tier2.label")} heading={t("tier2.heading")} />
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{t("tier2.p1")}</p>
                <p className="text-base font-semibold text-foreground">
                  {t("tier2.rate")}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {t("tier2.rateNote")}
                  </span>
                </p>
                <p>{t("tier2.p2")}</p>
                <p>{t("tier2.p3")}</p>
              </CardContent>
            </Card>
          </section>

          {/* Tier 3 — referral to a specialist firm, free for the user */}
          <section id="tier-3">
            <Card>
              <TierHeading index={3} label={t("tier3.label")} heading={t("tier3.heading")} />
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{t("tier3.p1")}</p>
                <p>{t("tier3.p2")}</p>
                <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-foreground">
                  {stepKeys.map((key) => (
                    <li key={key}>{t(`tier3.steps.${key}`)}</li>
                  ))}
                </ol>
                <p className="font-medium text-foreground">{t("tier3.p3")}</p>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Commission disclosure. Sits in the body of the offer, directly under
            the tier it applies to, never in the footer or the small print. */}
        <section id="how-we-earn" className="mt-8">
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-xl">{t("earn.heading")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium text-foreground">{t("earn.p1")}</p>
              <p className="text-muted-foreground">{t("earn.p2")}</p>
              <p className="text-muted-foreground">{t("earn.p3")}</p>
              <p>
                <Link
                  href="/vermittlung"
                  className="text-sm font-medium underline underline-offset-4 hover:text-primary"
                >
                  {t("earn.link")}
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>

        <section id="what-we-do-not-do" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t("notDo.heading")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {notDoKeys.map((key) => (
                  <li key={key} className="flex gap-2">
                    <span aria-hidden className="text-muted-foreground">
                      &bull;
                    </span>
                    <span>{t(`notDo.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section id="contact" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t("contact.heading")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{t("contact.p1", { email: t("contact.email") })}</p>
              <Button asChild>
                <a
                  href={`mailto:${t("contact.email")}?subject=${encodeURIComponent(subject)}`}
                >
                  {t("contact.cta")}
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>
      </article>
    </CopyProtected>
  );
}
