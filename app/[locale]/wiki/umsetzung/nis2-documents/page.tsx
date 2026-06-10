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
import { CheckCircle2, MinusCircle } from "lucide-react";
import { pageAlternates, pageOg, type Locale as SeoLocale } from "@/lib/seo";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import {
  NIS2_DOCUMENTS,
  NIS2_DOCUMENT_GROUPS,
  type DocumentGroup,
} from "@/lib/nis2-documents";

type Locale = "de" | "en" | "nl";

const content: Record<Locale, {
  title: string;
  subtitle: string;
  meta: { title: string; description: string };
  intro: string[];
  sources: { heading: string; bullets: string[] };
  countLine: (groupCount: number, docCount: number, coveredCount: number) => string;
  columns: {
    name: string;
    reference: string;
    description: string;
    platform: string;
  };
  notCoveredLabel: string;
  cta: { heading: string; description: string; primary: string; secondary: string };
  footnote: string;
  breadcrumb: string;
  badge: string;
}> = {
  de: {
    title: "NIS 2 Dokumente: Pflicht-Liste nach Richtlinie + CIR 2024/2690",
    subtitle:
      "Die Dokumente und Aufzeichnungen, die NIS 2 und die Durchführungsverordnung 2024/2690 verlangen — eins zu eins zur Regulierung, ohne Beratungs-Bloat.",
    meta: {
      title: "NIS 2 Dokumente: Pflicht-Liste (Richtlinie + CIR 2024/2690)",
      description:
        "Die unter NIS 2 und CIR 2024/2690 erforderlichen Dokumente — verankert in den EU-Originaltexten. Pro Dokument: Artikel-Verweis, CIR-Annex, Beschreibung und nisd2.eu-Plattform-Modul.",
    },
    intro: [
      "Diese Seite listet die Dokumente und Aufzeichnungen, die NIS 2 (Richtlinie (EU) 2022/2555) und die Durchführungsverordnung (EU) 2024/2690 verlangen. Quelle für die Benennung und Verweise: die Verordnungstexte selbst — nicht ein Berater-Toolkit.",
      "Bewusst kompakt: Beratungs-Toolkits zerlegen jede Anforderung in Verfahren + Formular + Anhang und kommen so auf 60+ Dokumente. Die Verordnung verlangt das nicht. Eine Anforderung = ein Dokument oder eine Aufzeichnung. Die fünf Stufen der Meldekaskade nach Artikel 23 sind ein Vorfall, der fünf Statusphasen durchläuft, nicht fünf separate Dokumente.",
      "Letzte Spalte: das genaue nisd2.eu-Modul, in dem das Dokument bzw. der Nachweis aus Ihren Daten lebt — versionsfest, mit Audit-Trail, jederzeit exportierbar. Klicken Sie auf das Modul, um direkt zur Live-Ansicht zu springen. So entsteht keine eingefrorene Word-Vorlage, sondern eine durchgehende Compliance-Posture.",
    ],
    sources: {
      heading: "Quellen",
      bullets: [
        "Richtlinie (EU) 2022/2555 (NIS 2) — Artikel 20, 21(2)(a-j), 23, 27",
        "Durchführungsverordnung (EU) 2024/2690 — Annex Abschnitte 1-13",
        "BSIG (deutsche Umsetzung) — §§ 30, 32, 33, 38",
        "BSI TR-02102 (Kryptografie), TR-03107 (Authentifizierung) — wo einschlägig",
      ],
    },
    countLine: (groupCount, docCount, coveredCount) =>
      `${docCount} Dokumente in ${groupCount} Themenbereichen — ${coveredCount} davon nativ in der Plattform abgedeckt.`,
    columns: {
      name: "Dokument",
      reference: "Verweis",
      description: "Beschreibung",
      platform: "nisd2.eu",
    },
    notCoveredLabel: "Nicht nativ",
    cta: {
      heading: "Diese Dokumente nicht von Hand pflegen",
      description:
        "nisd2.eu erzeugt diese Dokumente und Nachweise aus Ihren Daten — Risiken, Lieferanten, Vorfälle, Schulungen, Audits — mit dauerhaftem Audit-Trail. Kostenlos, ohne Lock-in.",
      primary: "Plattform ansehen",
      secondary: "Kostenlose Anwendbarkeitsprüfung",
    },
    footnote:
      "Diese Liste wird gepflegt, ersetzt aber keine juristische Prüfung. Verbindlich sind die Originaltexte der Richtlinie 2022/2555, der CIR 2024/2690 und des BSIG.",
    breadcrumb: "NIS 2 Dokumente",
    badge: "Referenz",
  },
  en: {
    title: "NIS 2 Documents: Required-List under the Directive + CIR 2024/2690",
    subtitle:
      "The documents and records NIS 2 and Implementing Regulation 2024/2690 actually require — one to one with the regulation, no consultancy bloat.",
    meta: {
      title: "NIS 2 Documents: Required List (Directive + CIR 2024/2690)",
      description:
        "Documents required under NIS 2 and CIR 2024/2690, anchored to the EU source texts. Per document: article reference, CIR annex, description, nisd2.eu platform module.",
    },
    intro: [
      "This page lists the documents and records NIS 2 (Directive (EU) 2022/2555) and Implementing Regulation (EU) 2024/2690 actually require. The names and references come from the regulation texts, not a consultancy toolkit.",
      "Intentionally compact: toolkit vendors split each requirement into a procedure + form + appendix and end up with 60+ documents. The regulation does not require that. One requirement = one document or record. The five-stage Article 23 reporting cascade is one incident progressing through five status phases, not five separate documents.",
      "Last column: the exact nisd2.eu module where the document or evidence lives as data — version-controlled, audit-trailed, exportable at any time. Click the module to jump straight to the live view. The point is continuous posture, not a frozen Word template.",
    ],
    sources: {
      heading: "Sources",
      bullets: [
        "Directive (EU) 2022/2555 (NIS 2) — Articles 20, 21(2)(a-j), 23, 27",
        "Implementing Regulation (EU) 2024/2690 — Annex sections 1-13",
        "BSIG (German transposition) — §§ 30, 32, 33, 38",
        "BSI TR-02102 (cryptography), TR-03107 (authentication) — where applicable",
      ],
    },
    countLine: (groupCount, docCount, coveredCount) =>
      `${docCount} documents across ${groupCount} topic areas — ${coveredCount} covered natively by the platform.`,
    columns: {
      name: "Document",
      reference: "Reference",
      description: "Description",
      platform: "nisd2.eu",
    },
    notCoveredLabel: "Not native",
    cta: {
      heading: "Don't maintain these documents by hand",
      description:
        "nisd2.eu generates these documents and evidence from your data — risks, suppliers, incidents, training, audits — with a durable audit trail. Free, no lock-in.",
      primary: "Explore the platform",
      secondary: "Free applicability check",
    },
    footnote:
      "This list is maintained but does not replace a legal review. The authoritative texts are Directive 2022/2555, CIR 2024/2690, and the relevant national transposition.",
    breadcrumb: "NIS 2 Documents",
    badge: "Reference",
  },
  nl: {
    title: "NIS 2 Documents: Required-List under the Directive + CIR 2024/2690",
    subtitle:
      "The documents and records NIS 2 and Implementing Regulation 2024/2690 actually require — one to one with the regulation, no consultancy bloat.",
    meta: {
      title: "NIS 2 Documents: Required List (Directive + CIR 2024/2690)",
      description:
        "Documents required under NIS 2 and CIR 2024/2690, anchored to the EU source texts. Per document: article reference, CIR annex, description, nisd2.eu platform module.",
    },
    intro: [
      "This page lists the documents and records NIS 2 (Directive (EU) 2022/2555) and Implementing Regulation (EU) 2024/2690 actually require. The names and references come from the regulation texts, not a consultancy toolkit.",
      "Intentionally compact: toolkit vendors split each requirement into a procedure + form + appendix and end up with 60+ documents. The regulation does not require that. One requirement = one document or record.",
      "Last column: the exact nisd2.eu module where the document or evidence lives as data — version-controlled, audit-trailed, exportable at any time. Click the module to jump straight to the live view.",
    ],
    sources: {
      heading: "Sources",
      bullets: [
        "Directive (EU) 2022/2555 (NIS 2) — Articles 20, 21(2)(a-j), 23, 27",
        "Implementing Regulation (EU) 2024/2690 — Annex sections 1-13",
        "National transposition (e.g. BSIG in Germany)",
      ],
    },
    countLine: (groupCount, docCount, coveredCount) =>
      `${docCount} documents across ${groupCount} topic areas — ${coveredCount} covered natively by the platform.`,
    columns: {
      name: "Document",
      reference: "Reference",
      description: "Description",
      platform: "nisd2.eu",
    },
    notCoveredLabel: "Not native",
    cta: {
      heading: "Don't maintain these documents by hand",
      description:
        "nisd2.eu generates these documents and evidence from your data — risks, suppliers, incidents, training, audits — with a durable audit trail. Free, no lock-in.",
      primary: "Explore the platform",
      secondary: "Free applicability check",
    },
    footnote:
      "This list is a reference, not legal advice. The authoritative texts are Directive 2022/2555, CIR 2024/2690, and the relevant national transposition.",
    breadcrumb: "NIS 2 Documents",
    badge: "Reference",
  },
};

