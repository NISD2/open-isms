import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { pageAlternates, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

type Locale = "de" | "en" | "nl";

const content: Record<Locale, {
  title: string;
  subtitle: string;
  meta: { title: string; description: string };
  intro: string;
  why: { heading: string; bullets: string[] };
  categories: {
    heading: string;
    description: string;
    rows: { name: string; purpose: string; needed: string }[];
  };
  checklist: { heading: string; description: string; items: { yes: boolean; text: string }[] };
  ourTool: { heading: string; description: string; features: string[]; cta: string; ctaSecondary: string };
  faq: { heading: string; items: { q: string; a: string }[] };
  breadcrumb: string;
}> = {
  de: {
    title: "NIS2 Tool: Buyer's Guide für Compliance-Software",
    subtitle:
      "Welche NIS2-Tools brauchen Sie wirklich, was kostet das, worauf achten — und welche Funktionen sind Pflicht.",
    meta: {
      title: "NIS2 Tool: Buyer's Guide & kostenlose Compliance-Software",
      description:
        "NIS2 Compliance Tool im Vergleich: Welche Funktionen sind Pflicht, was ist optional, was kostet das. Inklusive kostenlose NIS2-Plattform ohne Lock-in.",
    },
    intro:
      "Ein NIS2 Tool ist Software, die Unternehmen bei der Umsetzung der EU-NIS2-Richtlinie (2022/2555) und ihrer nationalen Transposition (in Deutschland: BSIG / NIS2UmsuCG) unterstützt. Es muss die 10 Cybersicherheitsmaßnahmen aus Artikel 21 NIS2 sowie die Meldepflichten und die BSI-Registrierung abbilden.",
    why: {
      heading: "Warum ein NIS2 Tool?",
      bullets: [
        "NIS2 erfordert dauerhafte Audit-Belege — Word-Dokumente reichen nicht.",
        "Das BSI prüft Reaktionszeiten (24h/72h/1 Monat) — manuell kaum nachweisbar.",
        "Geschäftsführerhaftung nach §38 BSIG: Sie brauchen den Nachweis, dass Maßnahmen getroffen wurden.",
        "Die 10 Maßnahmen aus Artikel 21 betreffen mehrere Abteilungen — koordinierte Tools sparen Zeit.",
      ],
    },
    categories: {
      heading: "Welche Arten von NIS2-Tools gibt es?",
      description:
        "Die Tool-Landschaft für NIS2 ist fragmentiert. Eine sinnvolle Kategorisierung:",
      rows: [
        {
          name: "GRC-Plattform",
          purpose:
            "Governance, Risk & Compliance. Bildet alle Maßnahmen, Risiken, Audits ab.",
          needed: "Pflicht für die Dokumentation",
        },
        {
          name: "Asset-Management",
          purpose: "Inventarisierung von IT-Assets als Basis für Risikoanalysen.",
          needed: "Pflicht (RSK 2.2)",
        },
        {
          name: "SIEM / Logging",
          purpose: "Erkennung von Sicherheitsereignissen, Forensik.",
          needed: "Sehr empfohlen — meldepflichtige Vorfälle erkennen",
        },
        {
          name: "Patch-Management",
          purpose: "Tracking von Updates für Betriebssysteme und Anwendungen.",
          needed: "Pflicht (Artikel 21(2)(e) NIS2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Multi-Faktor-Authentifizierung, Berechtigungsverwaltung.",
          needed: "Pflicht (Artikel 21(2)(j) NIS2)",
        },
        {
          name: "Backup / DR",
          purpose: "Datensicherung und Wiederherstellungsfähigkeit.",
          needed: "Pflicht (Artikel 21(2)(c) NIS2)",
        },
        {
          name: "Lieferantenmanagement",
          purpose: "Bewertung der Cybersicherheit Ihrer Zulieferer.",
          needed: "Pflicht (Artikel 21(2)(d) NIS2)",
        },
        {
          name: "Schulungs-Plattform",
          purpose: "Awareness-Training für alle Mitarbeitenden + Geschäftsführung (§38 BSIG).",
          needed: "Pflicht (Artikel 21(2)(g) NIS2)",
        },
      ],
    },
    checklist: {
      heading: "Worauf achten beim NIS2 Tool?",
      description:
        "Diese Funktionen sollte ein NIS2-Compliance-Tool zwingend abbilden:",
      items: [
        { yes: true, text: "Alle 10 Maßnahmen aus Artikel 21 NIS2 / §30 BSIG" },
        { yes: true, text: "Drei-Stufen-Meldekaskade (24h/72h/1 Monat) nach §32 BSIG" },
        { yes: true, text: "BSI-Registrierungsdaten (§33 BSIG) versionsfest" },
        { yes: true, text: "Audit-Trail: jede Änderung mit Zeitstempel und Verantwortlichem" },
        { yes: true, text: "Sign-Off der Geschäftsführung mit eIDAS-konformer Signatur" },
        { yes: true, text: "Lieferanten-Erfassung mit eigenem Compliance-Status" },
        { yes: true, text: "Mehrere EU-Länder bei grenzüberschreitender Tätigkeit" },
        { yes: false, text: "Vendor Lock-in: Daten-Export muss vollständig möglich sein" },
        { yes: false, text: "„Forever Free“ als Marketing — Achtung: oft nur Lockmittel" },
      ],
    },
    ourTool: {
      heading: "Unsere Antwort: nisd2.eu",
      description:
        "Wir betreiben eine kostenlose NIS2-Compliance-Plattform für europäische Unternehmen. Open-Source-orientiert, ohne Lock-in, mit Fokus auf den deutschen Mittelstand und EU-weite Anforderungen.",
      features: [
        "Alle 49 BSIG-Anforderungen abgebildet",
        "Drei-Stufen-Meldekaskade integriert",
        "Audit-Trail dauerhaft nicht löschbar",
        "Geschäftsführerhaftung-Schutz: Sign-Off, Schulungen, Nachweis",
        "Lieferantenportal: Self-Service-Fragebögen",
        "Kostenlos für die Plattform, optional kostenpflichtige Implementierungsbegleitung",
      ],
      cta: "Plattform ansehen",
      ctaSecondary: "Kostenlose Anwendbarkeitsprüfung",
    },
    faq: {
      heading: "Häufige Fragen",
      items: [
        {
          q: "Was kostet ein NIS2 Tool?",
          a: "Kommerzielle GRC-Tools (Vanta, Drata, OneTrust) liegen bei 10.000–60.000 EUR pro Jahr für ein Mittelstand-Unternehmen. nisd2.eu ist kostenlos. Implementierungsbegleitung kostet bei uns ab 500 EUR pro Monat.",
        },
        {
          q: "Brauche ich ein Tool, oder reicht Excel?",
          a: "Excel reicht nicht aus. Das BSI verlangt einen versionsfesten Audit-Trail. Bei Vorfällen müssen Sie nachweisen können, wer wann was geändert hat. Excel-Dateien werden überschrieben — ein BSI-Auditor wird das beanstanden.",
        },
        {
          q: "Reicht ein einziges Tool oder brauche ich mehrere?",
          a: "Ein GRC-Tool deckt die Dokumentation und Nachweise ab. Für SIEM, Patch-Management, MFA, Backups brauchen Sie weiterhin separate technische Tools. Ein gutes NIS2-Tool integriert Belege aus diesen Systemen.",
        },
        {
          q: "Kann eine kostenlose Plattform NIS2-konform sein?",
          a: "Ja. NIS2 verlangt keinen bestimmten Hersteller. Entscheidend ist, ob die Anforderungen erfüllt und revisionssicher dokumentiert werden. Open-Source- und kostenlose Tools können das genauso gut wie teure SaaS-Lösungen.",
        },
      ],
    },
    breadcrumb: "NIS2 Tool",
  },
  en: {
    title: "NIS2 Tool: Buyer's Guide for Compliance Software",
    subtitle:
      "What NIS2 tools you actually need, what they cost, what to look for, and which features are mandatory under the directive.",
    meta: {
      title: "NIS2 Tool: Buyer's Guide & Free Compliance Software",
      description:
        "NIS2 compliance tool comparison: which features are mandatory, which are optional, what they cost. Includes free EU-wide NIS2 platform with no lock-in.",
    },
    intro:
      "A NIS2 tool is software that helps companies implement the EU NIS2 Directive (2022/2555) and its national transposition (in Germany: BSIG / NIS2UmsuCG). It must support the 10 cybersecurity measures from Article 21 NIS2 plus incident reporting and authority registration.",
    why: {
      heading: "Why use a NIS2 tool?",
      bullets: [
        "NIS2 requires durable audit evidence — Word documents are not enough.",
        "The BSI checks response times (24h / 72h / 1 month) — hard to demonstrate manually.",
        "Personal management liability under §38 BSIG: you need proof measures were implemented.",
        "The 10 measures from Article 21 span multiple departments — coordinated tools save time.",
      ],
    },
    categories: {
      heading: "What types of NIS2 tools exist?",
      description: "The tooling landscape for NIS2 is fragmented. A useful breakdown:",
      rows: [
        {
          name: "GRC platform",
          purpose:
            "Governance, Risk & Compliance — represents all measures, risks, audits.",
          needed: "Mandatory for documentation",
        },
        {
          name: "Asset management",
          purpose: "IT asset inventory as the basis for risk analysis.",
          needed: "Mandatory (RSK 2.2)",
        },
        {
          name: "SIEM / logging",
          purpose: "Detection of security events, forensics.",
          needed: "Strongly recommended — detect reportable incidents",
        },
        {
          name: "Patch management",
          purpose: "Tracking updates for operating systems and applications.",
          needed: "Mandatory (Article 21(2)(e) NIS2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Multi-factor authentication, identity & access management.",
          needed: "Mandatory (Article 21(2)(j) NIS2)",
        },
        {
          name: "Backup / DR",
          purpose: "Data backup and recovery capability.",
          needed: "Mandatory (Article 21(2)(c) NIS2)",
        },
        {
          name: "Supplier management",
          purpose: "Cybersecurity assessment of your suppliers and partners.",
          needed: "Mandatory (Article 21(2)(d) NIS2)",
        },
        {
          name: "Training platform",
          purpose:
            "Awareness training for all employees + management (§38 BSIG).",
          needed: "Mandatory (Article 21(2)(g) NIS2)",
        },
      ],
    },
    checklist: {
      heading: "What to check in a NIS2 tool",
      description:
        "These features are non-negotiable in any NIS2 compliance tool:",
      items: [
        { yes: true, text: "All 10 measures from Article 21 NIS2 / §30 BSIG" },
        { yes: true, text: "Three-stage incident reporting cascade (24h / 72h / 1 month) under §32 BSIG" },
        { yes: true, text: "BSI registration data (§33 BSIG) version-controlled" },
        { yes: true, text: "Audit trail: every change with timestamp and responsible person" },
        { yes: true, text: "Management sign-off via eIDAS-compliant signature" },
        { yes: true, text: "Supplier inventory with their own compliance status" },
        { yes: true, text: "Multi-country support if you operate across the EU" },
        { yes: false, text: "Vendor lock-in: full data export must be possible" },
        { yes: false, text: "\"Forever free\" as a marketing claim — usually a hook, read the fine print" },
      ],
    },
    ourTool: {
      heading: "Our answer: nisd2.eu",
      description:
        "We run a free NIS2 compliance platform for European companies. Open-source-aligned, no lock-in, focused on the German Mittelstand and EU-wide requirements.",
      features: [
        "All 49 BSIG requirements covered",
        "Three-stage incident reporting cascade built in",
        "Audit trail that cannot be deleted",
        "Management liability protection: sign-off, training, evidence",
        "Supplier portal: self-service questionnaires",
        "Free platform, optional paid implementation guidance",
      ],
      cta: "Explore the platform",
      ctaSecondary: "Free applicability check",
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        {
          q: "What does a NIS2 tool cost?",
          a: "Commercial GRC tools (Vanta, Drata, OneTrust) typically run €10,000–€60,000 per year for a mid-sized company. nisd2.eu is free. Implementation guidance from us starts at €500 per month.",
        },
        {
          q: "Do I need a tool, or is Excel enough?",
          a: "Excel is not enough. The BSI requires a tamper-evident audit trail. After an incident, you must prove who changed what when. Excel files are overwritten — a BSI auditor will reject this.",
        },
        {
          q: "Is one tool enough, or do I need several?",
          a: "A GRC tool covers documentation and proof. For SIEM, patch management, MFA, backups you still need separate technical tools. A good NIS2 tool integrates evidence from those systems.",
        },
        {
          q: "Can a free platform be NIS2-compliant?",
          a: "Yes. NIS2 doesn't mandate a specific vendor. What matters is whether the requirements are met and documented in an audit-resistant way. Open-source and free tools can do this just as well as expensive SaaS.",
        },
      ],
    },
    breadcrumb: "NIS2 Tool",
  },
  nl: {
    title: "NIS2 Tool: Buyer's Guide for Compliance Software",
    subtitle:
      "What NIS2 tools you actually need, what they cost, what to look for, and which features are mandatory under the directive.",
    meta: {
      title: "NIS2 Tool: Buyer's Guide & Free Compliance Software",
      description:
        "NIS2 compliance tool comparison: which features are mandatory, which are optional, what they cost. Includes free EU-wide NIS2 platform with no lock-in.",
    },
    intro:
      "A NIS2 tool is software that helps companies implement the EU NIS2 Directive (2022/2555) and its national transposition. It must support the 10 cybersecurity measures from Article 21 NIS2 plus incident reporting and authority registration.",
    why: {
      heading: "Why use a NIS2 tool?",
      bullets: [
        "NIS2 requires durable audit evidence — Word documents are not enough.",
        "Authorities check response times (24h / 72h / 1 month) — hard to demonstrate manually.",
        "Personal management liability: you need proof measures were implemented.",
        "The 10 measures from Article 21 span multiple departments — coordinated tools save time.",
      ],
    },
    categories: {
      heading: "What types of NIS2 tools exist?",
      description: "The tooling landscape for NIS2 is fragmented. A useful breakdown:",
      rows: [
        { name: "GRC platform", purpose: "Governance, Risk & Compliance — represents all measures, risks, audits.", needed: "Mandatory for documentation" },
        { name: "Asset management", purpose: "IT asset inventory as the basis for risk analysis.", needed: "Mandatory" },
        { name: "SIEM / logging", purpose: "Detection of security events, forensics.", needed: "Strongly recommended" },
        { name: "Patch management", purpose: "Tracking updates for OS and applications.", needed: "Mandatory (Article 21(2)(e))" },
        { name: "MFA / IAM", purpose: "Multi-factor authentication, identity & access management.", needed: "Mandatory (Article 21(2)(j))" },
        { name: "Backup / DR", purpose: "Data backup and recovery capability.", needed: "Mandatory (Article 21(2)(c))" },
        { name: "Supplier management", purpose: "Cybersecurity assessment of your suppliers.", needed: "Mandatory (Article 21(2)(d))" },
        { name: "Training platform", purpose: "Awareness training for all employees + management.", needed: "Mandatory (Article 21(2)(g))" },
      ],
    },
    checklist: {
      heading: "What to check in a NIS2 tool",
      description: "These features are non-negotiable in any NIS2 compliance tool:",
      items: [
        { yes: true, text: "All 10 measures from Article 21 NIS2" },
        { yes: true, text: "Three-stage incident reporting cascade (24h / 72h / 1 month)" },
        { yes: true, text: "Authority registration data version-controlled" },
        { yes: true, text: "Audit trail: every change with timestamp and responsible person" },
        { yes: true, text: "Management sign-off via eIDAS-compliant signature" },
        { yes: true, text: "Supplier inventory with their own compliance status" },
        { yes: true, text: "Multi-country support across the EU" },
        { yes: false, text: "Vendor lock-in: full data export must be possible" },
        { yes: false, text: "\"Forever free\" as marketing — read the fine print" },
      ],
    },
    ourTool: {
      heading: "Our answer: nisd2.eu",
      description:
        "We run a free NIS2 compliance platform for European companies. No lock-in, focused on EU-wide requirements.",
      features: [
        "All 49 BSIG requirements covered",
        "Three-stage incident reporting cascade built in",
        "Audit trail that cannot be deleted",
        "Management liability protection: sign-off, training, evidence",
        "Supplier portal: self-service questionnaires",
        "Free platform, optional paid implementation guidance",
      ],
      cta: "Explore the platform",
      ctaSecondary: "Free applicability check",
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "What does a NIS2 tool cost?", a: "Commercial GRC tools (Vanta, Drata, OneTrust) run €10,000–€60,000 per year for a mid-sized company. nisd2.eu is free." },
        { q: "Do I need a tool, or is Excel enough?", a: "Excel is not enough. Authorities require a tamper-evident audit trail. After an incident, you must prove who changed what when." },
        { q: "Is one tool enough, or do I need several?", a: "A GRC tool covers documentation and proof. For SIEM, patch management, MFA, backups you still need separate technical tools." },
        { q: "Can a free platform be NIS2-compliant?", a: "Yes. NIS2 doesn't mandate a specific vendor. What matters is whether the requirements are met and documented." },
      ],
    },
    breadcrumb: "NIS2 Tool",
  },
};

