"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Locale = "de" | "en";

export interface PitchStats {
  users: number;
  courseStarts: number;
  courseCompletions: number;
}

const TOTAL = 11;

const NAV_TITLES: Record<Locale, string[]> = {
  en: ["Cover", "Problem", "Solution", "Traction", "Market", "Business Model", "Competition", "Why Now", "Financials", "Roadmap", "Team"],
  de: ["Cover", "Problem", "Lösung", "Traktion", "Markt", "Geschäftsmodell", "Wettbewerb", "Warum Jetzt", "Finanzen", "Fahrplan", "Team"],
};

// Desktop: h-full fills the aspect-video container.
// Mobile: h-auto so the slide grows with its stacked content.
function SlideShell({ children, tinted = false }: { children: React.ReactNode; tinted?: boolean }) {
  return (
    <div className={`h-full w-full flex flex-col px-10 py-7 max-md:h-auto max-md:px-6 max-md:py-5 ${tinted ? "bg-slate-50" : "bg-white"}`}>
      {children}
    </div>
  );
}

function Kicker({ text }: { text: string }) {
  return <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-1.5">{text}</p>;
}

function Headline({ text }: { text: string }) {
  return (
    <h2 className="text-xl font-bold text-slate-900 leading-tight mb-3">
      {text}
    </h2>
  );
}

// Desktop: flex-1 fills remaining slide width.
// Mobile: fixed h-44, flex-none so it doesn't try to grow.
function ChartPane({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative flex-1 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 max-md:flex-none max-md:h-44">
      <Image src={src} alt={alt} fill className="object-contain p-2" />
    </div>
  );
}

// ── Slide 1: Cover ────────────────────────────────────────────────────────────
function CoverSlide({ en }: { en: boolean }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white text-center px-12 max-md:h-auto max-md:py-12">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-6">
        {en ? "Investor Presentation · 2026" : "Unternehmenspräsentation · 2026"}
      </p>
      <h1 className="text-7xl font-bold text-slate-900 mb-3 max-md:text-5xl">nisd2.eu</h1>
      <div className="w-12 h-px bg-indigo-500 mb-5" />
      <p className="text-lg text-slate-600 mb-2 max-w-lg max-md:text-base">
        {en
          ? "Free NIS2 compliance for European SMEs"
          : "Kostenfreie NIS2-Compliance für europäische KMU"}
      </p>
      <p className="text-sm text-slate-400 max-w-md">
        {en
          ? "Turning a €30,000–€80,000 consulting project into an open-source platform"
          : "Aus einem 30.000–80.000 Euro Beratungsprojekt eine Open-Source-Plattform"}
      </p>
      <p className="mt-8 text-xs text-slate-400">Cologne · 2026</p>
    </div>
  );
}

// ── Slide 2: Problem ──────────────────────────────────────────────────────────
function ProblemSlide({ en, locale }: { en: boolean; locale: Locale }) {
  const bullets = en
    ? [
        "NIS2 applies across all 27 EU member states (no transition period)",
        "Most affected companies are SMEs: under 250 employees, no CISO, no compliance budget",
        "Existing tools: €7,500–€100,000/year. Consulting: €30,000–€80,000 per project",
      ]
    : [
        "NIS2 gilt in allen 27 EU-Mitgliedstaaten (keine Übergangsfrist)",
        "Die meisten betroffenen Unternehmen sind KMU: unter 250 Mitarbeiter, kein CISO, kein Compliance-Budget",
        "Bestehende Tools: 7.500–100.000 Euro/Jahr. Beratung: 30.000–80.000 Euro pro Projekt",
      ];
  return (
    <SlideShell>
      <Kicker text="02 / Problem" />
      <Headline text={en ? "160,000+ European companies. No affordable compliance tool." : "160.000+ europäische Unternehmen. Kein bezahlbares Compliance-Tool."} />
      <div className="flex flex-1 gap-6 min-h-0 max-md:flex-col max-md:flex-none max-md:gap-4">
        <div className="w-[38%] flex flex-col justify-center space-y-4 max-md:w-full">
          {bullets.map((b, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-indigo-500 font-bold text-xs mt-0.5 shrink-0">{i + 1}.</span>
              <p className="text-sm text-slate-700 leading-snug">{b}</p>
            </div>
          ))}
          <p className="text-xs text-slate-400 mt-2 border-t border-slate-200 pt-2">
            {en
              ? "ENISA estimates 160,000–180,000 obligated entities EU-wide — the majority newly in scope for the first time"
              : "ENISA schätzt 160.000–180.000 verpflichtete Einrichtungen EU-weit — die Mehrheit erstmals im Anwendungsbereich"}
          </p>
        </div>
        <ChartPane
          src={`/pitch/${locale}/REF-09_kostenvergleich.png`}
          alt={en ? "NIS2 compliance cost comparison" : "NIS2-Compliance-Kostenvergleich"}
        />
      </div>
    </SlideShell>
  );
}

