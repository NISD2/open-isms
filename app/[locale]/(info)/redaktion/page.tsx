import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/locale";
import { pageAlternates, pageOg } from "@/lib/seo";

const META = {
  de: {
    title: "Redaktionsleitlinien | nisd2.eu",
    description:
      "Wie wir Themen wählen, EU- und nationale Primärquellen zitieren, Autoren benennen und Fehler korrigieren.",
  },
  en: {
    title: "Editorial principles | nisd2.eu",
    description:
      "How we choose topics, source primary EU and German law, attribute authors, and correct mistakes.",
  },
  cs: {
    title: "Redakční zásady | nisd2.eu",
    description:
      "Jak vybíráme témata, citujeme primární zdroje práva EU a českého práva, uvádíme autory a opravujeme chyby.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { title, description } = pickLocalized(META, locale, "de");
  return {
    title,
    description,
    alternates: pageAlternates("redaktion", locale),
    ...pageOg({ slug: "redaktion", locale, title, description }),
  };
}

function EditorialEn() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1>Editorial principles</h1>
      <p>
        nisd2.eu is a NIS 2 wiki for German Mittelstand operators. Three principles govern
        what we publish.
      </p>

      <h2>1. Primary sources, named and linked.</h2>
      <p>
        Every regulatory claim cites the EU directive, the German BSIG, the CIR 2024/2690
        implementing regulation, or the BSI publication it comes from. Citations link to
        the canonical EUR-Lex ELI URL or gesetze-im-internet.de paragraph. Our citation
        library at <a href="/wiki/zitate">/wiki/zitate</a> lists every source we
        reference.
      </p>

      <h2>2. Named authors with verifiable expertise.</h2>
      <p>
        Every article carries a byline (Simon Orzel or Cory Hisey). Author profiles at{" "}
        <a href="/autor/simon-orzel">/autor/simon-orzel</a> and{" "}
        <a href="/autor/cory-hisey">/autor/cory-hisey</a> list topic ownership and
        verifiable credentials (LinkedIn). No anonymous editorial.
      </p>

      <h2>3. We correct mistakes in public.</h2>
      <p>
        When we get something wrong, we update the article and log the change at{" "}
        <a href="/corrections">/corrections</a> with date and reason. We do not silently
        edit content to hide errors.
      </p>

      <h2>What we do not do</h2>
      <ul>
        <li>No paid placements disguised as editorial.</li>
        <li>No AI-generated content shipped without a named human review.</li>
        <li>
          No legal advice for individual cases — the wiki is informational content based
          on public sources, not a legal opinion under §2 RDG.
        </li>
      </ul>
    </div>
  );
}

function RedaktionDe() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1>Redaktionsleitlinien</h1>
      <p>
        nisd2.eu ist ein NIS 2 Wiki für den deutschen Mittelstand. Drei Grundsätze
        bestimmen, was wir veröffentlichen.
      </p>

      <h2>1. Primärquellen, benannt und verlinkt.</h2>
      <p>
        Jede regulatorische Aussage zitiert die EU-Richtlinie, das BSIG, die
        Durchführungsverordnung CIR 2024/2690 oder die BSI-Veröffentlichung, aus der sie
        stammt. Zitate verlinken auf die kanonische EUR-Lex ELI URL oder den jeweiligen
        §-Anker auf gesetze-im-internet.de. Unsere Zitatbibliothek unter{" "}
        <a href="/wiki/zitate">/wiki/zitate</a> listet alle Quellen.
      </p>

      <h2>2. Autoren mit nachprüfbarer Expertise.</h2>
      <p>
        Jeder Artikel trägt eine Autorenzeile (Simon Orzel oder Cory Hisey). Die
        Autorenprofile auf <a href="/autor/simon-orzel">/autor/simon-orzel</a> und{" "}
        <a href="/autor/cory-hisey">/autor/cory-hisey</a> listen Themen­ verantwortung und
        nachprüfbare Credentials (LinkedIn). Keine anonyme Redaktion.
      </p>

      <h2>3. Wir korrigieren Fehler öffentlich.</h2>
      <p>
        Wenn wir etwas falsch geschrieben haben, aktualisieren wir den Artikel und
        protokollieren die Änderung unter <a href="/corrections">/corrections</a> mit
        Datum und Begründung. Wir ändern Inhalte nicht stillschweigend, um Fehler zu
        kaschieren.
      </p>

      <h2>Was wir nicht machen</h2>
      <ul>
        <li>Keine bezahlten Platzierungen, die wie Redaktion aussehen.</li>
        <li>Keine KI-generierten Inhalte ohne benannte menschliche Review.</li>
        <li>
          Keine Einzelfall-Rechtsberatung — das Wiki sind Informationsinhalte auf Basis
          öffentlicher Quellen, keine Rechtsauskunft im Sinne des §2 RDG.
        </li>
      </ul>
    </div>
  );
}

function RedakceCs() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1>Redakční zásady</h1>
      <p>
        nisd2.eu je wiki o NIS 2 pro střední firmy. České stránky píšeme pro firmy, na
        které dopadá zákon č. 264/2025 Sb., o kybernetické bezpečnosti. Co zveřejňujeme,
        určují tři zásady.
      </p>

      <h2>1. Primární zdroje, pojmenované a odkázané.</h2>
      <p>
        Každé regulatorní tvrzení cituje předpis nebo publikaci, ze které vychází:
        směrnici NIS 2, prováděcí nařízení (EU) 2024/2690, zákon č. 264/2025 Sb. a jeho
        vyhlášky nebo materiál NÚKIB. Předpisy EU odkazujeme na EUR-Lex, zákon a vyhlášky
        na příslušné ustanovení v e-Sbírce (e-sbirka.gov.cz). Naše{" "}
        <Link href="/wiki/zitate">knihovna citací</Link> uvádí předpisy EU s odkazem na
        úřední text.
      </p>

      <h2>2. Jmenovití autoři s ověřitelnou odborností.</h2>
      <p>
        Každý článek nese jméno autora (Simon Orzel nebo Cory Hisey). Profily autorů{" "}
        <Link href="/autor/simon-orzel">Simon Orzel</Link> a{" "}
        <Link href="/autor/cory-hisey">Cory Hisey</Link> uvádějí, za která témata
        odpovídají, a ověřitelnou kvalifikaci (LinkedIn). Žádný anonymní redakční obsah.
      </p>

      <h2>3. Chyby opravujeme veřejně.</h2>
      <p>
        Když se zmýlíme, článek opravíme a změnu s datem a důvodem zapíšeme na stránku{" "}
        <Link href="/corrections">Opravy</Link>. Obsah neupravujeme potichu, abychom chyby
        zakryli.
      </p>

      <h2>Co neděláme</h2>
      <ul>
        <li>Žádné placené umístění vydávané za redakční obsah.</li>
        <li>
          Žádný obsah vytvořený umělou inteligencí bez kontroly jmenovitě uvedeným
          člověkem.
        </li>
        <li>
          Žádné právní poradenství v jednotlivých případech: wiki je informační obsah z
          veřejných zdrojů, nikoli právní stanovisko.
        </li>
      </ul>
    </div>
  );
}

const BODY = { de: RedaktionDe, en: EditorialEn, cs: RedakceCs };

export default async function RedaktionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const Body = pickLocalized(BODY, locale, "de");
  return <Body />;
}
