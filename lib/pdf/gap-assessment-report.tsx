import { Document, Page, View } from "@react-pdf/renderer";
import { localizeGapDomain, localizeGapQuestion } from "@/lib/gap-assessment/localize";
import type {
  AssessmentScores,
  GapDomain,
  GapQuestion,
} from "@/lib/gap-assessment/schema";
import { Meter } from "./brand";
import {
  BrandBands,
  type Column,
  CoverFooter,
  CoverHeading,
  DocHeader,
  PageFooter,
  SectionHeading,
  StatPlate,
  scoreColor,
  Table,
} from "./chrome";
import { type PdfLocale, pdfLocale } from "./format";
import { styles } from "./styles";
import { SIGNAL } from "./theme";

/**
 * Readiness report for the public gap assessment.
 *
 * Shares lib/pdf/chrome with the certificate and the compliance report; it used
 * to carry its own StyleSheet and its own traffic-light palette, which meant a
 * customer who ran the assessment and then exported a report got two documents
 * that did not look like they came from the same company.
 */

const MATURITY_LABELS: Readonly<Record<PdfLocale, Readonly<Record<string, string>>>> = {
  en: {
    critical: "Critical",
    initial: "Initial",
    developing: "Developing",
    managed: "Managed",
    optimized: "Optimized",
  },
  de: {
    critical: "Kritisch",
    initial: "Initial",
    developing: "In Entwicklung",
    managed: "Gesteuert",
    optimized: "Optimiert",
  },
  cs: {
    critical: "Kritická",
    initial: "Počáteční",
    developing: "Rozvíjející se",
    managed: "Řízená",
    optimized: "Optimalizovaná",
  },
};

const CONSEQUENCE_LABELS: Readonly<Record<PdfLocale, Readonly<Record<number, string>>>> =
  {
    en: { 0: "Audit finding", 1: "Operational risk", 2: "Fine", 3: "Personal liability" },
    de: {
      0: "Audit-Feststellung",
      1: "Operatives Risiko",
      2: "Bußgeld",
      3: "Persönliche Haftung",
    },
    cs: {
      0: "Zjištění z auditu",
      1: "Provozní riziko",
      2: "Pokuta",
      3: "Osobní odpovědnost",
    },
  };

const TIME_LABELS: Readonly<Record<PdfLocale, Readonly<Record<number, string>>>> = {
  en: { 0: "Quick win", 1: "Days", 2: "Weeks", 3: "Months" },
  de: { 0: "Sofort", 1: "Tage", 2: "Wochen", 3: "Monate" },
  cs: { 0: "Ihned", 1: "Dny", 2: "Týdny", 3: "Měsíce" },
};

const COPY = {
  en: {
    title: "NIS 2 Gap Assessment",
    subtitle: "Readiness Assessment",
    company: "Organisation",
    date: "Date",
    answered: "Questions answered",
    domainScores: "Domain scores",
    priorityGaps: "Priority gaps",
    overall: "Overall",
    criticalGaps: "Critical gaps",
    fineExposure: "Fine exposure",
    quickWins: "Quick wins",
    domain: "Domain",
    score: "Score",
    maturity: "Maturity",
    answeredShort: "Answered",
    finding: "Finding",
    consequence: "Consequence",
    effort: "Effort",
    fine: "Fine",
    confidential: "Confidential",
    generatedWith: "Generated with",
    page: (n: number, total: number) => `Page ${n} of ${total}`,
  },
  de: {
    title: "NIS 2 Gap-Assessment",
    subtitle: "Bereitschaftsbewertung",
    company: "Einrichtung",
    date: "Datum",
    answered: "Beantwortete Fragen",
    domainScores: "Ergebnisse pro Bereich",
    priorityGaps: "Prioritäre Lücken",
    overall: "Gesamt",
    criticalGaps: "Kritische Lücken",
    fineExposure: "Bußgeldrisiko",
    quickWins: "Sofort behebbar",
    domain: "Bereich",
    score: "Ergebnis",
    maturity: "Reifegrad",
    answeredShort: "Beantwortet",
    finding: "Feststellung",
    consequence: "Konsequenz",
    effort: "Aufwand",
    fine: "Bußgeld",
    confidential: "Vertraulich",
    generatedWith: "Erstellt mit",
    page: (n: number, total: number) => `Seite ${n} von ${total}`,
  },
  cs: {
    title: "GAP analýza NIS 2",
    subtitle: "Hodnocení připravenosti",
    company: "Organizace",
    date: "Datum",
    answered: "Zodpovězené otázky",
    domainScores: "Skóre podle oblastí",
    priorityGaps: "Prioritní nedostatky",
    overall: "Celkové skóre",
    criticalGaps: "Kritické nedostatky",
    fineExposure: "Riziko pokuty",
    quickWins: "Napravitelné ihned",
    domain: "Oblast",
    score: "Skóre",
    maturity: "Vyspělost",
    answeredShort: "Zodpovězeno",
    finding: "Zjištění",
    consequence: "Důsledek",
    effort: "Náročnost",
    fine: "Pokuta",
    confidential: "Důvěrné",
    generatedWith: "Vytvořeno pomocí",
    page: (n: number, total: number) => `Strana ${n} z ${total}`,
  },
} as const satisfies Record<PdfLocale, object>;

