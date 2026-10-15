import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/locale";
import { pageAlternates, pageOg } from "@/lib/seo";

const META = {
  de: {
    title: "Ethik | nisd2.eu",
    description:
      "Interessenkonflikte, Werbe-Richtlinien, Affiliate-Offenlegung, und wie wir mit Leserdaten umgehen.",
  },
  en: {
    title: "Ethics statement | nisd2.eu",
    description:
      "Conflicts of interest, advertising policy, affiliate disclosures, and how we handle reader data.",
  },
  cs: {
    title: "Etika | nisd2.eu",
    description:
      "Střety zájmů, pravidla pro reklamu, affiliate odkazy a jak zacházíme s údaji čtenářů.",
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
    alternates: pageAlternates("ethik", locale),
    ...pageOg({ slug: "ethik", locale, title, description }),
  };
}

function EthicsEn() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1>Ethics statement</h1>

      <h2>Conflicts of interest</h2>
      <p>
        We disclose every commercial relationship that could shape what we write. The
        direct financial interest behind nisd2.eu (Simon Orzel, managing director of
        Kardashev Catalyst UG (haftungsbeschränkt), which publishes it) is public via the
        Impressum. We do not own equity in NIS 2 consultancies, audit firms, or competing
        GRC platforms.
      </p>

      <h2>Advertising and sponsorships</h2>
      <p>
        We do not run display ads. We do not publish sponsored content. Partnerships with
        vendors (e.g. SoSafe, Advisera) are disclosed explicitly in the article they
        appear in and never disguised as neutral editorial.
      </p>

      <h2>Affiliate disclosures</h2>
      <p>
        Some links to vendors may be affiliate links. When they are, the disclosure
        appears above the link, not buried in a footer. We do not recommend a vendor we
        would not recommend without compensation.
      </p>

      <h2>Reader data</h2>
      <p>
        See <a href="/datenschutz">/datenschutz</a> for the legal version. Plain English:
        we use self-hosted analytics (Umami), no third-party trackers, no behavioural ads,
        no data sold to anyone. Newsletter subscribers can unsubscribe via one click in
        every email.
      </p>

      <h2>Corrections</h2>
      <p>
        Public, dated log at <a href="/corrections">/corrections</a>.
      </p>
    </div>
  );
}

function EthikDe() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1>Ethik</h1>

      <h2>Interessenkonflikte</h2>
      <p>
        Wir legen jede kommerzielle Beziehung offen, die unsere Inhalte beeinflussen
        könnte. Das direkte finanzielle Interesse hinter nisd2.eu (Simon Orzel,
        Geschäftsführer der Kardashev Catalyst UG (haftungsbeschränkt), die die Website
        betreibt) ist über das Impressum öffentlich. Wir halten keine Beteiligungen an NIS
        2 Beratungen, Auditfirmen oder konkurrierenden GRC-Plattformen.
      </p>

      <h2>Werbung und Sponsorings</h2>
      <p>
        Wir schalten keine Display-Werbung. Wir veröffentlichen keine bezahlten Inhalte
        (Sponsored Content). Partnerschaften mit Anbietern (z. B. SoSafe, Advisera) werden
        im jeweiligen Artikel ausdrücklich gekennzeichnet und nie als neutrale Redaktion
        getarnt.
      </p>

      <h2>Affiliate-Offenlegung</h2>
      <p>
        Manche Verweise auf Anbieter können Affiliate-Links sein. Falls ja, steht der
        Hinweis direkt am Link, nicht versteckt im Footer. Wir empfehlen keinen Anbieter,
        den wir nicht auch ohne Provision empfehlen würden.
      </p>

      <h2>Daten unserer Leser</h2>
      <p>
        Rechtsversion unter <a href="/datenschutz">/datenschutz</a>. Klartext:
        selbst-gehostete Analyse (Umami), keine Drittanbieter-Tracker, keine
        verhaltensbasierte Werbung, kein Datenverkauf. Newsletter-Abonnenten können mit
        einem Klick aus jeder E-Mail abbestellen.
      </p>

      <h2>Korrekturen</h2>
      <p>
        Öffentliches, datiertes Log unter <a href="/corrections">/corrections</a>.
      </p>
    </div>
  );
}

function EtikaCs() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1>Etika</h1>

      <h2>Střety zájmů</h2>
      <p>
        Zveřejňujeme každý obchodní vztah, který by mohl ovlivnit, co píšeme. Přímý
        finanční zájem za nisd2.eu je veřejně uveden v{" "}
        <Link href="/impressum">tiráži</Link>: Simon Orzel je jednatelem společnosti
        Kardashev Catalyst UG (haftungsbeschränkt), která web provozuje. Nemáme podíly v
        poradenských firmách pro NIS 2, v auditorských firmách ani v konkurenčních
        platformách GRC.
      </p>

      <h2>Reklama a sponzoring</h2>
      <p>
        Nezobrazujeme bannerovou reklamu. Nezveřejňujeme placený obsah. Partnerství s
        dodavateli (například SoSafe, Advisera) výslovně uvádíme v článku, ve kterém se
        objevují, a nikdy je nevydáváme za nezávislý redakční obsah.
      </p>

      <h2>Affiliate odkazy</h2>
      <p>
        Některé odkazy na dodavatele mohou být affiliate odkazy. Pokud ano, upozornění
        stojí přímo u odkazu, ne skryté v patičce. Nedoporučujeme žádného dodavatele,
        kterého bychom nedoporučili i bez provize.
      </p>

      <h2>Údaje čtenářů</h2>
      <p>
        Právní znění najdete v{" "}
        <Link href="/datenschutz">zásadách ochrany osobních údajů</Link>. Zjednodušeně:
        analytiku Umami provozujeme na vlastním serveru, nepoužíváme sledovací nástroje
        třetích stran ani behaviorální reklamu a údaje nikomu neprodáváme. Odběr
        newsletteru zrušíte jedním kliknutím v každém e-mailu.
      </p>

      <h2>Opravy</h2>
      <p>
        Veřejný záznam oprav s daty: <Link href="/corrections">Opravy</Link>.
      </p>
    </div>
  );
}

const BODY = { de: EthikDe, en: EthicsEn, cs: EtikaCs };

export default async function EthikPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const Body = pickLocalized(BODY, locale, "de");
  return <Body />;
}
