import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageAlternates, pageOg } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const title = isEn ? "Editorial principles | nisd2.eu" : "Redaktionsleitlinien | nisd2.eu";
  const description = isEn
    ? "How we choose topics, source primary EU and German law, attribute authors, and correct mistakes."
    : "Wie wir Themen wählen, EU- und nationale Primärquellen zitieren, Autoren benennen und Fehler korrigieren.";
  return {
    title,
    description,
    alternates: pageAlternates("redaktion", locale),
    ...pageOg({ slug: "redaktion", locale, title, description }),
  };
}

export default async function RedaktionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";

  if (isEn) {
    return (
      <div className="prose prose-sm max-w-none">
        <h1>Editorial principles</h1>
        <p>
          nisd2.eu is a NIS 2 wiki for German Mittelstand operators. Three principles
          govern what we publish.
        </p>

        <h2>1. Primary sources, named and linked.</h2>
        <p>
          Every regulatory claim cites the EU directive, the German BSIG, the CIR
          2024/2690 implementing regulation, or the BSI publication it comes from.
          Citations link to the canonical EUR-Lex ELI URL or gesetze-im-internet.de
          paragraph. Our citation library at{" "}
          <a href="/wiki/zitate">/wiki/zitate</a> lists every source we reference.
        </p>

        <h2>2. Named authors with verifiable expertise.</h2>
        <p>
          Every article carries a byline (Simon Orzel or Cory Hisey). Author
          profiles at <a href="/autor/simon-orzel">/autor/simon-orzel</a> and{" "}
          <a href="/autor/cory-hisey">/autor/cory-hisey</a> list topic ownership
          and verifiable credentials (LinkedIn). No anonymous editorial.
        </p>

        <h2>3. We correct mistakes in public.</h2>
        <p>
          When we get something wrong, we update the article and log the change
          at <a href="/corrections">/corrections</a> with date and reason. We do
          not silently edit content to hide errors.
        </p>

        <h2>What we do not do</h2>
        <ul>
          <li>No paid placements disguised as editorial.</li>
          <li>No AI-generated content shipped without a named human review.</li>
          <li>
            No legal advice for individual cases — the wiki is informational
            content based on public sources, not a legal opinion under §2 RDG.
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none">
      <h1>Redaktionsleitlinien</h1>
      <p>
        nisd2.eu ist ein NIS 2 Wiki für den deutschen Mittelstand. Drei
        Grundsätze bestimmen, was wir veröffentlichen.
      </p>

      <h2>1. Primärquellen, benannt und verlinkt.</h2>
      <p>
        Jede regulatorische Aussage zitiert die EU-Richtlinie, das BSIG, die
        Durchführungsverordnung CIR 2024/2690 oder die BSI-Veröffentlichung,
        aus der sie stammt. Zitate verlinken auf die kanonische EUR-Lex ELI
        URL oder den jeweiligen §-Anker auf gesetze-im-internet.de. Unsere
        Zitatbibliothek unter <a href="/wiki/zitate">/wiki/zitate</a> listet
        alle Quellen.
      </p>

      <h2>2. Autoren mit nachprüfbarer Expertise.</h2>
      <p>
        Jeder Artikel trägt eine Autorenzeile (Simon Orzel oder Cory Hisey).
        Die Autorenprofile auf{" "}
        <a href="/autor/simon-orzel">/autor/simon-orzel</a> und{" "}
        <a href="/autor/cory-hisey">/autor/cory-hisey</a> listen Themen­
        verantwortung und nachprüfbare Credentials (LinkedIn). Keine
        anonyme Redaktion.
      </p>

      <h2>3. Wir korrigieren Fehler öffentlich.</h2>
      <p>
        Wenn wir etwas falsch geschrieben haben, aktualisieren wir den Artikel
        und protokollieren die Änderung unter{" "}
        <a href="/corrections">/corrections</a> mit Datum und Begründung. Wir
        ändern Inhalte nicht stillschweigend, um Fehler zu kaschieren.
      </p>

      <h2>Was wir nicht machen</h2>
      <ul>
        <li>Keine bezahlten Platzierungen, die wie Redaktion aussehen.</li>
        <li>
          Keine KI-generierten Inhalte ohne benannte menschliche Review.
        </li>
        <li>
          Keine Einzelfall-Rechtsberatung — das Wiki sind Informationsinhalte
          auf Basis öffentlicher Quellen, keine Rechtsauskunft im Sinne des
          §2 RDG.
        </li>
      </ul>
    </div>
  );
}