// ── Slide 3: Solution ─────────────────────────────────────────────────────────
function SolutionSlide({ en, locale }: { en: boolean; locale: Locale }) {
  const bullets = en
    ? [
        "Requirements register, risk management, supplier portal, incident tracking",
        "BSIG-specific (not a generic ISO mapper)",
        "Open source (AGPL-3.0), no lock-in, data export always available",
        "eIDAS timestamp sign-off, audit-proof log, PDF export for auditors",
      ]
    : [
        "Anforderungsregister, Risikomanagement, Lieferantenportal, Incident-Tracking",
        "BSIG-spezifisch (kein generischer ISO-Mapper)",
        "Open Source (AGPL-3.0), kein Lock-in, Datenexport jederzeit",
        "eIDAS-Zeitstempel, manipulationssicheres Log, PDF-Export für Prüfer",
      ];
  return (
    <SlideShell>
      <Kicker text="03 / Solution" />
      <Headline text={en ? "The platform is the documentation. Free, forever." : "Die Plattform ist die Dokumentation. Kostenlos, für immer."} />
      <div className="flex flex-1 gap-6 min-h-0 max-md:flex-col max-md:flex-none max-md:gap-4">
        <div className="w-[38%] flex flex-col justify-center space-y-3 max-md:w-full">
          {bullets.map((b, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-indigo-500 mt-0.5 shrink-0">✓</span>
              <p className="text-sm text-slate-700 leading-snug">{b}</p>
            </div>
          ))}
        </div>
        <ChartPane
          src={`/pitch/${locale}/REF-10_audit-coverage.png`}
          alt={en ? "Platform coverage of top NIS2 audit findings" : "Plattformabdeckung der häufigsten NIS2-Prüfbefunde"}
        />
      </div>
    </SlideShell>
  );
}

