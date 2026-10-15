import Image from "next/image";
import { TranslationBadge } from "@/components/wiki/TranslationBadge";
import { Link } from "@/i18n/navigation";
import { AUTHORS, type DocsAuthor } from "@/lib/content/authors";
import type { WikiLocale } from "@/lib/content/wiki-locale";

/** The languages a wiki page is first written in. */
type SourceLocale = "de" | "en" | "nl";

/**
 * Visible E-E-A-T meta strip for a wiki article — author byline,
 * last-reviewed (or published) date, and an auto-translation notice
 * when the reader's locale differs from the source locale. Sits below
 * the H1 + subtitle. No bottom border; the page-level Separator
 * underneath handles the divider.
 */
export function WikiPageMeta({
  authorSlug,
  lastReviewedAt,
  datePublished,
  sourceLocale = "en",
  locale,
}: {
  authorSlug: DocsAuthor["slug"];
  /** ISO 8601 date string. Preferred over datePublished when both are set. */
  lastReviewedAt?: string;
  /** ISO 8601 date string. Shown as "Published ..." if lastReviewedAt is absent. */
  datePublished?: string;
  /** The language the page was originally written in. Defaults to "en". */
  sourceLocale?: SourceLocale;
  locale: WikiLocale;
}) {
  const author = AUTHORS[authorSlug];

  const reviewedDate = lastReviewedAt ?? datePublished;
  const dateLine = reviewedDate
    ? lastReviewedAt
      ? `${REVIEWED_LABEL[locale]} ${formatDate(reviewedDate, locale)}`
      : `${PUBLISHED_LABEL[locale]} ${formatDate(reviewedDate, locale)}`
    : CONTINUOUS_LABEL[locale];

  const translationNotice =
    locale !== sourceLocale ? TRANSLATION_NOTICE[locale][sourceLocale] : null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <Link
        href={author.profileUrl}
        className="flex items-center gap-2 hover:text-foreground"
      >
        <Image
          src={author.photoUrl}
          alt={author.name}
          width={32}
          height={32}
          className="h-8 w-8 rounded-full border border-border"
        />
        <span className="font-medium text-foreground">{author.name}</span>
      </Link>
      <span className="text-muted-foreground/60">·</span>
      {reviewedDate ? (
        <time dateTime={reviewedDate}>{dateLine}</time>
      ) : (
        <span>{dateLine}</span>
      )}
      {translationNotice ? <TranslationBadge notice={translationNotice} /> : null}
    </div>
  );
}

const REVIEWED_LABEL: Record<WikiLocale, string> = {
  de: "Zuletzt geprüft",
  en: "Last reviewed",
  nl: "Laatst gecontroleerd",
  cs: "Naposledy zkontrolováno",
};

const PUBLISHED_LABEL: Record<WikiLocale, string> = {
  de: "Veröffentlicht",
  en: "Published",
  nl: "Gepubliceerd",
  cs: "Zveřejněno",
};

const CONTINUOUS_LABEL: Record<WikiLocale, string> = {
  de: "Laufend geprüft",
  en: "Continuously reviewed",
  nl: "Doorlopend gecontroleerd",
  cs: "Průběžně kontrolováno",
};

const TRANSLATION_NOTICE: Record<WikiLocale, Record<SourceLocale, string>> = {
  en: {
    de: "Originally written in German, automatically translated.",
    en: "Originally written in English, automatically translated.",
    nl: "Originally written in Dutch, automatically translated.",
  },
  de: {
    de: "Original auf Deutsch verfasst, automatisch übersetzt.",
    en: "Original auf Englisch verfasst, automatisch übersetzt.",
    nl: "Original auf Niederländisch verfasst, automatisch übersetzt.",
  },
  nl: {
    de: "Origineel in het Duits geschreven, automatisch vertaald.",
    en: "Origineel in het Engels geschreven, automatisch vertaald.",
    nl: "Origineel in het Nederlands geschreven, automatisch vertaald.",
  },
  cs: {
    de: "Původně napsáno v němčině, automaticky přeloženo.",
    en: "Původně napsáno v angličtině, automaticky přeloženo.",
    nl: "Původně napsáno v nizozemštině, automaticky přeloženo.",
  },
};

const DATE_TAG: Record<WikiLocale, string> = {
  de: "de-DE",
  en: "en-GB",
  nl: "nl-NL",
  cs: "cs-CZ",
};

function formatDate(iso: string, locale: WikiLocale): string {
  const d = new Date(iso);
  return d.toLocaleDateString(DATE_TAG[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
