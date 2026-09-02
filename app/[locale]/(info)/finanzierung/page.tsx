import type { Metadata } from "next";
import { pageAlternates, pageOg } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const title = isEn ? "How we are funded | nisd2.eu" : "Finanzierung | nisd2.eu";
  const description = isEn
    ? "How nisd2.eu pays its bills, who owns the operating company, and why the platform is free."
    : "Wie nisd2.eu seine Rechnungen bezahlt, wem das Betreiberunternehmen gehört, und warum die Plattform kostenlos ist.";
  return {
    title,
    description,
    alternates: pageAlternates("finanzierung", locale),
    ...pageOg({ slug: "finanzierung", locale, title, description }),
  };
}

export default async function FinanzierungPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";

  if (isEn) {
    return (
      <div className="prose prose-sm max-w-none">
        <h1>How we are funded</h1>

        <h2>Operator</h2>
        <p>
          The wiki and the NIS 2 platform are operated by Simon Orzel in
          Germany. No external shareholders, no VC investment.
        </p>

        <h2>Revenue today (2026)</h2>
        <p>
          The platform itself is free. We currently fund operations through
          founder savings plus three early income lines: affiliate revenue from
          training partners (paid by the partner, never by readers), referral
          fees from a hand-picked consultant list (paid only on closed
          engagements), and small consulting projects we take on directly when
          they advance the platform mission.
        </p>

        <h2>Revenue we have rejected</h2>
        <p>
          We have declined: VC term sheets that would require the wiki to gate
          content, sponsored-content offers from GRC tool vendors, and paid
          placement requests from law firms.
        </p>

        <h2>Why free</h2>
        <p>
          The mission is to halve Europe's NIS 2 compliance bill. Gatekeeping
          information behind a paywall would defeat that mission. We monetise
          adjacent services (training partnerships, consultant lead routing,
          eventual self-hostable enterprise tier) while keeping the wiki
          itself open.
        </p>

        <h2>Public funding applications</h2>
        <p>
          We have applied to: Sovereign Tech Fund (open-source infrastructure),
          NLnet (open-source), Gründungszuschuss (German founder unemployment
          bridge). Awards and rejections will be logged here when they finalise.
        </p>
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none">
      <h1>Finanzierung</h1>

      <h2>Betreiber</h2>
      <p>
        Wiki und NIS 2 Plattform werden von Simon Orzel in Deutschland
        betrieben. Keine externen Gesellschafter, kein VC-Investment.
      </p>

      <h2>Einnahmen heute (2026)</h2>
      <p>
        Die Plattform ist kostenlos. Wir finanzieren den Betrieb aktuell aus
        Gründer-Ersparnissen plus drei frühen Einnahmequellen: Affiliate-
        Erträge von Schulungs-Partnern (vom Partner gezahlt, nie vom Leser),
        Vermittlungsgebühren aus einer handverlesenen Beraterliste
        (nur bei abgeschlossenen Projekten), und kleinere direkte
        Beratungsprojekte, die wir annehmen, wenn sie der Plattformmission
        dienen.
      </p>

      <h2>Einnahmen, die wir abgelehnt haben</h2>
      <p>
        Wir haben abgelehnt: VC-Termsheets, die uns gezwungen hätten, Wiki-
        Inhalte hinter Paywalls zu stellen, Angebote für Sponsored Content
        von GRC-Tool-Anbietern, und bezahlte Platzierungsanfragen von
        Anwaltskanzleien.
      </p>

      <h2>Warum kostenlos</h2>
      <p>
        Die Mission ist es, die NIS 2 Rechnung Europas zu halbieren.
        Information hinter einer Paywall einzusperren würde diese Mission
        verfehlen. Wir monetarisieren angrenzende Dienste (Schulungs-
        Partnerschaften, Beratungsvermittlung, später eine selbst-hostbare
        Enterprise-Variante) und halten das Wiki selbst offen.
      </p>

      <h2>Förderanträge</h2>
      <p>
        Wir haben Anträge laufen bei: Sovereign Tech Fund (Open-Source-
        Infrastruktur), NLnet (Open Source), Gründungszuschuss
        (Arbeitsagentur). Bewilligungen und Ablehnungen werden hier
        nach Abschluss protokolliert.
      </p>
    </div>
  );
}
