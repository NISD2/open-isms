import type { LocaleCode } from "@/lib/locale";

/**
 * The words on a wiki page's author strip ("Zuletzt geprüft 30. Mai 2026") in the reader's own
 * language, for every locale the site serves.
 *
 * The strip used to key these by `WikiLocale`, and `wikiLocale()` maps every locale except de, en,
 * nl and cs to German, so a Spanish or Polish page showed German labels over its translated body.
 * Keyed by `LocaleCode`, a locale added to the site without its labels fails to compile.
 */
export const BYLINE_LABELS: Record<
  LocaleCode,
  {
    readonly reviewed: string;
    readonly published: string;
    readonly continuous: string;
    /** The BCP 47 tag the date is written in. */
    readonly dateTag: string;
  }
> = {
  de: {
    reviewed: "Zuletzt geprüft",
    published: "Veröffentlicht",
    continuous: "Laufend geprüft",
    dateTag: "de-DE",
  },
  en: {
    reviewed: "Last reviewed",
    published: "Published",
    continuous: "Continuously reviewed",
    dateTag: "en-GB",
  },
  nl: {
    reviewed: "Laatst gecontroleerd",
    published: "Gepubliceerd",
    continuous: "Doorlopend gecontroleerd",
    dateTag: "nl-NL",
  },
  fr: {
    reviewed: "Dernière vérification",
    published: "Publié",
    continuous: "Vérifié en continu",
    dateTag: "fr-FR",
  },
  it: {
    reviewed: "Ultima verifica",
    published: "Pubblicato",
    continuous: "Verifica continua",
    dateTag: "it-IT",
  },
  es: {
    reviewed: "Última revisión",
    published: "Publicado",
    continuous: "Revisión continua",
    dateTag: "es-ES",
  },
  pl: {
    reviewed: "Ostatnio sprawdzono",
    published: "Opublikowano",
    continuous: "Stale weryfikowane",
    dateTag: "pl-PL",
  },
  cs: {
    reviewed: "Naposledy zkontrolováno",
    published: "Zveřejněno",
    continuous: "Průběžně kontrolováno",
    dateTag: "cs-CZ",
  },
  pt: {
    reviewed: "Última revisão",
    published: "Publicado",
    continuous: "Revisão contínua",
    dateTag: "pt-PT",
  },
  ro: {
    reviewed: "Ultima verificare",
    published: "Publicat",
    continuous: "Verificat continuu",
    dateTag: "ro-RO",
  },
};

/**
 * A calendar day written the way the locale writes it, such as "30 de mayo de 2026". The day is
 * the one on a Berlin clock, so an instant late on the 28th UTC is already the 29th.
 */
export function bylineDate(iso: string, locale: LocaleCode): string {
  return new Date(iso).toLocaleDateString(BYLINE_LABELS[locale].dateTag, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  });
}

/** The strip's "last reviewed" line, such as "Zuletzt geprüft 29. Oktober 2026". */
export function reviewedLine(iso: string, locale: LocaleCode): string {
  return `${BYLINE_LABELS[locale].reviewed} ${bylineDate(iso, locale)}`;
}