function pickLocale(locale: string): Locale {
  if (locale === "de") return "de";
  if (locale === "nl") return "nl";
  return "en";
}

const GROUP_ORDER: DocumentGroup[] = [
  "registration",
  "governance",
  "risk",
  "assets",
  "incident",
  "incident-reporting",
  "continuity",
  "supply-chain",
  "acquisition",
  "cryptography",
  "hr-access",
  "authentication",
  "training",
  "effectiveness",
];

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
    alternates: pageAlternates("wiki/umsetzung/nis2-documents", locale),
    ...pageOg({
      slug: "wiki/umsetzung/nis2-documents",
      locale,
      title: c.meta.title,
      description: c.meta.description,
      type: "article",
    }),
  };
}

export default async function Nis2DocumentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale;
  const seoLocale: SeoLocale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const loc = pickLocale(locale);
  const c = content[loc];

  const docsByGroup = GROUP_ORDER.map((g) => ({
    group: g,
    label:
      loc === "de"
        ? NIS2_DOCUMENT_GROUPS[g].label_de
        : NIS2_DOCUMENT_GROUPS[g].label_en,
    docs: NIS2_DOCUMENTS.filter((d) => d.group === g),
  })).filter((g) => g.docs.length > 0);

  const totalDocs = NIS2_DOCUMENTS.length;
  const totalGroups = docsByGroup.length;
  const coveredDocs = NIS2_DOCUMENTS.filter((d) => d.platform.module).length;

  return (
    <GlossedProse locale={seoLocale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="umsetzung"
        slug="nis2-documents"
        locale={seoLocale}
        authorSlug="cory-hisey"
        proficiencyLevel="Intermediate"
        audienceType="Compliance-Beauftragte"
        citationKeys={["nis2", "bsig", "cir-2024-2690"]}
        aboutKeys={["nis2"]}
      />

      <header>
        <Badge variant="secondary" className="mb-3">{c.badge}</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{c.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{c.subtitle}</p>
      </header>

      <WikiPageMeta authorSlug="cory-hisey" locale={seoLocale === "nl" ? "de" : (seoLocale as "de" | "en")} />

      <Separator />

      <section className="space-y-3">
        {c.intro.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}
        <p className="text-sm font-medium">
          {c.countLine(totalGroups, totalDocs, coveredDocs)}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{c.sources.heading}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {c.sources.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {docsByGroup.map(({ group, label, docs }) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle>{label}</CardTitle>
            <CardDescription>
              {docs.length}{" "}
              {docs.length === 1
                ? loc === "de" ? "Dokument" : "document"
                : loc === "de" ? "Dokumente" : "documents"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[24%]">{c.columns.name}</TableHead>
                  <TableHead className="w-[16%]">{c.columns.reference}</TableHead>
                  <TableHead>{c.columns.description}</TableHead>
                  <TableHead className="w-[22%]">{c.columns.platform}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => {
                  const note =
                    loc === "de"
                      ? doc.platform.note_de
                      : doc.platform.note_en;
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium align-top whitespace-normal">
                        {loc === "de" ? doc.name_de : doc.name_en}
                      </TableCell>
                      <TableCell className="align-top whitespace-normal text-xs">
                        <div>{doc.nis2Ref}</div>
                        <div className="text-muted-foreground">
                          {doc.cirRef}
                        </div>
                      </TableCell>
                      <TableCell className="align-top whitespace-normal text-sm text-muted-foreground">
                        {loc === "de" ? doc.description_de : doc.description_en}
                      </TableCell>
                      <TableCell className="align-top whitespace-normal text-xs">
                        {doc.platform.module && doc.platform.slug ? (
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <div>
                              <Link
                                href={doc.platform.slug as never}
                                className="font-medium text-foreground underline-offset-2 hover:underline"
                              >
                                {doc.platform.module}
                                <span className="ml-1 text-muted-foreground">
                                  {doc.platform.slug}
                                </span>
                              </Link>
                              <div className="text-muted-foreground">
                                {note}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-1.5">
                            <MinusCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-muted-foreground">
                                {c.notCoveredLabel}
                              </div>
                              <div className="text-muted-foreground">
                                {note}
                              </div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>{c.cta.heading}</CardTitle>
          <CardDescription>{c.cta.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/features">{c.cta.primary}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/applicability">{c.cta.secondary}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{c.footnote}</p>
    </div>
    </GlossedProse>
  );
}