// ── Slide 4: Traction ─────────────────────────────────────────────────────────
function TractionSlide({ en, locale, liveStats }: { en: boolean; locale: Locale; liveStats?: PitchStats }) {
  const stats = [
    {
      value: liveStats ? String(liveStats.users) : "173",
      label: en ? "Registered users" : "Registrierte Nutzer",
    },
    {
      value: liveStats ? String(liveStats.courseStarts) : "77",
      label: en ? "CEO courses started" : "Gestartete CEO-Kurse",
    },
    {
      value: liveStats && liveStats.courseCompletions > 0 ? String(liveStats.courseCompletions) : "40.5k",
      label: liveStats && liveStats.courseCompletions > 0
        ? (en ? "CEO courses completed" : "Abgeschlossene CEO-Kurse")
        : (en ? "LinkedIn impressions (May 20 week)" : "LinkedIn-Impressionen (KW 21)"),
    },
  ];
  return (
    <SlideShell>
      <Kicker text="04 / Traction" />
      <Headline text={en ? "Live since Q1 2026. Growing without paid ads." : "Live seit Q1 2026. Wachstum ohne bezahlte Werbung."} />
      <div className="flex flex-1 gap-6 min-h-0 max-md:flex-col max-md:flex-none max-md:gap-4">
        <div className="w-[42%] flex flex-col justify-center gap-3 max-md:w-full max-md:flex-row max-md:gap-2">
          {stats.map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200 max-md:flex-1 max-md:px-3 max-md:py-2">
              <p className="text-3xl font-bold text-slate-900 max-md:text-2xl">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 max-md:text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col flex-1 gap-3 min-h-0 max-md:flex-none max-md:gap-2">
          <ChartPane
            src={`/pitch/${locale}/REF-11_reichweite-funnel.png`}
            alt={en ? "Reach and engagement funnel" : "Reichweite- und Engagement-Funnel"}
          />
          <p className="text-xs text-slate-400 shrink-0">
            {en
              ? "BSI enforcement window opens 2026. Inbound CISO + IHK conversations already active."
              : "BSI-Durchsetzungsphase beginnt 2026. Eingehende CISO- + IHK-Gespräche bereits aktiv."}
          </p>
        </div>
      </div>
    </SlideShell>
  );
}

// ── Slide 5: Market ───────────────────────────────────────────────────────────
function MarketSlide({ en, locale }: { en: boolean; locale: Locale }) {
  return (
    <SlideShell>
      <Kicker text="05 / Market" />
      <Headline text={en ? "160,000–180,000 companies obligated across the EU." : "160.000–180.000 verpflichtete Unternehmen in der EU."} />
      <div className="relative flex-1 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 min-h-0 max-md:flex-none max-md:h-48">
        <Image
          src={`/pitch/${locale}/REF-02_tam-sam-som.png`}
          alt={en ? "TAM SAM SOM market size pyramid" : "TAM SAM SOM Marktgrößen-Pyramide"}
          fill
          className="object-contain p-3"
        />
      </div>
      <p className="text-[10px] text-slate-400 mt-2 text-center shrink-0">
        {en
          ? "TAM: 160–180k EU entities (ENISA/BSI) · SAM: 135–155k EU SMEs · SOM: ~400 paying customers by Year 3"
          : "TAM: 160–180k EU-Unternehmen (ENISA/BSI) · SAM: 135–155k EU-KMU · SOM: ~400 zahlende Kunden bis Jahr 3"}
      </p>
    </SlideShell>
  );
}

// ── Slide 6: Business Model ───────────────────────────────────────────────────
function BusinessModelSlide({ en, locale }: { en: boolean; locale: Locale }) {
  const bullets = en
    ? [
        "Consulting-referral commissions (~73% of Year-2 revenue, avg €1,000–1,500 per referral)",
[redacted for public release]
        "Licenses + hosted cloud, €49–299/month by company size (~16% of Year-2 revenue)",
      ]
    : [
        "Beratungs-Vermittlungsprovisionen (~73% des Jahr-2-Umsatzes, Ø 1.000–1.500 Euro je Vermittlung)",
[redacted for public release]
        "Lizenzen + gehostete Cloud, 49–299 Euro/Monat je Unternehmensgröße (~16% des Jahr-2-Umsatzes)",
      ];
  return (
    <SlideShell>
      <Kicker text="06 / Business Model" />
      <Headline text={en ? "Free platform. Revenue from what surrounds it." : "Kostenlose Plattform. Erlöse aus dem Umfeld."} />
      <div className="relative flex-1 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 min-h-0 mb-3 max-md:flex-none max-md:h-44">
        <Image
          src={`/pitch/${locale}/REF-01_geschaeftsmodell-fluss.png`}
          alt={en ? "Five revenue channels around the free open-source core" : "Fünf Erlöskanäle um den kostenfreien Open-Source-Kern"}
          fill
          className="object-contain p-2"
        />
      </div>
      <div className="grid grid-cols-3 gap-3 shrink-0 max-md:grid-cols-1 max-md:gap-2">
        {bullets.map((b, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
            <p className="text-[11px] text-slate-700 leading-snug">{b}</p>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

// ── Slide 7: Competition ──────────────────────────────────────────────────────
function CompetitionSlide({ en, locale }: { en: boolean; locale: Locale }) {
  const left = en
    ? ["US platforms (Vanta, Drata): €7,500–€100k/year, English, ISO-centric", "German SaaS (DataGuard, NIS2Compass): demo walls, 3-year lock-in", "Consulting (KPMG, Sopra Steria): €30,000–€80,000 per project"]
    : ["US-Plattformen (Vanta, Drata): 7.500–100.000 Euro/Jahr, englisch, ISO-zentrisch", "Deutsche SaaS (DataGuard, NIS2Compass): Demo-Wall, 3-Jahres-Lock-in", "Beratung (KPMG, Sopra Steria): 30.000–80.000 Euro pro Projekt"];
  const right = en
    ? ["Free forever. Open source. No lock-in.", "BSIG-specific (covers the 20% of NIS2 that ISO 27001 misses)", "IHK chambers can endorse us (no vendor conflict)"]
    : ["Kostenlos für immer. Open Source. Kein Lock-in.", "BSIG-spezifisch (deckt die 20% ab, die ISO 27001 verfehlt)", "IHK-Kammern können uns empfehlen (kein Anbieterkonflikt)"];
  return (
    <SlideShell>
      <Kicker text="07 / Competition" />
      <Headline text={en ? "Nobody else is free, open-source, and BSIG-specific." : "Niemand sonst ist kostenlos, Open-Source und BSIG-spezifisch."} />
      <div className="flex flex-1 gap-4 min-h-0 max-md:flex-col max-md:flex-none max-md:gap-4">
        <div className="relative flex-1 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 max-md:flex-none max-md:h-44">
          <Image
            src={`/pitch/${locale}/REF-03_wettbewerber-matrix.png`}
            alt={en ? "Competitor positioning matrix" : "Wettbewerber-Positionierungsmatrix"}
            fill
            className="object-contain p-2"
          />
        </div>
        <div className="w-[38%] flex flex-col gap-3 justify-center max-md:w-full">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-500">{en ? "Market gap" : "Marktlücke"}</p>
            {left.map((b, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-rose-500 text-xs shrink-0 mt-0.5">✗</span>
                <p className="text-xs text-slate-500 leading-snug">{b}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-slate-200 pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">nisd2.eu</p>
            {right.map((b, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-indigo-500 text-xs shrink-0 mt-0.5">✓</span>
                <p className="text-xs text-slate-700 leading-snug">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

// ── Slide 8: Why Now ──────────────────────────────────────────────────────────
function WhyNowSlide({ en }: { en: boolean }) {
  const points = en
    ? [
        { n: "1", head: "Regulation live", body: "NIS2 in force Dec 6, 2025. No transition period." },
        { n: "2", head: "62% unregistered", body: "Most obligated German companies still haven't filed with the BSI." },
        { n: "3", head: "Enforcement starting", body: "First fines and §38 personal-liability cases expected 2026–2027." },
        { n: "4", head: "No market leader", body: "US providers too expensive. German providers closed. Window is open." },
        { n: "5", head: "Channels opening", body: "IHK chambers actively seeking NIS2 material for their 3.5M members." },
      ]
    : [
        { n: "1", head: "Verordnung in Kraft", body: "NIS2 gilt seit 6. Dez. 2025. Keine Übergangsfrist." },
        { n: "2", head: "62% nicht registriert", body: "Die meisten verpflichteten deutschen Unternehmen haben sich noch nicht beim BSI angemeldet." },
        { n: "3", head: "Durchsetzung beginnt", body: "Erste Bußgelder und §38-Haftungsfälle für 2026–2027 erwartet." },
        { n: "4", head: "Noch kein Marktführer", body: "US-Anbieter zu teuer. Deutsche Anbieter geschlossen. Fenster steht offen." },
        { n: "5", head: "Kanäle öffnen sich", body: "IHK-Kammern suchen aktiv nach NIS2-Material für ihre 3,5 Mio. Mitglieder." },
      ];
  return (
    <SlideShell tinted>
      <Kicker text="08 / Why Now" />
      <Headline text={en ? "Enforcement starts 2026. The window to build authority is open." : "Durchsetzung beginnt 2026. Das Fenster zur Marktführerschaft steht offen."} />
      <div className="flex-1 grid grid-cols-3 gap-3 content-start max-md:flex-none max-md:grid-cols-2 max-md:gap-2">
        {points.map((p) => (
          <div key={p.n} className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-2xl font-bold text-indigo-500 mb-1">{p.n}</p>
            <p className="text-sm font-semibold text-slate-900 mb-1">{p.head}</p>
            <p className="text-xs text-slate-500 leading-snug">{p.body}</p>
          </div>
        ))}
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100 flex items-center justify-center">
          <p className="text-xs text-indigo-700 text-center font-medium">
            {en
              ? "An open-source platform can build authority now, before the market consolidates."
              : "Eine Open-Source-Plattform kann jetzt Autorität aufbauen, bevor der Markt konsolidiert."}
          </p>
        </div>
      </div>
    </SlideShell>
  );
}

// ── Slide 9: Financials ───────────────────────────────────────────────────────
function FinancialsSlide({ en, locale }: { en: boolean; locale: Locale }) {
  const rows = en
    ? [["2026 (Mar–Dec, partial)", "€3,800", "−€9,430"], ["2027 (full year)", "€62,200", "+€19,698"], ["2028 (conservative)", "€110,000", "+€17,077"]]
    : [["2026 (März–Dez, anteilig)", "3.800 Euro", "−9.430 Euro"], ["2027 (Gesamtjahr)", "62.200 Euro", "+19.698 Euro"], ["2028 (konservativ)", "110.000 Euro", "+17.077 Euro"]];
  return (
    <SlideShell>
      <Kicker text="09 / Financials" />
      <Headline text={en ? "Break-even May 2027. First Managing Director salary June 2027." : "Break-even Mai 2027. Erstes Geschäftsführergehalt Juni 2027."} />
      <div className="flex flex-1 gap-6 min-h-0 max-md:flex-col max-md:flex-none max-md:gap-4">
        <ChartPane
          src={`/pitch/${locale}/REF-06_break-even.png`}
          alt={en ? "Break-even chart" : "Break-even-Diagramm"}
        />
        <div className="w-[42%] flex flex-col justify-center gap-4 max-md:w-full">
          <table className="text-xs w-full">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="text-left py-1.5 text-slate-500 font-medium">{en ? "Year" : "Jahr"}</th>
                <th className="text-right py-1.5 text-slate-500 font-medium">{en ? "Revenue" : "Umsatz"}</th>
                <th className="text-right py-1.5 text-slate-500 font-medium">{en ? "Net result" : "Ergebnis"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([year, rev, result], i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 text-slate-700">{year}</td>
                  <td className="py-2 text-right text-slate-900 font-medium">{rev}</td>
                  <td className={`py-2 text-right font-medium ${result.startsWith("−") || result.startsWith("-") ? "text-rose-600" : "text-emerald-600"}`}>{result}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5">
            <p className="text-xs text-slate-700 font-medium">{en ? "Model assumptions" : "Modellannahmen"}</p>
            <p className="text-[11px] text-slate-500 leading-snug">
              {en
                ? "Conservative path. 50% revenue shortfall scenario: no insolvency. Grants excluded from base case."
                : "Konservativer Pfad. 50%-Umsatzausfall-Szenario: keine Insolvenz. Fördermittel nicht in der Basisplanung."}
            </p>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

// ── Slide 10: Roadmap ─────────────────────────────────────────────────────────
function RoadmapSlide({ en, locale }: { en: boolean; locale: Locale }) {
  const milestones = en
    ? [
        { t: "Q1 2026", b: "Platform live. 173 users, 77 CEO courses. BSI registration deadline." },
[redacted for public release]
        { t: "Q1 2027", b: "Netherlands + Austria market entry. Hosted cloud tier launched." },
        { t: "Q1 2028", b: "400 paying customers. First employee. €300k+ annual revenue." },
      ]
    : [
        { t: "Q1 2026", b: "Plattform live. 173 Nutzer, 77 CEO-Kurse. BSI-Registrierungsfrist." },
[redacted for public release]
        { t: "Q1 2027", b: "Markteintritt Niederlande + Österreich. Hosted-Cloud-Tier gestartet." },
        { t: "Q1 2028", b: "400 zahlende Kunden. Erster Mitarbeiter. 300.000+ Euro Jahresumsatz." },
      ];
  return (
    <SlideShell>
      <Kicker text="10 / Roadmap" />
      <Headline text={en ? "Four milestones to market leadership." : "Vier Meilensteine zur Marktführerschaft."} />
      <div className="relative flex-1 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 min-h-0 mb-3 max-md:flex-none max-md:h-40">
        <Image
          src={`/pitch/${locale}/REF-07_realisierungsfahrplan.png`}
          alt={en ? "Implementation roadmap" : "Realisierungsfahrplan"}
          fill
          className="object-contain p-2"
        />
      </div>
      <div className="grid grid-cols-4 gap-2 shrink-0 max-md:grid-cols-2">
        {milestones.map((m) => (
          <div key={m.t} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
            <p className="text-xs font-bold text-indigo-600 mb-1">{m.t}</p>
            <p className="text-[11px] text-slate-700 leading-snug">{m.b}</p>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

// ── Slide 11: Team ────────────────────────────────────────────────────────────
function TeamSlide({ en }: { en: boolean }) {
  return (
    <SlideShell tinted>
      <Kicker text="11 / Team" />
      <Headline text={en ? "Built by people who read the regulation in its original language." : "Gebaut von Menschen, die die Verordnung im Original gelesen haben."} />
      <div className="flex flex-1 gap-6 min-h-0 max-md:flex-col max-md:flex-none max-md:gap-4">
        <div className="flex-1 bg-white rounded-xl p-5 border border-slate-200 flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
              <Image src="/simon-bg-rem.png" alt="Simon Orzel" fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Simon Orzel</p>
              <p className="text-xs text-indigo-600">{en ? "Managing Director · 51%" : "Geschäftsführer · 51%"}</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed flex-1">
            {en
              ? "Based in Cologne. 10 years in full-stack B2B software engineering. Former Founding Engineer at EventFirst (Top-5 US VC Funded). Deep expertise in modern webstack, LLM/RAG, and regulatory framework translation. Technical lead and architecture."
              : "In Köln ansässig. 10 Jahre Full-Stack-B2B-Softwareentwicklung. Ehemaliger Gründungsingenieur bei EventFirst (Top-5 US VC). Tiefe Expertise in modernem Webstack, LLM/RAG und regulatorischer Framework-Übersetzung. Technische Leitung und Architektur."}
          </p>
        </div>
        <div className="flex-1 bg-white rounded-xl p-5 border border-slate-200 flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
              <Image src="/team-cory.png" alt="Cory Hisey" fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Cory Hisey</p>
              <p className="text-xs text-indigo-600">{en ? "Co-Founder · 49%" : "Mitgründer · 49%"}</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed flex-1">
            {en
              ? "Based in Osnabrück. M.Eng Mechatronics and cyber-physical systems (focus: embedded systems and AI integration). Handles business development, partnerships, and client-facing implementation support."
              : "In Osnabrück ansässig. M.Eng Mechatronik und cyber-physische Systeme (Schwerpunkt: Eingebettete Systeme und KI-Integration). Verantwortlich für Business Development, Partnerschaften und kundennahe Implementierungsunterstützung."}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end shrink-0">
        <p className="text-[10px] text-indigo-600 font-medium">nisd2.eu</p>
      </div>
    </SlideShell>
  );
}

// ── Slide renderer ────────────────────────────────────────────────────────────
export function renderSlide(index: number, locale: Locale, liveStats?: PitchStats) {
  const en = locale === "en";
  const slides = [
    <CoverSlide key={0} en={en} />,
    <ProblemSlide key={1} en={en} locale={locale} />,
    <SolutionSlide key={2} en={en} locale={locale} />,
    <TractionSlide key={3} en={en} locale={locale} liveStats={liveStats} />,
    <MarketSlide key={4} en={en} locale={locale} />,
    <BusinessModelSlide key={5} en={en} locale={locale} />,
    <CompetitionSlide key={6} en={en} locale={locale} />,
    <WhyNowSlide key={7} en={en} />,
    <FinancialsSlide key={8} en={en} locale={locale} />,
    <RoadmapSlide key={9} en={en} locale={locale} />,
    <TeamSlide key={10} en={en} />,
  ];
  return slides[index];
}

// ── Print view (all slides, one per page) ─────────────────────────────────────
function PrintView({ locale, liveStats }: { locale: Locale; liveStats?: PitchStats }) {
  return (
    <div className="hidden print:block">
      {Array.from({ length: TOTAL }, (_, i) => (
        <div key={i} className="w-full aspect-video break-after-page overflow-hidden">
          {renderSlide(i, locale, liveStats)}
        </div>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function PitchDeckViewer({ locale, stats }: { locale: Locale; stats?: PitchStats }) {
  const [current, setCurrent] = useState(0);
  const en = locale === "en";

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent((c) => Math.min(TOTAL - 1, c + 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  return (
    <>
      <div className="space-y-3 print:hidden">
        {/* Single container — swaps content between desktop (live) and mobile (screenshot) */}
        <div className="relative rounded-xl overflow-hidden aspect-video shadow-sm ring-1 ring-slate-200 bg-white">
          {/* Desktop: live interactive component */}
          <div className="absolute inset-0 hidden md:block">
            {renderSlide(current, locale, stats)}
          </div>
          {/* Mobile: pre-rendered screenshot — plain img to bypass Next.js image cache */}
          <div className="absolute inset-0 md:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/pitch/slides/${locale}/slide-${String(current).padStart(2, "0")}.png`}
              alt={`${NAV_TITLES[locale][current]} — slide ${current + 1} of ${TOTAL}`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={prev} disabled={current === 0} className="gap-1 text-xs">
            <ChevronLeft className="size-3.5" />
            {en ? "Previous" : "Zurück"}
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex gap-1 items-center">
              {Array.from({ length: TOTAL }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === current
                      ? "w-4 h-1.5 bg-foreground"
                      : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {current + 1}&thinsp;/&thinsp;{TOTAL}
            </span>
          </div>

          <Button variant="outline" size="sm" onClick={next} disabled={current === TOTAL - 1} className="gap-1 text-xs">
            {en ? "Next" : "Weiter"}
            <ChevronRight className="size-3.5" />
          </Button>
        </div>

        <p className="text-center text-xs font-medium text-muted-foreground tracking-wide uppercase">
          {NAV_TITLES[locale][current]}
        </p>
      </div>

      <PrintView locale={locale} liveStats={stats} />
    </>
  );
}