export function GapAssessmentReport({
  scores,
  domains,
  questions,
  locale,
  companyName,
  date,
}: {
  scores: AssessmentScores;
  domains: GapDomain[];
  questions: GapQuestion[];
  locale: string;
  companyName?: string;
  date: string;
}) {
  const l = pdfLocale(locale);
  const t = COPY[l];
  const maturityLabels = MATURITY_LABELS[l];
  const consequenceLabels = CONSEQUENCE_LABELS[l];
  const timeLabels = TIME_LABELS[l];

  const criticalGaps = scores.gaps.filter((g) => g.criticality === 3).length;
  const fineExposed = scores.gaps.filter((g) => g.fineExposure).length;
  const quickWins = scores.gaps.filter((g) => g.timeToFix === 0).length;

  const footerContext = companyName ?? t.title;

  function getDomainName(id: number) {
    const d = domains.find((dom) => dom.id === id);
    return d ? localizeGapDomain(d, l).name : `${t.domain} ${id}`;
  }

  function getQuestionText(qid: string) {
    const q = questions.find((qu) => qu.id === qid);
    return q ? localizeGapQuestion(q, l).text : qid;
  }

  const domainColumns: Column[] = [
    { header: t.domain, width: 34 },
    { header: t.score, width: 10, align: "right" },
    { header: "", width: 16 },
    { header: t.maturity, width: 20 },
    { header: t.answeredShort, width: 14, align: "center" },
  ];

  const gapColumns: Column[] = [
    { header: "#", width: 5, mono: true },
    { header: t.finding, width: 44 },
    { header: t.domain, width: 16 },
    { header: t.consequence, width: 16 },
    { header: t.effort, width: 11 },
    { header: t.fine, width: 8, align: "center" },
  ];

  return (
    <Document title={t.title} author="NISD2.eu" subject={t.subtitle}>
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <BrandBands />
        <DocHeader label={t.date} value={date} />

        <View style={styles.coverBody}>
          <CoverHeading
            eyebrow={t.subtitle}
            title={t.title}
            subtitle={companyName}
            meta={[
              ...(companyName ? [{ label: t.company, value: companyName }] : []),
              { label: t.date, value: date },
              {
                label: t.answered,
                value: `${scores.totalAnswered} / ${scores.totalQuestions}`,
              },
            ]}
          />

          <StatPlate
            stats={[
              {
                value: `${scores.overall}%`,
                label: t.overall,
                tone: scoreColor(scores.overall),
              },
              { value: String(criticalGaps), label: t.criticalGaps, tone: SIGNAL.poor },
              { value: String(fineExposed), label: t.fineExposure, tone: SIGNAL.fair },
              { value: String(quickWins), label: t.quickWins, tone: SIGNAL.strong },
            ]}
          />
        </View>

        <CoverFooter issuedByLabel={t.generatedWith} disclaimer={t.confidential} />
      </Page>

      <Page size="A4" style={styles.page}>
        <BrandBands />
        <View fixed>
          <DocHeader label={t.subtitle} value={date} />
        </View>

        <SectionHeading title={t.domainScores} />
        <View style={{ marginTop: 10 }}>
          <Table
            columns={domainColumns}
            rows={scores.domains.map((d) => [
              getDomainName(d.domainId),
              `${d.percentage}%`,
              <Meter
                key={d.domainId}
                percent={d.percentage}
                color={scoreColor(d.percentage)}
              />,
              maturityLabels[d.maturity] ?? d.maturity,
              `${d.answeredCount}/${d.totalCount}`,
            ])}
          />
        </View>

        <PageFooter context={footerContext} pageLabel={t.page} />
      </Page>

      <Page size="A4" style={styles.page}>
        <BrandBands />
        <View fixed>
          <DocHeader label={t.subtitle} value={date} />
        </View>

        <SectionHeading title={t.priorityGaps} />
        <View style={{ marginTop: 10 }}>
          <Table
            columns={gapColumns}
            rows={scores.gaps
              .slice(0, 30)
              .map((gap, i) => [
                String(i + 1),
                getQuestionText(gap.questionId),
                getDomainName(gap.domain),
                consequenceLabels[gap.consequence] ?? "",
                timeLabels[gap.timeToFix] ?? "",
                gap.fineExposure ? "!" : "",
              ])}
          />
        </View>

        <PageFooter context={footerContext} pageLabel={t.page} />
      </Page>
    </Document>
  );
}
