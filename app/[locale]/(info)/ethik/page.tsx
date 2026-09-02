import type { Metadata } from "next";
import { pageAlternates, pageOg } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const title = isEn ? "Ethics statement | nisd2.eu" : "Ethik | nisd2.eu";
  const description = isEn
    ? "Conflicts of interest, advertising policy, affiliate disclosures, and how we handle reader data."
    : "Interessenkonflikte, Werbe-Richtlinien, Affiliate-Offenlegung, und wie wir mit Leserdaten umgehen.";
  return {
    title,
    description,
    alternates: pageAlternates("ethik", locale),
    ...pageOg({ slug: "ethik", locale, title, description }),
  };
}

export default async function EthikPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";

  if (isEn) {
    return (
      <div className="prose prose-sm max-w-none">
        <h1>Ethics statement</h1>

        <h2>Conflicts of interest</h2>
        <p>
          We disclose every commercial relationship that could shape what we
          write. The direct financial interest behind nisd2.eu (Simon Orzel,
          who publishes it) is public via the Impressum. We do not own equity
          in NIS 2 consultancies, audit firms, or competing GRC platforms.
        </p>

        <h2>Advertising and sponsorships</h2>
        <p>
          We do not run display ads. We do not publish sponsored content.
          Partnerships with vendors (e.g. SoSafe, Advisera) are disclosed
          explicitly in the article they appear in and never disguised as
          neutral editorial.
        </p>

        <h2>Affiliate disclosures</h2>
        <p>
          Some links to vendors may be affiliate links. When they are, the
          disclosure appears above the link, not buried in a footer. We do
          not recommend a vendor we would not recommend without compensation.
        </p>

        <h2>Reader data</h2>
        <p>
          See <a href="/datenschutz">/datenschutz</a> for the legal version.
          Plain English: we use self-hosted analytics (Umami), no third-party
          trackers, no behavioural ads, no data sold to anyone. Newsletter
          subscribers can unsubscribe via one click in every email.
        </p>

        <h2>Corrections</h2>
        <p>
          Public, dated log at <a href="/corrections">/corrections</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none">
      <h1>Ethik</h1>

      <h2>Interessenkonflikte</h2>
      <p>
        Wir legen jede kommerzielle Beziehung offen, die unsere Inhalte
        beeinflussen könnte. Das direkte finanzielle Interesse hinter nisd2.eu
        (Simon Orzel, der die Website betreibt) ist über das Impressum
        öffentlich. Wir halten keine Beteiligungen an NIS 2 Beratungen,
        Auditfirmen oder konkurrierenden GRC-Plattformen.
      </p>

      <h2>Werbung und Sponsorings</h2>
      <p>
        Wir schalten keine Display-Werbung. Wir veröffentlichen keine
        bezahlten Inhalte (Sponsored Content). Partnerschaften mit Anbietern
        (z. B. SoSafe, Advisera) werden im jeweiligen Artikel ausdrücklich
        gekennzeichnet und nie als neutrale Redaktion getarnt.
      </p>

      <h2>Affiliate-Offenlegung</h2>
      <p>
        Manche Verweise auf Anbieter können Affiliate-Links sein. Falls ja,
        steht der Hinweis direkt am Link, nicht versteckt im Footer. Wir
        empfehlen keinen Anbieter, den wir nicht auch ohne Provision
        empfehlen würden.
      </p>

      <h2>Daten unserer Leser</h2>
      <p>
        Rechtsversion unter <a href="/datenschutz">/datenschutz</a>.
        Klartext: selbst-gehostete Analyse (Umami), keine Drittanbieter-
        Tracker, keine verhaltensbasierte Werbung, kein Datenverkauf.
        Newsletter-Abonnenten können mit einem Klick aus jeder E-Mail
        abbestellen.
      </p>

      <h2>Korrekturen</h2>
      <p>
        Öffentliches, datiertes Log unter{" "}
        <a href="/corrections">/corrections</a>.
      </p>
    </div>
  );
}
