import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { SourceText } from "@/components/wiki/SourceText";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { Link } from "@/i18n/navigation";
import { wikiLabel, wikiLocale } from "@/lib/content/wiki-locale";
import {
  type GlossaryEntry,
  getGlossary,
  glossaryByLetter,
} from "@/lib/dictionary/glossary";
import { getTermUses, taughtIn } from "@/lib/dictionary/usage";
import { isLocaleCode } from "@/lib/locale";
import { pageAlternates, pageOg } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("glossary.meta.title");
  const description = t("glossary.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/glossar", locale),
    ...pageOg({
      slug: "wiki/grundlagen/glossar",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const letterId = (letter: string) => `letter-${letter === "#" ? "symbols" : letter}`;

export default async function GlossaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = wikiLocale(rawLocale);
  // The wiki's furniture is German, English, Dutch or Czech; the definitions
  // exist in every language the dictionary has, so the reader's own is used.
  const dictionaryLocale = isLocaleCode(rawLocale) ? rawLocale : "en";
  const t = await getTranslations("info");

  const entries = getGlossary(dictionaryLocale);
  const letters = glossaryByLetter(dictionaryLocale);
  const uses = await getTermUses(dictionaryLocale);

  const definitions = entries.map((entry) => ({
    "@type": "DefinedTerm" as const,
    name: entry.term,
    description: entry.definition,
  }));
  const sources = t.raw("glossary.sources.items") as string[];

  const renderUse = (entry: GlossaryEntry) => {
    const all = uses.get(entry.term.toLowerCase()) ?? [];
    const main = taughtIn(all);
    if (!main) return null;
    // Lesson numbers repeat across courses (every course has a 0.1), so a lesson
    // in another course than the quoted one is named with its course.
    const elsewhere = all
      .filter((use) => use !== main)
      .map((use) => {
        const lesson = t("glossary.lesson", { id: use.lessonId });
        return use.courseId === main.courseId ? lesson : `${use.courseTitle}, ${lesson}`;
      });
    return (
      <dd className="mt-2 border-l-2 border-primary/20 pl-3 text-xs leading-relaxed text-muted-foreground">
        <q className="italic">{main.sentence}</q>
        <span className="mt-1 block">
          <Link
            href={`/training/${main.courseId}`}
            className="underline underline-offset-2"
          >
            {main.courseTitle}
          </Link>
          {", "}
          {t("glossary.lesson", { id: main.lessonId })}: {main.lessonTitle}
          {elsewhere.length > 0 &&
            `. ${t("glossary.alsoIn", { items: elsewhere.join("; ") })}`}
        </span>
      </dd>
    );
  };

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-10">
        <WikiPageJsonLd
          category="grundlagen"
          slug="glossar"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsleitung und IT-Verantwortliche im Mittelstand"
          mentionsKeys={["nis2", "bsig", "cir-2024-2690", "gdpr", "cra", "dora"]}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            name: t("glossary.title"),
            hasDefinedTerm: definitions,
          }}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            {wikiLabel(locale, {
              cs: "NIS2 / zákon č. 264/2025 Sb.",
              other: "NIS2 / BSIG / CRA",
            })}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">{t("glossary.title")}</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("glossary.subtitle", { count: entries.length })}
          </p>
        </header>

        <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : locale} />

        <Separator />

        <section className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("glossary.intro")}
          </p>
          <nav aria-label={t("glossary.lettersLabel")}>
            <ul className="flex flex-wrap gap-1.5">
              {letters.map(({ letter }) => (
                <li key={letter}>
                  <a
                    href={`#${letterId(letter)}`}
                    className="inline-flex size-11 items-center justify-center rounded-md border text-sm font-medium hover:bg-muted sm:size-9"
                  >
                    {letter}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        {letters.map(({ letter, rows }) => (
          <section key={letter} id={letterId(letter)} className="scroll-mt-24">
            <h2 className="mb-1 border-b pb-2 text-xl font-semibold">{letter}</h2>
            <dl>
              {rows.map((row) =>
                row.kind === "entry" ? (
                  <div
                    key={row.entry.slug}
                    id={row.entry.slug}
                    className="scroll-mt-24 border-b py-4 last:border-b-0"
                  >
                    <dt className="text-sm font-semibold">{row.entry.term}</dt>
                    {row.entry.aliases.length > 0 && (
                      <dd className="text-xs italic text-muted-foreground/60">
                        {t("glossary.alsoCalled")} {row.entry.aliases.join(", ")}
                      </dd>
                    )}
                    <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {row.entry.definition}
                    </dd>
                    {row.entry.legalRef && (
                      <dd className="mt-1 text-xs text-primary">{row.entry.legalRef}</dd>
                    )}
                    {renderUse(row.entry)}
                  </div>
                ) : (
                  <div
                    key={`see-${row.label}-${row.entry.slug}`}
                    className="border-b py-3 text-sm last:border-b-0"
                  >
                    <dt className="inline font-semibold">{row.label}</dt>
                    <dd className="inline text-muted-foreground">
                      {" "}
                      {t("glossary.see")}{" "}
                      <a
                        href={`#${row.entry.slug}`}
                        className="underline underline-offset-2"
                      >
                        {row.entry.term}
                      </a>
                    </dd>
                  </div>
                ),
              )}
            </dl>
          </section>
        ))}

        <Separator />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("glossary.sources.heading")}</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {sources.map((source) => (
              <li key={source}>
                <SourceText text={source} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </GlossedProse>
  );
}
