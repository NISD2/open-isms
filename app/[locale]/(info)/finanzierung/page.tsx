import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/locale";
import { pageAlternates, pageOg } from "@/lib/seo";

const META = {
  de: {
    title: "Finanzierung | nisd2.eu",
    description:
      "Wie nisd2.eu seine Rechnungen bezahlt, wer das Betreiberunternehmen führt, und warum das Wiki kostenlos ist.",
  },
  en: {
    title: "How we are funded | nisd2.eu",
    description:
      "How nisd2.eu pays its bills, who runs the operating company, and why the wiki is free.",
  },
  cs: {
    title: "Jak se financujeme | nisd2.eu",
    description:
      "Jak nisd2.eu platí své účty, kdo vede provozní společnost a proč je wiki zdarma.",
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
    alternates: pageAlternates("finanzierung", locale),
    ...pageOg({ slug: "finanzierung", locale, title, description }),
  };
}

function FundingEn() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1>How we are funded</h1>

      <h2>Operator</h2>
      <p>
        The wiki and the NIS 2 platform are operated by Kardashev Catalyst UG
        (haftungsbeschränkt) in Köln, Germany, managed by Simon Orzel. No external
        shareholders, no VC investment.
      </p>

      <h2>Revenue today (2026)</h2>
      <p>
        The wiki and the courses are free. The NIS 2 walkthrough on the platform is paid;
        its price is on the pricing page. We also fund operations through founder savings
        plus three early income lines: affiliate revenue from training partners (paid by
        the partner, never by readers), referral fees from a hand-picked consultant list
        (paid only on closed engagements), and small consulting projects we take on
        directly when they advance the platform mission.
      </p>

      <h2>Revenue we have rejected</h2>
      <p>
        We have declined: VC term sheets that would require the wiki to gate content,
        sponsored-content offers from GRC tool vendors, and paid placement requests from
        law firms.
      </p>

      <h2>Why free</h2>
      <p>
        The mission is to halve Europe's NIS 2 compliance bill. Gatekeeping information
        behind a paywall would defeat that mission. We monetise adjacent services
        (training partnerships, consultant lead routing, eventual self-hostable enterprise
        tier) while keeping the wiki itself open.
      </p>

      <h2>Public funding applications</h2>
      <p>
        We have applied to: Sovereign Tech Fund (open-source infrastructure), NLnet
        (open-source), Gründungszuschuss (German founder unemployment bridge). Awards and
        rejections will be logged here when they finalise.
      </p>
    </div>
  );
}

function FinanzierungDe() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1>Finanzierung</h1>

      <h2>Betreiber</h2>
      <p>
        Wiki und NIS 2 Plattform werden von der Kardashev Catalyst UG (haftungsbeschränkt)
        in Köln betrieben, Geschäftsführer ist Simon Orzel. Keine externen Gesellschafter,
        kein VC-Investment.
      </p>

      <h2>Einnahmen heute (2026)</h2>
      <p>
        Wiki und Kurse sind kostenlos. Der Durchgang auf der Plattform ist
        kostenpflichtig, der Preis steht auf der Preisseite. Außerdem finanzieren wir den
        Betrieb aktuell aus Gründer-Ersparnissen plus drei frühen Einnahmequellen:
        Affiliate-Erträge von Schulungs-Partnern (vom Partner gezahlt, nie vom Leser),
        Vermittlungsgebühren aus einer handverlesenen Beraterliste (nur bei
        abgeschlossenen Projekten), und kleinere direkte Beratungsprojekte, die wir
        annehmen, wenn sie der Plattformmission dienen.
      </p>

      <h2>Einnahmen, die wir abgelehnt haben</h2>
      <p>
        Wir haben abgelehnt: VC-Termsheets, die uns gezwungen hätten, Wiki-Inhalte hinter
        Paywalls zu stellen, Angebote für Sponsored Content von GRC-Tool-Anbietern, und
        bezahlte Platzierungsanfragen von Anwaltskanzleien.
      </p>

      <h2>Warum kostenlos</h2>
      <p>
        Die Mission ist es, die NIS 2 Rechnung Europas zu halbieren. Information hinter
        einer Paywall einzusperren würde diese Mission verfehlen. Wir monetarisieren
        angrenzende Dienste (Schulungspartnerschaften, Beratungsvermittlung, später eine
        selbst-hostbare Enterprise-Variante) und halten das Wiki selbst offen.
      </p>

      <h2>Förderanträge</h2>
      <p>
        Wir haben Anträge laufen bei: Sovereign Tech Fund (Open-Source-Infrastruktur),
        NLnet (Open Source), Gründungszuschuss (Arbeitsagentur). Bewilligungen und
        Ablehnungen werden hier nach Abschluss protokolliert.
      </p>
    </div>
  );
}

function FinancovaniCs() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1>Jak se financujeme</h1>

      <h2>Provozovatel</h2>
      <p>
        Wiki a platformu NIS 2 provozuje společnost Kardashev Catalyst UG
        (haftungsbeschränkt) se sídlem v Kolíně nad Rýnem v Německu, jejím jednatelem je
        Simon Orzel. Nemáme externí společníky ani investice rizikového kapitálu.
      </p>

      <h2>Příjmy dnes (2026)</h2>
      <p>
        Wiki a kurzy jsou zdarma. Průvodce NIS 2 na platformě je placený, cenu najdete v{" "}
        <Link href="/pricing">ceníku</Link>. Provoz dále financujeme z úspor zakladatelů a
        ze tří raných zdrojů příjmů: affiliate příjmy od partnerů pro školení (platí je
        partner, nikdy čtenář), provize za doporučení z pečlivě vybraného seznamu
        konzultantů (jen u uzavřených zakázek) a menší poradenské projekty, které
        přijímáme přímo, pokud podporují poslání platformy.
      </p>

      <h2>Příjmy, které jsme odmítli</h2>
      <p>
        Odmítli jsme nabídky rizikového kapitálu, které by vyžadovaly uzavřít obsah wiki
        za platbu, nabídky placeného obsahu od dodavatelů nástrojů GRC a žádosti
        advokátních kanceláří o placené umístění.
      </p>

      <h2>Proč zdarma</h2>
      <p>
        Naším posláním je snížit evropské náklady na plnění NIS 2 na polovinu. Zamknout
        informace za platební bránu by tomuto poslání odporovalo. Vyděláváme na
        navazujících službách (partnerství pro školení, doporučování konzultantů, později
        verze pro firmy k provozu na vlastních serverech) a samotnou wiki necháváme
        otevřenou.
      </p>

      <h2>Žádosti o veřejné financování</h2>
      <p>
        Podali jsme žádosti u těchto programů: Sovereign Tech Fund (otevřená
        infrastruktura), NLnet (open source) a Gründungszuschuss (německý příspěvek úřadu
        práce na zahájení podnikání). Přiznání i zamítnutí zde zapíšeme, jakmile budou
        rozhodnuta.
      </p>
    </div>
  );
}

const BODY = { de: FinanzierungDe, en: FundingEn, cs: FinancovaniCs };

export default async function FinanzierungPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const Body = pickLocalized(BODY, locale, "de");
  return <Body />;
}