function pickLocale(locale: string): Locale {
  if (locale === "de") return "de";
  if (locale === "nl") return "nl";
  return "en";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = content[pickLocale(locale)];
  return {
    title: c.meta.title,
    description: c.meta.description,
    alternates: pageAlternates("nis2-tool", locale),
  };
}

export default async function Nis2ToolPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const c = content[pickLocale(locale)];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="space-y-10">
      <JsonLd
        data={articleJsonLd({
          slug: "nis2-tool",
          locale,
          title: c.meta.title,
          description: c.meta.description,
          datePublished: "2026-05-03",
          dateModified: "2026-05-03",
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "NIS2", slug: "" },
            { name: c.breadcrumb, slug: "nis2-tool" },
          ],
          locale
        )}
      />
      <JsonLd data={faqJsonLd} />

      <header>
        <Badge variant="secondary" className="mb-3">Buyer's Guide</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{c.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{c.subtitle}</p>
      </header>

      <Separator />

      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">{c.intro}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{c.why.heading}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {c.why.bullets.map((b, i) => (
              <li key={i} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{c.categories.heading}</CardTitle>
          <CardDescription>{c.categories.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>NIS2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {c.categories.rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="whitespace-normal text-sm text-muted-foreground">
                    {row.purpose}
                  </TableCell>
                  <TableCell className="whitespace-normal text-sm">
                    {row.needed}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{c.checklist.heading}</CardTitle>
          <CardDescription>{c.checklist.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {c.checklist.items.map((item, i) => (
              <li key={i} className="flex gap-2">
                {item.yes ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                )}
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{c.ourTool.heading}</CardTitle>
          <CardDescription>{c.ourTool.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            {c.ourTool.features.map((f, i) => (
              <li key={i} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button asChild>
              <Link href="/features">{c.ourTool.cta}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/applicability">{c.ourTool.ctaSecondary}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{c.faq.heading}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {c.faq.items.map((item, i) => (
            <div key={i}>
              <h3 className="text-sm font-semibold">{item.q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
