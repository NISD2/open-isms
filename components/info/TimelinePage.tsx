import { getTranslations } from "next-intl/server";
import { Timeline } from "@/components/info/Timeline";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import type { LegislationKey } from "@/lib/content/citations";
import { wikiLocale } from "@/lib/content/wiki-locale";
import type { TimelineId } from "@/lib/timeline";

interface TimelinePageProps {
  locale: string;
  /** The German-canonical slug under zeit-und-status; matches the page's directory. */
  slug: string;
  timeline: TimelineId;
  /** The `timelines.<key>` message namespace holding badge, title and subtitle. */
  messages: string;
  law: LegislationKey;
}

/** A regulation's timeline as a wiki page: the header, then the dated events. */
export async function TimelinePage({
  locale: rawLocale,
  slug,
  timeline,
  messages,
  law,
}: TimelinePageProps) {
  const locale = wikiLocale(rawLocale);
  const t = await getTranslations(`timelines.${messages}`);

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-10">
        <WikiPageJsonLd
          category="zeit-und-status"
          slug={slug}
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Intermediate"
          audienceType="Geschäftsführung und Compliance-Beauftragte"
          citationKeys={[law]}
          aboutKeys={[law]}
        />
        <header>
          <Badge variant="secondary" className="mb-3">
            {t("badge")}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t("subtitle")}</p>
        </header>

        <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : locale} />

        <Separator />

        <Timeline id={timeline} />
      </div>
    </GlossedProse>
  );
}
