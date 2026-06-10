import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import {
  getRegistrationPortals,
  getTranspositionStatus,
  type TranspositionStatus,
} from "@/lib/registration-portals";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const title = isEn
    ? "NIS 2 EU implementation tracker: all 27 Member States"
    : "NIS 2 EU-Umsetzungstracker: alle 27 Mitgliedstaaten";
  const description = isEn
    ? "Where every EU Member State stands on NIS 2 transposition: national act, competent authority, national CSIRT, status. Reviewed June 2026."
    : "Wo jeder EU-Mitgliedstaat bei der NIS 2 Umsetzung steht: nationales Gesetz, zuständige Behörde, nationales CSIRT, Stand. Stand Juni 2026.";
  return {
    title,
    description,
    alternates: pageAlternates(
      "wiki/zeit-und-status/nis2-tracker-eu",
      locale,
    ),
    ...pageOg({
      slug: "wiki/zeit-und-status/nis2-tracker-eu",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

function statusBadgeClasses(status: TranspositionStatus): string {
  switch (status) {
    case "in-force":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-400/30";
    case "bill-pending":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-400/30";
    case "drafting":
      return "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-900/40 dark:text-slate-300 dark:ring-slate-400/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

const STATUS_LABELS: Record<TranspositionStatus, { en: string; de: string }> = {
  "in-force": { en: "In force", de: "In Kraft" },
  "bill-pending": { en: "Bill pending", de: "Gesetzentwurf" },
  "drafting": { en: "Drafting", de: "Im Entwurf" },
  "unknown": { en: "Unknown", de: "Unbekannt" },
};

export default async function Nis2TrackerEuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale =
    rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const isEn = locale === "en";

  const { portals } = getRegistrationPortals();

  const display = new Intl.DisplayNames([isEn ? "en" : "de"], {
    type: "region",
  });
  const countryName = (code: string): string => display.of(code) ?? code;

  const today = new Date();
  const rows = portals
    .map((p) => ({
      ...p,
      transpositionStatus: getTranspositionStatus(p, today),
      name: countryName(p.countryCode),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, isEn ? "en" : "de"));

  const counts = {
    inForce: rows.filter((r) => r.transpositionStatus === "in-force").length,
    pending: rows.filter((r) => r.transpositionStatus === "bill-pending").length,
    drafting: rows.filter(
      (r) =>
        r.transpositionStatus === "drafting" ||
        r.transpositionStatus === "unknown",
    ).length,
  };

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-10">
        <WikiPageJsonLd
          category="zeit-und-status"
          slug="nis2-tracker-eu"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType={
            isEn
              ? "EU-wide operators and compliance leads"
              : "EU-weit tätige Unternehmen und Compliance-Verantwortliche"
          }
          citationKeys={["nis2"]}
          aboutKeys={["nis2"]}
          mentionsKeys={["bsig"]}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            {isEn ? "Live status" : "Aktueller Stand"}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEn
              ? "NIS 2 EU implementation tracker"
              : "NIS 2 EU-Umsetzungstracker"}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {isEn
              ? "Where every EU Member State stands on the NIS 2 transposition. National act, competent authority, national CSIRT, status. Reviewed June 2026."
              : "Wo jeder EU-Mitgliedstaat bei der NIS 2 Umsetzung steht. Nationales Gesetz, zuständige Behörde, nationales CSIRT, Stand. Stand Juni 2026."}
          </p>
        </header>

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-06-01"
          sourceLocale="en"
        />

        <Separator />

        {/* Snapshot */}
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
            <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
              {counts.inForce}
            </div>
            <div className="text-sm text-muted-foreground">
              {isEn
                ? "Member States with the national act in force"
                : "Mitgliedstaaten mit nationalem Gesetz in Kraft"}
            </div>
          </div>
          <div className="rounded-lg border bg-amber-50/50 p-4 dark:bg-amber-950/20">
            <div className="text-2xl font-semibold text-amber-700 dark:text-amber-300">
              {counts.pending}
            </div>
            <div className="text-sm text-muted-foreground">
              {isEn
                ? "Member States with the bill in legislative process"
                : "Mitgliedstaaten mit Gesetzentwurf im Verfahren"}
            </div>
          </div>
          <div className="rounded-lg border bg-slate-50/50 p-4 dark:bg-slate-900/20">
            <div className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
              {counts.drafting}
            </div>
            <div className="text-sm text-muted-foreground">
              {isEn
                ? "Member States still drafting or status unclear"
                : "Mitgliedstaaten in der Entwurfsphase oder unklar"}
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {isEn ? "What this is" : "Worum es geht"}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {isEn
              ? "The 17 October 2024 transposition deadline set in Article 41 NIS 2 has come and gone. A few Member States moved fast (Italy, Belgium, Hungary, Croatia, Romania). Most are still in legislative process, including the four biggest economies (Germany, France, Spain, Netherlands). The European Commission opened infringement procedures in May 2025 against the late ones."
              : "Die Umsetzungsfrist vom 17. Oktober 2024 aus Artikel 41 NIS 2 ist verstrichen. Wenige Mitgliedstaaten waren rechtzeitig (Italien, Belgien, Ungarn, Kroatien, Rumänien). Die meisten sind noch im Gesetzgebungsverfahren, einschließlich der vier größten Volkswirtschaften (Deutschland, Frankreich, Spanien, Niederlande). Die Europäische Kommission hat im Mai 2025 Vertragsverletzungsverfahren gegen die säumigen Mitgliedstaaten eröffnet."}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {isEn
              ? "The table below summarises the canonical national act, the lead competent authority and the national CSIRT for each Member State. Where we have a per-country deep dive, the country name links to it. Status as of the review date; check the ENISA NIS 2 transposition tracker for the latest verifiable picture."
              : "Die Tabelle unten fasst je Mitgliedstaat das wesentliche nationale Gesetz, die federführende zuständige Behörde und das nationale CSIRT zusammen. Wo eine Vertiefung pro Land existiert, ist der Landesname verlinkt. Stand zum Prüfdatum; für das aktuellste belastbare Bild bleibt die ENISA NIS 2 Umsetzungsübersicht maßgeblich."}
          </p>
        </section>

        {/* Country table */}
        <section className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide text-muted-foreground">
                  {isEn ? "Member State" : "Mitgliedstaat"}
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide text-muted-foreground">
                  {isEn ? "National act" : "Nationales Gesetz"}
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide text-muted-foreground">
                  {isEn ? "Competent authority" : "Zuständige Behörde"}
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide text-muted-foreground">
                  {isEn ? "National CSIRT" : "Nationales CSIRT"}
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide text-muted-foreground">
                  {isEn ? "Status" : "Stand"}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const act = r.nationalLaw ?? "—";
                const note = isEn ? r.trackerNoteEn : r.trackerNoteDe;
                const statusLabel =
                  STATUS_LABELS[r.transpositionStatus][isEn ? "en" : "de"];
                return (
                  <tr key={r.countryCode} className="border-t">
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-baseline gap-2">
                        <span className="inline-flex h-5 items-center rounded bg-muted px-1.5 text-[10px] font-mono tracking-wide text-muted-foreground">
                          {r.countryCode}
                        </span>
                        {r.wikiSlug ? (
                          <Link
                            href={
                              `/wiki/zeit-und-status/${r.wikiSlug}` as never
                            }
                            className="font-medium hover:underline"
                          >
                            {r.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{r.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm leading-relaxed">{act}</div>
                      {note && (
                        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {note}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-sm leading-relaxed">
                      {r.authority}
                    </td>
                    <td className="px-4 py-3 align-top text-sm leading-relaxed">
                      {r.csirt ?? "—"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${statusBadgeClasses(r.transpositionStatus)}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Per-country deep dives */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isEn ? "Per-country deep dives" : "Vertiefungen pro Land"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {rows
                .filter((r) => r.wikiSlug)
                .map((r) => (
                  <Link
                    key={r.countryCode}
                    href={`/wiki/zeit-und-status/${r.wikiSlug}` as never}
                    className="rounded-md border p-3 transition hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="inline-flex h-5 items-center rounded bg-muted px-1.5 text-[10px] font-mono tracking-wide text-muted-foreground">
                        {r.countryCode}
                      </span>
                      <span className="text-sm font-medium">{r.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.authority}
                    </p>
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader>
            <CardTitle>{isEn ? "Sources" : "Quellen"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {isEn
                  ? "Directive (EU) 2022/2555 (NIS 2), Article 41 — transposition deadline. EUR-Lex: eur-lex.europa.eu/eli/dir/2022/2555/oj"
                  : "Richtlinie (EU) 2022/2555 (NIS 2), Artikel 41 — Umsetzungsfrist. EUR-Lex: eur-lex.europa.eu/eli/dir/2022/2555/oj"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                ENISA NIS 2 transposition tracker — enisa.europa.eu/topics/nis-directive
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {isEn
                  ? "European Commission, infringement procedures opened against Member States that did not communicate full transposition of NIS 2 (November 2024, reasoned opinions May 2025)."
                  : "Europäische Kommission, Vertragsverletzungsverfahren gegen Mitgliedstaaten ohne vollständige Mitteilung der NIS 2 Umsetzung (November 2024, mit Gründen versehene Stellungnahmen Mai 2025)."}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {isEn
                  ? "National official journals: BGBl (DE), Moniteur belge / Belgisch Staatsblad (BE), Gazzetta Ufficiale (IT), BOE (ES), JORF (FR), Sbírka zákonů (CZ), etc."
                  : "Nationale Amtsblätter: BGBl (DE), Moniteur belge / Belgisch Staatsblad (BE), Gazzetta Ufficiale (IT), BOE (ES), JORF (FR), Sbírka zákonů (CZ) usw."}
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isEn
                ? "Run the applicability check for your entity"
                : "Anwendbarkeitsprüfung starten"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isEn
                ? "The applicability check works against the EU directive, so the answer holds regardless of which national transposition is in force in your country yet."
                : "Die Anwendbarkeitsprüfung läuft gegen die EU-Richtlinie. Das Ergebnis gilt unabhängig davon, welche nationale Umsetzung in Ihrem Land bereits in Kraft ist."}
            </p>
            <div className="mt-4">
              <Link
                href="/applicability"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {isEn
                  ? "Open the applicability check"
                  : "Anwendbarkeitsprüfung öffnen"}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
